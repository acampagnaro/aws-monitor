// const { getFirebaseToken } = require('../config')
// const database = require('../config/firebase/database')
const { CronJob } = require('cron')
const mailer = require('./mailer')
const moment = require('moment')
const path = require('path')
const { destinations } = require('../config')
const humanSize = require('human-size')
moment.locale('pt-br')
const ServersModel = require('../models/servers')
const logger = require('../config/logger')


module.exports = () => {
	const checkAWSServersData = (serversDataArray) => {
		const Errors = []
		
		serversDataArray.map((server) => {
			if(server.devMode) return // Server in devMode, no notifications are issued

			if(!server.diskInfo.percentUsed || server.diskInfo.percentUsed > 75){
				Errors.push({Alert: 'Disk Usage', Server: server.server, PercentUsed: server.diskInfo.percentUsed})
			}

			if(!server.updatedAt || new Date(server.updatedAt).getTime() < (Date.now() - (20 * 60 * 1000))) {
				Errors.push({Alert: 'Last Seen', Server: server.server, updatedAt: moment(server.updatedAt).format('LLLL')})
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
				// if(!file.size || file.size > ( 200 * 1024 * 1024 )){  // ( MB * MB (size) * KB (size) )
					 // if(path.extname(file.name) !== '.mdf' && file.name.split('_')[file.name.split('_').length - 1] !== 'Data'){
				// If file is log and > than 400MB
				if(!file.size || file.size > ( 400 * 1024 * 1024 )){  // ( MB * MB (size) * KB (size) )	
					if(path.extname(file.name) === '.ldf' || file.name.split('_')[file.name.split('_').length - 1].match(/log/i)){
						Errors.push({Alert: 'Log_File Size', Server: server.server, file: file.name, size: humanSize(file.size, 2)})
					} 
				}
				// If file isn't log and size > than 10GB
				if(!file.size || file.size > ( 10 * 1024 * 1024 * 1024 )){  // ( GB * GB (size) * MB (size) * KB (size) )	
					if(path.extname(file.name) !== '.ldf' && !file.name.split('_')[file.name.split('_').length - 1].match(/log/i)){
						Errors.push({Alert: 'File Size', Server: server.server, file: file.name, size: humanSize(file.size, 2)})
					} 
				}
			})
		})
				
		if(Errors.length){
      logger.error(['AWS_MONITOR.ALERTER', Errors])
      const config = {
        to: destinations,
        subject: 'ALERTA',
        message: `Erros: \n\n ${JSON.stringify(Errors,'', 2)}`
      }
			mailer.mail(config)
		}

		logger.info('AWS_MONITOR.ALERTER: servers checked!')
	}
	
	const getAWSServersData = async () => {
		try {
			logger.info('AWS_MONITOR.ALERTER: checking servers...')
			const serversData = await ServersModel.find()
			checkAWSServersData(serversData)
		} catch (err) {
			logger.error(['AWS_MONITOR.ALERTER', err])
			const config = {
				to: destinations,
				subject: 'ALERTA',
				message: `${err}`
			}
			mailer.mail(config)
		}
	}
  
  const cron = process.env.ALERTER_CRON || '0 5-59/20 * * * *'
  
  logger.info(`Alerter will check for errors following cron: ${cron}`)
	const verifyServersCron = new CronJob(cron, getAWSServersData, null, true, 'America/Sao_Paulo', this, false, -3)
	verifyServersCron.start()
}
