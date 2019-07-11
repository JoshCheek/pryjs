const tty                                      = require('tty')
const fs                                       = require('fs')
const WebSocket                                = require('ws')
const readline                                 = require('readline')
const { isMainThread, parentPort, workerData } = require('worker_threads')
const { url, pid }                             = workerData


class Client {
  constructor ({ url, parentPort }) {
    const ws = new WebSocket(url)
    ws.on('message', (message) => {
      this.log('debug', { type: 'worker-ws-received', message: JSON.parse(message) })
    })
    ws.on('close',   (...idk) => {
      this.log('debug', { type: 'worker-ws-closed', idk })
    })
    this.url        = url
    this.parentPort = parentPort
    this.messageId  = 0
    this.ws         = ws
    this.connect    = new Promise(resolve => {
      this.log('verbose', { type: 'worker-ws-connect', url })
      ws.on('open', resolve)
    })
  }

  send (method, data={}) {
    const message = { id: this.messageId++, method, ...data }
    this.log('debug', { type: 'worker-ws-send', message })
    this.ws.send(JSON.stringify(message))
  }

  close () {
    this.log('verbose', { type: 'worker-ws-close' })
    this.ws.close()
  }

  log (level, message) {
    this.parentPort. postMessage({ type: 'log', level, message })
  }
}


void async function run() {
  // connect to debugger via a websocket
  const client = new Client({ url, parentPort })
  await client.connect

  // pause the program
  client.send('Debugger.pause')

  // listen for messages from parent
  parentPort.on('message', (message) => {
    if (message === 'reprompt') rl.prompt()
  })

  // read the user's input and pass to the debugging client
  const stdin = new tty.ReadStream(fs.openSync('/dev/tty'))
  const rl = readline.createInterface({
    input:  stdin,
    output: process.stdout,
    prompt: 'pry.js> ',
  })

  rl.prompt()

  rl.on('close', () => {
    client.log('verbose', { type: 'worker-rl-closed' })
    close()
  })

  const method = 'Runtime.evaluate'
  rl.on('line', (line) => {
    client.log('debug', { type: 'worker-rl-line', line })
    if (line === 'exit') {
      client.log('verbose', { type: 'worker-rl-close', line })
      close()
    } else {
      client.send(method, { params: { expression: line } })
      rl.prompt()
    }
  })

  function close(status=0) {
    client.close()
    rl.close()
    process.exit(status)
  }
}().catch(error => {
  client.log('error', { type: 'worker-error', error })
  throw error
})
