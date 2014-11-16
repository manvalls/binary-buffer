[![NPM](https://nodei.co/npm/binary-buffer.png?downloads=true)](https://nodei.co/npm/binary-buffer/)

This package uses or may use at some point in the future ECMAScript 6 features. Use it on a compatible environment or transpile it with Traceur, Closure Compiler, es6-transpiler or equivalent. Please note that some of these have flaws and bugs, test your code carefully until you find a suitable tool for your task.

When cloning this repository, put the folder inside another named "node_modules" in order to avoid potential errors related to npm's dependency handling, and then run `npm install` on it.

No piece of software is ever completed, feel free to contribute and be humble.

# BinaryBuffer

## Sample usage:

```javascript
var walk = require('vz.walk'),
    BinaryBuffer = require('binary-buffer'),
    bb = new BinaryBuffer();

walk(function*(){
  bb.write([1,2,3]);
  yield bb.read(Buffer);    // <Buffer 01 02 03>
  yield bb.read(Buffer,3);  // <Buffer 04 05 06>
});

bb.write([4,5,6]);
```

