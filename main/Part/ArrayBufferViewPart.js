
var Yielded = require('vz.yielded'),
    ArrayBufferPart = require('./ArrayBufferPart.js'),
    Part;

Part = module.exports = function Part(data){
  this.data = data;
};

Object.defineProperties(Part.prototype,{
  
  size: {get: function(){
    return this.data.byteLength;
  }},
  
  async: {value: false},
  
  getArrayLike: {value: function(){
    return new Yielded(
      new Uint8Array(
        this.data.buffer.slice(this.data.byteOffset,this.data.byteOffset + this.data.byteLength)
      )
    );
  }},
  
  getBuffer: {value: function(){
    return new Yielded(
      new Buffer(
        new Uint8Array(
          this.data.buffer.slice(this.data.byteOffset,this.data.byteOffset + this.data.byteLength)
        )
      )
    );
  }},
  
  getArray: {value: function(){
    return new Yielded(
      Array.apply(this,
        new Uint8Array(
          this.data.buffer.slice(this.data.byteOffset,this.data.byteOffset + this.data.byteLength)
        )
      )
    );
  }},
  
  getBlobPiece: {value: function(){
    return this.data;
  }},
  
  slice: {value: function(start,end){
    var aBuff = this.data.buffer.slice(this.data.byteOffset,this.data.byteOffset + this.data.byteLength);
    
    if(arguments.length > 1) return new ArrayBufferPart(aBuff.slice(start,end));
    return new ArrayBufferPart(aBuff.slice(start));
  }}
  
});

