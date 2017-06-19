import each from 'lodash/each'
import reduce from 'lodash/reduce'
import isEmpty from 'lodash/isEmpty'
import sortBy from 'lodash/sortBy'
import { createResults, deleteDuplicates } from './movieset'
import async from 'async'

const MDB_API_KEY = '6931de2906a99776822e6352bddb2475'
const mdb = require('moviedb')(MDB_API_KEY)

let face_url = ''
mdb.configuration({}, (err, res) => {
  console.log(
    'Configuration from Movie DB loaded with profile pic sizes of ' +
      res.images.logo_sizes[0]
  )
  face_url = res.images.base_url + res.images.logo_sizes[0]
})

export const getActorName = (req, res) => {
  const name = req.params.name
  if (!name) {
    //we throw an error if there are no params.
    res.json({ status: 0, name: 'error' })
    return
  }
  //we use 'ngram' because we'll want to use it as an autocomplete method (see API).
  mdb.searchPerson(
    { query: name, search_type: 'ngram', include_adult: true },
    (err1, personInfo) => {
      if (isEmpty(personInfo.results)) {
        res.json([])
        return
      }
      each(personInfo.results, (person, index) => {
        if (person.profile_path != null) {
          personInfo.results[index].profile_path =
            face_url + person.profile_path
        }
      })

      //important to sort results by their popularity.
      personInfo.results = sortBy(personInfo.results, obj => {
        return obj.popularity
      }).reverse()

      res.json(personInfo.results)
    }
  )
}

export const getActorRevenue = (req, res) => {
  const id = req.params.id
  if (!id) {
    //we throw an error if there are no params.
    res.json({ status: 0, name: 'error' })
    return
  }

  const getRevenue = (credit, callback) => {
    mdb.movieInfo({ id: credit.id }, (err, result) => {
      credit.revenue = result.revenue
      callback(null, result.revenue)
    })
  }

  mdb.personCredits({ id: id, include_adult: true }, (err2, credits) => {
    if (err2 || !credits.cast) {
      res.json({ status: 0, name: 'error getting revenue' })
      return
    }
    async.map(credits.cast, getRevenue, (err, results) => {
      const revenue = reduce(results, (memo, num) => memo + num, 0)
      res.json({ credits: credits, revenue: revenue })
    })
  })
}

export const getConnection = (req, res) => {
  let movies = {} //here we'll store all  the movies from each actor.
  res.type('text/plain') // set content-type
  if (!req.params.name1 || !req.params.name2) {
    //we throw a mistake if there are no params.
    res.json({ status: 0, name: 'error' })
    return
  }

  let names = [req.params.name1, req.params.name2]

  const limit = names.length //the amount of actors to ask for.
  let counter = 0 //to see when are we done fetching information.
  each(names, name => {
    movies[name] = []
    if (name == '') {
      console.log('Empty name')
      res.json({ status: 0, name: name })
      return
    }
    mdb.searchPerson(
      { query: name, include_adult: true },
      (err1, personInfo) => {
        if (isEmpty(personInfo.results) || personInfo.results[0] == null) {
          console.log('Who is ' + name + '?')
          res.json({ status: 0, name: name })
          return
        }
        const id = personInfo.results[0].id
        mdb.personCredits({ id: id, include_adult: true }, (err2, credits) => {
          each(credits.cast, movie => movies[name].push(movie))
          each(credits.crew, movie => movies[name].push(movie))
          movies[name] = deleteDuplicates(movies[name])
          if (++counter == limit) createResults(res, movies)
        })
      }
    )
  })
}
