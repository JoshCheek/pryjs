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
$ ref/show js
$ ref/show browser
```

Currently blocked on how to get them in the same terminal?
----------------------------------------------------------

Pretty sure I can't do it in the same callstack (ie can't just use async or w/e)
because the callstack will be getting paused and manipulated, so I think I need
a separate callstack for the debugger code and for the program. It's possible
that I don't, that I can run the commands as like... deeper in the callstack
than the debugger code, so then I could eval things and have them return to
the debugger code... but it sure feels like I do, so I haven't really tried
exploring this yet

* First thought was to make a worker, the worker can paise the main thread and start the REPL.
  That led to the discovery of a bug where worker threads get killed if they listen for data on stdin,
  reported [here](https://github.com/nodejs/node/issues/28144).
* Second thought was to actually do it in 2 separate processes, so have the
  main program start a child that then pauses the main program, and uses the
  inherited file descriptors to interact with the user, and the websocket
  to interact with the debugger. I'm worried about them fighting over the file
  descriptors, and worried about them getting SIGTTOU'd, so I wanted to swap the
  program's file descriptors out for pipes.

  I wrote up what I'd do in Ruby ([`sigh.rb`](./sigh.rb) b/c I can think much
  better in Ruby, and confirmed that input went to the child, which could then
  send input to the parent, and read the parent's outputs and so forth.
  So then the child would own the file descriptors and present the REPL,
  and mediate any IO between the user and the parent.

  It seems node does not provide the abstractions I used in Ruby (dup, reopen,
  unclear whether it provides pipes).
  So I translated that into C ([`sigh.c`](./sigh.c)), and confirmed it worked
  when compiled with `gcc` (clang) and `g++`.

  Then I figured out how to make a C++ addon for node, and compiled it into
  a function that could be called from node [`src/magic.cc`](./src/magic.cc)
  and [`index2.js`](./index2.js). It compiles, with `node-gyp`, and I can call
  it, but it doesn't actually work. The child program seems to immediately die,
  I can't tell why. The parent program (the node program) should block, waiting
  on inputs via `fgets` and `waitpid`, but it instantly returns, as if `fgets`
  itself has become asynchronous.  I don't understand why. Perhaps the
  `node-gyp` + `nan` tooling has swapped out the underlying function definitions?
  So I think I'm calling `fgets` from `stdio.h`, but I'm really calling some
  custom async `fgets`? Or perhaps there's some really low-level state that gets
  set on the file descriptors? Like is there an `ioctl` you can use to set
  the file descriptor itself to be asynchronous, at the OS level? IDK :shrug:

If I can't figure this out, though, I could still try to reproduce the `pry`
functionality, but from a different terminal. Then at least I could make
progress while pondering this / waiting for that worker thread bug to be fixed.
