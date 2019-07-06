const readline = require('readline')
const inspector = require('inspector')
const { Worker } = require('worker_threads')

module.exports = async function pry() {
  process._debugEnd()
  process._debugProcess(process.pid)
  const url = await getDebugUrl()

  const worker = new Worker("./pry_worker.js", {
    workerData: {
      url: url,
      pid: process.pid,
    },
    stdin:  false,
    stdout: false,
    stderr: false,
  })

  return new Promise((resolve, reject) => {
    worker.on('message', (message) => {
      console.log('PARENT SAW: ', {message})
    })
    worker.on('error', (error) => {
      console.log('PARENT SAW: ', {error})
    })
    worker.on('exit', (code) => {
      console.log('WORKER EXITED WITH CODE: ', code)
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
