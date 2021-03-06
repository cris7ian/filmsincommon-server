import { getActorName, getActorRevenue, getConnection } from './api'
import timeout from 'connect-timeout'
import express from 'express'

express()
  .use(timeout(120000))
  .use((req, res, next) => {
    res
      .header('Access-Control-Allow-Origin', '*')
      .header(
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS, PUT, PATCH, DELETE'
      )
      .header(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, Content-Length, X-Requested-With'
      )
    next()
  })
  .get('/person/:name', getActorName)
  .get('/revenue/:id', getActorRevenue)
  .get('/connection/:id1/:id2', getConnection)
  .listen(process.env['PORT'] || 3000)

console.log(`server started at port ${process.env['PORT'] || 3000}`)
