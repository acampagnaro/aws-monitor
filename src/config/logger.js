const pino = require('pino')

const logger = pino({
  level: process.env.DEBUG_MODE || 'info',
  prettyPrint: true,
})

module.exports = logger
