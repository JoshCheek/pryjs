const WebSocket = require('ws')
const readline = require('readline')

const pid = parseInt(process.argv[2])
process._debugEnd()
process._debugProcess(pid)

const rl = readline.createInterface({input: process.stdin, output: process.stdout})
let ws
run()
  .catch((err) => console.error(err.stack))
  .finally(() => rl.close())

async function run() {
  const wsString = await new Promise(resolve =>
    rl.question('What is the websocket? ', resolve)
  )
  const ws = new WebSocket(wsString.trim())
  ws.on('message', (message) => {
    ws.close()
    console.log(message)
  })
  await new Promise(resolve => ws.on('open', resolve))

  let id = 0
  const method = 'Runtime.evaluate'
  while(true) {
    const expression = await new Promise(resolve =>
      rl.question('What expression do you want to evaluate? ', resolve)
    )
    const params = { expression: expression }
    ws.send(JSON.stringify({id: id++, method, params}))
  }
}
