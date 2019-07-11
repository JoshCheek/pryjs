const tty = require('tty')
const fs = require('fs')
const WebSocket = require('ws')
const readline = require('readline')
const { isMainThread, parentPort, workerData } = require('worker_threads')
const { url, pid } = workerData

let id = 0
void async function run() {
  const ws = new WebSocket(url)

  ws.on('message', (message) => console.log('WORKER SEES WS MESSAGE: ', message))
  ws.on('close',   (...idk) => console.log('WORKER SEES CLOSE EVENT: ', idk))

  await new Promise(resolve => ws.on('open', resolve))

  const message = JSON.stringify({id: id++, method: 'Debugger.pause'})
  console.log(`sending ${message}`)
  ws.send(message)

  console.log('WORKER CONNECTED TO PARENT')

  const stdin = new tty.ReadStream(fs.openSync('/dev/tty'))
  const rl = readline.createInterface({
    input:  stdin,
    output: process.stdout,
    prompt: 'pry.js> ',
  })

  rl.prompt()

  rl.on('close', () => {
    console.log('CLOSED')
    close()
  })

  const method = 'Runtime.evaluate'
  rl.on('line', (line) => {
    console.log({line})
    if (line === 'exit') {
      close()
    } else {
      const params = { expression: line }
      const message = JSON.stringify({id: id++, method, params})
      console.log(`sending ${message}`)
      ws.send(message)
      parentPort.postMessage({ line })
      rl.prompt()
    }
  })

  function close(status=0) {
    ws.close()
    rl.close()
    process.exit(status)
  }
}()
