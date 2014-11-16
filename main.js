var Su = require('vz.rand').Su,
    walk = require('vz.walk'),
    Yielded = require('vz.yielded'),
    Part = require('./main/Part.js'),
    
    size = Su(),
    parts = Su(),
    waiting = Su(),
    queue = Su(),
    buffer = Su(),
    
    BinaryBuffer,
    
    Blob = global.Blob,
    Buffer = global.Buffer;

BinaryBuffer = module.exports = function BinaryBuffer(){
  var i;
  
  this[size] = 0;
  this[parts] = [];
  this[queue] = [];
  this[waiting] = this[queue].shift();
  
  for(i = 0;i < arguments.length;i++) this.write(arguments[i]);
};

// Read

function waitForData(size,buff){
  var yd = new Yielded();
  
  if(buff[waiting] || buff[queue].length) buff[queue].push({
    yielded: yd,
    size: size
  });
  else if(buff.size < size) buff[waiting] = {
    yielded: yd,
    size: size
  };
  else yd.done = true;
  
  return yd;
}

function getParts(buff,sz){
  var data,
      part,
      partsSlice,
      buffSlice;
  
  if(sz == buff.size){
    data = buff[parts];
    buff[parts] = [];
    buff[size] = 0;
  }else{
    data = [];
    buff[size] -= sz;
    
    while(sz > 0){
      part = buff[parts].shift();
      sz -= part.size;
      data.push(part);
    }
    
    if(sz < 0){
      part = data.pop();
      partsSlice = part.slice(0,part.size + sz);
      buffSlice = part.slice(part.size + sz,part.size);
      
      data.push(partsSlice);
      buff[parts].unshift(buffSlice);
    }
    
  }
  
  return data;
}

function* read(buff,type,size){
  var data,
      
      offset,
      part,
      i,
      ret;
  
  yield waitForData(size,buff);
  
  data = getParts(buff,size);
  
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
      ret = new Uint8ClampedArray(size);
    case Uint8Array:
      ret = ret || new Uint8Array(size);
      offset = 0;
      
      for(i = 0;i < data.length;i++){
        part = yield data[i].getArrayLike();
        ret.set(part,offset);
        offset += part.length;
      }
      
      break;
    
    // Unsupported
    
    default:
      throw new TypeError('Unsupported type');
    
  }
  
  return ret;
}

function onConsumed(){
  var buff = this[buffer],
      first;
  
  if(buff[queue].length){
    first = buff[queue].shift();
    
    if(buff.size >= first.size) first.yielded.done = true;
    else buff[waiting] = first;
  }
  
}

// Prototype

Object.defineProperties(BinaryBuffer.prototype,{
  
  write: {value: function(data){
    var part,
        yd;
    
    if(data.constructor == BinaryBuffer){
      this[parts] = this[parts].concat(data[parts]);
      this[size] += data[size];
    }else{
      part = new Part(data);
      this[size] += part.size;
      this[parts].push(part);
    }
    
    if(this[waiting] && this[size] >= this[waiting].size){
      yd = this[waiting].yielded;
      this[waiting] = null;
      yd.done = true;
    }
    
  }},
  
  read: {value: function(type,size){
    var yd;
    
    if(size == null) size = this.size;
    yd = walk(read,[this,type,size]);
    
    yd[buffer] = this;
    yd.on('consumed',onConsumed);
    
    return yd;
  }},
  
  size: {get: function(){
    return this[size];
  }}
  
});


