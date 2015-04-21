import {chan, go, operations, buffers, take, put, takeAsync, putAsync, CLOSED} from 'js-csp'

export function defineDispatcher({transformers}){
  return class {

    constructor(){
      this.outCh = chan(buffers.fixed(10))
      this.outMult = operations.mult(this.outCh)
    }

    listen(source){

      if(source.outMult && source.throughMult){
        source = source.throughMult
      } else if(source.outMult){
        source = source.outMult
      }

      const ch = chan()
      const that = this
      operations.mult.tap(source, ch)

      go(function*(){
        var value = yield take(ch)
        while (value !== CLOSED) {
          that.trigger(value)
          value = yield take(ch)
        }
      })

      return this
    }

    emit(...args){
      this.trigger(...args)
    }

    trigger(name, payload, promise){
      if(typeof name === 'string'){
        let obj =
          transformers[name] ? transformers[name]({name, payload, promise})
          : {name, payload, promise}
        putAsync(this.outCh, obj)
      } else if(typeof name === 'object' && typeof name.name === 'object'){
        let obj =
          transformers[name] ? transformers[name](name)
          : name
        putAsync(this.outCh, obj)
      }
    }
  }
}