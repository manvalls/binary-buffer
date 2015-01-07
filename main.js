var Su = require('vz.rand').Su,
    walk = require('vz.walk'),
    Yarr = require('vz.yarr'),
    
    Part = require('./main/Part.js'),
    
    parts = Su(),
    total = Su(),
    open = Su(),
    
    BinaryBuffer,
    
    Blob = global.Blob,
    Buffer = global.Buffer,
    
    populate,
    pipe;

BinaryBuffer = module.exports = function BinaryBuffer(){
  this[parts] = new Yarr();
  this[total] = 0;
  this[open] = true;
};

populate = walk.wrap(function*(array,data){
  var offset = 0,i,part;
  
  for(i = 0;i < data.length;i++){
    part = yield data[i].getArrayLike();
    array.set(part,offset);
    offset += part.length;
  }
  
});

pipe = walk.wrap(function*(buff,type,yarr){
  
  while(true){
    yield yarr.untilQueued()
    yield yarr.write(yield buff.read(type));
  }
  
});

Object.defineProperties(BinaryBuffer.prototype,{
  
  isBinaryBuffer: {value: true},
  
  write: {value: walk.wrap(function*(data){
    var part,yd,yarr;
    
    if(data == null){
      this.open = false;
      return;
    }
    
    if(!this[open]) throw new Error('Cannot write to a closed BinaryBuffer');
    
    if(data.isYarr){
      yarr = data;
      while(data = yield yarr.shift()) yield this.write(data);
      return;
    }
    
    part = new Part(data);
    this[total] += part.size;
    yield this[parts].push(part);
    
  })},
  
  read: {value: walk.wrap(function*(type,size){
    var data = [],
        ret,
        sz,
        part,
        point;
    
    if(arguments.length < 2){
      
      switch(typeof type){
        case 'number':
          size = type;
          type = Buffer || Uint8Array;
          break;
        case 'undefined':
          type = Buffer || Uint8Array;
          break;
      }
      
    }
    
    size = size || this[total];
    
    part = yield this[parts].shift();
    if(!part){
      this[total] = 0;
      return null;
    }
    
    size = size || part.size;
    sz = size;
    
    size -= part.size;
    data.push(part);
    
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
      this[parts].unshift(part.slice(point));
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
    
    return ret;
  })},
  
  size: {get: function(){
    return this[total];
  }},
  
  getYarr: {value: function(type){
    var yarr = new Yarr();
    
    type = type || Buffer || Uint8Array;
    pipe(this,type,yarr);
    
    return yarr;
  }},
  
  open: {
    get: function(){
      return this[open];
    },
    set: function(v){
      if(!this[open]) return;
      if(!v){
        this[open] = false;
        this[parts].insist(null);
      }
    }
  }
  
});

