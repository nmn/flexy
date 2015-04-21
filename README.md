# flexy

Friendly flux based on channels and immutable data.

## Another Flux Library?

There are many great implementations of Flux out there. Yet, I feel there is still a need for another take.
Most Flux implementations focus on the Dispatcher. Some put a lot of complications in Action Creators. Others, take a simple approach and reduce the number of parts.

Think of Flex is something that tries to be the best of both worlds. Flexy has few moving parts, just a dispatcher and store, nothing else. At the same time, it tries to make it possible to build something complicated and powerful. It does this by focussing on the store.

Using Immutable data, Flexy stores make it possible to easily accomplish optimistic updates. Unlike other stores, you never directly mutate the data in the store. You pass functions that take the old state of the data and return the new state. Further, every change can be applied optimistically and later committed or rejected.

## WaitFor?

Inspired by the talk 'Full Stack Flux', Flexy gets rid of the waitFor metophor altother. Instead, every Store, apart from emitting change events, also pipes through all the events from the Dispatcher, after it handles them. Instead of waitFor, you just listen to another store to accomplish the same.

## Observe API

Flexy is based on channels, but it plays well with the upcoming Observe API in React. You can call the `getObservable` method on a store with a filter function. This will give you something that resembles an observable. You can then subscribe to this to be sotified of changes. When you subscribe, you will get an object with a `.dispose()` method, just like a real observable.

## CSP Mults

In case you want to use channels, that is easy too. You can just call the `.tap` and `.untap` methods to directly subscribe to all changes. In this case you will have to filter through the data yourself. I hope to fix this in the near future.

## API

### Stores

Flexy is based on definining classes. (This will be useful for isomorphic apps, which is coming in the future) You can define a Store class by calling the 
`.defineStore` method with "Transformers", "consumers".

#### Transformers
Transformers are simple functions the current data, and return new data. The functions will also receive the payload sent with the action if any

e.g.:
```
'ACTION_NAME': function(data, payload){
  return data.merge(payload)
}
```

#### Consumers
Consumers are for times when you need finer grain control over the updates of your stores. It's best to show with an example:

```
'ACTION_NAME': function({apply, commit, reject}, {payload, promise}){
  apply(function(data){
    return data.setIn([payload.id, 'count'], data.get(payload.id).get(count) + 1)
  })

  setTimeout(commit, 1000)
}
```

Here your function gets the controls to your data as the first argument, and the action as the second argument.
You should call apply with a simple function that takes the old data and returns new data. This change will be applied immediately.
After this you can do any async calls that you may need to and only after that, call commit on success.

If something goes wrong, just call reject, and your change will be rolled back. Special care is taken to ensure that only this particular change is rolled back and not the changes caused by actions that may have occurred since.

## More Documentation Soon.


