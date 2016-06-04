/**/ 'use strict' /**/

var Resolver = require('y-resolver'),
    output = Symbol(),
    input = Symbol(),
    tf = Symbol(),
    bytes = Symbol(),
    autoFlush = Symbol(),

    set = Uint8Array.prototype.set;

class BinaryBuffer{

  constructor(){
    this[output] = [];
    this[input] = [];
    this[tf] = 0;
    this[bytes] = 0;
    this[autoFlush] = false;
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
        setBytes(o.array,arr,o.array.length - o.remaining);

        obj.array = getArr(obj.array,o.remaining);
        out.shift();
        os.push(o);
      }else{
        setBytes(o.array,obj.array,o.array.length - o.remaining);
        o.remaining -= obj.array.length;
        obj.array = [];
      }

    }

    if(!obj.array.length) obj.resolver.accept();
    else this[input].push(obj);

    for(j = 0;j < os.length;j++){
      o = os[j];
      o.resolver.accept(getArr(o.array,0,o.array.length));
    }

    if(this[autoFlush]) this.flush();
    return obj.resolver.yielded;
  }

  read(array,constructor){
    var inp = this[input],
        is = [],
        obj,arr,i,j;

    if(typeof array == 'number') obj = {
      array: {
        length: array,
        setArgs: [],
        buffConstructor: constructor || global.Buffer || Uint8Array
      },
      remaining: array,
      resolver: new Resolver()
    };
    else obj = {
      array: array,
      remaining: array.length,
      resolver: new Resolver()
    };

    while(inp[0] && obj.remaining){
      i = inp[0];

      if('flush' in i){
        this[bytes] -= i.flush;
        this[tf]++;
        inp.shift();

        obj.resolver.accept(getArr(obj.array,0,obj.array.length - obj.remaining));
        for(j = 0;j < is.length;j++){
          i = is[j];
          i.resolver.accept();
        }

        return obj.resolver.yielded;
      }

      if(obj.remaining >= i.array.length){
        setBytes(obj.array,i.array,array.length - obj.remaining);

        obj.remaining -= i.array.length;
        inp.shift();
        is.push(i);
      }else{
        arr = getArr(i.array,0,obj.remaining);
        setBytes(obj.array,arr,array.length - obj.remaining);
        i.array = getArr(i.array,obj.remaining);
        obj.remaining = 0;
      }

    }

    if(!obj.remaining) obj.resolver.accept(getArr(obj.array,0,obj.array.length));
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

  get autoFlush(){
    return this[autoFlush];
  }

  set autoFlush(value){
    value = !!value;
    if(value == this[autoFlush]) return;
    this[autoFlush] = value;
    if(value) this.flush();
  }

  get timesFlushed(){
    return this[tf];
  }

  get bytesSinceFlushed(){
    return this[bytes];
  }

}

// utils

function setBytes(destination,source,offset){
  if(destination.constructor == Object) destination.setArgs.push([source,offset]);
  else set.call(destination,source,offset);
}

function getArr(arr,from,to){
  var buff,args;

  if(arr.constructor == Object){
    buff = new arr.buffConstructor(to - from);
    for(args of arr.setArgs) set.apply(buff,args);
    return buff;
  }

  if(from == 0 && to == arr.length) return arr;
  if(arr.constructor != Uint8Array) return arr.slice(from,to);
  return arr.subarray(from,to);
}

/*/ exports /*/

module.exports = BinaryBuffer;
