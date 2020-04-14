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
───────┬─────────────────────────────────────────
       │ File: example.js
───────┼─────────────────────────────────────────
   1   │ const pry = require('./src')
   2   │
   3   │ a = 111
   4   │ getA = function() { return a }
   5   │ void async function main () {
   6   │   let a = 222
   7   │   console.log({ a1: getA(), a2: a })
   8   │   await pry({ logLevel: 'silly' })
   9   │   console.log({ a1: getA(), a2: a })
  10   │ }()
───────┴─────────────────────────────────────────

🐠  node example.js
{ a1: 111, a2: 222 }
Debugger listening on ws://127.0.0.1:9229/c5349fa9-267f-438c-b978-f5245031e605
For help, see: https://nodejs.org/en/docs/inspector
{ type: 'worker-ws-open' }
Debugger attached.
{ type: 'worker-ws-opened' }
{
  type: 'worker-ws-send',
  message: { id: 0, method: 'Debugger.enable' }
}
{
  type: 'worker-ws-received',
  message: '{"method":"Debugger.scriptParsed","params":{"scriptId":"4","url":"internal/per_context/primordials.js","startLine":0,"startColumn":0,"endLine":112,"endColumn":0,"executionContextId":0,"hash":"2740f510529da3241fa954f2b49b6744818bd6ea","isLiveEdit":false,"sourceMapURL":"","hasSourceURL":false,"isModule":false,"length":3086}}'
}
pry.js> a = 333
pry.js> exit // NOTE: this didn't actually print the prompt here -.-
// ... some spammy irrelevant, maybe buggy stuff got printed here ...
{ type: 'parent-exit', code: 0 }
{ a1: 333, a2: 222 } // <-- this is wrong, should have been { a1: 111, a2: 333 }
                     // so it's not evaluating within the correct binding
```

NOTE TO SELF:
-------------

current plan:
  √ enable debugger (prob)
  √ record all the script parseds:
    { type: 'worker-ws-received',
      message: '{
        "method": "Debugger.scriptParsed",
        "params": {
          "scriptId":    "74",
          "url":         "internal/streams/destroy.js",
          ...
        }
      }'
    }
  √ when we see our file come in
    Debugger.setBreakpoint({
      "scriptId":     scriptIds[loc.name],
      "lineNumber":   loc.line+1,
      "columnNumber": 0, // or loc.col,
    })
  * tell parent to resolve so that it returns to binding

Maybe the breakpoint we set is wrong? Check what `Debugger.getPossibleBreakpoints`
returns to make sure our values are correct

