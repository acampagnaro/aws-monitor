// const getFirebaseToken = require ('./firebase/firebase-database')
// module.exports = {
//   destinations: process.env.ALERT_DESTINATIONS,
//   getFirebaseToken
// }
//
// ─── This app no longer use firebase ───────────────────────────────────────

const mongodb = require ('./mongoDB')
mongodb()

const logger = require ('./logger')

module.exports = {
  destinations: process.env.ALERT_DESTINATIONS,
  logger,
}