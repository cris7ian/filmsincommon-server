import mdbAPI from 'moviedb'
import redis from 'redis'
import bluebird from 'bluebird'

bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

const client = redis.createClient(process.env.REDIS_URL)

const mdb = mdbAPI(process.env.MDB_API_KEY)

const TWO_DAYS = 60 * 60 * 24 * 2

const searchInMBD = (options, method) =>
  new Promise((resolve, reject) =>
    mdb[method](options, (err, info) => {
      if (err) {
        reject()
      } else {
        client.set(
          `${method}:${options.query || options.id}`,
          JSON.stringify(info),
          'EX',
          TWO_DAYS
        )
        resolve(info)
      }
    })
  )

export const search = (options, method) => {
  return client
    .getAsync(`${method}:${options.query || options.id}`)
    .then(
      result => (result ? JSON.parse(result) : searchInMBD(options, method))
    )
    .catch(error => {
      console.log(`error!: ${error}`)
    })
}
