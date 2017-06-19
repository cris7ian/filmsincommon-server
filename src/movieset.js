import each from 'lodash/each'
import find from 'lodash/find'
import isNull from 'lodash/isNull'
import intersectionBy from 'lodash/intersectionBy'
import isUndefined from 'lodash/isUndefined'
import mdbAPI from 'moviedb'

const mdb = mdbAPI(process.env['MDB_API_KEY'])

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

export const createResults = (movies, useBigPosters = true) => {
  let arr = null
  for (let actor in movies) {
    if (isNull(arr)) {
      //initialization.
      arr = movies[actor]
    } else {
      arr = intersectionBy(arr, movies[actor], 'title') //only the movies they share.
    }
  }
  let answer = '' //we just use this variable to print a friendly log.
  let responseJson = {} //the final response.
  responseJson.moviesTheyWorkedIn = []
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
  return Promise.resolve(responseJson)
}
