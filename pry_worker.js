const WebSocket = require('ws')
const { isMainThread, parentPort, workerData } = require('worker_threads')

console.log({ workerData })
const { url, pid } = workerData

void async function run() {
  const ws = new WebSocket(url)

  ws.on('message', (message) => {
    ws.close()
    console.log('WS MESSAGE: ', message)
  })

  await new Promise(resolve => ws.on('open', resolve))

  let id = 0
  const method = 'Runtime.evaluate'
  const params = { expression: 'a = 456' }
  ws.send(JSON.stringify({id: id++, method, params}))
}()
