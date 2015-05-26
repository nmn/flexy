import {chan, go, operations, buffers, take, putAsync, CLOSED} from 'js-csp'
import {compose, filter} from 'transducers.js'
import I from 'immutable'

export function defineDispatcher({transformers}){
  return class {

    constructor(){
      this.outCh = chan(buffers.fixed(10), compose(filter(value => !!value)))
      this.outMult = operations.mult(this.outCh)
      this._subscribers = I.Set()
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

    broadcast(value){
      this._subscribers
        .map(list => list.toJS())
        .forEach(([subscriber, ctx]) => subscriber.call(ctx, value))
    }

    subscribe(fn, ctx = null){
      const list = I.List([fn, ctx])
      this._subscribers = this._subscribers.add( list )
      return list
    }

    unsubscribe(fn, ctx = null){
      const list = I.List([fn, ctx])
      this._subscribers = this._subscribers.delete( list )
      return list
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
        this.broadcast(obj)
      } else {
        console.warn('dispatched event without a name', name)
      }
    }
  }
}