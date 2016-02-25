var t = require('u-test'),
    assert = require('assert'),
    walk = require('y-walk'),
    BinaryBuffer = require('../main.js');

t('Write first',function(){

  t('Simple rw',function*(){
    var buff = new BinaryBuffer(),
        result = new Buffer(0);

    buff.write(new Buffer([1,2,3]));
    buff.flush();

    assert.strictEqual(buff.timesFlushed,0);
    assert.strictEqual(buff.bytesSinceFlushed,3);
    while(!buff.timesFlushed) result = Buffer.concat([result,yield buff.read(new Buffer(2))]);
    assert.strictEqual(buff.bytesSinceFlushed,0);
    assert.strictEqual(buff.timesFlushed,1);

    assert.deepEqual(result,[1,2,3]);
  });

  t('More complex read',function*(){
    var buff = new BinaryBuffer(),
        result,yd;

    yd = walk(function*(){
      yield buff.write(new Buffer([1,2,3]));
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

  t('fakeFlush',function*(){
    var buff = new BinaryBuffer(),
        result,yd;

    buff.write(new Buffer([1,2]));
    buff.fakeFlush();
    assert.strictEqual(buff.timesFlushed,1);
    assert.strictEqual(buff.bytesSinceFlushed,0);
    buff.write(new Buffer([3]));

    result = yield buff.read(new Buffer(3));
    assert.deepEqual(result,[1,2,3]);
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
      result = yield buff.read(3);
      assert.deepEqual(result,[1,2]);
    });

    yield buff.write(new Buffer([1,2]));
    buff.flush();
    yield yd;
  });

  t('autoFlush',function*(){
    var buff = new BinaryBuffer(),
        result = new Buffer(0),
        yd;

    assert.strictEqual(buff.autoFlush,false);
    buff.autoFlush = false;
    buff.autoFlush = true;
    buff.autoFlush = false;
    buff.autoFlush = true;
    assert.strictEqual(buff.autoFlush,true);
    buff.autoFlush = true;

    yd = walk(function*(){
      while(result.length < 5) result = Buffer.concat([result,yield buff.read(new Buffer(50))]);
      assert.deepEqual(result,[1,2,3,4,5]);
    });

    yield buff.write(new Buffer([1]));
    yield buff.write(new Buffer([2,3]));
    yield buff.write(new Buffer([4]));
    yield buff.write(new Buffer([5]));
    yield yd;
  });

});
