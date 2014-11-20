/*
 * # Part object
 * 
 * Part.size;               // readonly
 * Part.async;              // readonly
 * Part.getArrayLike();     // yields
 * Part.getBuffer();        // yields
 * Part.getArray();         // yields
 * Part.getBlobPiece();
 * Part.slice(start[,end]);
 * 
 */

var ArrayPart = require('./Part/ArrayPart.js'),
    BufferPart = require('./Part/BufferPart.js'),
    BlobPart = require('./Part/BlobPart.js'),
    ArrayBufferPart = require('./Part/ArrayBufferPart.js'),
    Uint8ArrayPart = require('./Part/Uint8ArrayPart.js'),
    ArrayBufferViewPart = require('./Part/ArrayBufferViewPart.js'),
    
    File = global.File,
    Blob = global.Blob,
    Buffer = global.Buffer;

module.exports = function Part(data){
  
  switch(data.constructor){
    case Number:              data = [data];
    case Array:               return new ArrayPart(data);
    case Buffer:              return new BufferPart(data);
    case File:
    case Blob:                return new BlobPart(data);
    case ArrayBuffer:         return new ArrayBufferPart(data);
    case Uint8ClampedArray:
    case Uint8Array:          return new Uint8ArrayPart(data);
    case Uint16Array:
    case Uint32Array:
    case Int8Array:
    case Int16Array:
    case Int32Array:
    case Float32Array:
    case Float64Array:
    case DataView:            return new ArrayBufferViewPart(data);
    
    default:                  throw new TypeError('Unsupported part type');
  }
  
};

