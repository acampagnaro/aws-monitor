const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const dotenv = require('dotenv')
const bodyParser = require('body-parser')
dotenv.config()

const EventEmitter = require('events')

class Events extends EventEmitter {}
const events = new Events()

const app = express()

app.disable('x-powered-by')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use(morgan('dev'))
app.use(cors())

app.listen(process.env.PORT, () => console.log(`Everything okay, Running at port: ${process.env.PORT}`))

app.get('/', (req, res) => {
  res.status(200)
  res.send('API Working')
})

const modules = require('./src')
modules(app, events)

/* Não deixa a aplicação quebrar */
process.on('uncaughtException', function (err) {
  console.error('uncaughtException: ', err)
})