const axios = require('axios');
const { destinations } = require('../config');
const mailer = require('./mailer');

const $apiCloudflare = axios.create({
  baseURL: 'https://api.cloudflare.com/client/v4',
  headers: {
    Authorization: `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
    'Content-Type': 'application/json',
  }
})

function getDnsRecords(parameters) {
  return $apiCloudflare.get(`/zones/${process.env.CLOUDFLARE_REGION_ID}/dns_records`, { params: parameters }).then(a => a.data.result)
}
module.exports.getDnsRecords = getDnsRecords

function updateDnsRecords(record_id, payload) {
  return $apiCloudflare.put(`/zones/${process.env.CLOUDFLARE_REGION_ID}/dns_records/${record_id}`, payload)
    .then(a => {
      mailer.mail({
        to: destinations,
        subject: `ATUALIZADO REGISTRO DNS: ${a.data.result.name}`,
        message: `dns_record: \n\n ${JSON.stringify(a.data.result,'', 2)}`
      })

      return a.data.result
    })
    .catch(error => {
      mailer.mail({
        to: destinations,
        subject: `ERROR: ATUALIZANDO REGISTRO DNS`,
        message: `Payload: \n${JSON.stringify(payload,'', 2)}\n\nError: \n${JSON.stringify(error.response.data,'', 2)}`
      })
      console.log('Error updating Cloudflare DNS record', error.response.data)
      throw error
    })
}
module.exports.updateDnsRecords = updateDnsRecords 

function createDnsRecords(payload) {
  return $apiCloudflare.post(`/zones/${process.env.CLOUDFLARE_REGION_ID}/dns_records`, payload)
    .then(a => {
      mailer.mail({
        to: destinations,
        subject: `CRIADO REGISTRO DNS: ${a.data.result.name}`,
        message: `dns_record: \n\n ${JSON.stringify(a.data.result,'', 2)}`
      })

      return a.data.result
    })
    .catch(error => {
      mailer.mail({
        to: destinations,
        subject: `ERROR: CRIANDO REGISTRO DNS`,
        message: `Payload: \n${JSON.stringify(payload,'', 2)}\n\nError: \n${JSON.stringify(error.response,'', 2)}`
      })
      console.log('Error creating Cloudflare DNS record', error.response.data)
    })
}
module.exports.createDnsRecords = createDnsRecords
