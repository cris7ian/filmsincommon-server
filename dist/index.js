'use strict'

var _each = require('lodash/each')

var _each2 = _interopRequireDefault(_each)

var _reduce = require('lodash/reduce')

var _reduce2 = _interopRequireDefault(_reduce)

var _isEmpty = require('lodash/isEmpty')

var _isEmpty2 = _interopRequireDefault(_isEmpty)

var _sortBy = require('lodash/sortBy')

var _sortBy2 = _interopRequireDefault(_sortBy)

var _movieset = require('./movieset')

var _async = require('async')

var _async2 = _interopRequireDefault(_async)

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj }
}

var MDB_API_KEY = '6931de2906a99776822e6352bddb2475'
var mdb = require('moviedb')(MDB_API_KEY)

var face_url = ''
mdb.configuration({}, function(err, res) {
  console.log(
    'Configuration from Movie DB loaded with profile pic sizes of ' +
      res.images.logo_sizes[0]
  )
  face_url = res.images.base_url + res.images.logo_sizes[0]
})

var express = require('express')
var app = express()

app.use(function(req, res, next) {
  // Website you wish to allow to connect
  res.header(
    'Access-Control-Allow-Origin',
    '*'

    // Request methods you wish to allow
  )
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  )
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With'

    // Pass to next layer of middleware
  )
  next()
})

app.use(
  express.bodyParser()

  // POST name: the person to search for.
)
app.post('/person', function(req, res) {
  if (!req.body.name) {
    //we throw an error if there are no params.
    res.json({ status: 0, name: 'error' })
    return
  }
  var name = req.body.name
  //we use 'ngram' because we'll want to use it as an autocomplete method (see API).
  mdb.searchPerson(
    { query: name, search_type: 'ngram', include_adult: true },
    function(err1, personInfo) {
      if ((0, _isEmpty2.default)(personInfo.results)) {
        res.json([])
        return
      }
      ;(0, _each2.default)(
        personInfo.results,
        function(person, index) {
          if (person.profile_path != null) {
            personInfo.results[index].profile_path =
              face_url + person.profile_path
          }
        }

        //important to sort results by their popularity.
      )
      personInfo.results = (0, _sortBy2.default)(personInfo.results, function(
        obj
      ) {
        return obj.popularity
      }).reverse()

      res.json(personInfo.results)
    }
  )
})

app.post(
  '/revenue',
  function(req, res) {
    if (!req.body.id) {
      //we throw an error if there are no params.
      res.json({ status: 0, name: 'error' })
      return
    }
    var id = req.body.id

    var getRevenue = function getRevenue(credit, callback) {
      mdb.movieInfo({ id: credit.id }, function(err, result) {
        credit.revenue = result.revenue
        callback(null, result.revenue)
      })
    }

    mdb.personCredits({ id: id, include_adult: true }, function(err2, credits) {
      if (err2 || !credits.cast) {
        res.json({ status: 0, name: 'error' })
        return
      }
      _async2.default.map(credits.cast, getRevenue, function(err, results) {
        var revenue = (0, _reduce2.default)(
          results,
          function(memo, num) {
            return memo + num
          },
          0
        )
        res.json({ credits: credits, revenue: revenue })
      })
    })
  }

  // POST names: an array with the people to query for.
)
app.post(
  '/connection',
  function(req, res) {
    var movies = {} //here we'll store all  the movies from each actor.
    var useBigPosters = false //A flag that says whether we want big posters or not.
    res.type(
      'text/plain' // set content-type
    )
    if (!req.body.names) {
      //we throw a mistake if there are no params.
      res.json({ status: 0, name: 'error' })
      return
    }

    if (req.body.useBigPosters) {
      useBigPosters = true
    }
    var names = []
    try {
      //we eval this params.
      names = eval(req.body.names)
    } catch (e) {
      res.json({ status: 0, name: 'array' })
      return
    }

    var limit = names.length //the amount of actors to ask for.
    var counter = 0 //to see when are we done fetching information.
    ;(0, _each2.default)(names, function(name) {
      movies[name] = []
      if (name == '') {
        console.log('Empty name')
        res.json({ status: 0, name: name })
        return
      }
      mdb.searchPerson({ query: name, include_adult: true }, function(
        err1,
        personInfo
      ) {
        if (
          (0, _isEmpty2.default)(personInfo.results) ||
          personInfo.results[0] == null
        ) {
          console.log('Who is ' + name + '?')
          res.json({ status: 0, name: name })
          return
        }
        var id = personInfo.results[0].id
        mdb.personCredits({ id: id, include_adult: true }, function(
          err2,
          credits
        ) {
          ;(0, _each2.default)(credits.cast, function(movie) {
            return movies[name].push(movie)
          })
          ;(0, _each2.default)(credits.crew, function(movie) {
            return movies[name].push(movie)
          })
          movies[name] = (0, _movieset.deleteDuplicates)(movies[name])
          if (++counter == limit)
            (0, _movieset.createResults)(res, movies, useBigPosters)
        })
      })
    })
  }

  //now we start the server. Yei.
)
app.listen(undefined || 3000)
console.log('server listening at port: ' + (undefined || 3000))
