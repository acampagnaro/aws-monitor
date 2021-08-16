const { param } =  require('express-validator')
// const { getFirebaseToken } = require('../config')
// const database = require('../config/firebase/database')
const ServersModel = require('../models/servers')
const logger = require('../config/logger')

module.exports = (server) => {
  server.post('/aws-monitor/update-last-backup/:server',[
    param('server').exists().notEmpty()
  ], async (req, res) => {
    const servers = await ServersModel.findOneAndUpdate({ server: req.params.server }, { lastBackup: new Date() })
      .catch((err) => {
        logger.error('AWS_MONITOR.SET_DATA:', err, 'ERROR')
        res.status(500).end('Error')
      })

    res.status(200).send(servers)
	})
}
