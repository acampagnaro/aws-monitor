const { check, validationResult } =  require('express-validator')
const { getFirebaseToken } = require('../config')
const database = require('../config/firebase/database')

module.exports = async (events, server) => {
  
  server.post('/aws-monitor/status-set/:server',[
  ], (req, res) => {
    
    let status = req.body.status.replace(/[ ]+/g, ' ')
    const serverName = req.params.server
    status = status.split('---break----------------------------------------------------')
    
    // DISK INFO
    const diskFreeRaw = status[0]
    const dFPattern = /(\/dev\/[a-z0-9]+)[ ]+([0-9]+)[ ]+([0-9]+)[ ]+([0-9]+)[ ]+([0-9]+)/
    const diskFreeProcessed = diskFreeRaw.match(dFPattern)
    const diskFree = {
      Name: diskFreeProcessed[1],
      Size: diskFreeProcessed[2],
      Used: diskFreeProcessed[3],
      Available: diskFreeProcessed[4],
      percentUsed: diskFreeProcessed[5]
    }
    
    // MSSQL FILES INFO
    const mssqlFiles = []
    const mssqlFilesRaw = status[1]
    const filesInfoPattern = /([-a-z]+) ([0-9]+) ([a-zA-Z]+) ([a-zA-Z]+) ([0-9]+) ([a-zA-Z]+) ([0-9]+) ([0-9:]+) ([a-zA-Z_.-]+)/g
    mssqlFilesProcessed = mssqlFilesRaw.match(filesInfoPattern)
    mssqlFilesProcessed.map((item) => {
      const itemSplit = item.split(' ')
      mssqlFiles.push({
        size: itemSplit[4],
        name: itemSplit[8]
      })
    })
    
    // MSSQL SERVER STATUS
    const mssqlStatusRaw = status[2]
    const mssqlStatusPattern = /Active: [a-zA-Z]+/
    mssqlStatusProcessed = mssqlStatusRaw.match(mssqlStatusPattern)[0]
    mssqlStatus = mssqlStatusProcessed.split(' ')[1]

    // RAM INFO
    const ramInfoRaw = status[3]
    const ramInfoPattern = /Mem:[ ]+([0-9]+)[ ]+([0-9]+)[ ]+([0-9]+)[ ]+([0-9]+)[ ]+([0-9]+)[ ]+([0-9]+)/
    const ramInfoProcessed = ramInfoRaw.match(ramInfoPattern)
    const ramInfo = {
      total: ramInfoProcessed[1],
      used: ramInfoProcessed[2],
      free: ramInfoProcessed[3],
      shared: ramInfoProcessed[4],
      cache: ramInfoProcessed[5],
      available: ramInfoProcessed[6]
    }
    
    // CPU LOAD AVERAGE
    const cpuLoadRaw = status[4]
    const cpuLoadPattern = /up[ ]+([0-9]+:[0-9]+|[0-9]+[ ]+[a-z]+)[,0-9a-z ]+load average:[ ]+([0-9.]+)[ ,]+([0-9.]+)[ ,]+([0-9.]+)/
    const cpuLoadProcessed = cpuLoadRaw.match(cpuLoadPattern)
    const uptime = cpuLoadProcessed[1]
    const cpuLoad = {
      oneMin: cpuLoadProcessed[2],
      fiveMin: cpuLoadProcessed[3],
      fifteenMin: cpuLoadProcessed[4]
    }

    const hostname = status[5]
    const hostnamePattern = /[a-zA-Z\-\_\.]+/g
    const hostnameProcessed = hostname.match(hostnamePattern)
    const host = {
      subdomain: hostnameProcessed[0],
      domain: 'clinic.inf.br'
    }

    const serverInfo = {
      server: serverName,
      mssqlStatus: mssqlStatus,
      diskInfo: diskFree,
      devMode: false,
      filesInfo: mssqlFiles,
      memory: ramInfo,
      cpuLoadAvg: cpuLoad,
      uptime: uptime,
      host: host,
      lastSeen: new Date()
    }

    console.log('AWS_MONITOR.SET_DATA:', `Data set: ${serverName}`)

    function setData ( data ) {
			events.once('tokenReady', (token) => {
				return database.patch(`/servers/${serverName}.json?access_token=${token}`, data)
				.then((response) => {
					res.status(response.status)
					res.end('Data set.')
				})
				.catch((err) => {
					console.error('AWS_MONITOR.SET_DATA:', err, 'ERROR')
					res.status(err.status)
					res.end('Error')
				})
			})
			getFirebaseToken(events)
    }

		setData(serverInfo)
    
  	return server
	})
}
