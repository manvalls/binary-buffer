var Su = require('vz.rand').Su,
    walk = require('vz.walk'),
    Yarr = require('vz.yarr'),
    
    Part = require('./main/Part.js'),
    
    parts = Su(),
    current = Su(),
    total = Su(),
    lock = Su(),
    
    BinaryBuffer,
    
    Blob = global.Blob,
    Buffer = global.Buffer,
    
    populate;

BinaryBuffer = module.exports = function BinaryBuffer(){
  this[current] = null;
  this[parts] = new Yarr();
  this[total] = 0;
  this[lock] = new Yarr();
  
  this[lock].push(true);
};

populate = walk.wrap(function*(array,data){
  var offset = 0,i,part;
  
  for(i = 0;i < data.length;i++){
    part = yield data[i].getArrayLike();
    array.set(part,offset);
    offset += part.length;
  }
  
});

Object.defineProperties(BinaryBuffer.prototype,{
  
  write: {value: function(data){
    var part = new Part(data);
    this[total] += part.size;
    
    return this[parts].push(part);
  }},
  
  read: {value: walk.wrap(function*(type,size){
    var data = [],
        ret,
        sz,
        part,
        point;
    
    yield this[lock].shift();
    
    size = size || this[total];
    sz = size;
    
    part = this[current] || (yield this[parts].shift());
    size -= part.size;
    data.push(part);
    
    this[current] = null;
    
    while(size > 0){
      part = yield this[parts].shift();
      size -= part.size;
      data.push(part);
    }
    
    if(size < 0){
      point = part.size + size;
      
      data.pop();
      this[current] = part.slice(point);
      data.push(part.slice(0,point));
    }
    
    switch(type){
      
      // Buffer
      
      case Buffer:
        for(i = 0;i < data.length;i++) data[i] = yield data[i].getBuffer();
        ret = Buffer.concat(data);
        break;
      
      // Blob
      
      case Blob:
        for(i = 0;i < data.length;i++) data[i] = data[i].getBlobPiece();
        ret = new Blob(data);
        break;
      
      // Uint8Array
      
      case Uint8ClampedArray:
        ret = new Uint8ClampedArray(sz);
      case Uint8Array:
        ret = ret || new Uint8Array(sz);
        yield populate(ret,data);
        break;
      
      // ArrayBuffer
      
      case ArrayBuffer:
        ret = new Uint8Array(sz);
        yield populate(ret,data);
        ret = ret.buffer;
        break;
      
      // Unsupported
      
      default:
        throw new TypeError('Unsupported type');
      
    }
    
    this[total] -= sz;
    
    this[lock].push(true);
    
    return ret;
  })},
  
  size: {get: function(){
    return this[total];
  }},
  
  drain: {get: walk.wrap(function*(yarr){
    var data;
    while(data = yield yarr.shift()) yield this.write(data);
  })}
  
});

