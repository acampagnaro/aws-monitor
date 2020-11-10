const axios = require('axios')

module.exports = axios.create({
	baseURL: `https://spitzer-monitor.firebaseio.com`
})

