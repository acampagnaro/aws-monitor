const express = require('express')
const morgan = require('morgan')
const cors = require('./cors')

require('dotenv/config')

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(morgan('dev'))
app.use(cors)

app.listen(process.env.PORT, () => console.log(`Everything okay, Running at port: ${process.env.PORT}`))

app.get('/', (req, res) => res.status(200).redirect('https://spitzer.io'))

const modules = require('./src')
modules(app)

/* Não deixa a aplicação quebrar */
process.on('uncaughtException', function (err) {
  console.error('uncaughtException: ', err)
})