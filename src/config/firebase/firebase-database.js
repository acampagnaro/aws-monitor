let {google} = require("googleapis")

module.exports = async (myEmitter) => {

  let accessToken = {
    token: '',
    expiry_date: 1
  }
  
  // Define the required scopes.
  let scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/firebase.database"
  ]
  
  // Authenticate a JWT client with the service account.
  let jwtClient = new google.auth.JWT(
    process.env.FIREBASE_CLIENT_EMAIL,
    null,
    process.env.FIREBASE_PRIVATE_KEY,
    scopes
  )
  
  if( accessToken.expiry_date !== '' && accessToken.expiry_date > Date.now() ) {
    myEmitter.emit('tokenReady', accessToken.token)
  }
  else {
    // Use the JWT client to generate an access token.
    await jwtClient.authorize(async function(error, tokens) {
      if (error) {
        console.error("FIREBASE: Error making request to generate access token:", error);
      } else if (tokens.access_token === null) {
        console.error("FIREBASE: Provided service account does not have permission to generate access tokens");
      } 
      else {
        accessToken = {
          token: tokens.access_token,
          expiry_date: tokens.expiry_date
        }
        myEmitter.emit('tokenReady', accessToken.token)
      }
    })
  }
}
