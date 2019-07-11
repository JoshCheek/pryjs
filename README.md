Pry.js
======

Maybe this will turn into [pry](https://pryrepl.org) for JavaScript.
But probably not, I'll probably get distracted :P

NOTE: You have to use the nightly build because there's a bug that's been fixed
there, which this depends on.

Currently
---------

```
🐠  bat example.js
───────┬──────────────────────────────────────
       │ File: example.js
───────┼──────────────────────────────────────
   1   │ const pry = require('./src')
   2   │
   3   │ void async function main () {
   4   │   a = 123
   5   │   console.log({ a })
   6   │   // await pry({ logLevel: 'silly' })
   7   │   await pry()
   8   │   console.log({ a })
   9   │ }()
───────┴──────────────────────────────────────

🐠  node example.js
{ a: 123 }
Debugger listening on ws://127.0.0.1:9229/6942d264-45c3-4f0c-8440-6e183cff1f6f
For help, see: https://nodejs.org/en/docs/inspector
Debugger attached.
pry.js> a = 456
456
pry.js> exit
Debugger listening on ws://127.0.0.1:9229/6942d264-45c3-4f0c-8440-6e183cff1f6f
For help, see: https://nodejs.org/en/docs/inspector
{ a: 456 }
```
