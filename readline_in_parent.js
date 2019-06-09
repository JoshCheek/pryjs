// looking at doing this since node's worker threads get terminated when they try to read from stdin:
// https://github.com/nodejs/node/issues/28144
const readline = require('readline')
const { Worker, isMainThread, parentPort } = require('worker_threads')

if(isMainThread)
  new Promise(async (resolve, reject) => {
    const worker = new Worker(__filename, {})
    const rl = readline.createInterface({input: process.stdin, output: process.stdout })
    const onCloses = [() => console.log('readline closed')]
    const onChildResponses = []

    const getResponse = () => new Promise((resolve, reject) => {
      function poll() {
        setTimeout(() => {
          if(onChildResponses.length)
            resolve(onChildResponses.shift())
          else
            poll()
        }, 0)
      }
      poll()
    })


    worker.on('message', message => onChildResponses.push(message))
    worker.on('error', err => reject)
    worker.on('exit', (status) => {
      console.log(`WORKER EXITED: ${status}`)
      rl.close()
      resolve(status)
    })

    rl.on('close', () => { while(onCloses.length) onCloses.shift()() })
    const prompt = () => new Promise((resolve, reject) => {
      onCloses.push(reject)
      rl.question('> ', resolve)
    })

    while(true) {
      let value
      try { value = await prompt() } catch(e) { break }
      console.log(`PARENT SAW MESSAGE: ${value}`)
      worker.postMessage(value);
      try {
        console.log(`CHILD RESPONDED WITH: ${await getResponse()}`)
      } catch(e) { break }
    }
  }).catch((err) => console.log({err}))
    .then((val) => console.log({val}))
else {
  let i = 0
  parentPort.on('message', (message) => {
    console.log(`CHILD SAW MESSAGE: ${message}`)
    parentPort.postMessage(message.toUpperCase())
    if(++i === 5)
      process.exit()
  })
}

