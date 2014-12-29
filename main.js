var Su = require('vz.rand').Su,
    walk = require('vz.walk'),
    Yarr = require('vz.yarr'),
    
    Part = require('./main/Part.js'),
    
    parts = Su(),
    current = Su(),
    total = Su(),
    lock = Su(),
    open = Su(),
    
    BinaryBuffer,
    
    Blob = global.Blob,
    Buffer = global.Buffer,
    
    populate;

BinaryBuffer = module.exports = function BinaryBuffer(){
  this[current] = null;
  this[parts] = new Yarr();
  this[total] = 0;
  this[lock] = new Yarr();
  this[open] = true;
  
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
    
    if(!this[open]) throw new Error('Cannot write to a closed BinaryBuffer');
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
    
    part = this[current] || (yield this[parts].shift());
    if(!part){
      this[total] = 0;
      this[lock].push(true);
      return null;
    }
    
    size = size || part.size;
    sz = size;
    
    size -= part.size;
    data.push(part);
    
    this[current] = null;
    
    while(size > 0){
      part = yield this[parts].shift();
      if(!part){
        size = 0;         // Straight to the type switch
        sz = this[total]; // The new size must be zero
        break;
      }
      
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
  
  drain: {get: walk.wrap(function*(yarr,type){
    var data;
    
    if(yarr.isYarr) while(data = yield yarr.shift()) yield this.write(data);
    else{
      if(Buffer) type = type || Buffer;
      else type = type || Uint8Array;
      
      while(data = yield yarr.read(type)) yield this.write(data);
    }
    
  })},
  
  open: {
    get: function(){
      return this[open];
    },
    set: walk.wrap(function*(v){
      
      if(this[open] && v === false){
        this[open] = false;
        while(true) yield this[parts].push(null);
      }
      
    })
  }
  
});

