const alerter = require('./services/alerter')
const setData = require('./routes/set-data')

module.exports = (app, events) => {
	alerter(events, app) //cronjob
  setData(events, app)

  return app
}
