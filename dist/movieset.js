'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})
exports.createResults = exports.deleteDuplicates = undefined

var _each = require('lodash/each')

var _each2 = _interopRequireDefault(_each)

var _find = require('lodash/find')

var _find2 = _interopRequireDefault(_find)

var _some = require('lodash/some')

var _some2 = _interopRequireDefault(_some)

var _isNull = require('lodash/isNull')

var _isNull2 = _interopRequireDefault(_isNull)

var _includes = require('lodash/includes')

var _includes2 = _interopRequireDefault(_includes)

var _union = require('lodash/union')

var _union2 = _interopRequireDefault(_union)

var _isUndefined = require('lodash/isUndefined')

var _isUndefined2 = _interopRequireDefault(_isUndefined)

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj }
}

var mdb = require('moviedb')('6931de2906a99776822e6352bddb2475')

var poster_url = ''
var poster_url_original = ''
mdb.configuration({}, function(err, res) {
  console.log(
    'Configuration from Movie DB loaded with poster sizes of ' +
      res.images.logo_sizes[4]
  )
  poster_url = res.images.base_url + res.images.logo_sizes[4]
  poster_url_original = res.images.base_url + res.images.logo_sizes[5]
})

var deleteDuplicates = (exports.deleteDuplicates = function deleteDuplicates(
  arr
) {
  var movies = []
  var titles = []
  ;(0, _each2.default)(arr, function(movie) {
    if (!(0, _includes2.default)(titles, movie.title)) {
      movies.push(movie)
      titles.push(
        movie.title //to keep track of the movies we already have.
      )
    }
  })
  return movies
})

var intersect = function intersect(arr1, arr2) {
  var intersect = []
  var allMovies = (0, _union2.default)(
    arr1,
    arr2
    //we need the movie to be contained in all of the people's work.
  )
  ;(0, _each2.default)(allMovies, function(movie) {
    if (
      (0, _some2.default)(arr1, { title: movie.title }) &&
      (0, _some2.default)(arr2, { title: movie.title }) &&
      !(0, _some2.default)(intersect, { title: movie.title })
    ) {
      intersect.push(movie)
    }
  })
  return intersect
}

var createResults = (exports.createResults = function createResults(
  res,
  movies,
  useBigPosters
) {
  var arr = null
  for (var actor in movies) {
    if ((0, _isNull2.default)(arr)) {
      //initialization.
      arr = movies[actor]
    } else {
      arr = intersect(
        arr,
        movies[actor] //only the movies they share.
      )
    }
  }
  var answer = '' //we just use this variable to print a friendly log.
  var responseJson = {} //the final response.
  responseJson.moviesTheyWorkedIn = []
  responseJson.status = 1 //so far so good.
  ;(0, _each2.default)(
    arr,
    function(movie) {
      var info = {}
      answer += 'Movie: ' + movie.title + ' (' + movie.release_date + ')' //we need only the year when it was released.
      info.movie = movie.title
      if (movie.poster_path) {
        info.poster =
          (useBigPosters ? poster_url_original : poster_url) + movie.poster_path
      }
      info.date = movie.release_date
      info.people = []
      for (var _actor in movies) {
        var actorJob = (0, _find2.default)(movies[_actor], {
          title: movie.title
        })
        if ((0, _isUndefined2.default)(actorJob.job)) {
          //if he was an actor.
          answer += '\n\t' + _actor + ' was ' + actorJob.character
          info.people.push({ name: _actor, character: actorJob.character })
        } else {
          //if he was part of the crew.
          answer += '\n\t' + _actor + ' worked as a ' + actorJob.job
          info.people.push({ name: _actor, job: actorJob.job })
        }
      }
      responseJson.moviesTheyWorkedIn.push(info)
      answer += '\n'
    }

    //we now look for the imdb links in Google.
  )
  res.json(responseJson)
})
