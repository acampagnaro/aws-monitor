const nodemailer = require('nodemailer');

module.exports = {
  mail ({from, to, message, subject, password, host, port, headers}) {
    const transporter = nodemailer.createTransport(
      {
        host: host || process.env.MAIL_HOST,
        port: port || process.env.MAIL_PORT,
        auth: {
          user: from || process.env.MAIL_FROM,
          pass: password || process.env.MAIL_PASSWORD
        },
        logger: true,
        debug: false // include SMTP traffic in the logs
      },
      {
        from: from || process.env.MAIL_FROM,
        headers: headers || {

        }
      }
    )
    
    const mailOptions = {
      from: from || process.env.MAIL_FROM,
      to: to,
      subject: subject || 'NO REPLY',
      text: message,
    }

    return new Promise(function (resolve, reject) {
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.error(new Date(), '| MAILER:', error);
          reject(error)
        } else {
          console.log(new Date(), '| MAILER:', 'Email sent: ' + info.response);
          resolve('Email sent.')
        }
      })
    })
  },
}
