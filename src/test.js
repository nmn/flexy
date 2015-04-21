import {defineStore} from 'flexy'

var BroadcastStore = defineStore(
  { primaryKey: 'id'
  , transformers:
      { 'FOLLOW_USER' : function({payload}, data){
          const id = payload.id
          return data.set(id, data.get(id).merge(payload))
        }
      }
  , consumers:
      { 'DELETE_IMAGE': function({payload}, {apply, commit, reject}){
          apply(data => data.delete(payload.id))
          request.del('/images').send({id: payload.id}).promise()
            .then(commit)
            .catch(reject)
        }
      }
  }
)