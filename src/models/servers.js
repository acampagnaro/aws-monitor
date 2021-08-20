const mongoose = require('mongoose')

const servers = new mongoose.Schema({
  server: String,
  mssqlStatus: String,
  diskInfo: {
    Name: String,
    Size: String,
    Used: String,
    Available: String,
    percentUsed: String
  },
  devMode: { type: Boolean, default: false },
  filesInfo: [{
    name: String,
    size: String,
  }],
  memory: {
    total: String,
    used: String,
    free: String,
    shared: String,
    cache: String,
    available: String
  },
  cpuLoadAvg: {
    oneMin: String,
    fiveMin: String,
    fifteenMin: String
  },
  uptime: String,
  host: {
    ip: String,
    subdomain: String,
    cloudflare_zone_id: String,
    cloudflare_zone_name: String,
    cloudflare_dns_record_id: String,
    cloudflare_dns_record_content: String,
  },
  lastBackup: Date,
}, { timestamps: true })

module.exports = mongoose.model('servers', servers)
