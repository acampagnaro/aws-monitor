// const {} =  require('express-validator')
// const { getFirebaseToken } = require('../config')
// const database = require('../config/firebase/database')
const ServersModel = require('../models/servers')
const logger = require('../config/logger')
const { getDnsRecords, updateDnsRecords, createDnsRecords } = require('../services/cloudflare')

module.exports = (server) => {
  server.post('/aws-monitor/status-set/:server',[
  ], async (req, res) => {
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
    const ip = status[6]
    ipProcessed = ip.trim()
    const host = {
      subdomain: hostnameProcessed[0],
      ip: ipProcessed,
    }

    const serverInfo = {
      server: serverName,
      mssqlStatus: mssqlStatus,
      diskInfo: diskFree,
      filesInfo: mssqlFiles,
      memory: ramInfo,
      cpuLoadAvg: cpuLoad,
      uptime: uptime,
      'host.subdomain': host.subdomain,
      'host.ip': host.ip,
    }

    logger.info('AWS_MONITOR.SET_DATA:', `Data set: ${serverName}`)

    const updatedServer = await ServersModel.findOneAndUpdate({ server: serverInfo.server }, serverInfo, { upsert: true, new: true, useFindAndModify: false })
      .then((response) => {
        res.status(200)
        res.end('Data set.')
        return response
      })
      .catch((err) => {
        logger.error('AWS_MONITOR.SET_DATA:', err, 'ERROR')
        res.status(500)
        res.end('Error')
      })

    if ( // Check if has server ip and is missing any of cloudflare info
      updatedServer.host && updatedServer.host.ip
      && (
        !updatedServer.host.cloudflare_zone_id
        || !updatedServer.host.cloudflare_zone_name
        || !updatedServer.host.cloudflare_dns_record_id
        || !updatedServer.host.cloudflare_dns_record_content
      )
    ) {
      try {
        // attempt to find record with server's ip
        let [record] = await getDnsRecords({ content: updatedServer.host.ip })

        // if record doesn't exists creates one
        if (!record && updatedServer.host.subdomain) {
          record = await createDnsRecords({
            type: 'A',
            name: updatedServer.host.subdomain,
            content: updatedServer.host.ip,
            ttl: 1,
            proxied: false
          })
        }

        // updates server's cloudflare dns info
        await ServersModel.findByIdAndUpdate(updatedServer._id, {
          'host.cloudflare_zone_id': record.zone_id,
          'host.cloudflare_zone_name': record.zone_name,
          'host.cloudflare_dns_record_id': record.id,
          'host.cloudflare_dns_record_content': record.content,
        }, { useFindAndModify: false })
      } catch (e) {
        console.log(e.response.data, 'Error updating DNS info')
      }
    } else if ( // If has ip and cloudflare info but current ip is different from dns record ip
      updatedServer.host
      && updatedServer.host.ip
      && updatedServer.host.cloudflare_dns_record_content
      && updatedServer.host.ip !== updatedServer.host.cloudflare_dns_record_content
    ) {
      // attempt to update dns record
      await updateDnsRecords(updatedServer.host.cloudflare_dns_record_id, {
        type: 'A',
        name: updatedServer.host.subdomain,
        content: updatedServer.host.ip,
        ttl: 1,
        proxied: false
      }).catch(async (error) => {
        if (
          error.response.data
          && error.response.data.errors
          && error.response.data.errors.length
          && error.response.data.errors[0].code === 81044 // Record doesnt exist, deleted manually
        ) {
          try {
            // attempt to find record with server's ip
            let [record] = await getDnsRecords({ content: updatedServer.host.ip })
    
            // if record doesn't exists creates one
            if (!record && updatedServer.host.subdomain) {
              record = await createDnsRecords({
                type: 'A',
                name: updatedServer.host.subdomain,
                content: updatedServer.host.ip,
                ttl: 1,
                proxied: false
              })
            }
    
            // updates server's cloudflare dns info
            await ServersModel.findByIdAndUpdate(updatedServer._id, {
              'host.cloudflare_zone_id': record.zone_id,
              'host.cloudflare_zone_name': record.zone_name,
              'host.cloudflare_dns_record_id': record.id,
              'host.cloudflare_dns_record_content': record.content,
            }, { useFindAndModify: false })
          } catch (e) {
            console.log(e.response.data, 'Error updating DNS info')
          }
        }
      })
    }
	})
}

// ─·─ SET DATA FUNCTION FOR FIREBASE ── KEPT FOR REFERENCE. NO LONGER IN USE ─·─
//
// function setData ( data ) {
//   events.once('tokenReady', (token) => {
//     return database.patch(`/servers/${serverName}.json?access_token=${token}`, data)
//     .then((response) => {
//       res.status(response.status)
//       res.end('Data set.')
//     })
//     .catch((err) => {
//       logger.error('AWS_MONITOR.SET_DATA:', err, 'ERROR')
//       res.status(err.status)
//       res.end('Error')
//     })
//   })
//   getFirebaseToken(events)
// }
// setData(serverInfo)
//
// ─·─ SET DATA FUNCTION FOR FIREBASE ── KEPT FOR REFERENCE. NO LONGER IN USE ─·─