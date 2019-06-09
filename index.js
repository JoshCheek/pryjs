const WebSocket = require('ws')
const readline = require('readline')

const pid = parseInt(process.argv[2])
console.log(pid)
process._debugProcess(pid)

const rl = readline.createInterface({input: process.stdin, output: process.stdout});

rl.question('What is the websocket? ', (wsString) => {
  wsString = wsString.trim()
  rl.question('What expression do you want to evaluate? ', (expression) => {
    console.log(`EXPRESSION: ${expression}`)
    rl.close()

    const ws = new WebSocket(wsString)

    ws.on('open', function open() {
      console.log('opened')
      const id = 0
      const method = 'Runtime.evaluate'
      const params = {expression: expression}
      ws.send(JSON.stringify({id, method, params}))
    })

    ws.on('message', function incoming(data) {
      console.log(`message: ${data}`)
    })
  })
})
