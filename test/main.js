var t = require('u-test'),
    assert = require('assert'),
    walk = require('y-walk'),
    BinaryBuffer = require('../main.js');

t('Write first',function(){

  t('Simple rw',function*(){
    var buff = new BinaryBuffer(),
        result,yd;

    yd = walk(function*(){
      yield buff.write(new Buffer([1,2,3]));
      buff.flush();
    });

    result = yield buff.read(new Buffer(3));
    assert.deepEqual(result,[1,2,3]);
    yield yd;
  });

  t('More complex read',function*(){
    var buff = new BinaryBuffer(),
        result,yd;

    yd = walk(function*(){
      yield buff.write(new Buffer([1,2,3]));
      written = true;
    });

    result = yield buff.read(new Buffer(1));
    assert.deepEqual(result,[1]);
    result = yield buff.read(new Buffer(2));
    assert.deepEqual(result,[2,3]);
    yield yd;
  });

  t('More complex write',function*(){
    var buff = new BinaryBuffer(),
        result,yd;

    yd = walk(function*(){
      yield buff.write(new Buffer([1,2]));
      yield buff.write(new Buffer([3]));
    });

    result = yield buff.read(new Buffer(3));
    assert.deepEqual(result,[1,2,3]);
    yield yd;
  });

  t('flush',function*(){
    var buff = new BinaryBuffer(),
        result,yd;

    yd = walk(function*(){
      yield buff.write(new Buffer([1,2]));
      buff.flush();
    });

    result = yield buff.read(new Buffer(3));
    assert.deepEqual(result,[1,2]);
    yield yd;
  });

});

t('Read first',function(){

  t('Simple rw',function*(){
    var buff = new BinaryBuffer(),
        result,yd;

    yd = walk(function*(){
      result = yield buff.read(new Buffer(3));
      assert.deepEqual(result,[1,2,3]);
    });

    yield buff.write(new Buffer([1,2,3]));
    buff.flush();
    yield yd;
  });

  t('More complex read',function*(){
    var buff = new BinaryBuffer(),
        result,yd;

    yd = walk(function*(){
      result = yield buff.read(new Buffer(1));
      assert.deepEqual(result,[1]);
      result = yield buff.read(new Buffer(2));
      assert.deepEqual(result,[2,3]);
    });

    yield buff.write(new Buffer([1,2,3]));
    yield yd;
  });

  t('More complex write',function*(){
    var buff = new BinaryBuffer(),
        result,yd;

    yd = walk(function*(){
      result = yield buff.read(new Buffer(3));
      assert.deepEqual(result,[1,2,3]);
    });

    yield buff.write(new Buffer([1,2]));
    yield buff.write(new Buffer([3]));
    yield yd;
  });

  t('flush',function*(){
    var buff = new BinaryBuffer(),
        result,yd;

    yd = walk(function*(){
      result = yield buff.read(new Uint8Array(3));
      assert.deepEqual(result,[1,2]);
    });

    yield buff.write(new Buffer([1,2]));
    buff.flush();
    yield yd;
  });

});
