Pry.js
======

Maybe this will turn into [pry](https://pryrepl.org) for JavaScript.
But probably not, I'll probably get distracted :P

Currently
---------

In terminal 1:

```js
$ node
Welcome to Node.js v12.0.0.
Type ".help" for more information.
> process.pid
85135

// NOW GO TO TERMINAL 2
Debugger listening on ws://127.0.0.1:9229/4fe1ba2f-bddb-4b6c-8806-ba0f8d76d9c9
For help, see: https://nodejs.org/en/docs/inspector

> a = 123
123

> a
123

// NOW GO TO TERMINAL 2
Debugger attached.

> a
456
```

In terminal 2:

```js
$ node index.js 85135
85135

// GET THIS FROM TERMINAL 1
What is the websocket? ws://127.0.0.1:9229/4fe1ba2f-bddb-4b6c-8806-ba0f8d76d9c9

// NOW GO TO TERMINAL 1
What expression do you want to evaluate? a = 456
message: {"id":0,"result":{"result":{"type":"number","value":456,"description":"456"}}}

// NOW GO TO TERMINAL 1
```

Docs
----

The things you can do are documented in the JSON files in the [`ref`](./ref) directory.
They were acquired like this:

```sh
$ curl https://raw.githubusercontent.com/ChromeDevTools/devtools-protocol/master/json/js_protocol.json > ref/js.json
$ curl https://raw.githubusercontent.com/ChromeDevTools/devtools-protocol/master/json/browser_protocol.json > ref/browser.json
```

I've made a view to make them easier to understand:

```sh
$ ref/show_js
```
