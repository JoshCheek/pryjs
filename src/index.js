const inspector              = require('inspector')
const { Worker }             = require('worker_threads')
const { join }               = require('path')
const { Logger, MockLogger } = require('./logger')

const workerPath = join(__dirname, 'pry-worker.js')

module.exports = async function pry({ logLevel=null }={}) {
  process._debugEnd()
  process._debugProcess(process.pid)
  const url = await getDebugUrl()

  const worker = new Worker(workerPath, {
    workerData: { logLevel, url: url, pid: process.pid },
    stdin: false, stdout: false, stderr: false,
  })

  const logger = getLogger(logLevel, worker)

  return new Promise((resolve, reject) => {
    worker.on('message', (message) => {
      if (message && message.type === 'log') {
        const { type, level, message: workerMessage } = message
        logger.log(level, workerMessage)
      } else {
        logger.log('debug', { type: 'parent-message', message })
      }
    })
    worker.on('error', (error) => {
      logger.log('error', { type: 'parent-error', error })
    })
    worker.on('exit', (code) => {
      logger.log('info', { type: 'parent-exit', code })
      resolve()
    })
  })
}

function getDebugUrl() {
  return new Promise(resolve => {
    const url = inspector.url()
    if(url)
      resolve(url)
    else
      resolve(getDebugUrl())
  })
}

function getLogger(logLevel, worker) {
  if (!logLevel) return new MockLogger({ level: 'silly' })

  // debounce reprompt for 50ms
  let needReprompt = false
  const reprompt = () => {
    needReprompt = true
    setTimeout(() => {
      if (needReprompt) worker.postMessage('reprompt')
      needReprompt = false
    }, 50)
  }

  return new Logger({
    level:     logLevel,
    stream:    process.stderr,
    afterLine: reprompt,
  })
}
