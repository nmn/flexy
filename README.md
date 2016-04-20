# flexy - WARNING: END OF LIFE

## Flexy was made months before redux. Redux is superior in almost every way. If you use flexy, you should find a way to transition over to redux. Most of the code should portable using `redux-thunk` and using immtable in your redux store.

Friendly flux based on channels and immutable data.

## Another Flux Library?

The more the merrier right?

There are many great implementations of Flux out there, but I think Flexy is different enough from the competition to justify it's existence.

Think of Flex is something that tries to be the best of both worlds. Flexy has few moving parts, just a dispatcher and store, nothing else. At the same time, it tries to make it possible to build something complicated and powerful. It does this by focussing on the store.

Using Immutable data, Flexy stores make it possible to easily accomplish optimistic updates. Unlike other stores, you never directly mutate the data in the store. You pass functions that take the old state of the data and return the new state. Further, every change can be applied optimistically and later committed or rejected.

## WaitFor?

Inspired by the talk 'Full Stack Flux', Flexy gets rid of the waitFor metophor altother. Instead, every Store, apart from emitting change events, also pipes through all the events from the Dispatcher, after it handles them. Instead of waitFor, you just listen to another store to accomplish the same.

## Observe API

Flexy is based on channels, but it plays well with the upcoming Observe API in React. You can call the `getObservable` method on a store with a filter function. This will give you something that resembles an observable. You can then subscribe to this to be sotified of changes. When you subscribe, you will get an object with a `.dispose()` method, just like a real observable.

## CSP Mults

In case you want to use channels, that is easy too. You can just call the `.tap` and `.untap` methods to directly subscribe to all changes. In this case you will have to filter through the data yourself. I hope to fix this in the near future. Read about mults in js-csp to understand how they work.

## API

### Stores

Flexy is based on definining classes. (This will be useful for isomorphic apps, which is coming in the future) You can define a Store class by calling the
`.defineStore` method with "Transformers", "consumers".

```

var StoreClass = Flexy.defineStore({
  primaryKey: 'id',
  transformers: [...],
  consumers: [...],
  ...
})

```

#### primaryKey *: String*
This is just a simple string

#### transformers *: Array<function>*
Transformers are simple functions the current data, and return new data. The functions will also receive the payload sent with the action if any

e.g.:
```
'ACTION_NAME': function(data, payload){
  return data.merge(payload)
}
```

#### consumers *: Array<function>*
Consumers are for times when you need finer grain control over the updates of your stores. It's best to show with an example:

```
'ACTION_NAME': function({apply, commit, reject}, {payload, promise}){
  apply(function(data){
    return data.setIn([payload.id, 'count'], data.get(payload.id).get(count) + 1)
  })

  setTimeout(commit, 1000)
}

'ACTION_NAME': function({apply, commit, reject}, {payload}){
  apply(function(data){
    return data.setIn([payload.id, 'count'], data.get(payload.id).get(count) + 1)
  })

  someAjaxCallPromise
    .then(apply)
    .catch(reject)

  setTimeout(commit, 1000)
}
```

Here your function gets the controls to your data as the first argument, and the action as the second argument.
You should call apply with a simple function that takes the old data and returns new data. This change will be applied immediately.
After this you can do any async calls that you may need to and only after that, call commit on success.

If something goes wrong, just call reject, and your change will be rolled back. Special care is taken to ensure that only this particular change is rolled back and not the changes caused by actions that may have occurred since.

#### Other properties *: Any
Other than primaryKey, consumers and transformers, you can pass in arbitrary properties while defining your store, or while instantiating it. All these properties would be made available on the context. This is a simple and powerful way to pass in various dependencies.


```
var StoreClass = Flexy.defineStore({
  primaryKey: 'id',
  transformers: [...],
  consumers: [...],
  a: function(){...}
})

var store = new StoreClass(initialData, {b: somethingElse})

```

In this case, the transformers and consumers will all have access to `this.a` and `this.b`

### Dispatchers
Dispatchers should usually not need much configuration. But for bigger projects, you may need something like action creators. Luckily, the dispatchers in Flexy can actually play the role of action creators as well.

A simple way to think of Dispatchers is that it is a simple stream of events, that lets you pass in map functions to handle particular events and transform them.

Dispatchers only take a single property, called transformers:

#### transformers
These are simple functions that have the same name as the action and can then accept the payload and return the new payload. This is usually only good for sanity checking and for firing ajax requests and passing promises along. Flexy is unopinioated about how you handle ajax/async calls in your actions. You can do that in your transformers, or in your stores (or a bit of both).


## Conclusion
I have been using Flexy in production of upclose.me. New patches and features are being added on a regular basis. I will soon switch to it for scribbler.co as well.

So far, I really like how simple but powerful it is. I have found many flux implementation to be too complex, and as a roadbloack while trying to adopt the flux architecture.

If you have any questions, suggestions, and pull requests (would be awesome) feel free to contact me. I'm trying to slowly add more documentation and examples. (help there would be amazing!)

## Future
Some features I'm working on are:
- [ ] a way to record all events that are dispatched
- [ ] an alternate debugging dispatcher, that replays a given list of actions, and ignores any fresh actions.
- [ ] Adding unique keys to every action to make debugging even easier

Apart from the additions to Flexy core, I'm working on an extention based on superagent, for ajax calls. This will probably live in a seperate npm module. This will have the following features:

- [ ] A built-in way to create batched requests, if your API server supports them
- [ ] A central place to keep track of pending requests and a callback to fire when all requests are fulfilled. This will make server-side rendering easy. (render to string once. Check for pending requests. Wait for all of them to complete. Render to string again. done.)
- [ ] A debugging version that can take an initial set of responses mapped to keys to re-play a user's experience after the fact


