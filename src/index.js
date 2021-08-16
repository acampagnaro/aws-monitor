const alerter = require('./services/alerter')
const routes = require('./routes')

module.exports = (app) => {
	alerter(app) //cronjob
  routes(app)
}
