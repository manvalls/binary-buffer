
var Yielded = require('vz.yielded'),
    Part;

Part = module.exports = function Part(data){
  this.data = data;
};

Object.defineProperties(Part.prototype,{
  
  size: {get: function(){
    return this.data.length;
  }},
  
  async: {value: false},
  
  getArrayLike: {value: function(){
    return new Yielded(this.data);
  }},
  
  getBuffer: {value: function(){
    return new Yielded(new Buffer(this.data));
  }},
  
  getArray: {value: function(){
    return new Yielded(this.data);
  }},
  
  getBlobPiece: {value: function(){
    return new Uint8Array(this.data);
  }},
  
  slice: {value: function(start,end){
    if(arguments.length > 1) return new Part(this.data.slice(start,end));
    return new Part(this.data.slice(start));
  }}
  
});

