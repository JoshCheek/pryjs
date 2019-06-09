const pry = require('./pry')

void async function main () {
  a = 123
  console.log({ a })
  await pry()
  console.log({ a })
}()
