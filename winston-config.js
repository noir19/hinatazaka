const winston = require('winston')

const logConfiguration = logName => {
  return {
    transports: [
      new winston.transports.File({
        filename: `./logs/${logName}`
      })
    ],
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(info => {
        return `${info.timestamp} - [${info.level}]: ${info.message}`
      })
    )
  }
}

module.exports = { logConfiguration }
