import { getActorName, getActorRevenue, getConnection } from './api'

const MDB_API_KEY = '6931de2906a99776822e6352bddb2475'
const mdb = require('moviedb')(MDB_API_KEY)

let face_url = ''
mdb.configuration({}, (err, res) => {
  face_url = res.images.base_url + res.images.logo_sizes[0]
})

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
