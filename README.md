# BinaryBuffer [![Build Status][travis-img]][travis-url] [![Coverage Status][cover-img]][cover-url]

## Sample usage

```javascript
var walk = require('y-walk'),
    BinaryBuffer = require('binary-buffer'),
    buff = new BinaryBuffer();

walk(function*(){
  yield buff.write(new Buffer([1,2,3]));
});

walk(function*(){
  var result = yield buff.read(new Buffer(3));
  console.log(result); // <Buffer 01 02 03>
});
```

[travis-img]: https://travis-ci.org/manvalls/binary-buffer.svg?branch=master
[travis-url]: https://travis-ci.org/manvalls/binary-buffer
[cover-img]: https://coveralls.io/repos/manvalls/binary-buffer/badge.svg?branch=master&service=github
[cover-url]: https://coveralls.io/github/manvalls/binary-buffer?branch=master
