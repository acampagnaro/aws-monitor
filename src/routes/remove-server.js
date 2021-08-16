const { param } =  require('express-validator')
// const { getFirebaseToken } = require('../config')
// const database = require('../config/firebase/database')
const ServersModel = require('../models/servers')
const logger = require('../config/logger')

const validate = require('../services/validate')
const authorize = require('../services/authorization')

module.exports = (server) => {
  server.post('/aws-monitor/remove/:server',[
    param('server').exists().notEmpty()
  ], validate, authorize, async (req, res) => {
    const servers = await ServersModel.findOneAndDelete({ server: req.params.server })
      .catch((err) => {
        logger.error('AWS_MONITOR.SET_DATA:', err, 'ERROR')
        res.status(500).end('Error')
      })

    res.status(200).send(servers)
	})
}
