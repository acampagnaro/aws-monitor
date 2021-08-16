const jwt = require('jsonwebtoken')

module.exports = async function authentication (req, res, next) {
  if (res.headersSent) {
    return next(req);
  }
  try {
    const token = req.headers.authorization
    console.log(req.headers)
    if (!token) {throw ('Must provide authorization header')}
    
    const isValid = await jwt.verify(token, process.env.JWT_SECRET)

    if (!isValid) { throw new Error('Unauthorized') }

    return next()
  } catch (err) {
    res.status(401).send(err)
  }
}