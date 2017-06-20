import { getConnection } from '../src/api'
import mdbAPI from 'moviedb'

mdbAPI.getPerson = jest.fn()
mdbAPI.searchPerson = jest.fn()
mdbAPI.personCredits = jest.fn()
mdbAPI.getCredits = jest.fn()
mdbAPI.movieInfo = jest.fn()

test('get connection gets an actor', () => {
  expect(typeof getConnection).toEqual('function')
})
