const { getFirebaseToken } = require('../config')
const database = require('../config/firebase/database')
const { CronJob } = require('cron')
const mailer = require('./mailer')
const moment = require('moment')
const path = require('path')
const { destinations } = require('../config')
const humanSize = require('human-size')
moment.locale('pt-br')


module.exports = (events) => {

	const checkAWSServersData = (serversData) => {
		serversDataArray = Object.entries(serversData)
		let Errors = []
		
		serversDataArray.map((item) => {
			let server = item[1]

			if(!server.devMode){				
				if(!server.diskInfo.percentUsed || server.diskInfo.percentUsed > 75){
					Errors.push({Alert: 'Disk Usage', Server: server.server, PercentUsed: server.diskInfo.percentUsed})
        }

				if(!server.lastSeen || new Date(server.lastSeen).getTime() < (Date.now() - (20 * 60 * 1000))) {
					Errors.push({Alert: 'Last Seen', Server: server.server, lastSeen: moment(server.lastSeen).format('LLLL')})
				}
				
				if(!server.mssqlStatus || server.mssqlStatus !== 'active') {
					Errors.push({Alert: 'MSSQL Offline', Server: server.server, mssqlStatus: server.mssqlStatus})
				}
				
				if(server.cpuLoadAvg.fiveMin > 0.9 && server.cpuLoadAvg.fifteenMin > 0.8) {
					Errors.push({Alert: 'CPU Load', Server: server.server, cpuLoad: server.cpuLoadAvg})
        }
        
				if((server.memory.available / server.memory.total) <= 0.15) {
					Errors.push({Alert: 'Low memory', Server: server.server, availableMemory: server.memory.available, percentAvailable: (server.memory.available / server.memory.total)})
				}
	
				if(server.uptime > 13) {
					Errors.push({Alert: 'Uptime', Server: server.server, uptime: server.uptime})
				}

				server.filesInfo.map((file) => {
					if(!file.size || file.size > ( 200 * 1024 * 1024 )){  // ( MB * MB (size) * KB (size) )
						if(path.extname(file.name) !== '.mdf' && file.name.split('_')[file.name.split('_').length - 1] !== 'Data'){
							Errors.push({Alert: 'File Size', Server: server.server, file: file.name, size: humanSize(file.size, 2)})
						} 
					}
				})
			}
		})
				
		if(Errors.length){
      console.error(new Date(), '| AWS_MONITOR.ALERTER:', Errors)
      const config = {
        to: destinations,
        subject: 'ALERTA',
        message: `Erros: \n\n ${JSON.stringify(Errors,'', 2)}`
      }
			mailer.mail(config)
		}

		console.log(new Date(), '| AWS_MONITOR.ALERTER:', 'servers checked!')
	}
	
	const getAWSServersData = () => {
		let serversData = []

		events.once('tokenReady', (token) => {
			database.get(`/servers.json?access_token=${token}`)
			.then((response) => {
				serversData = response.data
				console.log(new Date(), '| AWS_MONITOR.ALERTER:', 'checking servers...')
				checkAWSServersData(serversData)
			})
			.catch((err) => {
        console.error(new Date(), '| AWS_MONITOR.ALERTER:', err, 'ERROR')
        const config = {
          to: destinations,
          subject: 'ALERTA',
          message: `${err}`
        }
				mailer.mail(config)
			})
		})
		getFirebaseToken(events)
	}
  
  const cron = process.env.ALERTER_CRON || '0 5-59/20 * * * *'
  
  console.log('Alerter will check for errors following cron:', cron)
	let verifyServers = new CronJob(cron, () => {
		getAWSServersData()
	}, null, true)
	verifyServers.start()
}