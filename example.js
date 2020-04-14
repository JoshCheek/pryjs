const pry = require('./src')

a = 111
getA = function() { return a }
void async function main () {
  let a = 222
  console.log({ a1: getA(), a2: a })
  await pry({ logLevel: 'silly' })
  console.log({ a1: getA(), a2: a })
}()
