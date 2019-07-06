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
      resolve(message)
    })
    worker.on('error', (error) => {
      console.log('PARENT SAW: ', {error})
      reject(error)
    })
    worker.on('exit', (code) => {
      console.log('WORKER EXITED WITH CODE: ', code)
      if (code)
        reject(new Error(`Pry failed with exit code ${code}`));
      else
        resolve()
    })
  })
}

function getDebugUrl() {
  return new Promise(resolve => {
    if(inspector.url())
      resolve(inspector.url())
    else
      resolve(getDebugUrl())
  })
}
