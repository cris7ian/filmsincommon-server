import each from 'lodash/each'
import reduce from 'lodash/reduce'
import isEmpty from 'lodash/isEmpty'
import sortBy from 'lodash/sortBy'
import uniqBy from 'lodash/uniqBy'
import { createResults } from './movieset'
import async from 'async'
import mdbAPI from 'moviedb'

const mdb = mdbAPI(process.env['MDB_API_KEY'])

const PROFILE_PICS_URL = 'http://image.tmdb.org/t/p/w45'

export const getActorName = (req, res) => {
  const name = req.params.name
  if (!name) {
    //we throw an error if there are no params.
    res.status(400).send({ error: 'Bad params!' })
    return
  }
  //we use 'ngram' because we'll want to use it as an autocomplete method (see API).
  mdb.searchPerson(
    { query: name, search_type: 'ngram', include_adult: true },
    (err1, personInfo) => {
      if (err1) {
        return res
          .status(500)
          .send({ error: 'Could not find person. API error' })
      }
      if (isEmpty(personInfo.results)) {
        return res.json([])
      }
      each(personInfo.results, (person, index) => {
        if (person.profile_path != null) {
          personInfo.results[index].profile_path =
            PROFILE_PICS_URL + person.profile_path
        }
      })
      //important to sort results by their popularity.
      personInfo.results = sortBy(personInfo.results, obj => {
        return obj.popularity
      }).reverse()
      return res.json(personInfo.results)
    }
  )
}

export const getActorRevenue = (req, res) => {
  const id = req.params.id
  if (!id) {
    //we throw an error if there are no params.
    return res.status(500).send({ error: 'Need an id.' })
  }
  try {
    const getRevenue = (credit, callback) => {
      mdb.movieInfo({ id: credit.id }, (err, result) => {
        if (err) {
          return callback(err, 0)
        }
        credit.revenue = result.revenue
        callback(null, result.revenue)
      })
    }

    mdb.personCredits({ id: id, include_adult: true }, (err2, credits) => {
      if (err2 || !credits.cast) {
        throw new Error('API LIMIT ERROR')
      }
      async.map(credits.cast, getRevenue, (err, results) => {
        if (err) {
          return res.status(500).send({ error: 'error collecting info.' })
        }
        const revenue = reduce(results, (memo, num) => memo + num, 0)
        return res.json({ revenue: revenue, credits: credits })
      })
    })
  } catch (error) {
    return res.status(500).send({ error: 'API error getting revenue.' })
  }
}

const getCredits = id =>
  new Promise((resolve, reject) => {
    mdb.personCredits({ id, include_adult: true }, (err, credits) => {
      if (err) {
        return reject('error getting credits')
      }
      return resolve(uniqBy([...credits.cast, ...credits.crew], 'title'))
    })
  })

export const getConnection = (req, res) => {
  const movies = {}
  if (!req.params.id1 || !req.params.id2) {
    //we throw a mistake if there are no params.
    return res.status(400).send({ error: 'Bad params! Need 2 ids.' })
  }
  const { id1, id2 } = req.params
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
    .catch(error =>
      res.status(500).send({
        error: "Can't get information for the connection. Server error."
      })
    )
}
