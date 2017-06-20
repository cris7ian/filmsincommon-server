import { getActorName, getActorRevenue, getConnection } from './api'

const express = require('express')
const app = express()

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  )
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With'
  )
  next()
})

app.get('/person/:name', getActorName)
app.get('/revenue/:id', getActorRevenue)
app.get('/connection/:id1/:id2', getConnection)

//now we start the server. Yei.
app.listen(process.env['PORT'] || 3000)
console.log(`server started at port ${process.env['PORT'] || 3000}`)
