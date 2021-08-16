'use strict'
const mongoose = require('mongoose')
const logger = require('./logger')

module.exports = () => {
  mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/aws-monitor?retryWrites=true`, { 
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(
    () => {
      logger.info('· MONGODB: Connected\n')
    }, 
    (err) => {
      logger.error(err, 'MONGODB: erro ao conectar mongoDB')
    }
  )
}

