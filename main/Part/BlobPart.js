
var Yielded = require('vz.yielded'),
    Part;

Part = module.exports = function Part(data){
  this.data = data;
};

function onLoadArrayLike(){
  this.yd.value = new Uint8Array(this.result);
}

function onLoadArray(){
  this.yd.value = Array(this,new Uint8Array(this.result));
}

function onLoadBuffer(){
  this.yd.value = new Buffer(new Uint8Array(this.result));
}

Object.defineProperties(Part.prototype,{
  
  size: {get: function(){
    return this.data.size;
  }},
  
  async: {value: true},
  
  getArrayLike: {value: function(){
    var fr = new FileReader();
    
    fr.yd = new Yielded();
    
    fr.onloadend = onLoadArrayLike;
    fr.readAsArrayBuffer(this.data);
    
    return fr.yd;
  }},
  
  getBuffer: {value: function(){
    var fr = new FileReader();
    
    fr.yd = new Yielded();
    
    fr.onloadend = onLoadBuffer;
    fr.readAsArrayBuffer(this.data);
    
    return fr.yd;
  }},
  
  getArray: {value: function(){
    var fr = new FileReader();
    
    fr.yd = new Yielded();
    
    fr.onloadend = onLoadArray;
    fr.readAsArrayBuffer(this.data);
    
    return fr.yd;
  }},
  
  getBlobPiece: {value: function(){
    return this.data;
  }},
  
  slice: {value: function(start,end){
    if(arguments.length > 1) return new Part(this.data.slice(start,end));
    return new Part(this.data.slice(start));
  }}
  
});


