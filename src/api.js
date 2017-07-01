import each from 'lodash/each'
import reduce from 'lodash/reduce'
import isEmpty from 'lodash/isEmpty'
import sortBy from 'lodash/sortBy'
import uniqBy from 'lodash/uniqBy'
import { createResults } from './helpers'
import async from 'async'
import { search, inCache } from './datasource'

const PROFILE_PICS_URL = 'http://image.tmdb.org/t/p/w45'
const TIME_ALLOWED_BETWEEN_API_REQUESTS = 251

const getActorName = (req, res) => {
  const name = req.params.name
  if (!name) {
    return res.status(400).send({ error: 'Bad params!' })
  }
  console.log(`query for name "${name}"`)
  //we use 'ngram' because we'll want to use it as an autocomplete method (see API).
  search(
    { query: name, search_type: 'ngram', include_adult: true },
    'searchPerson'
  )
    .then(personInfo => {
      if (isEmpty(personInfo.results)) {
        return res.json([])
      }
      each(personInfo.results, (person, index) => {
        if (person.profile_path != null) {
          personInfo.results[index].profile_path =
            PROFILE_PICS_URL + person.profile_path
        }
      })
      personInfo.results = sortBy(
        personInfo.results,
        obj => obj.popularity
      ).reverse()
      return res.json(personInfo.results)
    })
    .catch(() =>
      res.status(500).send({ error: 'Could not find person. API error' })
    )
}

const getActorRevenue = (req, res) => {
  const id = req.params.id
  if (!id) {
    return res.status(500).send({ error: 'Need an id.' })
  }

  console.log(`query for revenue of ${id}`)
  let timer = 0

  const getRevenue = (credit, callback) => {
    const searchNow = () =>
      search({ id: credit.id }, 'movieInfo')
        .then(result => callback(null, { ...credit, revenue: result.revenue }))
        .catch(err => callback(err, 0))

    inCache('movieInfo', credit.id).then(isInCache => {
      const time = TIME_ALLOWED_BETWEEN_API_REQUESTS * timer++
      if (isInCache) {
        searchNow()
      } else {
        setTimeout(() => searchNow(), time)
      }
    })
  }

  search({ id, include_adult: true }, 'personCredits')
    .then(credits => {
      if (!credits.cast) {
        throw new Error('API LIMIT ERROR')
      }

      async.map(credits.cast, getRevenue, (err, results) => {
        if (err) {
          return res.status(500).send({ error: 'error collecting info.' })
        }
        const revenue = reduce(
          results,
          (memo, credit) => memo + credit.revenue,
          0
        )
        return res.json({ revenue: revenue, credits: results })
      })
    })
    .catch(error => {
      console.log(error)
      res.status(500).send({ error: 'API error getting revenue.' })
    })
}

const getCredits = id =>
  new Promise((resolve, reject) => {
    search({ id, include_adult: true }, 'personCredits')
      .then(credits =>
        resolve(uniqBy([...credits.cast, ...credits.crew], 'title'))
      )
      .catch(() => reject('error getting credits'))
  })

const getConnection = (req, res) => {
  const movies = {}
  if (!req.params.id1 || !req.params.id2) {
    return res.status(400).send({ error: 'Bad params! Need 2 ids.' })
  }
  const { id1, id2 } = req.params
  console.log(`query for ${id1} and ${id2}`)
  getCredits(id1)
    .then(moviesActor1 => {
      movies[id1] = moviesActor1
      return getCredits(id2)
    })
    .then(moviesActor2 => {
      movies[id2] = moviesActor2
      return movies
    })
    .then(movies => createResults(movies))
    .then(response => res.json(response))
    .catch(() =>
      res.status(500).send({
        error: "Can't get information for the connection. Server error."
      })
    )
}

export { getActorName, getConnection, getActorRevenue }
