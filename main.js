var Su = require('vz.rand').Su,
    walk = require('vz.walk'),
    Yielded = require('vz.yielded'),
    Part = require('./main/Part.js'),
    
    size = Su(),
    parts = Su(),
    queue = Su(),
    asyncParts = Su(),
    locked = Su(),
    buffer = Su(),
    
    BinaryBuffer,
    
    Blob = global.Blob,
    Buffer = global.Buffer;

BinaryBuffer = module.exports = function BinaryBuffer(){
  var i;
  
  this[size] = 0;
  this[asyncParts] = 0;
  this[parts] = [];
  
  this[queue] = [];
  this[locked] = false;
  
  for(i = 0;i < arguments.length;i++) this.write(arguments[i]);
};

// Read

function waitForData(size,buff){
  var yd = new Yielded();
  
  if(buff[locked] || buff.size < size) buff[queue].push({
    yielded: yd,
    size: size
  });
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
    buff[asyncParts] = 0;
  }else{
    data = [];
    buff[size] -= sz;
    
    while(sz > 0){
      part = buff[parts].shift();
      
      if(part.async) buff[asyncParts]--;
      sz -= part.size;
      
      data.push(part);
    }
    
    if(sz < 0){
      part = data.pop();
      partsSlice = part.slice(0,part.size + sz);
      buffSlice = part.slice(part.size + sz,part.size);
      
      if(buffSlice.async) buff[asyncParts]++;
      
      data.push(partsSlice);
      buff[parts].unshift(buffSlice);
    }
    
  }
  
  return data;
}

function* prepare(buff,size){
  var i = 0,
      to,
      part,
      
      asyncPart,
      syncPart;
  
  while(size > 0){
    part = buff[parts][i];
    
    if(part.async && part.size > size){
      
      to = Math.min(Math.max(size,10e3),part.size);
      buff[parts].splice(i,1);
      
      if(to < part.size){
        
        syncPart = part.slice(0,to);
        asyncPart = part.slice(to,part.size);
        
        syncPart = yield syncPart.getArrayLike();
        syncPart = new Part(syncPart);
        
        buff[parts].splice(i,0,syncPart,asyncPart);
        
      }else{
        
        buff[asyncParts]--;
        
        syncPart = yield part.getArrayLike();
        syncPart = new Part(syncPart);
        
        buff[parts].splice(i,0,syncPart);
        
      }
      
      break;
    }
    
    i++;
    size -= part.size;
  }
  
}

function needsPreparation(buff,type){
  return buff[asyncParts] > 0 && type != Blob;
}

function* read(buff,type,size){
  var data,
      
      offset,
      part,
      i,
      ret;
  
  yield waitForData(size,buff);
  buff[locked] = true;
  
  if(needsPreparation(buff,type)) yield walk(prepare,[buff,size]);
  
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
  
  buff[locked] = false;
  
  if(first = buff[queue].shift()){
    if(buff.size >= first.size) first.yielded.done = true;
    else buff[queue].unshift(first);
  }
  
}

// Prototype

Object.defineProperties(BinaryBuffer.prototype,{
  
  write: {value: function(data){
    var part,
        first,
        yd;
    
    if(data.constructor == BinaryBuffer){
      this[parts] = this[parts].concat(data[parts]);
      this[size] += data[size];
      this[asyncParts] += data[asyncParts];
    }else{
      part = new Part(data);
      
      this[size] += part.size;
      if(part.async) this[asyncParts]++;
      
      this[parts].push(part);
    }
    
    if(first = this[queue].shift()){
      if(this[size] >= first.size) first.yielded.done = true;
      else this[queue].unshift(first);
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


