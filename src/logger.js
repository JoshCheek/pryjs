/* eslint-disable curly */
const util         = require('util')
const logStreamKey = Symbol('logStream')
const logLevelKey  = Symbol('logLevel')
const LEVELS       = ['error', 'warn', 'info', 'verbose', 'debug', 'silly']

/* eslint-disable require-jsdoc */
function validateLevel (level) {
  if (!LEVELS.includes(level)) {
    throw new Error(`level must be one of: ${LEVELS.join(', ')}`)
  }
}

function validateStream (stream) {
  if (!stream)              throw new Error('Must provide a stream')
  if (!('write' in stream)) throw new Error('stream must have a `write` method')
}

function levelIndex (levelName) {
  return LEVELS.indexOf(levelName)
}

function stringify (obj) {
  if (typeof obj === 'string')
    return obj

  if (obj instanceof Error && !('toJSON' in obj))
    return obj.stack

  const toLog = JSON.parse(JSON.stringify(obj))
  return util.inspect(toLog, { colors: true, depth: null })
}
/* eslint-enable require-jsdoc */


/**
 * Writes messages to a stream if the message has a sufficiently imperative log level
 */
class Logger {
  constructor ({level, stream}) {
    validateLevel(level)
    validateStream(stream)
    this[logLevelKey]  = levelIndex(level)
    this[logStreamKey] = stream
  }

  log (level, message) {
    if (this.shouldLog(level)) {
      let string = stringify(message)
      if (string[string.length-1] !== '\n') {
        string += '\n'
      }
      this[logStreamKey].write(string)
    }
  }

  shouldLog (level) {
    return levelIndex(level) <= this[logLevelKey]
  }
}


class MockLogger extends Logger {
  constructor ({level}) {
    const logged = []
    const stream = {
      write (message) {
        logged.push(message)
        return true
      },
    }
    super({level, stream})
    this.logged = logged
  }
}

module.exports = {Logger, MockLogger}

/* eslint-enable curly */
