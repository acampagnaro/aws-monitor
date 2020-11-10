const getFirebaseToken = require ('./firebase/firebase-database')

module.exports = {
  destinations: process.env.ALERT_DESTINATIONS,
  getFirebaseToken
}