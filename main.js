/**/ 'use strict' /**/

var Resolver = require('y-resolver'),
    output = Symbol(),
    input = Symbol(),
    tf = Symbol(),
    bytes = Symbol(),

    set = Uint8Array.prototype.set;

class BinaryBuffer{

  constructor(){
    this[output] = [];
    this[input] = [];
    this[tf] = 0;
    this[bytes] = 0;
  }

  write(array){
    var out = this[output],
        os = [],
        obj = {
          array: array,
          resolver: new Resolver()
        },
        arr,o,j;

    this[bytes] += array.length;

    while(out[0] && obj.array.length){
      o = out[0];

      if(obj.array.length >= o.remaining){
        arr = getArr(obj.array,0,o.remaining);
        set.call(o.array,arr,o.array.length - o.remaining);

        obj.array = getArr(obj.array,o.remaining);
        out.shift();
        os.push(o);
      }else{
        set.call(o.array,obj.array,o.array.length - o.remaining);
        o.remaining -= obj.array.length;
        obj.array = [];
      }

    }

    if(!obj.array.length) obj.resolver.accept();
    else this[input].push(obj);

    for(j = 0;j < os.length;j++){
      o = os[j];
      o.resolver.accept(o.array);
    }

    return obj.resolver.yielded;
  }

  read(array){
    var inp = this[input],
        is = [],
        obj,arr,i,j;

    if(typeof array == 'number') array = new Uint8Array(array);

    obj = {
      array: array,
      remaining: array.length,
      resolver: new Resolver()
    };

    while(inp[0] && obj.remaining){
      i = inp[0];

      if('flush' in i){
        this[bytes] -= i.flush;
        this[tf]++;

        obj.resolver.accept(getArr(obj.array,0,obj.array.length - obj.remaining));
        for(j = 0;j < is.length;j++){
          i = is[j];
          i.resolver.accept();
        }

        return obj.resolver.yielded;
      }

      if(obj.remaining >= i.array.length){
        set.call(array,i.array,array.length - obj.remaining);

        obj.remaining -= i.array.length;
        inp.shift();
        is.push(i);
      }else{
        arr = getArr(i.array,0,obj.remaining);
        set.call(array,arr,array.length - obj.remaining);
        i.array = getArr(i.array,obj.remaining);
        obj.remaining = 0;
      }

    }

    if(!obj.remaining) obj.resolver.accept(array);
    else this[output].push(obj);

    for(j = 0;j < is.length;j++){
      i = is[j];
      i.resolver.accept();
    }

    return obj.resolver.yielded;
  }

  fakeFlush(){
    this[bytes] = 0;
    this[tf]++;
  }

  flush(){
    var out = this[output],
        o = out.shift();

    if(o){
      this[bytes] = 0;
      this[tf]++;
      o.resolver.accept(getArr(o.array,0,o.array.length - o.remaining));
    }else this[input].push({flush: this[bytes]});
  }

  get timesFlushed(){
    return this[tf];
  }

  get bytesSinceFlushed(){
    return this[bytes];
  }

}

// utils

function getArr(arr,from,to){
  if(from == 0 && to == arr.length) return arr;
  if(arr.constructor != Uint8Array) return arr.slice(from,to);
  return arr.subarray(from,to);
}

/*/ exports /*/

module.exports = BinaryBuffer;
