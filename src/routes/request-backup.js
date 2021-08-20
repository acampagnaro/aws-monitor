const { param, query, header } =  require('express-validator')
const axios = require('axios')

const ServersModel = require('../models/servers')
const logger = require('../config/logger')

const validate = require('../services/validate')
const authorize = require('../services/authorization')

module.exports = (server) => {
  server.post('/aws-monitor/request-backup/:server',[
    header('Authorization').exists().notEmpty(),
    param('server').exists().notEmpty(),
  ], validate, authorize, async (req, res) => {
    const serverInfo = await ServersModel.findOne({ server: req.params.server })
      .catch((err) => {
        logger.error('AWS_MONITOR.REQUEST_BACKUP:', err, 'ERROR')
      })

    if (!serverInfo) {
      res.status(500).send({ errors: ['Error getting serverInfo'] })
      return
    }

    console.log(serverInfo.host)

    if (!serverInfo.host || !serverInfo.host.ip) {
      res.status(500).send({ errors: ['Cant request backup'] })
      return
    }
    
    axios.default.defaults.timeout = 999999

    const backupResult = await axios.get(`http://${serverInfo.host.ip}:8097/request-backup?jwt=${req.headers.authorization}`)
      .catch((err) => {
        logger.error('AWS_MONITOR.REQUEST_BACKUP:', err, 'ERROR')
        res.status(500).send({ errors: ['Error getting backup'] })
      })
    console.log(backupResult)

    res.status(200).send(backupResult.data)
	})
}
