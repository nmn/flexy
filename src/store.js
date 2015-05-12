import I from 'immutable'
import {chan, go, operations, buffers, take, put, takeAsync, putAsync, CLOSED} from 'js-csp'
import {compose, map, filter, dedupe, merge} from 'transducers.js'


export function defineStore({primaryKey = 'id', consumers, transformers, ...ctx}){
  return class {
    constructor(initialData, ctx2){
      this.data =
        !initialData ?
          I.Map()
        : Array.isArray(initialData) && primaryKey ?
          I.Map( initialData.reduce((collection, obj) => Object.assign(collection, {[obj[primaryKey]]: obj}), {}) )
        : typeof initialData === 'object' ?
          I.Map( initialData )
        : I.Map()

      this.context = merge({}, ctx, ctx2)

      this.reducers = I.OrderedMap()

      this.inCh = chan()
      this.outCh = chan( buffers.fixed(100), compose(dedupe()) )
      this.outMult = operations.mult(this.outCh)
      this.sources = I.Set()
      this.throughCh = chan(buffers.fixed(100))
      this.throughMult = operations.mult(this.throughCh)
    }

    toJSON(){
      return JSON.stringify(this.data)
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
          that.handleAction(value)
          value = yield take(ch)
        }
      })

      return this
    }

    trigger(){
      // const oldData = this.data
      const fnsToApply = this.reducers.takeWhile(v => v > 0)
      this.reducers = this.reducers.skipWhile(v => v > 0).filter(v => v >= 0)
      this.data = fnsToApply.reduce((value, val, fn) => fn(value), this.data)

      const dataToSend = this.reducers.reduce((value, val, fn) => fn(value), this.data)

      putAsync(this.outCh, dataToSend)
    }

    getObservable(transformer, onUndefined){

      transformer = transformer || function(a){return a}
      const that = this

      return {
        subscribe(onNext, onError, onCompleted){

          const initialData =
            transformer(
              that.reducers
                  .filter(v => v >= 0)
                  .reduce( (value, val, fn) => fn(value), that.data)
            )

          if(initialData === undefined){
            typeof onUndefined === 'function' && onUndefined()
          } else {
            onNext(initialData)
          }

          const tempCh = chan()
          operations.mult.tap(that.outMult, tempCh)
          let completed = false

          go(function* (){
            try {
              let value = yield take(tempCh)
              while(value !== CLOSED){
                onNext(transformer(value))
                value = yield take(tempCh)
              }
              if(completed){
                onCompleted()
              }
            } catch (e){
              onError(e)
            }
          })

          return {
            dispose(){
              operations.mult.untap(that.outMult, tempCh)
              tempCh.close()
            }
          }
        }
      }
    }

    subscribe(onNext, onError, onCompleted){

      const tempCh = chan()
      operations.mult.tap(this.outMult, tempCh)
      let completed = false

      go(function* (){
        try {
          let value = yield take(tempCh)
          while(value !== CLOSED){
            onNext(value)
            value = yield take(tempCh)
          }
          if(completed){
            onCompleted()
          }
        } catch (e){
          onError(e)
        }
      })

      return {
        dispose(){
          operations.mult.untap(this.outMult, tempCh)
          tempCh.close()
        }
      }
    }

    tap(channel){
      operations.mult.tap(this.outMult, channel)
      return this
    }

    untap(channel){
      operations.mult.untap(this.outMult, channel)
      return this
    }

    handleAction(action){
      const that = this
      const {name, payload, promise} = action

      // in case of full consumer. We provide, (controls, action)
      // controls is an object of three functions — apply, commit, and reject
      // in case of sync operations, the consumer is expected to call apply with a reducer function and then immediately call commit
      // in case of async ops, the consumer should call apply with a reducer function. Then if the async op is successful call commit,
      // if the async operation fails, reject should be called. This will roll back the change.
      if(consumers[name]){
        let cached = null
        consumers[name]
           .call( this.context
                , { apply(fn){
                      if(cached){
                        that.reducers = that.reducers.set(cached, -1)
                      }
                      cached = fn
                      that.reducers = that.reducers.set(fn, 0)
                      that.trigger()
                    }
                  , commit(){
                      if(!cached){
                        return false
                      }
                      that.reducers = that.reducers.set(cached, 1)
                      that.trigger()
                      cached = null
                      putAsync(that.throughCh, action)
                      return true
                    }
                  , reject(){
                      if(!cached){
                        return false
                      }
                      that.reducers = that.reducers.set(cached, -1)
                      that.trigger()
                      cached = null
                      putAsync(that.throughCh, action)
                      return true
                    }
                  }
                , { payload, promise}
                )
      } else if(transformers[name]){
        let cached = (data) => transformers[name].call(this.context, data, payload)
        that.reducers = that.reducers.set(cached, 0)
        if(promise){
          that.trigger()
          promise
            .then(() => {
              that.reducers = that.reducers.set(cached, 1)
              that.trigger()
              putAsync(that.throughCh, action)
            })
            .catch((err) => {
              that.reducers = that.reducers.set(cached, -1)
              that.trigger()
              console.error(err)
              putAsync(that.throughCh, action)
            })
        } else {
          that.reducers = that.reducers.set(cached, 1)
          that.trigger()
          putAsync(that.throughCh, action)
        }
      } else {
        putAsync(that.throughCh, action)
      }
    }
  }
}

