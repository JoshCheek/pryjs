class Queue {
  constructor () {
    this.queue = []
    this.working = false
  }

  enqueue (fn) {
    return new Promise((resolve, reject) => {
      const callFn = () => {
        fn((result) => {
          resolve(result)
          const next = this.queue.shift()
          if (next) next()
          else this.working = false
        })
      }
      if (this.working) {
        this.queue.push(callFn)
      } else {
        this.working = true
        callFn()
      }
    })
  }
}

module.exports = Queue
