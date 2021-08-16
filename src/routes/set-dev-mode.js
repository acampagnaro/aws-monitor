const { param, query } =  require('express-validator')
// const { getFirebaseToken } = require('../config')
// const database = require('../config/firebase/database')
const ServersModel = require('../models/servers')
const logger = require('../config/logger')

const validate = require('../services/validate')
const authorize = require('../services/authorization')

module.exports = (server) => {
  server.post('/aws-monitor/dev-mode/:server',[
    param('server').exists().notEmpty(),
    query('value').exists().notEmpty().toBoolean(),
  ], validate, authorize, async (req, res) => {
    const servers = await ServersModel.findOneAndUpdate({ server: req.params.server }, { devMode: req.query.value })
      .catch((err) => {
        logger.error('AWS_MONITOR.SET_DATA:', err, 'ERROR')
        res.status(500).end('Error')
      })

    res.status(200).send(servers)
	})
}
