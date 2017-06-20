import each from 'lodash/each'
import find from 'lodash/find'
import isNull from 'lodash/isNull'
import intersectionBy from 'lodash/intersectionBy'
import isUndefined from 'lodash/isUndefined'

const POSTERS_URL = 'http://image.tmdb.org/t/p/w500'

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
  const responseJson = {}
  responseJson.moviesTheyWorkedIn = []
  each(arr, movie => {
    const info = {}
    answer += 'Movie: ' + movie.title + ' (' + movie.release_date + ')'
    info.movie = movie.title
    if (movie.poster_path) {
      info.poster = POSTERS_URL + movie.poster_path
    }
    info.date = movie.release_date
    info.people = []
    for (const actor in movies) {
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
