const Queue                                    = require('./queue')
const tty                                      = require('tty')
const fs                                       = require('fs')
const WebSocket                                = require('ws')
const readline                                 = require('readline')
const { isMainThread, parentPort, workerData } = require('worker_threads')
const { url, pid }                             = workerData


class Client {
  constructor ({ ws, logPort }) {
    this.queue     = new Queue()
    this.logPort   = logPort
    this.messageId = 0
    this.ws        = ws
    this.listeners = {}
    ws.on('message', (message) => {
      this.log('debug', { type: 'worker-ws-received', message })
      const { id, ...rest } = JSON.parse(message)
      const callback = this.listeners[id]
      callback && callback(rest)
    })
    ws.on('close',   (...idk) => {
      this.log('debug', { type: 'worker-ws-closed', idk })
    })
  }

  send (method, data={}) {
    return this.enqueue(complete => {
      const id = this.messageId++
      const message = { id, method, ...data }
      this.listeners[id] = complete
      this.log('debug', { type: 'worker-ws-send', message })
      this.ws.send(JSON.stringify(message))
    })
  }

  close () {
    this.log('verbose', { type: 'worker-ws-close' })
    this.ws.close()
  }

  log (level, message) {
    this.logPort.postMessage({ type: 'log', level, message })
  }

  enqueue(fn) {
    return this.queue.enqueue(fn)
  }
}


void async function run() {
  // connect to debugger via a websocket
  const ws     = new WebSocket(url)
  const client = new Client({ ws, logPort: parentPort })
  client.log('verbose', { type: 'worker-ws-open' })
  await new Promise(resolve => {
    ws.on('open', () => {
      client.log('verbose', { type: 'worker-ws-opened' })
      resolve()
    })
  })

  // pause the program
  client.send('Debugger.pause')

  // listen for messages from parent
  parentPort.on('message', (message) => {
    if (message === 'reprompt') {
      rl.prompt()
    } else {
      throw new Error(`UNKNOWN MESSAGE FROM PARENT: ${message}`)
    }
  })

  // read the user's input and pass to the debugging client
  const stdin = new tty.ReadStream(fs.openSync('/dev/tty'))
  const rl = readline.createInterface({
    input:  stdin,
    output: process.stdout,
    prompt: 'pry.js> ',
  })

  rl.on('close', () => {
    client.log('verbose', { type: 'worker-rl-closed' })
    close()
  })

  rl.prompt()
  const method = 'Runtime.evaluate'
  rl.on('line', async (line) => {
    client.log('debug', { type: 'worker-rl-line', line })
    if (line === 'exit') {
      client.log('verbose', { type: 'worker-rl-close', line })
      close()
    } else {
      await client.send(method, { params: { expression: line } })
      rl.prompt()
    }
  })

  function close(status=0) {
    client.close()
    rl.close()
    process.exit(status)
  }
}().catch(error => {
  client.log('error', error)
  throw error
})
