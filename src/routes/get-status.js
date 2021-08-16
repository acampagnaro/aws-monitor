const { header } =  require('express-validator')
const ServersModel = require('../models/servers')
const logger = require('../config/logger')

const validate = require('../services/validate')
const authorize = require('../services/authorization')

module.exports = (server) => {
  server.get('/aws-monitor/get-status',[
    header('Authorization').exists().notEmpty()
  ], validate, authorize, async (req, res) => {
    const servers = await ServersModel.find()
      .catch((err) => {
        logger.error('AWS_MONITOR.SET_DATA:', err, 'ERROR')
        res.status(500).end('Error')
      })

    res.status(200).send(servers)
	})
}
