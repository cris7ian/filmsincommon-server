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

const express = require('express')
const app = express()

app.use((req, res, next) => {
  // Website you wish to allow to connect
  res.header('Access-Control-Allow-Origin', '*')

  // Request methods you wish to allow
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  )
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With'
  )

  // Pass to next layer of middleware
  next()
})

app.use(express.bodyParser())

// POST name: the person to search for.
app.post('/person', (req, res) => {
  if (!req.body.name) {
    //we throw an error if there are no params.
    res.json({ status: 0, name: 'error' })
    return
  }
  const name = req.body.name
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
})

app.post('/revenue', (req, res) => {
  if (!req.body.id) {
    //we throw an error if there are no params.
    res.json({ status: 0, name: 'error' })
    return
  }
  const id = req.body.id

  const getRevenue = (credit, callback) => {
    mdb.movieInfo({ id: credit.id }, (err, result) => {
      credit.revenue = result.revenue
      callback(null, result.revenue)
    })
  }

  mdb.personCredits({ id: id, include_adult: true }, (err2, credits) => {
    if (err2 || !credits.cast) {
      res.json({ status: 0, name: 'error' })
      return
    }
    async.map(credits.cast, getRevenue, (err, results) => {
      const revenue = reduce(results, (memo, num) => memo + num, 0)
      res.json({ credits: credits, revenue: revenue })
    })
  })
})

// POST names: an array with the people to query for.
app.post('/connection', (req, res) => {
  let movies = {} //here we'll store all  the movies from each actor.
  let useBigPosters = false //A flag that says whether we want big posters or not.
  res.type('text/plain') // set content-type
  if (!req.body.names) {
    //we throw a mistake if there are no params.
    res.json({ status: 0, name: 'error' })
    return
  }

  if (req.body.useBigPosters) {
    useBigPosters = true
  }
  let names = []
  try {
    //we eval this params.
    names = eval(req.body.names)
  } catch (e) {
    res.json({ status: 0, name: 'array' })
    return
  }

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
          if (++counter == limit) createResults(res, movies, useBigPosters)
        })
      }
    )
  })
})

//now we start the server. Yei.
app.listen(process.env['PORT'] || 3000)
console.log(`server listening at port: ${process.env['PORT'] || 3000}`)
