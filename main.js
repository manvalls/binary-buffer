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
      buffSlice,
      ap = 0;
  
  if(sz == buff.size){
    data = buff[parts];
    ap = buff[asyncParts];
    
    buff[parts] = [];
    buff[size] = 0;
    buff[asyncParts] = 0;
  }else{
    data = [];
    buff[size] -= sz;
    
    while(sz > 0){
      part = buff[parts].shift();
      
      if(part.async){
        buff[asyncParts]--;
        ap++;
      }
      
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
  
  return [data,ap];
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

function* populate(array,data){
  var offset = 0,i,part;
  
  for(i = 0;i < data.length;i++){
    part = yield data[i].getArrayLike();
    array.set(part,offset);
    offset += part.length;
  }
  
}

function* read(buff,type,sz){
  var data,
      ap,
      
      i,
      ret;
  
  yield waitForData(sz,buff);
  buff[locked] = true;
  
  if(needsPreparation(buff,type)) yield walk(prepare,[buff,sz]);
  
  data = getParts(buff,sz);
  ap = data[1];
  data = data[0];
  
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
      yield walk(populate,[ret,data]);
      break;
    
    // ArrayBuffer
    
    case ArrayBuffer:
      ret = new Uint8Array(sz);
      yield walk(populate,[ret,data]);
      ret = ret.buffer;
      break;
    
    // BinaryBuffer
    
    case BinaryBuffer:
      ret = new BinaryBuffer();
      ret[size] = sz;
      ret[parts] = data;
      ret[asyncParts] = ap;
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


