const pry = require('./src')

void async function main () {
  let a = 123
  console.log({ a })
  await pry()
  console.log({ a })
}()
