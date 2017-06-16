import each from 'lodash/each'
import find from 'lodash/find'
import some from 'lodash/some'
import isNull from 'lodash/isNull'
import includes from 'lodash/includes'
import union from 'lodash/union'
import isUndefined from 'lodash/isUndefined'

const mdb = require('moviedb')(process.env['MDB_API_KEY'])

let poster_url = ''
let poster_url_original = ''
mdb.configuration({}, (err, res) => {
  console.log(
    'Configuration from Movie DB loaded with poster sizes of ' +
      res.images.logo_sizes[4]
  )
  poster_url = res.images.base_url + res.images.logo_sizes[4]
  poster_url_original = res.images.base_url + res.images.logo_sizes[5]
})

export const deleteDuplicates = arr => {
  let movies = []
  let titles = []
  each(arr, movie => {
    if (!includes(titles, movie.title)) {
      movies.push(movie)
      titles.push(movie.title) //to keep track of the movies we already have.
    }
  })
  return movies
}

const intersect = (arr1, arr2) => {
  let intersect = []
  const allMovies = union(arr1, arr2)
  //we need the movie to be contained in all of the people's work.
  each(allMovies, movie => {
    if (
      some(arr1, { title: movie.title }) &&
      some(arr2, { title: movie.title }) &&
      !some(intersect, { title: movie.title })
    ) {
      intersect.push(movie)
    }
  })
  return intersect
}

export const createResults = (res, movies, useBigPosters = true) => {
  let arr = null
  for (let actor in movies) {
    if (isNull(arr)) {
      //initialization.
      arr = movies[actor]
    } else {
      arr = intersect(arr, movies[actor]) //only the movies they share.
    }
  }
  let answer = '' //we just use this variable to print a friendly log.
  let responseJson = {} //the final response.
  responseJson.moviesTheyWorkedIn = []
  responseJson.status = 1 //so far so good.
  each(arr, movie => {
    const info = {}
    answer += 'Movie: ' + movie.title + ' (' + movie.release_date + ')' //we need only the year when it was released.
    info.movie = movie.title
    if (movie.poster_path) {
      info.poster =
        (useBigPosters ? poster_url_original : poster_url) + movie.poster_path
    }
    info.date = movie.release_date
    info.people = []
    for (let actor in movies) {
      const actorJob = find(movies[actor], { title: movie.title })
      if (isUndefined(actorJob.job)) {
        //if he was an actor.
        answer += '\n\t' + actor + ' was ' + actorJob.character
        info.people.push({ name: actor, character: actorJob.character })
      } else {
        //if he was part of the crew.
        answer += '\n\t' + actor + ' worked as a ' + actorJob.job
        info.people.push({ name: actor, job: actorJob.job })
      }
    }
    responseJson.moviesTheyWorkedIn.push(info)
    answer += '\n'
  })

  console.log(answer)
  //we now look for the imdb links in Google.
  res.json(responseJson)
}
