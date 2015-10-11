/**/ 'use strict' /**/

var Resolver = require('y-resolver'),
    output = Symbol(),
    input = Symbol(),
    tf = Symbol(),

    set = Uint8Array.prototype.set;

class BinaryBuffer{

  constructor(){
    this[output] = [];
    this[input] = [];
    this[tf] = 0;
  }

  write(array){
    var out = this[output],
        os = [],
        obj = {
          array: array,
          remaining: array.length,
          resolver: new Resolver()
        },
        arr,from,o,j;

    while(out[0] && obj.remaining){
      from = obj.array.length - obj.remaining;
      o = out[0];

      if(obj.remaining >= o.remaining){
        arr = getArr(array,from,from + o.remaining);
        set.call(o.array,arr,o.array.length - o.remaining);

        obj.remaining -= o.remaining;
        out.shift();
        os.push(o);
      }else{
        arr = getArr(array,from,array.length);
        set.call(o.array,arr,o.array.length - o.remaining);
        o.remaining -= obj.remaining;
        obj.remaining = 0;
      }

    }

    if(!obj.remaining) obj.resolver.accept(array);
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
        obj,arr,from,i,j;

    if(typeof array == 'number') array = new Uint8Array(array);

    obj = {
      array: array,
      remaining: array.length,
      resolver: new Resolver()
    };

    while(inp[0] && obj.remaining){
      i = inp[0];
      from = i.array.length - i.remaining;

      if(obj.remaining >= i.remaining){
        arr = getArr(i.array,from,i.array.length);
        set.call(array,arr,array.length - obj.remaining);

        obj.remaining -= i.remaining;
        inp.shift();
        is.push(i);
      }else{
        arr = getArr(i.array,from,from + obj.remaining);
        set.call(array,arr,array.length - obj.remaining);
        i.remaining -= obj.remaining;
        obj.remaining = 0;
      }

    }

    if(!obj.remaining) obj.resolver.accept(array);
    else this[output].push(obj);

    for(j = 0;j < is.length;j++){
      i = is[j];
      i.resolver.accept(i.array);
    }

    return obj.resolver.yielded;
  }

  flush(){
    var out = this[output],
        o = out.shift();

    this[tf]++;
    if(o) o.resolver.accept(getArr(o.array,0,o.array.length - o.remaining));
  }

  get timesFlushed(){
    return this[tf];
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
