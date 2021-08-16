const getStatus = require('./get-status')
const setData = require('./set-data')
const removeServer = require('./remove-server')
const updateLastBackupTime = require('./update-last-backup-time')
const setDevMode = require('./set-dev-mode')

module.exports = (app) => {
  getStatus(app)
  setData(app)
  removeServer(app)
  updateLastBackupTime(app)
  setDevMode(app)
}