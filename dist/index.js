(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 *  Copyright (c) 2014-2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  global.Immutable = factory()
}(this, function () { 'use strict';var SLICE$0 = Array.prototype.slice;

  function createClass(ctor, superClass) {
    if (superClass) {
      ctor.prototype = Object.create(superClass.prototype);
    }
    ctor.prototype.constructor = ctor;
  }

  // Used for setting prototype methods that IE8 chokes on.
  var DELETE = 'delete';

  // Constants describing the size of trie nodes.
  var SHIFT = 5; // Resulted in best performance after ______?
  var SIZE = 1 << SHIFT;
  var MASK = SIZE - 1;

  // A consistent shared value representing "not set" which equals nothing other
  // than itself, and nothing that could be provided externally.
  var NOT_SET = {};

  // Boolean references, Rough equivalent of `bool &`.
  var CHANGE_LENGTH = { value: false };
  var DID_ALTER = { value: false };

  function MakeRef(ref) {
    ref.value = false;
    return ref;
  }

  function SetRef(ref) {
    ref && (ref.value = true);
  }

  // A function which returns a value representing an "owner" for transient writes
  // to tries. The return value will only ever equal itself, and will not equal
  // the return of any subsequent call of this function.
  function OwnerID() {}

  // http://jsperf.com/copy-array-inline
  function arrCopy(arr, offset) {
    offset = offset || 0;
    var len = Math.max(0, arr.length - offset);
    var newArr = new Array(len);
    for (var ii = 0; ii < len; ii++) {
      newArr[ii] = arr[ii + offset];
    }
    return newArr;
  }

  function ensureSize(iter) {
    if (iter.size === undefined) {
      iter.size = iter.__iterate(returnTrue);
    }
    return iter.size;
  }

  function wrapIndex(iter, index) {
    return index >= 0 ? (+index) : ensureSize(iter) + (+index);
  }

  function returnTrue() {
    return true;
  }

  function wholeSlice(begin, end, size) {
    return (begin === 0 || (size !== undefined && begin <= -size)) &&
      (end === undefined || (size !== undefined && end >= size));
  }

  function resolveBegin(begin, size) {
    return resolveIndex(begin, size, 0);
  }

  function resolveEnd(end, size) {
    return resolveIndex(end, size, size);
  }

  function resolveIndex(index, size, defaultIndex) {
    return index === undefined ?
      defaultIndex :
      index < 0 ?
        Math.max(0, size + index) :
        size === undefined ?
          index :
          Math.min(size, index);
  }

  function Iterable(value) {
      return isIterable(value) ? value : Seq(value);
    }


  createClass(KeyedIterable, Iterable);
    function KeyedIterable(value) {
      return isKeyed(value) ? value : KeyedSeq(value);
    }


  createClass(IndexedIterable, Iterable);
    function IndexedIterable(value) {
      return isIndexed(value) ? value : IndexedSeq(value);
    }


  createClass(SetIterable, Iterable);
    function SetIterable(value) {
      return isIterable(value) && !isAssociative(value) ? value : SetSeq(value);
    }



  function isIterable(maybeIterable) {
    return !!(maybeIterable && maybeIterable[IS_ITERABLE_SENTINEL]);
  }

  function isKeyed(maybeKeyed) {
    return !!(maybeKeyed && maybeKeyed[IS_KEYED_SENTINEL]);
  }

  function isIndexed(maybeIndexed) {
    return !!(maybeIndexed && maybeIndexed[IS_INDEXED_SENTINEL]);
  }

  function isAssociative(maybeAssociative) {
    return isKeyed(maybeAssociative) || isIndexed(maybeAssociative);
  }

  function isOrdered(maybeOrdered) {
    return !!(maybeOrdered && maybeOrdered[IS_ORDERED_SENTINEL]);
  }

  Iterable.isIterable = isIterable;
  Iterable.isKeyed = isKeyed;
  Iterable.isIndexed = isIndexed;
  Iterable.isAssociative = isAssociative;
  Iterable.isOrdered = isOrdered;

  Iterable.Keyed = KeyedIterable;
  Iterable.Indexed = IndexedIterable;
  Iterable.Set = SetIterable;


  var IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
  var IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
  var IS_INDEXED_SENTINEL = '@@__IMMUTABLE_INDEXED__@@';
  var IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';

  /* global Symbol */

  var ITERATE_KEYS = 0;
  var ITERATE_VALUES = 1;
  var ITERATE_ENTRIES = 2;

  var REAL_ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
  var FAUX_ITERATOR_SYMBOL = '@@iterator';

  var ITERATOR_SYMBOL = REAL_ITERATOR_SYMBOL || FAUX_ITERATOR_SYMBOL;


  function src_Iterator__Iterator(next) {
      this.next = next;
    }

    src_Iterator__Iterator.prototype.toString = function() {
      return '[Iterator]';
    };


  src_Iterator__Iterator.KEYS = ITERATE_KEYS;
  src_Iterator__Iterator.VALUES = ITERATE_VALUES;
  src_Iterator__Iterator.ENTRIES = ITERATE_ENTRIES;

  src_Iterator__Iterator.prototype.inspect =
  src_Iterator__Iterator.prototype.toSource = function () { return this.toString(); }
  src_Iterator__Iterator.prototype[ITERATOR_SYMBOL] = function () {
    return this;
  };


  function iteratorValue(type, k, v, iteratorResult) {
    var value = type === 0 ? k : type === 1 ? v : [k, v];
    iteratorResult ? (iteratorResult.value = value) : (iteratorResult = {
      value: value, done: false
    });
    return iteratorResult;
  }

  function iteratorDone() {
    return { value: undefined, done: true };
  }

  function hasIterator(maybeIterable) {
    return !!getIteratorFn(maybeIterable);
  }

  function isIterator(maybeIterator) {
    return maybeIterator && typeof maybeIterator.next === 'function';
  }

  function getIterator(iterable) {
    var iteratorFn = getIteratorFn(iterable);
    return iteratorFn && iteratorFn.call(iterable);
  }

  function getIteratorFn(iterable) {
    var iteratorFn = iterable && (
      (REAL_ITERATOR_SYMBOL && iterable[REAL_ITERATOR_SYMBOL]) ||
      iterable[FAUX_ITERATOR_SYMBOL]
    );
    if (typeof iteratorFn === 'function') {
      return iteratorFn;
    }
  }

  function isArrayLike(value) {
    return value && typeof value.length === 'number';
  }

  createClass(Seq, Iterable);
    function Seq(value) {
      return value === null || value === undefined ? emptySequence() :
        isIterable(value) ? value.toSeq() : seqFromValue(value);
    }

    Seq.of = function(/*...values*/) {
      return Seq(arguments);
    };

    Seq.prototype.toSeq = function() {
      return this;
    };

    Seq.prototype.toString = function() {
      return this.__toString('Seq {', '}');
    };

    Seq.prototype.cacheResult = function() {
      if (!this._cache && this.__iterateUncached) {
        this._cache = this.entrySeq().toArray();
        this.size = this._cache.length;
      }
      return this;
    };

    // abstract __iterateUncached(fn, reverse)

    Seq.prototype.__iterate = function(fn, reverse) {
      return seqIterate(this, fn, reverse, true);
    };

    // abstract __iteratorUncached(type, reverse)

    Seq.prototype.__iterator = function(type, reverse) {
      return seqIterator(this, type, reverse, true);
    };



  createClass(KeyedSeq, Seq);
    function KeyedSeq(value) {
      return value === null || value === undefined ?
        emptySequence().toKeyedSeq() :
        isIterable(value) ?
          (isKeyed(value) ? value.toSeq() : value.fromEntrySeq()) :
          keyedSeqFromValue(value);
    }

    KeyedSeq.prototype.toKeyedSeq = function() {
      return this;
    };



  createClass(IndexedSeq, Seq);
    function IndexedSeq(value) {
      return value === null || value === undefined ? emptySequence() :
        !isIterable(value) ? indexedSeqFromValue(value) :
        isKeyed(value) ? value.entrySeq() : value.toIndexedSeq();
    }

    IndexedSeq.of = function(/*...values*/) {
      return IndexedSeq(arguments);
    };

    IndexedSeq.prototype.toIndexedSeq = function() {
      return this;
    };

    IndexedSeq.prototype.toString = function() {
      return this.__toString('Seq [', ']');
    };

    IndexedSeq.prototype.__iterate = function(fn, reverse) {
      return seqIterate(this, fn, reverse, false);
    };

    IndexedSeq.prototype.__iterator = function(type, reverse) {
      return seqIterator(this, type, reverse, false);
    };



  createClass(SetSeq, Seq);
    function SetSeq(value) {
      return (
        value === null || value === undefined ? emptySequence() :
        !isIterable(value) ? indexedSeqFromValue(value) :
        isKeyed(value) ? value.entrySeq() : value
      ).toSetSeq();
    }

    SetSeq.of = function(/*...values*/) {
      return SetSeq(arguments);
    };

    SetSeq.prototype.toSetSeq = function() {
      return this;
    };



  Seq.isSeq = isSeq;
  Seq.Keyed = KeyedSeq;
  Seq.Set = SetSeq;
  Seq.Indexed = IndexedSeq;

  var IS_SEQ_SENTINEL = '@@__IMMUTABLE_SEQ__@@';

  Seq.prototype[IS_SEQ_SENTINEL] = true;



  // #pragma Root Sequences

  createClass(ArraySeq, IndexedSeq);
    function ArraySeq(array) {
      this._array = array;
      this.size = array.length;
    }

    ArraySeq.prototype.get = function(index, notSetValue) {
      return this.has(index) ? this._array[wrapIndex(this, index)] : notSetValue;
    };

    ArraySeq.prototype.__iterate = function(fn, reverse) {
      var array = this._array;
      var maxIndex = array.length - 1;
      for (var ii = 0; ii <= maxIndex; ii++) {
        if (fn(array[reverse ? maxIndex - ii : ii], ii, this) === false) {
          return ii + 1;
        }
      }
      return ii;
    };

    ArraySeq.prototype.__iterator = function(type, reverse) {
      var array = this._array;
      var maxIndex = array.length - 1;
      var ii = 0;
      return new src_Iterator__Iterator(function() 
        {return ii > maxIndex ?
          iteratorDone() :
          iteratorValue(type, ii, array[reverse ? maxIndex - ii++ : ii++])}
      );
    };



  createClass(ObjectSeq, KeyedSeq);
    function ObjectSeq(object) {
      var keys = Object.keys(object);
      this._object = object;
      this._keys = keys;
      this.size = keys.length;
    }

    ObjectSeq.prototype.get = function(key, notSetValue) {
      if (notSetValue !== undefined && !this.has(key)) {
        return notSetValue;
      }
      return this._object[key];
    };

    ObjectSeq.prototype.has = function(key) {
      return this._object.hasOwnProperty(key);
    };

    ObjectSeq.prototype.__iterate = function(fn, reverse) {
      var object = this._object;
      var keys = this._keys;
      var maxIndex = keys.length - 1;
      for (var ii = 0; ii <= maxIndex; ii++) {
        var key = keys[reverse ? maxIndex - ii : ii];
        if (fn(object[key], key, this) === false) {
          return ii + 1;
        }
      }
      return ii;
    };

    ObjectSeq.prototype.__iterator = function(type, reverse) {
      var object = this._object;
      var keys = this._keys;
      var maxIndex = keys.length - 1;
      var ii = 0;
      return new src_Iterator__Iterator(function()  {
        var key = keys[reverse ? maxIndex - ii : ii];
        return ii++ > maxIndex ?
          iteratorDone() :
          iteratorValue(type, key, object[key]);
      });
    };

  ObjectSeq.prototype[IS_ORDERED_SENTINEL] = true;


  createClass(IterableSeq, IndexedSeq);
    function IterableSeq(iterable) {
      this._iterable = iterable;
      this.size = iterable.length || iterable.size;
    }

    IterableSeq.prototype.__iterateUncached = function(fn, reverse) {
      if (reverse) {
        return this.cacheResult().__iterate(fn, reverse);
      }
      var iterable = this._iterable;
      var iterator = getIterator(iterable);
      var iterations = 0;
      if (isIterator(iterator)) {
        var step;
        while (!(step = iterator.next()).done) {
          if (fn(step.value, iterations++, this) === false) {
            break;
          }
        }
      }
      return iterations;
    };

    IterableSeq.prototype.__iteratorUncached = function(type, reverse) {
      if (reverse) {
        return this.cacheResult().__iterator(type, reverse);
      }
      var iterable = this._iterable;
      var iterator = getIterator(iterable);
      if (!isIterator(iterator)) {
        return new src_Iterator__Iterator(iteratorDone);
      }
      var iterations = 0;
      return new src_Iterator__Iterator(function()  {
        var step = iterator.next();
        return step.done ? step : iteratorValue(type, iterations++, step.value);
      });
    };



  createClass(IteratorSeq, IndexedSeq);
    function IteratorSeq(iterator) {
      this._iterator = iterator;
      this._iteratorCache = [];
    }

    IteratorSeq.prototype.__iterateUncached = function(fn, reverse) {
      if (reverse) {
        return this.cacheResult().__iterate(fn, reverse);
      }
      var iterator = this._iterator;
      var cache = this._iteratorCache;
      var iterations = 0;
      while (iterations < cache.length) {
        if (fn(cache[iterations], iterations++, this) === false) {
          return iterations;
        }
      }
      var step;
      while (!(step = iterator.next()).done) {
        var val = step.value;
        cache[iterations] = val;
        if (fn(val, iterations++, this) === false) {
          break;
        }
      }
      return iterations;
    };

    IteratorSeq.prototype.__iteratorUncached = function(type, reverse) {
      if (reverse) {
        return this.cacheResult().__iterator(type, reverse);
      }
      var iterator = this._iterator;
      var cache = this._iteratorCache;
      var iterations = 0;
      return new src_Iterator__Iterator(function()  {
        if (iterations >= cache.length) {
          var step = iterator.next();
          if (step.done) {
            return step;
          }
          cache[iterations] = step.value;
        }
        return iteratorValue(type, iterations, cache[iterations++]);
      });
    };




  // # pragma Helper functions

  function isSeq(maybeSeq) {
    return !!(maybeSeq && maybeSeq[IS_SEQ_SENTINEL]);
  }

  var EMPTY_SEQ;

  function emptySequence() {
    return EMPTY_SEQ || (EMPTY_SEQ = new ArraySeq([]));
  }

  function keyedSeqFromValue(value) {
    var seq =
      Array.isArray(value) ? new ArraySeq(value).fromEntrySeq() :
      isIterator(value) ? new IteratorSeq(value).fromEntrySeq() :
      hasIterator(value) ? new IterableSeq(value).fromEntrySeq() :
      typeof value === 'object' ? new ObjectSeq(value) :
      undefined;
    if (!seq) {
      throw new TypeError(
        'Expected Array or iterable object of [k, v] entries, '+
        'or keyed object: ' + value
      );
    }
    return seq;
  }

  function indexedSeqFromValue(value) {
    var seq = maybeIndexedSeqFromValue(value);
    if (!seq) {
      throw new TypeError(
        'Expected Array or iterable object of values: ' + value
      );
    }
    return seq;
  }

  function seqFromValue(value) {
    var seq = maybeIndexedSeqFromValue(value) ||
      (typeof value === 'object' && new ObjectSeq(value));
    if (!seq) {
      throw new TypeError(
        'Expected Array or iterable object of values, or keyed object: ' + value
      );
    }
    return seq;
  }

  function maybeIndexedSeqFromValue(value) {
    return (
      isArrayLike(value) ? new ArraySeq(value) :
      isIterator(value) ? new IteratorSeq(value) :
      hasIterator(value) ? new IterableSeq(value) :
      undefined
    );
  }

  function seqIterate(seq, fn, reverse, useKeys) {
    var cache = seq._cache;
    if (cache) {
      var maxIndex = cache.length - 1;
      for (var ii = 0; ii <= maxIndex; ii++) {
        var entry = cache[reverse ? maxIndex - ii : ii];
        if (fn(entry[1], useKeys ? entry[0] : ii, seq) === false) {
          return ii + 1;
        }
      }
      return ii;
    }
    return seq.__iterateUncached(fn, reverse);
  }

  function seqIterator(seq, type, reverse, useKeys) {
    var cache = seq._cache;
    if (cache) {
      var maxIndex = cache.length - 1;
      var ii = 0;
      return new src_Iterator__Iterator(function()  {
        var entry = cache[reverse ? maxIndex - ii : ii];
        return ii++ > maxIndex ?
          iteratorDone() :
          iteratorValue(type, useKeys ? entry[0] : ii - 1, entry[1]);
      });
    }
    return seq.__iteratorUncached(type, reverse);
  }

  createClass(Collection, Iterable);
    function Collection() {
      throw TypeError('Abstract');
    }


  createClass(KeyedCollection, Collection);function KeyedCollection() {}

  createClass(IndexedCollection, Collection);function IndexedCollection() {}

  createClass(SetCollection, Collection);function SetCollection() {}


  Collection.Keyed = KeyedCollection;
  Collection.Indexed = IndexedCollection;
  Collection.Set = SetCollection;

  /**
   * An extension of the "same-value" algorithm as [described for use by ES6 Map
   * and Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#Key_equality)
   *
   * NaN is considered the same as NaN, however -0 and 0 are considered the same
   * value, which is different from the algorithm described by
   * [`Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is).
   *
   * This is extended further to allow Objects to describe the values they
   * represent, by way of `valueOf` or `equals` (and `hashCode`).
   *
   * Note: because of this extension, the key equality of Immutable.Map and the
   * value equality of Immutable.Set will differ from ES6 Map and Set.
   *
   * ### Defining custom values
   *
   * The easiest way to describe the value an object represents is by implementing
   * `valueOf`. For example, `Date` represents a value by returning a unix
   * timestamp for `valueOf`:
   *
   *     var date1 = new Date(1234567890000); // Fri Feb 13 2009 ...
   *     var date2 = new Date(1234567890000);
   *     date1.valueOf(); // 1234567890000
   *     assert( date1 !== date2 );
   *     assert( Immutable.is( date1, date2 ) );
   *
   * Note: overriding `valueOf` may have other implications if you use this object
   * where JavaScript expects a primitive, such as implicit string coercion.
   *
   * For more complex types, especially collections, implementing `valueOf` may
   * not be performant. An alternative is to implement `equals` and `hashCode`.
   *
   * `equals` takes another object, presumably of similar type, and returns true
   * if the it is equal. Equality is symmetrical, so the same result should be
   * returned if this and the argument are flipped.
   *
   *     assert( a.equals(b) === b.equals(a) );
   *
   * `hashCode` returns a 32bit integer number representing the object which will
   * be used to determine how to store the value object in a Map or Set. You must
   * provide both or neither methods, one must not exist without the other.
   *
   * Also, an important relationship between these methods must be upheld: if two
   * values are equal, they *must* return the same hashCode. If the values are not
   * equal, they might have the same hashCode; this is called a hash collision,
   * and while undesirable for performance reasons, it is acceptable.
   *
   *     if (a.equals(b)) {
   *       assert( a.hashCode() === b.hashCode() );
   *     }
   *
   * All Immutable collections implement `equals` and `hashCode`.
   *
   */
  function is(valueA, valueB) {
    if (valueA === valueB || (valueA !== valueA && valueB !== valueB)) {
      return true;
    }
    if (!valueA || !valueB) {
      return false;
    }
    if (typeof valueA.valueOf === 'function' &&
        typeof valueB.valueOf === 'function') {
      valueA = valueA.valueOf();
      valueB = valueB.valueOf();
      if (valueA === valueB || (valueA !== valueA && valueB !== valueB)) {
        return true;
      }
      if (!valueA || !valueB) {
        return false;
      }
    }
    if (typeof valueA.equals === 'function' &&
        typeof valueB.equals === 'function' &&
        valueA.equals(valueB)) {
      return true;
    }
    return false;
  }

  function fromJS(json, converter) {
    return converter ?
      fromJSWith(converter, json, '', {'': json}) :
      fromJSDefault(json);
  }

  function fromJSWith(converter, json, key, parentJSON) {
    if (Array.isArray(json)) {
      return converter.call(parentJSON, key, IndexedSeq(json).map(function(v, k)  {return fromJSWith(converter, v, k, json)}));
    }
    if (isPlainObj(json)) {
      return converter.call(parentJSON, key, KeyedSeq(json).map(function(v, k)  {return fromJSWith(converter, v, k, json)}));
    }
    return json;
  }

  function fromJSDefault(json) {
    if (Array.isArray(json)) {
      return IndexedSeq(json).map(fromJSDefault).toList();
    }
    if (isPlainObj(json)) {
      return KeyedSeq(json).map(fromJSDefault).toMap();
    }
    return json;
  }

  function isPlainObj(value) {
    return value && (value.constructor === Object || value.constructor === undefined);
  }

  var src_Math__imul =
    typeof Math.imul === 'function' && Math.imul(0xffffffff, 2) === -2 ?
    Math.imul :
    function imul(a, b) {
      a = a | 0; // int
      b = b | 0; // int
      var c = a & 0xffff;
      var d = b & 0xffff;
      // Shift by 0 fixes the sign on the high part.
      return (c * d) + ((((a >>> 16) * d + c * (b >>> 16)) << 16) >>> 0) | 0; // int
    };

  // v8 has an optimization for storing 31-bit signed numbers.
  // Values which have either 00 or 11 as the high order bits qualify.
  // This function drops the highest order bit in a signed number, maintaining
  // the sign bit.
  function smi(i32) {
    return ((i32 >>> 1) & 0x40000000) | (i32 & 0xBFFFFFFF);
  }

  function hash(o) {
    if (o === false || o === null || o === undefined) {
      return 0;
    }
    if (typeof o.valueOf === 'function') {
      o = o.valueOf();
      if (o === false || o === null || o === undefined) {
        return 0;
      }
    }
    if (o === true) {
      return 1;
    }
    var type = typeof o;
    if (type === 'number') {
      var h = o | 0;
      if (h !== o) {
        h ^= o * 0xFFFFFFFF;
      }
      while (o > 0xFFFFFFFF) {
        o /= 0xFFFFFFFF;
        h ^= o;
      }
      return smi(h);
    }
    if (type === 'string') {
      return o.length > STRING_HASH_CACHE_MIN_STRLEN ? cachedHashString(o) : hashString(o);
    }
    if (typeof o.hashCode === 'function') {
      return o.hashCode();
    }
    return hashJSObj(o);
  }

  function cachedHashString(string) {
    var hash = stringHashCache[string];
    if (hash === undefined) {
      hash = hashString(string);
      if (STRING_HASH_CACHE_SIZE === STRING_HASH_CACHE_MAX_SIZE) {
        STRING_HASH_CACHE_SIZE = 0;
        stringHashCache = {};
      }
      STRING_HASH_CACHE_SIZE++;
      stringHashCache[string] = hash;
    }
    return hash;
  }

  // http://jsperf.com/hashing-strings
  function hashString(string) {
    // This is the hash from JVM
    // The hash code for a string is computed as
    // s[0] * 31 ^ (n - 1) + s[1] * 31 ^ (n - 2) + ... + s[n - 1],
    // where s[i] is the ith character of the string and n is the length of
    // the string. We "mod" the result to make it between 0 (inclusive) and 2^31
    // (exclusive) by dropping high bits.
    var hash = 0;
    for (var ii = 0; ii < string.length; ii++) {
      hash = 31 * hash + string.charCodeAt(ii) | 0;
    }
    return smi(hash);
  }

  function hashJSObj(obj) {
    var hash;
    if (usingWeakMap) {
      hash = weakMap.get(obj);
      if (hash !== undefined) {
        return hash;
      }
    }

    hash = obj[UID_HASH_KEY];
    if (hash !== undefined) {
      return hash;
    }

    if (!canDefineProperty) {
      hash = obj.propertyIsEnumerable && obj.propertyIsEnumerable[UID_HASH_KEY];
      if (hash !== undefined) {
        return hash;
      }

      hash = getIENodeHash(obj);
      if (hash !== undefined) {
        return hash;
      }
    }

    hash = ++objHashUID;
    if (objHashUID & 0x40000000) {
      objHashUID = 0;
    }

    if (usingWeakMap) {
      weakMap.set(obj, hash);
    } else if (isExtensible !== undefined && isExtensible(obj) === false) {
      throw new Error('Non-extensible objects are not allowed as keys.');
    } else if (canDefineProperty) {
      Object.defineProperty(obj, UID_HASH_KEY, {
        'enumerable': false,
        'configurable': false,
        'writable': false,
        'value': hash
      });
    } else if (obj.propertyIsEnumerable !== undefined &&
               obj.propertyIsEnumerable === obj.constructor.prototype.propertyIsEnumerable) {
      // Since we can't define a non-enumerable property on the object
      // we'll hijack one of the less-used non-enumerable properties to
      // save our hash on it. Since this is a function it will not show up in
      // `JSON.stringify` which is what we want.
      obj.propertyIsEnumerable = function() {
        return this.constructor.prototype.propertyIsEnumerable.apply(this, arguments);
      };
      obj.propertyIsEnumerable[UID_HASH_KEY] = hash;
    } else if (obj.nodeType !== undefined) {
      // At this point we couldn't get the IE `uniqueID` to use as a hash
      // and we couldn't use a non-enumerable property to exploit the
      // dontEnum bug so we simply add the `UID_HASH_KEY` on the node
      // itself.
      obj[UID_HASH_KEY] = hash;
    } else {
      throw new Error('Unable to set a non-enumerable property on object.');
    }

    return hash;
  }

  // Get references to ES5 object methods.
  var isExtensible = Object.isExtensible;

  // True if Object.defineProperty works as expected. IE8 fails this test.
  var canDefineProperty = (function() {
    try {
      Object.defineProperty({}, '@', {});
      return true;
    } catch (e) {
      return false;
    }
  }());

  // IE has a `uniqueID` property on DOM nodes. We can construct the hash from it
  // and avoid memory leaks from the IE cloneNode bug.
  function getIENodeHash(node) {
    if (node && node.nodeType > 0) {
      switch (node.nodeType) {
        case 1: // Element
          return node.uniqueID;
        case 9: // Document
          return node.documentElement && node.documentElement.uniqueID;
      }
    }
  }

  // If possible, use a WeakMap.
  var usingWeakMap = typeof WeakMap === 'function';
  var weakMap;
  if (usingWeakMap) {
    weakMap = new WeakMap();
  }

  var objHashUID = 0;

  var UID_HASH_KEY = '__immutablehash__';
  if (typeof Symbol === 'function') {
    UID_HASH_KEY = Symbol(UID_HASH_KEY);
  }

  var STRING_HASH_CACHE_MIN_STRLEN = 16;
  var STRING_HASH_CACHE_MAX_SIZE = 255;
  var STRING_HASH_CACHE_SIZE = 0;
  var stringHashCache = {};

  function invariant(condition, error) {
    if (!condition) throw new Error(error);
  }

  function assertNotInfinite(size) {
    invariant(
      size !== Infinity,
      'Cannot perform this action with an infinite size.'
    );
  }

  createClass(ToKeyedSequence, KeyedSeq);
    function ToKeyedSequence(indexed, useKeys) {
      this._iter = indexed;
      this._useKeys = useKeys;
      this.size = indexed.size;
    }

    ToKeyedSequence.prototype.get = function(key, notSetValue) {
      return this._iter.get(key, notSetValue);
    };

    ToKeyedSequence.prototype.has = function(key) {
      return this._iter.has(key);
    };

    ToKeyedSequence.prototype.valueSeq = function() {
      return this._iter.valueSeq();
    };

    ToKeyedSequence.prototype.reverse = function() {var this$0 = this;
      var reversedSequence = reverseFactory(this, true);
      if (!this._useKeys) {
        reversedSequence.valueSeq = function()  {return this$0._iter.toSeq().reverse()};
      }
      return reversedSequence;
    };

    ToKeyedSequence.prototype.map = function(mapper, context) {var this$0 = this;
      var mappedSequence = mapFactory(this, mapper, context);
      if (!this._useKeys) {
        mappedSequence.valueSeq = function()  {return this$0._iter.toSeq().map(mapper, context)};
      }
      return mappedSequence;
    };

    ToKeyedSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      var ii;
      return this._iter.__iterate(
        this._useKeys ?
          function(v, k)  {return fn(v, k, this$0)} :
          ((ii = reverse ? resolveSize(this) : 0),
            function(v ) {return fn(v, reverse ? --ii : ii++, this$0)}),
        reverse
      );
    };

    ToKeyedSequence.prototype.__iterator = function(type, reverse) {
      if (this._useKeys) {
        return this._iter.__iterator(type, reverse);
      }
      var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
      var ii = reverse ? resolveSize(this) : 0;
      return new src_Iterator__Iterator(function()  {
        var step = iterator.next();
        return step.done ? step :
          iteratorValue(type, reverse ? --ii : ii++, step.value, step);
      });
    };

  ToKeyedSequence.prototype[IS_ORDERED_SENTINEL] = true;


  createClass(ToIndexedSequence, IndexedSeq);
    function ToIndexedSequence(iter) {
      this._iter = iter;
      this.size = iter.size;
    }

    ToIndexedSequence.prototype.includes = function(value) {
      return this._iter.includes(value);
    };

    ToIndexedSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      var iterations = 0;
      return this._iter.__iterate(function(v ) {return fn(v, iterations++, this$0)}, reverse);
    };

    ToIndexedSequence.prototype.__iterator = function(type, reverse) {
      var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
      var iterations = 0;
      return new src_Iterator__Iterator(function()  {
        var step = iterator.next();
        return step.done ? step :
          iteratorValue(type, iterations++, step.value, step)
      });
    };



  createClass(ToSetSequence, SetSeq);
    function ToSetSequence(iter) {
      this._iter = iter;
      this.size = iter.size;
    }

    ToSetSequence.prototype.has = function(key) {
      return this._iter.includes(key);
    };

    ToSetSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      return this._iter.__iterate(function(v ) {return fn(v, v, this$0)}, reverse);
    };

    ToSetSequence.prototype.__iterator = function(type, reverse) {
      var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
      return new src_Iterator__Iterator(function()  {
        var step = iterator.next();
        return step.done ? step :
          iteratorValue(type, step.value, step.value, step);
      });
    };



  createClass(FromEntriesSequence, KeyedSeq);
    function FromEntriesSequence(entries) {
      this._iter = entries;
      this.size = entries.size;
    }

    FromEntriesSequence.prototype.entrySeq = function() {
      return this._iter.toSeq();
    };

    FromEntriesSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      return this._iter.__iterate(function(entry ) {
        // Check if entry exists first so array access doesn't throw for holes
        // in the parent iteration.
        if (entry) {
          validateEntry(entry);
          var indexedIterable = isIterable(entry);
          return fn(
            indexedIterable ? entry.get(1) : entry[1],
            indexedIterable ? entry.get(0) : entry[0],
            this$0
          );
        }
      }, reverse);
    };

    FromEntriesSequence.prototype.__iterator = function(type, reverse) {
      var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
      return new src_Iterator__Iterator(function()  {
        while (true) {
          var step = iterator.next();
          if (step.done) {
            return step;
          }
          var entry = step.value;
          // Check if entry exists first so array access doesn't throw for holes
          // in the parent iteration.
          if (entry) {
            validateEntry(entry);
            var indexedIterable = isIterable(entry);
            return iteratorValue(
              type,
              indexedIterable ? entry.get(0) : entry[0],
              indexedIterable ? entry.get(1) : entry[1],
              step
            );
          }
        }
      });
    };


  ToIndexedSequence.prototype.cacheResult =
  ToKeyedSequence.prototype.cacheResult =
  ToSetSequence.prototype.cacheResult =
  FromEntriesSequence.prototype.cacheResult =
    cacheResultThrough;


  function flipFactory(iterable) {
    var flipSequence = makeSequence(iterable);
    flipSequence._iter = iterable;
    flipSequence.size = iterable.size;
    flipSequence.flip = function()  {return iterable};
    flipSequence.reverse = function () {
      var reversedSequence = iterable.reverse.apply(this); // super.reverse()
      reversedSequence.flip = function()  {return iterable.reverse()};
      return reversedSequence;
    };
    flipSequence.has = function(key ) {return iterable.includes(key)};
    flipSequence.includes = function(key ) {return iterable.has(key)};
    flipSequence.cacheResult = cacheResultThrough;
    flipSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
      return iterable.__iterate(function(v, k)  {return fn(k, v, this$0) !== false}, reverse);
    }
    flipSequence.__iteratorUncached = function(type, reverse) {
      if (type === ITERATE_ENTRIES) {
        var iterator = iterable.__iterator(type, reverse);
        return new src_Iterator__Iterator(function()  {
          var step = iterator.next();
          if (!step.done) {
            var k = step.value[0];
            step.value[0] = step.value[1];
            step.value[1] = k;
          }
          return step;
        });
      }
      return iterable.__iterator(
        type === ITERATE_VALUES ? ITERATE_KEYS : ITERATE_VALUES,
        reverse
      );
    }
    return flipSequence;
  }


  function mapFactory(iterable, mapper, context) {
    var mappedSequence = makeSequence(iterable);
    mappedSequence.size = iterable.size;
    mappedSequence.has = function(key ) {return iterable.has(key)};
    mappedSequence.get = function(key, notSetValue)  {
      var v = iterable.get(key, NOT_SET);
      return v === NOT_SET ?
        notSetValue :
        mapper.call(context, v, key, iterable);
    };
    mappedSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
      return iterable.__iterate(
        function(v, k, c)  {return fn(mapper.call(context, v, k, c), k, this$0) !== false},
        reverse
      );
    }
    mappedSequence.__iteratorUncached = function (type, reverse) {
      var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
      return new src_Iterator__Iterator(function()  {
        var step = iterator.next();
        if (step.done) {
          return step;
        }
        var entry = step.value;
        var key = entry[0];
        return iteratorValue(
          type,
          key,
          mapper.call(context, entry[1], key, iterable),
          step
        );
      });
    }
    return mappedSequence;
  }


  function reverseFactory(iterable, useKeys) {
    var reversedSequence = makeSequence(iterable);
    reversedSequence._iter = iterable;
    reversedSequence.size = iterable.size;
    reversedSequence.reverse = function()  {return iterable};
    if (iterable.flip) {
      reversedSequence.flip = function () {
        var flipSequence = flipFactory(iterable);
        flipSequence.reverse = function()  {return iterable.flip()};
        return flipSequence;
      };
    }
    reversedSequence.get = function(key, notSetValue) 
      {return iterable.get(useKeys ? key : -1 - key, notSetValue)};
    reversedSequence.has = function(key )
      {return iterable.has(useKeys ? key : -1 - key)};
    reversedSequence.includes = function(value ) {return iterable.includes(value)};
    reversedSequence.cacheResult = cacheResultThrough;
    reversedSequence.__iterate = function (fn, reverse) {var this$0 = this;
      return iterable.__iterate(function(v, k)  {return fn(v, k, this$0)}, !reverse);
    };
    reversedSequence.__iterator =
      function(type, reverse)  {return iterable.__iterator(type, !reverse)};
    return reversedSequence;
  }


  function filterFactory(iterable, predicate, context, useKeys) {
    var filterSequence = makeSequence(iterable);
    if (useKeys) {
      filterSequence.has = function(key ) {
        var v = iterable.get(key, NOT_SET);
        return v !== NOT_SET && !!predicate.call(context, v, key, iterable);
      };
      filterSequence.get = function(key, notSetValue)  {
        var v = iterable.get(key, NOT_SET);
        return v !== NOT_SET && predicate.call(context, v, key, iterable) ?
          v : notSetValue;
      };
    }
    filterSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
      var iterations = 0;
      iterable.__iterate(function(v, k, c)  {
        if (predicate.call(context, v, k, c)) {
          iterations++;
          return fn(v, useKeys ? k : iterations - 1, this$0);
        }
      }, reverse);
      return iterations;
    };
    filterSequence.__iteratorUncached = function (type, reverse) {
      var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
      var iterations = 0;
      return new src_Iterator__Iterator(function()  {
        while (true) {
          var step = iterator.next();
          if (step.done) {
            return step;
          }
          var entry = step.value;
          var key = entry[0];
          var value = entry[1];
          if (predicate.call(context, value, key, iterable)) {
            return iteratorValue(type, useKeys ? key : iterations++, value, step);
          }
        }
      });
    }
    return filterSequence;
  }


  function countByFactory(iterable, grouper, context) {
    var groups = src_Map__Map().asMutable();
    iterable.__iterate(function(v, k)  {
      groups.update(
        grouper.call(context, v, k, iterable),
        0,
        function(a ) {return a + 1}
      );
    });
    return groups.asImmutable();
  }


  function groupByFactory(iterable, grouper, context) {
    var isKeyedIter = isKeyed(iterable);
    var groups = (isOrdered(iterable) ? OrderedMap() : src_Map__Map()).asMutable();
    iterable.__iterate(function(v, k)  {
      groups.update(
        grouper.call(context, v, k, iterable),
        function(a ) {return (a = a || [], a.push(isKeyedIter ? [k, v] : v), a)}
      );
    });
    var coerce = iterableClass(iterable);
    return groups.map(function(arr ) {return reify(iterable, coerce(arr))});
  }


  function sliceFactory(iterable, begin, end, useKeys) {
    var originalSize = iterable.size;

    if (wholeSlice(begin, end, originalSize)) {
      return iterable;
    }

    var resolvedBegin = resolveBegin(begin, originalSize);
    var resolvedEnd = resolveEnd(end, originalSize);

    // begin or end will be NaN if they were provided as negative numbers and
    // this iterable's size is unknown. In that case, cache first so there is
    // a known size.
    if (resolvedBegin !== resolvedBegin || resolvedEnd !== resolvedEnd) {
      return sliceFactory(iterable.toSeq().cacheResult(), begin, end, useKeys);
    }

    var sliceSize = resolvedEnd - resolvedBegin;
    if (sliceSize < 0) {
      sliceSize = 0;
    }

    var sliceSeq = makeSequence(iterable);

    sliceSeq.size = sliceSize === 0 ? sliceSize : iterable.size && sliceSize || undefined;

    if (!useKeys && isSeq(iterable) && sliceSize >= 0) {
      sliceSeq.get = function (index, notSetValue) {
        index = wrapIndex(this, index);
        return index >= 0 && index < sliceSize ?
          iterable.get(index + resolvedBegin, notSetValue) :
          notSetValue;
      }
    }

    sliceSeq.__iterateUncached = function(fn, reverse) {var this$0 = this;
      if (sliceSize === 0) {
        return 0;
      }
      if (reverse) {
        return this.cacheResult().__iterate(fn, reverse);
      }
      var skipped = 0;
      var isSkipping = true;
      var iterations = 0;
      iterable.__iterate(function(v, k)  {
        if (!(isSkipping && (isSkipping = skipped++ < resolvedBegin))) {
          iterations++;
          return fn(v, useKeys ? k : iterations - 1, this$0) !== false &&
                 iterations !== sliceSize;
        }
      });
      return iterations;
    };

    sliceSeq.__iteratorUncached = function(type, reverse) {
      if (sliceSize && reverse) {
        return this.cacheResult().__iterator(type, reverse);
      }
      // Don't bother instantiating parent iterator if taking 0.
      var iterator = sliceSize && iterable.__iterator(type, reverse);
      var skipped = 0;
      var iterations = 0;
      return new src_Iterator__Iterator(function()  {
        while (skipped++ < resolvedBegin) {
          iterator.next();
        }
        if (++iterations > sliceSize) {
          return iteratorDone();
        }
        var step = iterator.next();
        if (useKeys || type === ITERATE_VALUES) {
          return step;
        } else if (type === ITERATE_KEYS) {
          return iteratorValue(type, iterations - 1, undefined, step);
        } else {
          return iteratorValue(type, iterations - 1, step.value[1], step);
        }
      });
    }

    return sliceSeq;
  }


  function takeWhileFactory(iterable, predicate, context) {
    var takeSequence = makeSequence(iterable);
    takeSequence.__iterateUncached = function(fn, reverse) {var this$0 = this;
      if (reverse) {
        return this.cacheResult().__iterate(fn, reverse);
      }
      var iterations = 0;
      iterable.__iterate(function(v, k, c) 
        {return predicate.call(context, v, k, c) && ++iterations && fn(v, k, this$0)}
      );
      return iterations;
    };
    takeSequence.__iteratorUncached = function(type, reverse) {var this$0 = this;
      if (reverse) {
        return this.cacheResult().__iterator(type, reverse);
      }
      var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
      var iterating = true;
      return new src_Iterator__Iterator(function()  {
        if (!iterating) {
          return iteratorDone();
        }
        var step = iterator.next();
        if (step.done) {
          return step;
        }
        var entry = step.value;
        var k = entry[0];
        var v = entry[1];
        if (!predicate.call(context, v, k, this$0)) {
          iterating = false;
          return iteratorDone();
        }
        return type === ITERATE_ENTRIES ? step :
          iteratorValue(type, k, v, step);
      });
    };
    return takeSequence;
  }


  function skipWhileFactory(iterable, predicate, context, useKeys) {
    var skipSequence = makeSequence(iterable);
    skipSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
      if (reverse) {
        return this.cacheResult().__iterate(fn, reverse);
      }
      var isSkipping = true;
      var iterations = 0;
      iterable.__iterate(function(v, k, c)  {
        if (!(isSkipping && (isSkipping = predicate.call(context, v, k, c)))) {
          iterations++;
          return fn(v, useKeys ? k : iterations - 1, this$0);
        }
      });
      return iterations;
    };
    skipSequence.__iteratorUncached = function(type, reverse) {var this$0 = this;
      if (reverse) {
        return this.cacheResult().__iterator(type, reverse);
      }
      var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
      var skipping = true;
      var iterations = 0;
      return new src_Iterator__Iterator(function()  {
        var step, k, v;
        do {
          step = iterator.next();
          if (step.done) {
            if (useKeys || type === ITERATE_VALUES) {
              return step;
            } else if (type === ITERATE_KEYS) {
              return iteratorValue(type, iterations++, undefined, step);
            } else {
              return iteratorValue(type, iterations++, step.value[1], step);
            }
          }
          var entry = step.value;
          k = entry[0];
          v = entry[1];
          skipping && (skipping = predicate.call(context, v, k, this$0));
        } while (skipping);
        return type === ITERATE_ENTRIES ? step :
          iteratorValue(type, k, v, step);
      });
    };
    return skipSequence;
  }


  function concatFactory(iterable, values) {
    var isKeyedIterable = isKeyed(iterable);
    var iters = [iterable].concat(values).map(function(v ) {
      if (!isIterable(v)) {
        v = isKeyedIterable ?
          keyedSeqFromValue(v) :
          indexedSeqFromValue(Array.isArray(v) ? v : [v]);
      } else if (isKeyedIterable) {
        v = KeyedIterable(v);
      }
      return v;
    }).filter(function(v ) {return v.size !== 0});

    if (iters.length === 0) {
      return iterable;
    }

    if (iters.length === 1) {
      var singleton = iters[0];
      if (singleton === iterable ||
          isKeyedIterable && isKeyed(singleton) ||
          isIndexed(iterable) && isIndexed(singleton)) {
        return singleton;
      }
    }

    var concatSeq = new ArraySeq(iters);
    if (isKeyedIterable) {
      concatSeq = concatSeq.toKeyedSeq();
    } else if (!isIndexed(iterable)) {
      concatSeq = concatSeq.toSetSeq();
    }
    concatSeq = concatSeq.flatten(true);
    concatSeq.size = iters.reduce(
      function(sum, seq)  {
        if (sum !== undefined) {
          var size = seq.size;
          if (size !== undefined) {
            return sum + size;
          }
        }
      },
      0
    );
    return concatSeq;
  }


  function flattenFactory(iterable, depth, useKeys) {
    var flatSequence = makeSequence(iterable);
    flatSequence.__iterateUncached = function(fn, reverse) {
      var iterations = 0;
      var stopped = false;
      function flatDeep(iter, currentDepth) {var this$0 = this;
        iter.__iterate(function(v, k)  {
          if ((!depth || currentDepth < depth) && isIterable(v)) {
            flatDeep(v, currentDepth + 1);
          } else if (fn(v, useKeys ? k : iterations++, this$0) === false) {
            stopped = true;
          }
          return !stopped;
        }, reverse);
      }
      flatDeep(iterable, 0);
      return iterations;
    }
    flatSequence.__iteratorUncached = function(type, reverse) {
      var iterator = iterable.__iterator(type, reverse);
      var stack = [];
      var iterations = 0;
      return new src_Iterator__Iterator(function()  {
        while (iterator) {
          var step = iterator.next();
          if (step.done !== false) {
            iterator = stack.pop();
            continue;
          }
          var v = step.value;
          if (type === ITERATE_ENTRIES) {
            v = v[1];
          }
          if ((!depth || stack.length < depth) && isIterable(v)) {
            stack.push(iterator);
            iterator = v.__iterator(type, reverse);
          } else {
            return useKeys ? step : iteratorValue(type, iterations++, v, step);
          }
        }
        return iteratorDone();
      });
    }
    return flatSequence;
  }


  function flatMapFactory(iterable, mapper, context) {
    var coerce = iterableClass(iterable);
    return iterable.toSeq().map(
      function(v, k)  {return coerce(mapper.call(context, v, k, iterable))}
    ).flatten(true);
  }


  function interposeFactory(iterable, separator) {
    var interposedSequence = makeSequence(iterable);
    interposedSequence.size = iterable.size && iterable.size * 2 -1;
    interposedSequence.__iterateUncached = function(fn, reverse) {var this$0 = this;
      var iterations = 0;
      iterable.__iterate(function(v, k) 
        {return (!iterations || fn(separator, iterations++, this$0) !== false) &&
        fn(v, iterations++, this$0) !== false},
        reverse
      );
      return iterations;
    };
    interposedSequence.__iteratorUncached = function(type, reverse) {
      var iterator = iterable.__iterator(ITERATE_VALUES, reverse);
      var iterations = 0;
      var step;
      return new src_Iterator__Iterator(function()  {
        if (!step || iterations % 2) {
          step = iterator.next();
          if (step.done) {
            return step;
          }
        }
        return iterations % 2 ?
          iteratorValue(type, iterations++, separator) :
          iteratorValue(type, iterations++, step.value, step);
      });
    };
    return interposedSequence;
  }


  function sortFactory(iterable, comparator, mapper) {
    if (!comparator) {
      comparator = defaultComparator;
    }
    var isKeyedIterable = isKeyed(iterable);
    var index = 0;
    var entries = iterable.toSeq().map(
      function(v, k)  {return [k, v, index++, mapper ? mapper(v, k, iterable) : v]}
    ).toArray();
    entries.sort(function(a, b)  {return comparator(a[3], b[3]) || a[2] - b[2]}).forEach(
      isKeyedIterable ?
      function(v, i)  { entries[i].length = 2; } :
      function(v, i)  { entries[i] = v[1]; }
    );
    return isKeyedIterable ? KeyedSeq(entries) :
      isIndexed(iterable) ? IndexedSeq(entries) :
      SetSeq(entries);
  }


  function maxFactory(iterable, comparator, mapper) {
    if (!comparator) {
      comparator = defaultComparator;
    }
    if (mapper) {
      var entry = iterable.toSeq()
        .map(function(v, k)  {return [v, mapper(v, k, iterable)]})
        .reduce(function(a, b)  {return maxCompare(comparator, a[1], b[1]) ? b : a});
      return entry && entry[0];
    } else {
      return iterable.reduce(function(a, b)  {return maxCompare(comparator, a, b) ? b : a});
    }
  }

  function maxCompare(comparator, a, b) {
    var comp = comparator(b, a);
    // b is considered the new max if the comparator declares them equal, but
    // they are not equal and b is in fact a nullish value.
    return (comp === 0 && b !== a && (b === undefined || b === null || b !== b)) || comp > 0;
  }


  function zipWithFactory(keyIter, zipper, iters) {
    var zipSequence = makeSequence(keyIter);
    zipSequence.size = new ArraySeq(iters).map(function(i ) {return i.size}).min();
    // Note: this a generic base implementation of __iterate in terms of
    // __iterator which may be more generically useful in the future.
    zipSequence.__iterate = function(fn, reverse) {
      /* generic:
      var iterator = this.__iterator(ITERATE_ENTRIES, reverse);
      var step;
      var iterations = 0;
      while (!(step = iterator.next()).done) {
        iterations++;
        if (fn(step.value[1], step.value[0], this) === false) {
          break;
        }
      }
      return iterations;
      */
      // indexed:
      var iterator = this.__iterator(ITERATE_VALUES, reverse);
      var step;
      var iterations = 0;
      while (!(step = iterator.next()).done) {
        if (fn(step.value, iterations++, this) === false) {
          break;
        }
      }
      return iterations;
    };
    zipSequence.__iteratorUncached = function(type, reverse) {
      var iterators = iters.map(function(i )
        {return (i = Iterable(i), getIterator(reverse ? i.reverse() : i))}
      );
      var iterations = 0;
      var isDone = false;
      return new src_Iterator__Iterator(function()  {
        var steps;
        if (!isDone) {
          steps = iterators.map(function(i ) {return i.next()});
          isDone = steps.some(function(s ) {return s.done});
        }
        if (isDone) {
          return iteratorDone();
        }
        return iteratorValue(
          type,
          iterations++,
          zipper.apply(null, steps.map(function(s ) {return s.value}))
        );
      });
    };
    return zipSequence
  }


  // #pragma Helper Functions

  function reify(iter, seq) {
    return isSeq(iter) ? seq : iter.constructor(seq);
  }

  function validateEntry(entry) {
    if (entry !== Object(entry)) {
      throw new TypeError('Expected [K, V] tuple: ' + entry);
    }
  }

  function resolveSize(iter) {
    assertNotInfinite(iter.size);
    return ensureSize(iter);
  }

  function iterableClass(iterable) {
    return isKeyed(iterable) ? KeyedIterable :
      isIndexed(iterable) ? IndexedIterable :
      SetIterable;
  }

  function makeSequence(iterable) {
    return Object.create(
      (
        isKeyed(iterable) ? KeyedSeq :
        isIndexed(iterable) ? IndexedSeq :
        SetSeq
      ).prototype
    );
  }

  function cacheResultThrough() {
    if (this._iter.cacheResult) {
      this._iter.cacheResult();
      this.size = this._iter.size;
      return this;
    } else {
      return Seq.prototype.cacheResult.call(this);
    }
  }

  function defaultComparator(a, b) {
    return a > b ? 1 : a < b ? -1 : 0;
  }

  function forceIterator(keyPath) {
    var iter = getIterator(keyPath);
    if (!iter) {
      // Array might not be iterable in this environment, so we need a fallback
      // to our wrapped type.
      if (!isArrayLike(keyPath)) {
        throw new TypeError('Expected iterable or array-like: ' + keyPath);
      }
      iter = getIterator(Iterable(keyPath));
    }
    return iter;
  }

  createClass(src_Map__Map, KeyedCollection);

    // @pragma Construction

    function src_Map__Map(value) {
      return value === null || value === undefined ? emptyMap() :
        isMap(value) ? value :
        emptyMap().withMutations(function(map ) {
          var iter = KeyedIterable(value);
          assertNotInfinite(iter.size);
          iter.forEach(function(v, k)  {return map.set(k, v)});
        });
    }

    src_Map__Map.prototype.toString = function() {
      return this.__toString('Map {', '}');
    };

    // @pragma Access

    src_Map__Map.prototype.get = function(k, notSetValue) {
      return this._root ?
        this._root.get(0, undefined, k, notSetValue) :
        notSetValue;
    };

    // @pragma Modification

    src_Map__Map.prototype.set = function(k, v) {
      return updateMap(this, k, v);
    };

    src_Map__Map.prototype.setIn = function(keyPath, v) {
      return this.updateIn(keyPath, NOT_SET, function()  {return v});
    };

    src_Map__Map.prototype.remove = function(k) {
      return updateMap(this, k, NOT_SET);
    };

    src_Map__Map.prototype.deleteIn = function(keyPath) {
      return this.updateIn(keyPath, function()  {return NOT_SET});
    };

    src_Map__Map.prototype.update = function(k, notSetValue, updater) {
      return arguments.length === 1 ?
        k(this) :
        this.updateIn([k], notSetValue, updater);
    };

    src_Map__Map.prototype.updateIn = function(keyPath, notSetValue, updater) {
      if (!updater) {
        updater = notSetValue;
        notSetValue = undefined;
      }
      var updatedValue = updateInDeepMap(
        this,
        forceIterator(keyPath),
        notSetValue,
        updater
      );
      return updatedValue === NOT_SET ? undefined : updatedValue;
    };

    src_Map__Map.prototype.clear = function() {
      if (this.size === 0) {
        return this;
      }
      if (this.__ownerID) {
        this.size = 0;
        this._root = null;
        this.__hash = undefined;
        this.__altered = true;
        return this;
      }
      return emptyMap();
    };

    // @pragma Composition

    src_Map__Map.prototype.merge = function(/*...iters*/) {
      return mergeIntoMapWith(this, undefined, arguments);
    };

    src_Map__Map.prototype.mergeWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
      return mergeIntoMapWith(this, merger, iters);
    };

    src_Map__Map.prototype.mergeIn = function(keyPath) {var iters = SLICE$0.call(arguments, 1);
      return this.updateIn(keyPath, emptyMap(), function(m ) {return m.merge.apply(m, iters)});
    };

    src_Map__Map.prototype.mergeDeep = function(/*...iters*/) {
      return mergeIntoMapWith(this, deepMerger(undefined), arguments);
    };

    src_Map__Map.prototype.mergeDeepWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
      return mergeIntoMapWith(this, deepMerger(merger), iters);
    };

    src_Map__Map.prototype.mergeDeepIn = function(keyPath) {var iters = SLICE$0.call(arguments, 1);
      return this.updateIn(keyPath, emptyMap(), function(m ) {return m.mergeDeep.apply(m, iters)});
    };

    src_Map__Map.prototype.sort = function(comparator) {
      // Late binding
      return OrderedMap(sortFactory(this, comparator));
    };

    src_Map__Map.prototype.sortBy = function(mapper, comparator) {
      // Late binding
      return OrderedMap(sortFactory(this, comparator, mapper));
    };

    // @pragma Mutability

    src_Map__Map.prototype.withMutations = function(fn) {
      var mutable = this.asMutable();
      fn(mutable);
      return mutable.wasAltered() ? mutable.__ensureOwner(this.__ownerID) : this;
    };

    src_Map__Map.prototype.asMutable = function() {
      return this.__ownerID ? this : this.__ensureOwner(new OwnerID());
    };

    src_Map__Map.prototype.asImmutable = function() {
      return this.__ensureOwner();
    };

    src_Map__Map.prototype.wasAltered = function() {
      return this.__altered;
    };

    src_Map__Map.prototype.__iterator = function(type, reverse) {
      return new MapIterator(this, type, reverse);
    };

    src_Map__Map.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      var iterations = 0;
      this._root && this._root.iterate(function(entry ) {
        iterations++;
        return fn(entry[1], entry[0], this$0);
      }, reverse);
      return iterations;
    };

    src_Map__Map.prototype.__ensureOwner = function(ownerID) {
      if (ownerID === this.__ownerID) {
        return this;
      }
      if (!ownerID) {
        this.__ownerID = ownerID;
        this.__altered = false;
        return this;
      }
      return makeMap(this.size, this._root, ownerID, this.__hash);
    };


  function isMap(maybeMap) {
    return !!(maybeMap && maybeMap[IS_MAP_SENTINEL]);
  }

  src_Map__Map.isMap = isMap;

  var IS_MAP_SENTINEL = '@@__IMMUTABLE_MAP__@@';

  var MapPrototype = src_Map__Map.prototype;
  MapPrototype[IS_MAP_SENTINEL] = true;
  MapPrototype[DELETE] = MapPrototype.remove;
  MapPrototype.removeIn = MapPrototype.deleteIn;


  // #pragma Trie Nodes



    function ArrayMapNode(ownerID, entries) {
      this.ownerID = ownerID;
      this.entries = entries;
    }

    ArrayMapNode.prototype.get = function(shift, keyHash, key, notSetValue) {
      var entries = this.entries;
      for (var ii = 0, len = entries.length; ii < len; ii++) {
        if (is(key, entries[ii][0])) {
          return entries[ii][1];
        }
      }
      return notSetValue;
    };

    ArrayMapNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
      var removed = value === NOT_SET;

      var entries = this.entries;
      var idx = 0;
      for (var len = entries.length; idx < len; idx++) {
        if (is(key, entries[idx][0])) {
          break;
        }
      }
      var exists = idx < len;

      if (exists ? entries[idx][1] === value : removed) {
        return this;
      }

      SetRef(didAlter);
      (removed || !exists) && SetRef(didChangeSize);

      if (removed && entries.length === 1) {
        return; // undefined
      }

      if (!exists && !removed && entries.length >= MAX_ARRAY_MAP_SIZE) {
        return createNodes(ownerID, entries, key, value);
      }

      var isEditable = ownerID && ownerID === this.ownerID;
      var newEntries = isEditable ? entries : arrCopy(entries);

      if (exists) {
        if (removed) {
          idx === len - 1 ? newEntries.pop() : (newEntries[idx] = newEntries.pop());
        } else {
          newEntries[idx] = [key, value];
        }
      } else {
        newEntries.push([key, value]);
      }

      if (isEditable) {
        this.entries = newEntries;
        return this;
      }

      return new ArrayMapNode(ownerID, newEntries);
    };




    function BitmapIndexedNode(ownerID, bitmap, nodes) {
      this.ownerID = ownerID;
      this.bitmap = bitmap;
      this.nodes = nodes;
    }

    BitmapIndexedNode.prototype.get = function(shift, keyHash, key, notSetValue) {
      if (keyHash === undefined) {
        keyHash = hash(key);
      }
      var bit = (1 << ((shift === 0 ? keyHash : keyHash >>> shift) & MASK));
      var bitmap = this.bitmap;
      return (bitmap & bit) === 0 ? notSetValue :
        this.nodes[popCount(bitmap & (bit - 1))].get(shift + SHIFT, keyHash, key, notSetValue);
    };

    BitmapIndexedNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
      if (keyHash === undefined) {
        keyHash = hash(key);
      }
      var keyHashFrag = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
      var bit = 1 << keyHashFrag;
      var bitmap = this.bitmap;
      var exists = (bitmap & bit) !== 0;

      if (!exists && value === NOT_SET) {
        return this;
      }

      var idx = popCount(bitmap & (bit - 1));
      var nodes = this.nodes;
      var node = exists ? nodes[idx] : undefined;
      var newNode = updateNode(node, ownerID, shift + SHIFT, keyHash, key, value, didChangeSize, didAlter);

      if (newNode === node) {
        return this;
      }

      if (!exists && newNode && nodes.length >= MAX_BITMAP_INDEXED_SIZE) {
        return expandNodes(ownerID, nodes, bitmap, keyHashFrag, newNode);
      }

      if (exists && !newNode && nodes.length === 2 && isLeafNode(nodes[idx ^ 1])) {
        return nodes[idx ^ 1];
      }

      if (exists && newNode && nodes.length === 1 && isLeafNode(newNode)) {
        return newNode;
      }

      var isEditable = ownerID && ownerID === this.ownerID;
      var newBitmap = exists ? newNode ? bitmap : bitmap ^ bit : bitmap | bit;
      var newNodes = exists ? newNode ?
        setIn(nodes, idx, newNode, isEditable) :
        spliceOut(nodes, idx, isEditable) :
        spliceIn(nodes, idx, newNode, isEditable);

      if (isEditable) {
        this.bitmap = newBitmap;
        this.nodes = newNodes;
        return this;
      }

      return new BitmapIndexedNode(ownerID, newBitmap, newNodes);
    };




    function HashArrayMapNode(ownerID, count, nodes) {
      this.ownerID = ownerID;
      this.count = count;
      this.nodes = nodes;
    }

    HashArrayMapNode.prototype.get = function(shift, keyHash, key, notSetValue) {
      if (keyHash === undefined) {
        keyHash = hash(key);
      }
      var idx = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
      var node = this.nodes[idx];
      return node ? node.get(shift + SHIFT, keyHash, key, notSetValue) : notSetValue;
    };

    HashArrayMapNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
      if (keyHash === undefined) {
        keyHash = hash(key);
      }
      var idx = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
      var removed = value === NOT_SET;
      var nodes = this.nodes;
      var node = nodes[idx];

      if (removed && !node) {
        return this;
      }

      var newNode = updateNode(node, ownerID, shift + SHIFT, keyHash, key, value, didChangeSize, didAlter);
      if (newNode === node) {
        return this;
      }

      var newCount = this.count;
      if (!node) {
        newCount++;
      } else if (!newNode) {
        newCount--;
        if (newCount < MIN_HASH_ARRAY_MAP_SIZE) {
          return packNodes(ownerID, nodes, newCount, idx);
        }
      }

      var isEditable = ownerID && ownerID === this.ownerID;
      var newNodes = setIn(nodes, idx, newNode, isEditable);

      if (isEditable) {
        this.count = newCount;
        this.nodes = newNodes;
        return this;
      }

      return new HashArrayMapNode(ownerID, newCount, newNodes);
    };




    function HashCollisionNode(ownerID, keyHash, entries) {
      this.ownerID = ownerID;
      this.keyHash = keyHash;
      this.entries = entries;
    }

    HashCollisionNode.prototype.get = function(shift, keyHash, key, notSetValue) {
      var entries = this.entries;
      for (var ii = 0, len = entries.length; ii < len; ii++) {
        if (is(key, entries[ii][0])) {
          return entries[ii][1];
        }
      }
      return notSetValue;
    };

    HashCollisionNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
      if (keyHash === undefined) {
        keyHash = hash(key);
      }

      var removed = value === NOT_SET;

      if (keyHash !== this.keyHash) {
        if (removed) {
          return this;
        }
        SetRef(didAlter);
        SetRef(didChangeSize);
        return mergeIntoNode(this, ownerID, shift, keyHash, [key, value]);
      }

      var entries = this.entries;
      var idx = 0;
      for (var len = entries.length; idx < len; idx++) {
        if (is(key, entries[idx][0])) {
          break;
        }
      }
      var exists = idx < len;

      if (exists ? entries[idx][1] === value : removed) {
        return this;
      }

      SetRef(didAlter);
      (removed || !exists) && SetRef(didChangeSize);

      if (removed && len === 2) {
        return new ValueNode(ownerID, this.keyHash, entries[idx ^ 1]);
      }

      var isEditable = ownerID && ownerID === this.ownerID;
      var newEntries = isEditable ? entries : arrCopy(entries);

      if (exists) {
        if (removed) {
          idx === len - 1 ? newEntries.pop() : (newEntries[idx] = newEntries.pop());
        } else {
          newEntries[idx] = [key, value];
        }
      } else {
        newEntries.push([key, value]);
      }

      if (isEditable) {
        this.entries = newEntries;
        return this;
      }

      return new HashCollisionNode(ownerID, this.keyHash, newEntries);
    };




    function ValueNode(ownerID, keyHash, entry) {
      this.ownerID = ownerID;
      this.keyHash = keyHash;
      this.entry = entry;
    }

    ValueNode.prototype.get = function(shift, keyHash, key, notSetValue) {
      return is(key, this.entry[0]) ? this.entry[1] : notSetValue;
    };

    ValueNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
      var removed = value === NOT_SET;
      var keyMatch = is(key, this.entry[0]);
      if (keyMatch ? value === this.entry[1] : removed) {
        return this;
      }

      SetRef(didAlter);

      if (removed) {
        SetRef(didChangeSize);
        return; // undefined
      }

      if (keyMatch) {
        if (ownerID && ownerID === this.ownerID) {
          this.entry[1] = value;
          return this;
        }
        return new ValueNode(ownerID, this.keyHash, [key, value]);
      }

      SetRef(didChangeSize);
      return mergeIntoNode(this, ownerID, shift, hash(key), [key, value]);
    };



  // #pragma Iterators

  ArrayMapNode.prototype.iterate =
  HashCollisionNode.prototype.iterate = function (fn, reverse) {
    var entries = this.entries;
    for (var ii = 0, maxIndex = entries.length - 1; ii <= maxIndex; ii++) {
      if (fn(entries[reverse ? maxIndex - ii : ii]) === false) {
        return false;
      }
    }
  }

  BitmapIndexedNode.prototype.iterate =
  HashArrayMapNode.prototype.iterate = function (fn, reverse) {
    var nodes = this.nodes;
    for (var ii = 0, maxIndex = nodes.length - 1; ii <= maxIndex; ii++) {
      var node = nodes[reverse ? maxIndex - ii : ii];
      if (node && node.iterate(fn, reverse) === false) {
        return false;
      }
    }
  }

  ValueNode.prototype.iterate = function (fn, reverse) {
    return fn(this.entry);
  }

  createClass(MapIterator, src_Iterator__Iterator);

    function MapIterator(map, type, reverse) {
      this._type = type;
      this._reverse = reverse;
      this._stack = map._root && mapIteratorFrame(map._root);
    }

    MapIterator.prototype.next = function() {
      var type = this._type;
      var stack = this._stack;
      while (stack) {
        var node = stack.node;
        var index = stack.index++;
        var maxIndex;
        if (node.entry) {
          if (index === 0) {
            return mapIteratorValue(type, node.entry);
          }
        } else if (node.entries) {
          maxIndex = node.entries.length - 1;
          if (index <= maxIndex) {
            return mapIteratorValue(type, node.entries[this._reverse ? maxIndex - index : index]);
          }
        } else {
          maxIndex = node.nodes.length - 1;
          if (index <= maxIndex) {
            var subNode = node.nodes[this._reverse ? maxIndex - index : index];
            if (subNode) {
              if (subNode.entry) {
                return mapIteratorValue(type, subNode.entry);
              }
              stack = this._stack = mapIteratorFrame(subNode, stack);
            }
            continue;
          }
        }
        stack = this._stack = this._stack.__prev;
      }
      return iteratorDone();
    };


  function mapIteratorValue(type, entry) {
    return iteratorValue(type, entry[0], entry[1]);
  }

  function mapIteratorFrame(node, prev) {
    return {
      node: node,
      index: 0,
      __prev: prev
    };
  }

  function makeMap(size, root, ownerID, hash) {
    var map = Object.create(MapPrototype);
    map.size = size;
    map._root = root;
    map.__ownerID = ownerID;
    map.__hash = hash;
    map.__altered = false;
    return map;
  }

  var EMPTY_MAP;
  function emptyMap() {
    return EMPTY_MAP || (EMPTY_MAP = makeMap(0));
  }

  function updateMap(map, k, v) {
    var newRoot;
    var newSize;
    if (!map._root) {
      if (v === NOT_SET) {
        return map;
      }
      newSize = 1;
      newRoot = new ArrayMapNode(map.__ownerID, [[k, v]]);
    } else {
      var didChangeSize = MakeRef(CHANGE_LENGTH);
      var didAlter = MakeRef(DID_ALTER);
      newRoot = updateNode(map._root, map.__ownerID, 0, undefined, k, v, didChangeSize, didAlter);
      if (!didAlter.value) {
        return map;
      }
      newSize = map.size + (didChangeSize.value ? v === NOT_SET ? -1 : 1 : 0);
    }
    if (map.__ownerID) {
      map.size = newSize;
      map._root = newRoot;
      map.__hash = undefined;
      map.__altered = true;
      return map;
    }
    return newRoot ? makeMap(newSize, newRoot) : emptyMap();
  }

  function updateNode(node, ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
    if (!node) {
      if (value === NOT_SET) {
        return node;
      }
      SetRef(didAlter);
      SetRef(didChangeSize);
      return new ValueNode(ownerID, keyHash, [key, value]);
    }
    return node.update(ownerID, shift, keyHash, key, value, didChangeSize, didAlter);
  }

  function isLeafNode(node) {
    return node.constructor === ValueNode || node.constructor === HashCollisionNode;
  }

  function mergeIntoNode(node, ownerID, shift, keyHash, entry) {
    if (node.keyHash === keyHash) {
      return new HashCollisionNode(ownerID, keyHash, [node.entry, entry]);
    }

    var idx1 = (shift === 0 ? node.keyHash : node.keyHash >>> shift) & MASK;
    var idx2 = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;

    var newNode;
    var nodes = idx1 === idx2 ?
      [mergeIntoNode(node, ownerID, shift + SHIFT, keyHash, entry)] :
      ((newNode = new ValueNode(ownerID, keyHash, entry)), idx1 < idx2 ? [node, newNode] : [newNode, node]);

    return new BitmapIndexedNode(ownerID, (1 << idx1) | (1 << idx2), nodes);
  }

  function createNodes(ownerID, entries, key, value) {
    if (!ownerID) {
      ownerID = new OwnerID();
    }
    var node = new ValueNode(ownerID, hash(key), [key, value]);
    for (var ii = 0; ii < entries.length; ii++) {
      var entry = entries[ii];
      node = node.update(ownerID, 0, undefined, entry[0], entry[1]);
    }
    return node;
  }

  function packNodes(ownerID, nodes, count, excluding) {
    var bitmap = 0;
    var packedII = 0;
    var packedNodes = new Array(count);
    for (var ii = 0, bit = 1, len = nodes.length; ii < len; ii++, bit <<= 1) {
      var node = nodes[ii];
      if (node !== undefined && ii !== excluding) {
        bitmap |= bit;
        packedNodes[packedII++] = node;
      }
    }
    return new BitmapIndexedNode(ownerID, bitmap, packedNodes);
  }

  function expandNodes(ownerID, nodes, bitmap, including, node) {
    var count = 0;
    var expandedNodes = new Array(SIZE);
    for (var ii = 0; bitmap !== 0; ii++, bitmap >>>= 1) {
      expandedNodes[ii] = bitmap & 1 ? nodes[count++] : undefined;
    }
    expandedNodes[including] = node;
    return new HashArrayMapNode(ownerID, count + 1, expandedNodes);
  }

  function mergeIntoMapWith(map, merger, iterables) {
    var iters = [];
    for (var ii = 0; ii < iterables.length; ii++) {
      var value = iterables[ii];
      var iter = KeyedIterable(value);
      if (!isIterable(value)) {
        iter = iter.map(function(v ) {return fromJS(v)});
      }
      iters.push(iter);
    }
    return mergeIntoCollectionWith(map, merger, iters);
  }

  function deepMerger(merger) {
    return function(existing, value, key) 
      {return existing && existing.mergeDeepWith && isIterable(value) ?
        existing.mergeDeepWith(merger, value) :
        merger ? merger(existing, value, key) : value};
  }

  function mergeIntoCollectionWith(collection, merger, iters) {
    iters = iters.filter(function(x ) {return x.size !== 0});
    if (iters.length === 0) {
      return collection;
    }
    if (collection.size === 0 && !collection.__ownerID && iters.length === 1) {
      return collection.constructor(iters[0]);
    }
    return collection.withMutations(function(collection ) {
      var mergeIntoMap = merger ?
        function(value, key)  {
          collection.update(key, NOT_SET, function(existing )
            {return existing === NOT_SET ? value : merger(existing, value, key)}
          );
        } :
        function(value, key)  {
          collection.set(key, value);
        }
      for (var ii = 0; ii < iters.length; ii++) {
        iters[ii].forEach(mergeIntoMap);
      }
    });
  }

  function updateInDeepMap(existing, keyPathIter, notSetValue, updater) {
    var isNotSet = existing === NOT_SET;
    var step = keyPathIter.next();
    if (step.done) {
      var existingValue = isNotSet ? notSetValue : existing;
      var newValue = updater(existingValue);
      return newValue === existingValue ? existing : newValue;
    }
    invariant(
      isNotSet || (existing && existing.set),
      'invalid keyPath'
    );
    var key = step.value;
    var nextExisting = isNotSet ? NOT_SET : existing.get(key, NOT_SET);
    var nextUpdated = updateInDeepMap(
      nextExisting,
      keyPathIter,
      notSetValue,
      updater
    );
    return nextUpdated === nextExisting ? existing :
      nextUpdated === NOT_SET ? existing.remove(key) :
      (isNotSet ? emptyMap() : existing).set(key, nextUpdated);
  }

  function popCount(x) {
    x = x - ((x >> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
    x = (x + (x >> 4)) & 0x0f0f0f0f;
    x = x + (x >> 8);
    x = x + (x >> 16);
    return x & 0x7f;
  }

  function setIn(array, idx, val, canEdit) {
    var newArray = canEdit ? array : arrCopy(array);
    newArray[idx] = val;
    return newArray;
  }

  function spliceIn(array, idx, val, canEdit) {
    var newLen = array.length + 1;
    if (canEdit && idx + 1 === newLen) {
      array[idx] = val;
      return array;
    }
    var newArray = new Array(newLen);
    var after = 0;
    for (var ii = 0; ii < newLen; ii++) {
      if (ii === idx) {
        newArray[ii] = val;
        after = -1;
      } else {
        newArray[ii] = array[ii + after];
      }
    }
    return newArray;
  }

  function spliceOut(array, idx, canEdit) {
    var newLen = array.length - 1;
    if (canEdit && idx === newLen) {
      array.pop();
      return array;
    }
    var newArray = new Array(newLen);
    var after = 0;
    for (var ii = 0; ii < newLen; ii++) {
      if (ii === idx) {
        after = 1;
      }
      newArray[ii] = array[ii + after];
    }
    return newArray;
  }

  var MAX_ARRAY_MAP_SIZE = SIZE / 4;
  var MAX_BITMAP_INDEXED_SIZE = SIZE / 2;
  var MIN_HASH_ARRAY_MAP_SIZE = SIZE / 4;

  createClass(List, IndexedCollection);

    // @pragma Construction

    function List(value) {
      var empty = emptyList();
      if (value === null || value === undefined) {
        return empty;
      }
      if (isList(value)) {
        return value;
      }
      var iter = IndexedIterable(value);
      var size = iter.size;
      if (size === 0) {
        return empty;
      }
      assertNotInfinite(size);
      if (size > 0 && size < SIZE) {
        return makeList(0, size, SHIFT, null, new VNode(iter.toArray()));
      }
      return empty.withMutations(function(list ) {
        list.setSize(size);
        iter.forEach(function(v, i)  {return list.set(i, v)});
      });
    }

    List.of = function(/*...values*/) {
      return this(arguments);
    };

    List.prototype.toString = function() {
      return this.__toString('List [', ']');
    };

    // @pragma Access

    List.prototype.get = function(index, notSetValue) {
      index = wrapIndex(this, index);
      if (index < 0 || index >= this.size) {
        return notSetValue;
      }
      index += this._origin;
      var node = listNodeFor(this, index);
      return node && node.array[index & MASK];
    };

    // @pragma Modification

    List.prototype.set = function(index, value) {
      return updateList(this, index, value);
    };

    List.prototype.remove = function(index) {
      return !this.has(index) ? this :
        index === 0 ? this.shift() :
        index === this.size - 1 ? this.pop() :
        this.splice(index, 1);
    };

    List.prototype.clear = function() {
      if (this.size === 0) {
        return this;
      }
      if (this.__ownerID) {
        this.size = this._origin = this._capacity = 0;
        this._level = SHIFT;
        this._root = this._tail = null;
        this.__hash = undefined;
        this.__altered = true;
        return this;
      }
      return emptyList();
    };

    List.prototype.push = function(/*...values*/) {
      var values = arguments;
      var oldSize = this.size;
      return this.withMutations(function(list ) {
        setListBounds(list, 0, oldSize + values.length);
        for (var ii = 0; ii < values.length; ii++) {
          list.set(oldSize + ii, values[ii]);
        }
      });
    };

    List.prototype.pop = function() {
      return setListBounds(this, 0, -1);
    };

    List.prototype.unshift = function(/*...values*/) {
      var values = arguments;
      return this.withMutations(function(list ) {
        setListBounds(list, -values.length);
        for (var ii = 0; ii < values.length; ii++) {
          list.set(ii, values[ii]);
        }
      });
    };

    List.prototype.shift = function() {
      return setListBounds(this, 1);
    };

    // @pragma Composition

    List.prototype.merge = function(/*...iters*/) {
      return mergeIntoListWith(this, undefined, arguments);
    };

    List.prototype.mergeWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
      return mergeIntoListWith(this, merger, iters);
    };

    List.prototype.mergeDeep = function(/*...iters*/) {
      return mergeIntoListWith(this, deepMerger(undefined), arguments);
    };

    List.prototype.mergeDeepWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
      return mergeIntoListWith(this, deepMerger(merger), iters);
    };

    List.prototype.setSize = function(size) {
      return setListBounds(this, 0, size);
    };

    // @pragma Iteration

    List.prototype.slice = function(begin, end) {
      var size = this.size;
      if (wholeSlice(begin, end, size)) {
        return this;
      }
      return setListBounds(
        this,
        resolveBegin(begin, size),
        resolveEnd(end, size)
      );
    };

    List.prototype.__iterator = function(type, reverse) {
      var index = 0;
      var values = iterateList(this, reverse);
      return new src_Iterator__Iterator(function()  {
        var value = values();
        return value === DONE ?
          iteratorDone() :
          iteratorValue(type, index++, value);
      });
    };

    List.prototype.__iterate = function(fn, reverse) {
      var index = 0;
      var values = iterateList(this, reverse);
      var value;
      while ((value = values()) !== DONE) {
        if (fn(value, index++, this) === false) {
          break;
        }
      }
      return index;
    };

    List.prototype.__ensureOwner = function(ownerID) {
      if (ownerID === this.__ownerID) {
        return this;
      }
      if (!ownerID) {
        this.__ownerID = ownerID;
        return this;
      }
      return makeList(this._origin, this._capacity, this._level, this._root, this._tail, ownerID, this.__hash);
    };


  function isList(maybeList) {
    return !!(maybeList && maybeList[IS_LIST_SENTINEL]);
  }

  List.isList = isList;

  var IS_LIST_SENTINEL = '@@__IMMUTABLE_LIST__@@';

  var ListPrototype = List.prototype;
  ListPrototype[IS_LIST_SENTINEL] = true;
  ListPrototype[DELETE] = ListPrototype.remove;
  ListPrototype.setIn = MapPrototype.setIn;
  ListPrototype.deleteIn =
  ListPrototype.removeIn = MapPrototype.removeIn;
  ListPrototype.update = MapPrototype.update;
  ListPrototype.updateIn = MapPrototype.updateIn;
  ListPrototype.mergeIn = MapPrototype.mergeIn;
  ListPrototype.mergeDeepIn = MapPrototype.mergeDeepIn;
  ListPrototype.withMutations = MapPrototype.withMutations;
  ListPrototype.asMutable = MapPrototype.asMutable;
  ListPrototype.asImmutable = MapPrototype.asImmutable;
  ListPrototype.wasAltered = MapPrototype.wasAltered;



    function VNode(array, ownerID) {
      this.array = array;
      this.ownerID = ownerID;
    }

    // TODO: seems like these methods are very similar

    VNode.prototype.removeBefore = function(ownerID, level, index) {
      if (index === level ? 1 << level : 0 || this.array.length === 0) {
        return this;
      }
      var originIndex = (index >>> level) & MASK;
      if (originIndex >= this.array.length) {
        return new VNode([], ownerID);
      }
      var removingFirst = originIndex === 0;
      var newChild;
      if (level > 0) {
        var oldChild = this.array[originIndex];
        newChild = oldChild && oldChild.removeBefore(ownerID, level - SHIFT, index);
        if (newChild === oldChild && removingFirst) {
          return this;
        }
      }
      if (removingFirst && !newChild) {
        return this;
      }
      var editable = editableVNode(this, ownerID);
      if (!removingFirst) {
        for (var ii = 0; ii < originIndex; ii++) {
          editable.array[ii] = undefined;
        }
      }
      if (newChild) {
        editable.array[originIndex] = newChild;
      }
      return editable;
    };

    VNode.prototype.removeAfter = function(ownerID, level, index) {
      if (index === level ? 1 << level : 0 || this.array.length === 0) {
        return this;
      }
      var sizeIndex = ((index - 1) >>> level) & MASK;
      if (sizeIndex >= this.array.length) {
        return this;
      }
      var removingLast = sizeIndex === this.array.length - 1;
      var newChild;
      if (level > 0) {
        var oldChild = this.array[sizeIndex];
        newChild = oldChild && oldChild.removeAfter(ownerID, level - SHIFT, index);
        if (newChild === oldChild && removingLast) {
          return this;
        }
      }
      if (removingLast && !newChild) {
        return this;
      }
      var editable = editableVNode(this, ownerID);
      if (!removingLast) {
        editable.array.pop();
      }
      if (newChild) {
        editable.array[sizeIndex] = newChild;
      }
      return editable;
    };



  var DONE = {};

  function iterateList(list, reverse) {
    var left = list._origin;
    var right = list._capacity;
    var tailPos = getTailOffset(right);
    var tail = list._tail;

    return iterateNodeOrLeaf(list._root, list._level, 0);

    function iterateNodeOrLeaf(node, level, offset) {
      return level === 0 ?
        iterateLeaf(node, offset) :
        iterateNode(node, level, offset);
    }

    function iterateLeaf(node, offset) {
      var array = offset === tailPos ? tail && tail.array : node && node.array;
      var from = offset > left ? 0 : left - offset;
      var to = right - offset;
      if (to > SIZE) {
        to = SIZE;
      }
      return function()  {
        if (from === to) {
          return DONE;
        }
        var idx = reverse ? --to : from++;
        return array && array[idx];
      };
    }

    function iterateNode(node, level, offset) {
      var values;
      var array = node && node.array;
      var from = offset > left ? 0 : (left - offset) >> level;
      var to = ((right - offset) >> level) + 1;
      if (to > SIZE) {
        to = SIZE;
      }
      return function()  {
        do {
          if (values) {
            var value = values();
            if (value !== DONE) {
              return value;
            }
            values = null;
          }
          if (from === to) {
            return DONE;
          }
          var idx = reverse ? --to : from++;
          values = iterateNodeOrLeaf(
            array && array[idx], level - SHIFT, offset + (idx << level)
          );
        } while (true);
      };
    }
  }

  function makeList(origin, capacity, level, root, tail, ownerID, hash) {
    var list = Object.create(ListPrototype);
    list.size = capacity - origin;
    list._origin = origin;
    list._capacity = capacity;
    list._level = level;
    list._root = root;
    list._tail = tail;
    list.__ownerID = ownerID;
    list.__hash = hash;
    list.__altered = false;
    return list;
  }

  var EMPTY_LIST;
  function emptyList() {
    return EMPTY_LIST || (EMPTY_LIST = makeList(0, 0, SHIFT));
  }

  function updateList(list, index, value) {
    index = wrapIndex(list, index);

    if (index >= list.size || index < 0) {
      return list.withMutations(function(list ) {
        index < 0 ?
          setListBounds(list, index).set(0, value) :
          setListBounds(list, 0, index + 1).set(index, value)
      });
    }

    index += list._origin;

    var newTail = list._tail;
    var newRoot = list._root;
    var didAlter = MakeRef(DID_ALTER);
    if (index >= getTailOffset(list._capacity)) {
      newTail = updateVNode(newTail, list.__ownerID, 0, index, value, didAlter);
    } else {
      newRoot = updateVNode(newRoot, list.__ownerID, list._level, index, value, didAlter);
    }

    if (!didAlter.value) {
      return list;
    }

    if (list.__ownerID) {
      list._root = newRoot;
      list._tail = newTail;
      list.__hash = undefined;
      list.__altered = true;
      return list;
    }
    return makeList(list._origin, list._capacity, list._level, newRoot, newTail);
  }

  function updateVNode(node, ownerID, level, index, value, didAlter) {
    var idx = (index >>> level) & MASK;
    var nodeHas = node && idx < node.array.length;
    if (!nodeHas && value === undefined) {
      return node;
    }

    var newNode;

    if (level > 0) {
      var lowerNode = node && node.array[idx];
      var newLowerNode = updateVNode(lowerNode, ownerID, level - SHIFT, index, value, didAlter);
      if (newLowerNode === lowerNode) {
        return node;
      }
      newNode = editableVNode(node, ownerID);
      newNode.array[idx] = newLowerNode;
      return newNode;
    }

    if (nodeHas && node.array[idx] === value) {
      return node;
    }

    SetRef(didAlter);

    newNode = editableVNode(node, ownerID);
    if (value === undefined && idx === newNode.array.length - 1) {
      newNode.array.pop();
    } else {
      newNode.array[idx] = value;
    }
    return newNode;
  }

  function editableVNode(node, ownerID) {
    if (ownerID && node && ownerID === node.ownerID) {
      return node;
    }
    return new VNode(node ? node.array.slice() : [], ownerID);
  }

  function listNodeFor(list, rawIndex) {
    if (rawIndex >= getTailOffset(list._capacity)) {
      return list._tail;
    }
    if (rawIndex < 1 << (list._level + SHIFT)) {
      var node = list._root;
      var level = list._level;
      while (node && level > 0) {
        node = node.array[(rawIndex >>> level) & MASK];
        level -= SHIFT;
      }
      return node;
    }
  }

  function setListBounds(list, begin, end) {
    var owner = list.__ownerID || new OwnerID();
    var oldOrigin = list._origin;
    var oldCapacity = list._capacity;
    var newOrigin = oldOrigin + begin;
    var newCapacity = end === undefined ? oldCapacity : end < 0 ? oldCapacity + end : oldOrigin + end;
    if (newOrigin === oldOrigin && newCapacity === oldCapacity) {
      return list;
    }

    // If it's going to end after it starts, it's empty.
    if (newOrigin >= newCapacity) {
      return list.clear();
    }

    var newLevel = list._level;
    var newRoot = list._root;

    // New origin might require creating a higher root.
    var offsetShift = 0;
    while (newOrigin + offsetShift < 0) {
      newRoot = new VNode(newRoot && newRoot.array.length ? [undefined, newRoot] : [], owner);
      newLevel += SHIFT;
      offsetShift += 1 << newLevel;
    }
    if (offsetShift) {
      newOrigin += offsetShift;
      oldOrigin += offsetShift;
      newCapacity += offsetShift;
      oldCapacity += offsetShift;
    }

    var oldTailOffset = getTailOffset(oldCapacity);
    var newTailOffset = getTailOffset(newCapacity);

    // New size might require creating a higher root.
    while (newTailOffset >= 1 << (newLevel + SHIFT)) {
      newRoot = new VNode(newRoot && newRoot.array.length ? [newRoot] : [], owner);
      newLevel += SHIFT;
    }

    // Locate or create the new tail.
    var oldTail = list._tail;
    var newTail = newTailOffset < oldTailOffset ?
      listNodeFor(list, newCapacity - 1) :
      newTailOffset > oldTailOffset ? new VNode([], owner) : oldTail;

    // Merge Tail into tree.
    if (oldTail && newTailOffset > oldTailOffset && newOrigin < oldCapacity && oldTail.array.length) {
      newRoot = editableVNode(newRoot, owner);
      var node = newRoot;
      for (var level = newLevel; level > SHIFT; level -= SHIFT) {
        var idx = (oldTailOffset >>> level) & MASK;
        node = node.array[idx] = editableVNode(node.array[idx], owner);
      }
      node.array[(oldTailOffset >>> SHIFT) & MASK] = oldTail;
    }

    // If the size has been reduced, there's a chance the tail needs to be trimmed.
    if (newCapacity < oldCapacity) {
      newTail = newTail && newTail.removeAfter(owner, 0, newCapacity);
    }

    // If the new origin is within the tail, then we do not need a root.
    if (newOrigin >= newTailOffset) {
      newOrigin -= newTailOffset;
      newCapacity -= newTailOffset;
      newLevel = SHIFT;
      newRoot = null;
      newTail = newTail && newTail.removeBefore(owner, 0, newOrigin);

    // Otherwise, if the root has been trimmed, garbage collect.
    } else if (newOrigin > oldOrigin || newTailOffset < oldTailOffset) {
      offsetShift = 0;

      // Identify the new top root node of the subtree of the old root.
      while (newRoot) {
        var beginIndex = (newOrigin >>> newLevel) & MASK;
        if (beginIndex !== (newTailOffset >>> newLevel) & MASK) {
          break;
        }
        if (beginIndex) {
          offsetShift += (1 << newLevel) * beginIndex;
        }
        newLevel -= SHIFT;
        newRoot = newRoot.array[beginIndex];
      }

      // Trim the new sides of the new root.
      if (newRoot && newOrigin > oldOrigin) {
        newRoot = newRoot.removeBefore(owner, newLevel, newOrigin - offsetShift);
      }
      if (newRoot && newTailOffset < oldTailOffset) {
        newRoot = newRoot.removeAfter(owner, newLevel, newTailOffset - offsetShift);
      }
      if (offsetShift) {
        newOrigin -= offsetShift;
        newCapacity -= offsetShift;
      }
    }

    if (list.__ownerID) {
      list.size = newCapacity - newOrigin;
      list._origin = newOrigin;
      list._capacity = newCapacity;
      list._level = newLevel;
      list._root = newRoot;
      list._tail = newTail;
      list.__hash = undefined;
      list.__altered = true;
      return list;
    }
    return makeList(newOrigin, newCapacity, newLevel, newRoot, newTail);
  }

  function mergeIntoListWith(list, merger, iterables) {
    var iters = [];
    var maxSize = 0;
    for (var ii = 0; ii < iterables.length; ii++) {
      var value = iterables[ii];
      var iter = IndexedIterable(value);
      if (iter.size > maxSize) {
        maxSize = iter.size;
      }
      if (!isIterable(value)) {
        iter = iter.map(function(v ) {return fromJS(v)});
      }
      iters.push(iter);
    }
    if (maxSize > list.size) {
      list = list.setSize(maxSize);
    }
    return mergeIntoCollectionWith(list, merger, iters);
  }

  function getTailOffset(size) {
    return size < SIZE ? 0 : (((size - 1) >>> SHIFT) << SHIFT);
  }

  createClass(OrderedMap, src_Map__Map);

    // @pragma Construction

    function OrderedMap(value) {
      return value === null || value === undefined ? emptyOrderedMap() :
        isOrderedMap(value) ? value :
        emptyOrderedMap().withMutations(function(map ) {
          var iter = KeyedIterable(value);
          assertNotInfinite(iter.size);
          iter.forEach(function(v, k)  {return map.set(k, v)});
        });
    }

    OrderedMap.of = function(/*...values*/) {
      return this(arguments);
    };

    OrderedMap.prototype.toString = function() {
      return this.__toString('OrderedMap {', '}');
    };

    // @pragma Access

    OrderedMap.prototype.get = function(k, notSetValue) {
      var index = this._map.get(k);
      return index !== undefined ? this._list.get(index)[1] : notSetValue;
    };

    // @pragma Modification

    OrderedMap.prototype.clear = function() {
      if (this.size === 0) {
        return this;
      }
      if (this.__ownerID) {
        this.size = 0;
        this._map.clear();
        this._list.clear();
        return this;
      }
      return emptyOrderedMap();
    };

    OrderedMap.prototype.set = function(k, v) {
      return updateOrderedMap(this, k, v);
    };

    OrderedMap.prototype.remove = function(k) {
      return updateOrderedMap(this, k, NOT_SET);
    };

    OrderedMap.prototype.wasAltered = function() {
      return this._map.wasAltered() || this._list.wasAltered();
    };

    OrderedMap.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      return this._list.__iterate(
        function(entry ) {return entry && fn(entry[1], entry[0], this$0)},
        reverse
      );
    };

    OrderedMap.prototype.__iterator = function(type, reverse) {
      return this._list.fromEntrySeq().__iterator(type, reverse);
    };

    OrderedMap.prototype.__ensureOwner = function(ownerID) {
      if (ownerID === this.__ownerID) {
        return this;
      }
      var newMap = this._map.__ensureOwner(ownerID);
      var newList = this._list.__ensureOwner(ownerID);
      if (!ownerID) {
        this.__ownerID = ownerID;
        this._map = newMap;
        this._list = newList;
        return this;
      }
      return makeOrderedMap(newMap, newList, ownerID, this.__hash);
    };


  function isOrderedMap(maybeOrderedMap) {
    return isMap(maybeOrderedMap) && isOrdered(maybeOrderedMap);
  }

  OrderedMap.isOrderedMap = isOrderedMap;

  OrderedMap.prototype[IS_ORDERED_SENTINEL] = true;
  OrderedMap.prototype[DELETE] = OrderedMap.prototype.remove;



  function makeOrderedMap(map, list, ownerID, hash) {
    var omap = Object.create(OrderedMap.prototype);
    omap.size = map ? map.size : 0;
    omap._map = map;
    omap._list = list;
    omap.__ownerID = ownerID;
    omap.__hash = hash;
    return omap;
  }

  var EMPTY_ORDERED_MAP;
  function emptyOrderedMap() {
    return EMPTY_ORDERED_MAP || (EMPTY_ORDERED_MAP = makeOrderedMap(emptyMap(), emptyList()));
  }

  function updateOrderedMap(omap, k, v) {
    var map = omap._map;
    var list = omap._list;
    var i = map.get(k);
    var has = i !== undefined;
    var newMap;
    var newList;
    if (v === NOT_SET) { // removed
      if (!has) {
        return omap;
      }
      if (list.size >= SIZE && list.size >= map.size * 2) {
        newList = list.filter(function(entry, idx)  {return entry !== undefined && i !== idx});
        newMap = newList.toKeyedSeq().map(function(entry ) {return entry[0]}).flip().toMap();
        if (omap.__ownerID) {
          newMap.__ownerID = newList.__ownerID = omap.__ownerID;
        }
      } else {
        newMap = map.remove(k);
        newList = i === list.size - 1 ? list.pop() : list.set(i, undefined);
      }
    } else {
      if (has) {
        if (v === list.get(i)[1]) {
          return omap;
        }
        newMap = map;
        newList = list.set(i, [k, v]);
      } else {
        newMap = map.set(k, list.size);
        newList = list.set(list.size, [k, v]);
      }
    }
    if (omap.__ownerID) {
      omap.size = newMap.size;
      omap._map = newMap;
      omap._list = newList;
      omap.__hash = undefined;
      return omap;
    }
    return makeOrderedMap(newMap, newList);
  }

  createClass(Stack, IndexedCollection);

    // @pragma Construction

    function Stack(value) {
      return value === null || value === undefined ? emptyStack() :
        isStack(value) ? value :
        emptyStack().unshiftAll(value);
    }

    Stack.of = function(/*...values*/) {
      return this(arguments);
    };

    Stack.prototype.toString = function() {
      return this.__toString('Stack [', ']');
    };

    // @pragma Access

    Stack.prototype.get = function(index, notSetValue) {
      var head = this._head;
      index = wrapIndex(this, index);
      while (head && index--) {
        head = head.next;
      }
      return head ? head.value : notSetValue;
    };

    Stack.prototype.peek = function() {
      return this._head && this._head.value;
    };

    // @pragma Modification

    Stack.prototype.push = function(/*...values*/) {
      if (arguments.length === 0) {
        return this;
      }
      var newSize = this.size + arguments.length;
      var head = this._head;
      for (var ii = arguments.length - 1; ii >= 0; ii--) {
        head = {
          value: arguments[ii],
          next: head
        };
      }
      if (this.__ownerID) {
        this.size = newSize;
        this._head = head;
        this.__hash = undefined;
        this.__altered = true;
        return this;
      }
      return makeStack(newSize, head);
    };

    Stack.prototype.pushAll = function(iter) {
      iter = IndexedIterable(iter);
      if (iter.size === 0) {
        return this;
      }
      assertNotInfinite(iter.size);
      var newSize = this.size;
      var head = this._head;
      iter.reverse().forEach(function(value ) {
        newSize++;
        head = {
          value: value,
          next: head
        };
      });
      if (this.__ownerID) {
        this.size = newSize;
        this._head = head;
        this.__hash = undefined;
        this.__altered = true;
        return this;
      }
      return makeStack(newSize, head);
    };

    Stack.prototype.pop = function() {
      return this.slice(1);
    };

    Stack.prototype.unshift = function(/*...values*/) {
      return this.push.apply(this, arguments);
    };

    Stack.prototype.unshiftAll = function(iter) {
      return this.pushAll(iter);
    };

    Stack.prototype.shift = function() {
      return this.pop.apply(this, arguments);
    };

    Stack.prototype.clear = function() {
      if (this.size === 0) {
        return this;
      }
      if (this.__ownerID) {
        this.size = 0;
        this._head = undefined;
        this.__hash = undefined;
        this.__altered = true;
        return this;
      }
      return emptyStack();
    };

    Stack.prototype.slice = function(begin, end) {
      if (wholeSlice(begin, end, this.size)) {
        return this;
      }
      var resolvedBegin = resolveBegin(begin, this.size);
      var resolvedEnd = resolveEnd(end, this.size);
      if (resolvedEnd !== this.size) {
        // super.slice(begin, end);
        return IndexedCollection.prototype.slice.call(this, begin, end);
      }
      var newSize = this.size - resolvedBegin;
      var head = this._head;
      while (resolvedBegin--) {
        head = head.next;
      }
      if (this.__ownerID) {
        this.size = newSize;
        this._head = head;
        this.__hash = undefined;
        this.__altered = true;
        return this;
      }
      return makeStack(newSize, head);
    };

    // @pragma Mutability

    Stack.prototype.__ensureOwner = function(ownerID) {
      if (ownerID === this.__ownerID) {
        return this;
      }
      if (!ownerID) {
        this.__ownerID = ownerID;
        this.__altered = false;
        return this;
      }
      return makeStack(this.size, this._head, ownerID, this.__hash);
    };

    // @pragma Iteration

    Stack.prototype.__iterate = function(fn, reverse) {
      if (reverse) {
        return this.reverse().__iterate(fn);
      }
      var iterations = 0;
      var node = this._head;
      while (node) {
        if (fn(node.value, iterations++, this) === false) {
          break;
        }
        node = node.next;
      }
      return iterations;
    };

    Stack.prototype.__iterator = function(type, reverse) {
      if (reverse) {
        return this.reverse().__iterator(type);
      }
      var iterations = 0;
      var node = this._head;
      return new src_Iterator__Iterator(function()  {
        if (node) {
          var value = node.value;
          node = node.next;
          return iteratorValue(type, iterations++, value);
        }
        return iteratorDone();
      });
    };


  function isStack(maybeStack) {
    return !!(maybeStack && maybeStack[IS_STACK_SENTINEL]);
  }

  Stack.isStack = isStack;

  var IS_STACK_SENTINEL = '@@__IMMUTABLE_STACK__@@';

  var StackPrototype = Stack.prototype;
  StackPrototype[IS_STACK_SENTINEL] = true;
  StackPrototype.withMutations = MapPrototype.withMutations;
  StackPrototype.asMutable = MapPrototype.asMutable;
  StackPrototype.asImmutable = MapPrototype.asImmutable;
  StackPrototype.wasAltered = MapPrototype.wasAltered;


  function makeStack(size, head, ownerID, hash) {
    var map = Object.create(StackPrototype);
    map.size = size;
    map._head = head;
    map.__ownerID = ownerID;
    map.__hash = hash;
    map.__altered = false;
    return map;
  }

  var EMPTY_STACK;
  function emptyStack() {
    return EMPTY_STACK || (EMPTY_STACK = makeStack(0));
  }

  createClass(src_Set__Set, SetCollection);

    // @pragma Construction

    function src_Set__Set(value) {
      return value === null || value === undefined ? emptySet() :
        isSet(value) ? value :
        emptySet().withMutations(function(set ) {
          var iter = SetIterable(value);
          assertNotInfinite(iter.size);
          iter.forEach(function(v ) {return set.add(v)});
        });
    }

    src_Set__Set.of = function(/*...values*/) {
      return this(arguments);
    };

    src_Set__Set.fromKeys = function(value) {
      return this(KeyedIterable(value).keySeq());
    };

    src_Set__Set.prototype.toString = function() {
      return this.__toString('Set {', '}');
    };

    // @pragma Access

    src_Set__Set.prototype.has = function(value) {
      return this._map.has(value);
    };

    // @pragma Modification

    src_Set__Set.prototype.add = function(value) {
      return updateSet(this, this._map.set(value, true));
    };

    src_Set__Set.prototype.remove = function(value) {
      return updateSet(this, this._map.remove(value));
    };

    src_Set__Set.prototype.clear = function() {
      return updateSet(this, this._map.clear());
    };

    // @pragma Composition

    src_Set__Set.prototype.union = function() {var iters = SLICE$0.call(arguments, 0);
      iters = iters.filter(function(x ) {return x.size !== 0});
      if (iters.length === 0) {
        return this;
      }
      if (this.size === 0 && !this.__ownerID && iters.length === 1) {
        return this.constructor(iters[0]);
      }
      return this.withMutations(function(set ) {
        for (var ii = 0; ii < iters.length; ii++) {
          SetIterable(iters[ii]).forEach(function(value ) {return set.add(value)});
        }
      });
    };

    src_Set__Set.prototype.intersect = function() {var iters = SLICE$0.call(arguments, 0);
      if (iters.length === 0) {
        return this;
      }
      iters = iters.map(function(iter ) {return SetIterable(iter)});
      var originalSet = this;
      return this.withMutations(function(set ) {
        originalSet.forEach(function(value ) {
          if (!iters.every(function(iter ) {return iter.includes(value)})) {
            set.remove(value);
          }
        });
      });
    };

    src_Set__Set.prototype.subtract = function() {var iters = SLICE$0.call(arguments, 0);
      if (iters.length === 0) {
        return this;
      }
      iters = iters.map(function(iter ) {return SetIterable(iter)});
      var originalSet = this;
      return this.withMutations(function(set ) {
        originalSet.forEach(function(value ) {
          if (iters.some(function(iter ) {return iter.includes(value)})) {
            set.remove(value);
          }
        });
      });
    };

    src_Set__Set.prototype.merge = function() {
      return this.union.apply(this, arguments);
    };

    src_Set__Set.prototype.mergeWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
      return this.union.apply(this, iters);
    };

    src_Set__Set.prototype.sort = function(comparator) {
      // Late binding
      return OrderedSet(sortFactory(this, comparator));
    };

    src_Set__Set.prototype.sortBy = function(mapper, comparator) {
      // Late binding
      return OrderedSet(sortFactory(this, comparator, mapper));
    };

    src_Set__Set.prototype.wasAltered = function() {
      return this._map.wasAltered();
    };

    src_Set__Set.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      return this._map.__iterate(function(_, k)  {return fn(k, k, this$0)}, reverse);
    };

    src_Set__Set.prototype.__iterator = function(type, reverse) {
      return this._map.map(function(_, k)  {return k}).__iterator(type, reverse);
    };

    src_Set__Set.prototype.__ensureOwner = function(ownerID) {
      if (ownerID === this.__ownerID) {
        return this;
      }
      var newMap = this._map.__ensureOwner(ownerID);
      if (!ownerID) {
        this.__ownerID = ownerID;
        this._map = newMap;
        return this;
      }
      return this.__make(newMap, ownerID);
    };


  function isSet(maybeSet) {
    return !!(maybeSet && maybeSet[IS_SET_SENTINEL]);
  }

  src_Set__Set.isSet = isSet;

  var IS_SET_SENTINEL = '@@__IMMUTABLE_SET__@@';

  var SetPrototype = src_Set__Set.prototype;
  SetPrototype[IS_SET_SENTINEL] = true;
  SetPrototype[DELETE] = SetPrototype.remove;
  SetPrototype.mergeDeep = SetPrototype.merge;
  SetPrototype.mergeDeepWith = SetPrototype.mergeWith;
  SetPrototype.withMutations = MapPrototype.withMutations;
  SetPrototype.asMutable = MapPrototype.asMutable;
  SetPrototype.asImmutable = MapPrototype.asImmutable;

  SetPrototype.__empty = emptySet;
  SetPrototype.__make = makeSet;

  function updateSet(set, newMap) {
    if (set.__ownerID) {
      set.size = newMap.size;
      set._map = newMap;
      return set;
    }
    return newMap === set._map ? set :
      newMap.size === 0 ? set.__empty() :
      set.__make(newMap);
  }

  function makeSet(map, ownerID) {
    var set = Object.create(SetPrototype);
    set.size = map ? map.size : 0;
    set._map = map;
    set.__ownerID = ownerID;
    return set;
  }

  var EMPTY_SET;
  function emptySet() {
    return EMPTY_SET || (EMPTY_SET = makeSet(emptyMap()));
  }

  createClass(OrderedSet, src_Set__Set);

    // @pragma Construction

    function OrderedSet(value) {
      return value === null || value === undefined ? emptyOrderedSet() :
        isOrderedSet(value) ? value :
        emptyOrderedSet().withMutations(function(set ) {
          var iter = SetIterable(value);
          assertNotInfinite(iter.size);
          iter.forEach(function(v ) {return set.add(v)});
        });
    }

    OrderedSet.of = function(/*...values*/) {
      return this(arguments);
    };

    OrderedSet.fromKeys = function(value) {
      return this(KeyedIterable(value).keySeq());
    };

    OrderedSet.prototype.toString = function() {
      return this.__toString('OrderedSet {', '}');
    };


  function isOrderedSet(maybeOrderedSet) {
    return isSet(maybeOrderedSet) && isOrdered(maybeOrderedSet);
  }

  OrderedSet.isOrderedSet = isOrderedSet;

  var OrderedSetPrototype = OrderedSet.prototype;
  OrderedSetPrototype[IS_ORDERED_SENTINEL] = true;

  OrderedSetPrototype.__empty = emptyOrderedSet;
  OrderedSetPrototype.__make = makeOrderedSet;

  function makeOrderedSet(map, ownerID) {
    var set = Object.create(OrderedSetPrototype);
    set.size = map ? map.size : 0;
    set._map = map;
    set.__ownerID = ownerID;
    return set;
  }

  var EMPTY_ORDERED_SET;
  function emptyOrderedSet() {
    return EMPTY_ORDERED_SET || (EMPTY_ORDERED_SET = makeOrderedSet(emptyOrderedMap()));
  }

  createClass(Record, KeyedCollection);

    function Record(defaultValues, name) {
      var hasInitialized;

      var RecordType = function Record(values) {
        if (values instanceof RecordType) {
          return values;
        }
        if (!(this instanceof RecordType)) {
          return new RecordType(values);
        }
        if (!hasInitialized) {
          hasInitialized = true;
          var keys = Object.keys(defaultValues);
          setProps(RecordTypePrototype, keys);
          RecordTypePrototype.size = keys.length;
          RecordTypePrototype._name = name;
          RecordTypePrototype._keys = keys;
          RecordTypePrototype._defaultValues = defaultValues;
        }
        this._map = src_Map__Map(values);
      };

      var RecordTypePrototype = RecordType.prototype = Object.create(RecordPrototype);
      RecordTypePrototype.constructor = RecordType;

      return RecordType;
    }

    Record.prototype.toString = function() {
      return this.__toString(recordName(this) + ' {', '}');
    };

    // @pragma Access

    Record.prototype.has = function(k) {
      return this._defaultValues.hasOwnProperty(k);
    };

    Record.prototype.get = function(k, notSetValue) {
      if (!this.has(k)) {
        return notSetValue;
      }
      var defaultVal = this._defaultValues[k];
      return this._map ? this._map.get(k, defaultVal) : defaultVal;
    };

    // @pragma Modification

    Record.prototype.clear = function() {
      if (this.__ownerID) {
        this._map && this._map.clear();
        return this;
      }
      var RecordType = this.constructor;
      return RecordType._empty || (RecordType._empty = makeRecord(this, emptyMap()));
    };

    Record.prototype.set = function(k, v) {
      if (!this.has(k)) {
        throw new Error('Cannot set unknown key "' + k + '" on ' + recordName(this));
      }
      var newMap = this._map && this._map.set(k, v);
      if (this.__ownerID || newMap === this._map) {
        return this;
      }
      return makeRecord(this, newMap);
    };

    Record.prototype.remove = function(k) {
      if (!this.has(k)) {
        return this;
      }
      var newMap = this._map && this._map.remove(k);
      if (this.__ownerID || newMap === this._map) {
        return this;
      }
      return makeRecord(this, newMap);
    };

    Record.prototype.wasAltered = function() {
      return this._map.wasAltered();
    };

    Record.prototype.__iterator = function(type, reverse) {var this$0 = this;
      return KeyedIterable(this._defaultValues).map(function(_, k)  {return this$0.get(k)}).__iterator(type, reverse);
    };

    Record.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      return KeyedIterable(this._defaultValues).map(function(_, k)  {return this$0.get(k)}).__iterate(fn, reverse);
    };

    Record.prototype.__ensureOwner = function(ownerID) {
      if (ownerID === this.__ownerID) {
        return this;
      }
      var newMap = this._map && this._map.__ensureOwner(ownerID);
      if (!ownerID) {
        this.__ownerID = ownerID;
        this._map = newMap;
        return this;
      }
      return makeRecord(this, newMap, ownerID);
    };


  var RecordPrototype = Record.prototype;
  RecordPrototype[DELETE] = RecordPrototype.remove;
  RecordPrototype.deleteIn =
  RecordPrototype.removeIn = MapPrototype.removeIn;
  RecordPrototype.merge = MapPrototype.merge;
  RecordPrototype.mergeWith = MapPrototype.mergeWith;
  RecordPrototype.mergeIn = MapPrototype.mergeIn;
  RecordPrototype.mergeDeep = MapPrototype.mergeDeep;
  RecordPrototype.mergeDeepWith = MapPrototype.mergeDeepWith;
  RecordPrototype.mergeDeepIn = MapPrototype.mergeDeepIn;
  RecordPrototype.setIn = MapPrototype.setIn;
  RecordPrototype.update = MapPrototype.update;
  RecordPrototype.updateIn = MapPrototype.updateIn;
  RecordPrototype.withMutations = MapPrototype.withMutations;
  RecordPrototype.asMutable = MapPrototype.asMutable;
  RecordPrototype.asImmutable = MapPrototype.asImmutable;


  function makeRecord(likeRecord, map, ownerID) {
    var record = Object.create(Object.getPrototypeOf(likeRecord));
    record._map = map;
    record.__ownerID = ownerID;
    return record;
  }

  function recordName(record) {
    return record._name || record.constructor.name || 'Record';
  }

  function setProps(prototype, names) {
    try {
      names.forEach(setProp.bind(undefined, prototype));
    } catch (error) {
      // Object.defineProperty failed. Probably IE8.
    }
  }

  function setProp(prototype, name) {
    Object.defineProperty(prototype, name, {
      get: function() {
        return this.get(name);
      },
      set: function(value) {
        invariant(this.__ownerID, 'Cannot set on an immutable record.');
        this.set(name, value);
      }
    });
  }

  function deepEqual(a, b) {
    if (a === b) {
      return true;
    }

    if (
      !isIterable(b) ||
      a.size !== undefined && b.size !== undefined && a.size !== b.size ||
      a.__hash !== undefined && b.__hash !== undefined && a.__hash !== b.__hash ||
      isKeyed(a) !== isKeyed(b) ||
      isIndexed(a) !== isIndexed(b) ||
      isOrdered(a) !== isOrdered(b)
    ) {
      return false;
    }

    if (a.size === 0 && b.size === 0) {
      return true;
    }

    var notAssociative = !isAssociative(a);

    if (isOrdered(a)) {
      var entries = a.entries();
      return b.every(function(v, k)  {
        var entry = entries.next().value;
        return entry && is(entry[1], v) && (notAssociative || is(entry[0], k));
      }) && entries.next().done;
    }

    var flipped = false;

    if (a.size === undefined) {
      if (b.size === undefined) {
        if (typeof a.cacheResult === 'function') {
          a.cacheResult();
        }
      } else {
        flipped = true;
        var _ = a;
        a = b;
        b = _;
      }
    }

    var allEqual = true;
    var bSize = b.__iterate(function(v, k)  {
      if (notAssociative ? !a.has(v) :
          flipped ? !is(v, a.get(k, NOT_SET)) : !is(a.get(k, NOT_SET), v)) {
        allEqual = false;
        return false;
      }
    });

    return allEqual && a.size === bSize;
  }

  createClass(Range, IndexedSeq);

    function Range(start, end, step) {
      if (!(this instanceof Range)) {
        return new Range(start, end, step);
      }
      invariant(step !== 0, 'Cannot step a Range by 0');
      start = start || 0;
      if (end === undefined) {
        end = Infinity;
      }
      step = step === undefined ? 1 : Math.abs(step);
      if (end < start) {
        step = -step;
      }
      this._start = start;
      this._end = end;
      this._step = step;
      this.size = Math.max(0, Math.ceil((end - start) / step - 1) + 1);
      if (this.size === 0) {
        if (EMPTY_RANGE) {
          return EMPTY_RANGE;
        }
        EMPTY_RANGE = this;
      }
    }

    Range.prototype.toString = function() {
      if (this.size === 0) {
        return 'Range []';
      }
      return 'Range [ ' +
        this._start + '...' + this._end +
        (this._step > 1 ? ' by ' + this._step : '') +
      ' ]';
    };

    Range.prototype.get = function(index, notSetValue) {
      return this.has(index) ?
        this._start + wrapIndex(this, index) * this._step :
        notSetValue;
    };

    Range.prototype.includes = function(searchValue) {
      var possibleIndex = (searchValue - this._start) / this._step;
      return possibleIndex >= 0 &&
        possibleIndex < this.size &&
        possibleIndex === Math.floor(possibleIndex);
    };

    Range.prototype.slice = function(begin, end) {
      if (wholeSlice(begin, end, this.size)) {
        return this;
      }
      begin = resolveBegin(begin, this.size);
      end = resolveEnd(end, this.size);
      if (end <= begin) {
        return new Range(0, 0);
      }
      return new Range(this.get(begin, this._end), this.get(end, this._end), this._step);
    };

    Range.prototype.indexOf = function(searchValue) {
      var offsetValue = searchValue - this._start;
      if (offsetValue % this._step === 0) {
        var index = offsetValue / this._step;
        if (index >= 0 && index < this.size) {
          return index
        }
      }
      return -1;
    };

    Range.prototype.lastIndexOf = function(searchValue) {
      return this.indexOf(searchValue);
    };

    Range.prototype.__iterate = function(fn, reverse) {
      var maxIndex = this.size - 1;
      var step = this._step;
      var value = reverse ? this._start + maxIndex * step : this._start;
      for (var ii = 0; ii <= maxIndex; ii++) {
        if (fn(value, ii, this) === false) {
          return ii + 1;
        }
        value += reverse ? -step : step;
      }
      return ii;
    };

    Range.prototype.__iterator = function(type, reverse) {
      var maxIndex = this.size - 1;
      var step = this._step;
      var value = reverse ? this._start + maxIndex * step : this._start;
      var ii = 0;
      return new src_Iterator__Iterator(function()  {
        var v = value;
        value += reverse ? -step : step;
        return ii > maxIndex ? iteratorDone() : iteratorValue(type, ii++, v);
      });
    };

    Range.prototype.equals = function(other) {
      return other instanceof Range ?
        this._start === other._start &&
        this._end === other._end &&
        this._step === other._step :
        deepEqual(this, other);
    };


  var EMPTY_RANGE;

  createClass(Repeat, IndexedSeq);

    function Repeat(value, times) {
      if (!(this instanceof Repeat)) {
        return new Repeat(value, times);
      }
      this._value = value;
      this.size = times === undefined ? Infinity : Math.max(0, times);
      if (this.size === 0) {
        if (EMPTY_REPEAT) {
          return EMPTY_REPEAT;
        }
        EMPTY_REPEAT = this;
      }
    }

    Repeat.prototype.toString = function() {
      if (this.size === 0) {
        return 'Repeat []';
      }
      return 'Repeat [ ' + this._value + ' ' + this.size + ' times ]';
    };

    Repeat.prototype.get = function(index, notSetValue) {
      return this.has(index) ? this._value : notSetValue;
    };

    Repeat.prototype.includes = function(searchValue) {
      return is(this._value, searchValue);
    };

    Repeat.prototype.slice = function(begin, end) {
      var size = this.size;
      return wholeSlice(begin, end, size) ? this :
        new Repeat(this._value, resolveEnd(end, size) - resolveBegin(begin, size));
    };

    Repeat.prototype.reverse = function() {
      return this;
    };

    Repeat.prototype.indexOf = function(searchValue) {
      if (is(this._value, searchValue)) {
        return 0;
      }
      return -1;
    };

    Repeat.prototype.lastIndexOf = function(searchValue) {
      if (is(this._value, searchValue)) {
        return this.size;
      }
      return -1;
    };

    Repeat.prototype.__iterate = function(fn, reverse) {
      for (var ii = 0; ii < this.size; ii++) {
        if (fn(this._value, ii, this) === false) {
          return ii + 1;
        }
      }
      return ii;
    };

    Repeat.prototype.__iterator = function(type, reverse) {var this$0 = this;
      var ii = 0;
      return new src_Iterator__Iterator(function() 
        {return ii < this$0.size ? iteratorValue(type, ii++, this$0._value) : iteratorDone()}
      );
    };

    Repeat.prototype.equals = function(other) {
      return other instanceof Repeat ?
        is(this._value, other._value) :
        deepEqual(other);
    };


  var EMPTY_REPEAT;

  /**
   * Contributes additional methods to a constructor
   */
  function mixin(ctor, methods) {
    var keyCopier = function(key ) { ctor.prototype[key] = methods[key]; };
    Object.keys(methods).forEach(keyCopier);
    Object.getOwnPropertySymbols &&
      Object.getOwnPropertySymbols(methods).forEach(keyCopier);
    return ctor;
  }

  Iterable.Iterator = src_Iterator__Iterator;

  mixin(Iterable, {

    // ### Conversion to other types

    toArray: function() {
      assertNotInfinite(this.size);
      var array = new Array(this.size || 0);
      this.valueSeq().__iterate(function(v, i)  { array[i] = v; });
      return array;
    },

    toIndexedSeq: function() {
      return new ToIndexedSequence(this);
    },

    toJS: function() {
      return this.toSeq().map(
        function(value ) {return value && typeof value.toJS === 'function' ? value.toJS() : value}
      ).__toJS();
    },

    toJSON: function() {
      return this.toSeq().map(
        function(value ) {return value && typeof value.toJSON === 'function' ? value.toJSON() : value}
      ).__toJS();
    },

    toKeyedSeq: function() {
      return new ToKeyedSequence(this, true);
    },

    toMap: function() {
      // Use Late Binding here to solve the circular dependency.
      return src_Map__Map(this.toKeyedSeq());
    },

    toObject: function() {
      assertNotInfinite(this.size);
      var object = {};
      this.__iterate(function(v, k)  { object[k] = v; });
      return object;
    },

    toOrderedMap: function() {
      // Use Late Binding here to solve the circular dependency.
      return OrderedMap(this.toKeyedSeq());
    },

    toOrderedSet: function() {
      // Use Late Binding here to solve the circular dependency.
      return OrderedSet(isKeyed(this) ? this.valueSeq() : this);
    },

    toSet: function() {
      // Use Late Binding here to solve the circular dependency.
      return src_Set__Set(isKeyed(this) ? this.valueSeq() : this);
    },

    toSetSeq: function() {
      return new ToSetSequence(this);
    },

    toSeq: function() {
      return isIndexed(this) ? this.toIndexedSeq() :
        isKeyed(this) ? this.toKeyedSeq() :
        this.toSetSeq();
    },

    toStack: function() {
      // Use Late Binding here to solve the circular dependency.
      return Stack(isKeyed(this) ? this.valueSeq() : this);
    },

    toList: function() {
      // Use Late Binding here to solve the circular dependency.
      return List(isKeyed(this) ? this.valueSeq() : this);
    },


    // ### Common JavaScript methods and properties

    toString: function() {
      return '[Iterable]';
    },

    __toString: function(head, tail) {
      if (this.size === 0) {
        return head + tail;
      }
      return head + ' ' + this.toSeq().map(this.__toStringMapper).join(', ') + ' ' + tail;
    },


    // ### ES6 Collection methods (ES6 Array and Map)

    concat: function() {var values = SLICE$0.call(arguments, 0);
      return reify(this, concatFactory(this, values));
    },

    contains: function(searchValue) {
      return this.includes(searchValue);
    },

    includes: function(searchValue) {
      return this.some(function(value ) {return is(value, searchValue)});
    },

    entries: function() {
      return this.__iterator(ITERATE_ENTRIES);
    },

    every: function(predicate, context) {
      assertNotInfinite(this.size);
      var returnValue = true;
      this.__iterate(function(v, k, c)  {
        if (!predicate.call(context, v, k, c)) {
          returnValue = false;
          return false;
        }
      });
      return returnValue;
    },

    filter: function(predicate, context) {
      return reify(this, filterFactory(this, predicate, context, true));
    },

    find: function(predicate, context, notSetValue) {
      var entry = this.findEntry(predicate, context);
      return entry ? entry[1] : notSetValue;
    },

    findEntry: function(predicate, context) {
      var found;
      this.__iterate(function(v, k, c)  {
        if (predicate.call(context, v, k, c)) {
          found = [k, v];
          return false;
        }
      });
      return found;
    },

    findLastEntry: function(predicate, context) {
      return this.toSeq().reverse().findEntry(predicate, context);
    },

    forEach: function(sideEffect, context) {
      assertNotInfinite(this.size);
      return this.__iterate(context ? sideEffect.bind(context) : sideEffect);
    },

    join: function(separator) {
      assertNotInfinite(this.size);
      separator = separator !== undefined ? '' + separator : ',';
      var joined = '';
      var isFirst = true;
      this.__iterate(function(v ) {
        isFirst ? (isFirst = false) : (joined += separator);
        joined += v !== null && v !== undefined ? v.toString() : '';
      });
      return joined;
    },

    keys: function() {
      return this.__iterator(ITERATE_KEYS);
    },

    map: function(mapper, context) {
      return reify(this, mapFactory(this, mapper, context));
    },

    reduce: function(reducer, initialReduction, context) {
      assertNotInfinite(this.size);
      var reduction;
      var useFirst;
      if (arguments.length < 2) {
        useFirst = true;
      } else {
        reduction = initialReduction;
      }
      this.__iterate(function(v, k, c)  {
        if (useFirst) {
          useFirst = false;
          reduction = v;
        } else {
          reduction = reducer.call(context, reduction, v, k, c);
        }
      });
      return reduction;
    },

    reduceRight: function(reducer, initialReduction, context) {
      var reversed = this.toKeyedSeq().reverse();
      return reversed.reduce.apply(reversed, arguments);
    },

    reverse: function() {
      return reify(this, reverseFactory(this, true));
    },

    slice: function(begin, end) {
      return reify(this, sliceFactory(this, begin, end, true));
    },

    some: function(predicate, context) {
      return !this.every(not(predicate), context);
    },

    sort: function(comparator) {
      return reify(this, sortFactory(this, comparator));
    },

    values: function() {
      return this.__iterator(ITERATE_VALUES);
    },


    // ### More sequential methods

    butLast: function() {
      return this.slice(0, -1);
    },

    isEmpty: function() {
      return this.size !== undefined ? this.size === 0 : !this.some(function()  {return true});
    },

    count: function(predicate, context) {
      return ensureSize(
        predicate ? this.toSeq().filter(predicate, context) : this
      );
    },

    countBy: function(grouper, context) {
      return countByFactory(this, grouper, context);
    },

    equals: function(other) {
      return deepEqual(this, other);
    },

    entrySeq: function() {
      var iterable = this;
      if (iterable._cache) {
        // We cache as an entries array, so we can just return the cache!
        return new ArraySeq(iterable._cache);
      }
      var entriesSequence = iterable.toSeq().map(entryMapper).toIndexedSeq();
      entriesSequence.fromEntrySeq = function()  {return iterable.toSeq()};
      return entriesSequence;
    },

    filterNot: function(predicate, context) {
      return this.filter(not(predicate), context);
    },

    findLast: function(predicate, context, notSetValue) {
      return this.toKeyedSeq().reverse().find(predicate, context, notSetValue);
    },

    first: function() {
      return this.find(returnTrue);
    },

    flatMap: function(mapper, context) {
      return reify(this, flatMapFactory(this, mapper, context));
    },

    flatten: function(depth) {
      return reify(this, flattenFactory(this, depth, true));
    },

    fromEntrySeq: function() {
      return new FromEntriesSequence(this);
    },

    get: function(searchKey, notSetValue) {
      return this.find(function(_, key)  {return is(key, searchKey)}, undefined, notSetValue);
    },

    getIn: function(searchKeyPath, notSetValue) {
      var nested = this;
      // Note: in an ES6 environment, we would prefer:
      // for (var key of searchKeyPath) {
      var iter = forceIterator(searchKeyPath);
      var step;
      while (!(step = iter.next()).done) {
        var key = step.value;
        nested = nested && nested.get ? nested.get(key, NOT_SET) : NOT_SET;
        if (nested === NOT_SET) {
          return notSetValue;
        }
      }
      return nested;
    },

    groupBy: function(grouper, context) {
      return groupByFactory(this, grouper, context);
    },

    has: function(searchKey) {
      return this.get(searchKey, NOT_SET) !== NOT_SET;
    },

    hasIn: function(searchKeyPath) {
      return this.getIn(searchKeyPath, NOT_SET) !== NOT_SET;
    },

    isSubset: function(iter) {
      iter = typeof iter.includes === 'function' ? iter : Iterable(iter);
      return this.every(function(value ) {return iter.includes(value)});
    },

    isSuperset: function(iter) {
      return iter.isSubset(this);
    },

    keySeq: function() {
      return this.toSeq().map(keyMapper).toIndexedSeq();
    },

    last: function() {
      return this.toSeq().reverse().first();
    },

    max: function(comparator) {
      return maxFactory(this, comparator);
    },

    maxBy: function(mapper, comparator) {
      return maxFactory(this, comparator, mapper);
    },

    min: function(comparator) {
      return maxFactory(this, comparator ? neg(comparator) : defaultNegComparator);
    },

    minBy: function(mapper, comparator) {
      return maxFactory(this, comparator ? neg(comparator) : defaultNegComparator, mapper);
    },

    rest: function() {
      return this.slice(1);
    },

    skip: function(amount) {
      return this.slice(Math.max(0, amount));
    },

    skipLast: function(amount) {
      return reify(this, this.toSeq().reverse().skip(amount).reverse());
    },

    skipWhile: function(predicate, context) {
      return reify(this, skipWhileFactory(this, predicate, context, true));
    },

    skipUntil: function(predicate, context) {
      return this.skipWhile(not(predicate), context);
    },

    sortBy: function(mapper, comparator) {
      return reify(this, sortFactory(this, comparator, mapper));
    },

    take: function(amount) {
      return this.slice(0, Math.max(0, amount));
    },

    takeLast: function(amount) {
      return reify(this, this.toSeq().reverse().take(amount).reverse());
    },

    takeWhile: function(predicate, context) {
      return reify(this, takeWhileFactory(this, predicate, context));
    },

    takeUntil: function(predicate, context) {
      return this.takeWhile(not(predicate), context);
    },

    valueSeq: function() {
      return this.toIndexedSeq();
    },


    // ### Hashable Object

    hashCode: function() {
      return this.__hash || (this.__hash = hashIterable(this));
    },


    // ### Internal

    // abstract __iterate(fn, reverse)

    // abstract __iterator(type, reverse)
  });

  // var IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
  // var IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
  // var IS_INDEXED_SENTINEL = '@@__IMMUTABLE_INDEXED__@@';
  // var IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';

  var IterablePrototype = Iterable.prototype;
  IterablePrototype[IS_ITERABLE_SENTINEL] = true;
  IterablePrototype[ITERATOR_SYMBOL] = IterablePrototype.values;
  IterablePrototype.__toJS = IterablePrototype.toArray;
  IterablePrototype.__toStringMapper = quoteString;
  IterablePrototype.inspect =
  IterablePrototype.toSource = function() { return this.toString(); };
  IterablePrototype.chain = IterablePrototype.flatMap;

  // Temporary warning about using length
  (function () {
    try {
      Object.defineProperty(IterablePrototype, 'length', {
        get: function () {
          if (!Iterable.noLengthWarning) {
            var stack;
            try {
              throw new Error();
            } catch (error) {
              stack = error.stack;
            }
            if (stack.indexOf('_wrapObject') === -1) {
              console && console.warn && console.warn(
                'iterable.length has been deprecated, '+
                'use iterable.size or iterable.count(). '+
                'This warning will become a silent error in a future version. ' +
                stack
              );
              return this.size;
            }
          }
        }
      });
    } catch (e) {}
  })();



  mixin(KeyedIterable, {

    // ### More sequential methods

    flip: function() {
      return reify(this, flipFactory(this));
    },

    findKey: function(predicate, context) {
      var entry = this.findEntry(predicate, context);
      return entry && entry[0];
    },

    findLastKey: function(predicate, context) {
      return this.toSeq().reverse().findKey(predicate, context);
    },

    keyOf: function(searchValue) {
      return this.findKey(function(value ) {return is(value, searchValue)});
    },

    lastKeyOf: function(searchValue) {
      return this.findLastKey(function(value ) {return is(value, searchValue)});
    },

    mapEntries: function(mapper, context) {var this$0 = this;
      var iterations = 0;
      return reify(this,
        this.toSeq().map(
          function(v, k)  {return mapper.call(context, [k, v], iterations++, this$0)}
        ).fromEntrySeq()
      );
    },

    mapKeys: function(mapper, context) {var this$0 = this;
      return reify(this,
        this.toSeq().flip().map(
          function(k, v)  {return mapper.call(context, k, v, this$0)}
        ).flip()
      );
    },

  });

  var KeyedIterablePrototype = KeyedIterable.prototype;
  KeyedIterablePrototype[IS_KEYED_SENTINEL] = true;
  KeyedIterablePrototype[ITERATOR_SYMBOL] = IterablePrototype.entries;
  KeyedIterablePrototype.__toJS = IterablePrototype.toObject;
  KeyedIterablePrototype.__toStringMapper = function(v, k)  {return JSON.stringify(k) + ': ' + quoteString(v)};



  mixin(IndexedIterable, {

    // ### Conversion to other types

    toKeyedSeq: function() {
      return new ToKeyedSequence(this, false);
    },


    // ### ES6 Collection methods (ES6 Array and Map)

    filter: function(predicate, context) {
      return reify(this, filterFactory(this, predicate, context, false));
    },

    findIndex: function(predicate, context) {
      var entry = this.findEntry(predicate, context);
      return entry ? entry[0] : -1;
    },

    indexOf: function(searchValue) {
      var key = this.toKeyedSeq().keyOf(searchValue);
      return key === undefined ? -1 : key;
    },

    lastIndexOf: function(searchValue) {
      return this.toSeq().reverse().indexOf(searchValue);
    },

    reverse: function() {
      return reify(this, reverseFactory(this, false));
    },

    slice: function(begin, end) {
      return reify(this, sliceFactory(this, begin, end, false));
    },

    splice: function(index, removeNum /*, ...values*/) {
      var numArgs = arguments.length;
      removeNum = Math.max(removeNum | 0, 0);
      if (numArgs === 0 || (numArgs === 2 && !removeNum)) {
        return this;
      }
      index = resolveBegin(index, this.size);
      var spliced = this.slice(0, index);
      return reify(
        this,
        numArgs === 1 ?
          spliced :
          spliced.concat(arrCopy(arguments, 2), this.slice(index + removeNum))
      );
    },


    // ### More collection methods

    findLastIndex: function(predicate, context) {
      var key = this.toKeyedSeq().findLastKey(predicate, context);
      return key === undefined ? -1 : key;
    },

    first: function() {
      return this.get(0);
    },

    flatten: function(depth) {
      return reify(this, flattenFactory(this, depth, false));
    },

    get: function(index, notSetValue) {
      index = wrapIndex(this, index);
      return (index < 0 || (this.size === Infinity ||
          (this.size !== undefined && index > this.size))) ?
        notSetValue :
        this.find(function(_, key)  {return key === index}, undefined, notSetValue);
    },

    has: function(index) {
      index = wrapIndex(this, index);
      return index >= 0 && (this.size !== undefined ?
        this.size === Infinity || index < this.size :
        this.indexOf(index) !== -1
      );
    },

    interpose: function(separator) {
      return reify(this, interposeFactory(this, separator));
    },

    interleave: function(/*...iterables*/) {
      var iterables = [this].concat(arrCopy(arguments));
      var zipped = zipWithFactory(this.toSeq(), IndexedSeq.of, iterables);
      var interleaved = zipped.flatten(true);
      if (zipped.size) {
        interleaved.size = zipped.size * iterables.length;
      }
      return reify(this, interleaved);
    },

    last: function() {
      return this.get(-1);
    },

    skipWhile: function(predicate, context) {
      return reify(this, skipWhileFactory(this, predicate, context, false));
    },

    zip: function(/*, ...iterables */) {
      var iterables = [this].concat(arrCopy(arguments));
      return reify(this, zipWithFactory(this, defaultZipper, iterables));
    },

    zipWith: function(zipper/*, ...iterables */) {
      var iterables = arrCopy(arguments);
      iterables[0] = this;
      return reify(this, zipWithFactory(this, zipper, iterables));
    },

  });

  IndexedIterable.prototype[IS_INDEXED_SENTINEL] = true;
  IndexedIterable.prototype[IS_ORDERED_SENTINEL] = true;



  mixin(SetIterable, {

    // ### ES6 Collection methods (ES6 Array and Map)

    get: function(value, notSetValue) {
      return this.has(value) ? value : notSetValue;
    },

    includes: function(value) {
      return this.has(value);
    },


    // ### More sequential methods

    keySeq: function() {
      return this.valueSeq();
    },

  });

  SetIterable.prototype.has = IterablePrototype.includes;


  // Mixin subclasses

  mixin(KeyedSeq, KeyedIterable.prototype);
  mixin(IndexedSeq, IndexedIterable.prototype);
  mixin(SetSeq, SetIterable.prototype);

  mixin(KeyedCollection, KeyedIterable.prototype);
  mixin(IndexedCollection, IndexedIterable.prototype);
  mixin(SetCollection, SetIterable.prototype);


  // #pragma Helper functions

  function keyMapper(v, k) {
    return k;
  }

  function entryMapper(v, k) {
    return [k, v];
  }

  function not(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    }
  }

  function neg(predicate) {
    return function() {
      return -predicate.apply(this, arguments);
    }
  }

  function quoteString(value) {
    return typeof value === 'string' ? JSON.stringify(value) : value;
  }

  function defaultZipper() {
    return arrCopy(arguments);
  }

  function defaultNegComparator(a, b) {
    return a < b ? 1 : a > b ? -1 : 0;
  }

  function hashIterable(iterable) {
    if (iterable.size === Infinity) {
      return 0;
    }
    var ordered = isOrdered(iterable);
    var keyed = isKeyed(iterable);
    var h = ordered ? 1 : 0;
    var size = iterable.__iterate(
      keyed ?
        ordered ?
          function(v, k)  { h = 31 * h + hashMerge(hash(v), hash(k)) | 0; } :
          function(v, k)  { h = h + hashMerge(hash(v), hash(k)) | 0; } :
        ordered ?
          function(v ) { h = 31 * h + hash(v) | 0; } :
          function(v ) { h = h + hash(v) | 0; }
    );
    return murmurHashOfSize(size, h);
  }

  function murmurHashOfSize(size, h) {
    h = src_Math__imul(h, 0xCC9E2D51);
    h = src_Math__imul(h << 15 | h >>> -15, 0x1B873593);
    h = src_Math__imul(h << 13 | h >>> -13, 5);
    h = (h + 0xE6546B64 | 0) ^ size;
    h = src_Math__imul(h ^ h >>> 16, 0x85EBCA6B);
    h = src_Math__imul(h ^ h >>> 13, 0xC2B2AE35);
    h = smi(h ^ h >>> 16);
    return h;
  }

  function hashMerge(a, b) {
    return a ^ b + 0x9E3779B9 + (a << 6) + (a >> 2) | 0; // int
  }

  var Immutable = {

    Iterable: Iterable,

    Seq: Seq,
    Collection: Collection,
    Map: src_Map__Map,
    OrderedMap: OrderedMap,
    List: List,
    Stack: Stack,
    Set: src_Set__Set,
    OrderedSet: OrderedSet,

    Record: Record,
    Range: Range,
    Repeat: Repeat,

    is: is,
    fromJS: fromJS,

  };

  return Immutable;

}));
},{}],2:[function(require,module,exports){
"use strict";

var buffers = require("./impl/buffers");
var channels = require("./impl/channels");
var select = require("./impl/select");
var process = require("./impl/process");
var timers = require("./impl/timers");

function spawn(gen, creator) {
  var ch = channels.chan(buffers.fixed(1));
  (new process.Process(gen, function(value) {
    if (value === channels.CLOSED) {
      ch.close();
    } else {
      process.put_then_callback(ch, value, function(ok) {
        ch.close();
      });
    }
  }, creator)).run();
  return ch;
};

function go(f, args) {
  args = args || [];

  var gen = f.apply(null, args);
  return spawn(gen, f);
};

function chan(bufferOrNumber, xform, exHandler) {
  var buf;
  if (bufferOrNumber === 0) {
    bufferOrNumber = null;
  }
  if (typeof bufferOrNumber === "number") {
    buf = buffers.fixed(bufferOrNumber);
  } else {
    buf = bufferOrNumber;
  }
  return channels.chan(buf, xform, exHandler);
};

function promiseChan(xform, exHandler){
    return chan(buffers.promise(), xform, exHandler);
};


module.exports = {
  buffers: {
    fixed: buffers.fixed,
    dropping: buffers.dropping,
    sliding: buffers.sliding,
    promise: buffers.promise
  },

  spawn: spawn,
  go: go,
  chan: chan,
  promiseChan: promiseChan,
  DEFAULT: select.DEFAULT,
  CLOSED: channels.CLOSED,

  put: process.put,
  take: process.take,
  sleep: process.sleep,
  alts: process.alts,
  putAsync: process.put_then_callback,
  takeAsync: process.take_then_callback,

  timeout: timers.timeout
};

},{"./impl/buffers":6,"./impl/channels":7,"./impl/process":9,"./impl/select":10,"./impl/timers":11}],3:[function(require,module,exports){
"use strict";

var csp = require("./csp.core");
var operations = require("./csp.operations");
var pipeline = require('./csp.pipeline');

csp.operations = operations;
csp.operations.pipeline = pipeline.pipeline;
csp.operations.pipelineAsync = pipeline.pipelineAsync;

module.exports = csp;

},{"./csp.core":2,"./csp.operations":4,"./csp.pipeline":5}],4:[function(require,module,exports){
"use strict";

var Box = require("./impl/channels").Box;

var csp = require("./csp.core"),
    go = csp.go,
    take = csp.take,
    put = csp.put,
    takeAsync = csp.takeAsync,
    putAsync = csp.putAsync,
    alts = csp.alts,
    chan = csp.chan,
    CLOSED = csp.CLOSED;


function mapFrom(f, ch) {
  return {
    is_closed: function() {
      return ch.is_closed();
    },
    close: function() {
      ch.close();
    },
    _put: function(value, handler) {
      return ch._put(value, handler);
    },
    _take: function(handler) {
      var result = ch._take({
        is_active: function() {
          return handler.is_active();
        },
        commit: function() {
          var take_cb = handler.commit();
          return function(value) {
            return take_cb(value === CLOSED ? CLOSED : f(value));
          };
        }
      });
      if (result) {
        var value = result.value;
        return new Box(value === CLOSED ? CLOSED : f(value));
      } else {
        return null;
      }
    }
  };
}

function mapInto(f, ch) {
  return {
    is_closed: function() {
      return ch.is_closed();
    },
    close: function() {
      ch.close();
    },
    _put: function(value, handler) {
      return ch._put(f(value), handler);
    },
    _take: function(handler) {
      return ch._take(handler);
    }
  };
}

function filterFrom(p, ch, bufferOrN) {
  var out = chan(bufferOrN);
  go(function*() {
    while (true) {
      var value = yield take(ch);
      if (value === CLOSED) {
        out.close();
        break;
      }
      if (p(value)) {
        yield put(out, value);
      }
    }
  });
  return out;
}

function filterInto(p, ch) {
  return {
    is_closed: function() {
      return ch.is_closed();
    },
    close: function() {
      ch.close();
    },
    _put: function(value, handler) {
      if (p(value)) {
        return ch._put(value, handler);
      } else {
        return new Box(!ch.is_closed());
      }
    },
    _take: function(handler) {
      return ch._take(handler);
    }
  };
}

function removeFrom(p, ch) {
  return filterFrom(function(value) {
    return !p(value);
  }, ch);
}

function removeInto(p, ch) {
  return filterInto(function(value) {
    return !p(value);
  }, ch);
}

function* mapcat(f, src, dst) {
  while (true) {
    var value = yield take(src);
    if (value === CLOSED) {
      dst.close();
      break;
    } else {
      var seq = f(value);
      var length = seq.length;
      for (var i = 0; i < length; i++) {
        yield put(dst, seq[i]);
      }
      if (dst.is_closed()) {
        break;
      }
    }
  }
}

function mapcatFrom(f, ch, bufferOrN) {
  var out = chan(bufferOrN);
  go(mapcat, [f, ch, out]);
  return out;
}

function mapcatInto(f, ch, bufferOrN) {
  var src = chan(bufferOrN);
  go(mapcat, [f, src, ch]);
  return src;
}

function pipe(src, dst, keepOpen) {
  go(function*() {
    while (true) {
      var value = yield take(src);
      if (value === CLOSED) {
        if (!keepOpen) {
          dst.close();
        }
        break;
      }
      if (!(yield put(dst, value))) {
        break;
      }
    }
  });
  return dst;
}

function split(p, ch, trueBufferOrN, falseBufferOrN) {
  var tch = chan(trueBufferOrN);
  var fch = chan(falseBufferOrN);
  go(function*() {
    while (true) {
      var value = yield take(ch);
      if (value === CLOSED) {
        tch.close();
        fch.close();
        break;
      }
      yield put(p(value) ? tch : fch, value);
    }
  });
  return [tch, fch];
}

function reduce(f, init, ch) {
  return go(function*() {
    var result = init;
    while (true) {
      var value = yield take(ch);
      if (value === CLOSED) {
        return result;
      } else {
        result = f(result, value);
      }
    }
  }, [], true);
}

function onto(ch, coll, keepOpen) {
  return go(function*() {
    var length = coll.length;
    // FIX: Should be a generic looping interface (for...in?)
    for (var i = 0; i < length; i++) {
      yield put(ch, coll[i]);
    }
    if (!keepOpen) {
      ch.close();
    }
  });
}

// TODO: Bounded?
function fromColl(coll) {
  var ch = chan(coll.length);
  onto(ch, coll);
  return ch;
}

function map(f, chs, bufferOrN) {
  var out = chan(bufferOrN);
  var length = chs.length;
  // Array holding 1 round of values
  var values = new Array(length);
  // TODO: Not sure why we need a size-1 buffer here
  var dchan = chan(1);
  // How many more items this round
  var dcount;
  // put callbacks for each channel
  var dcallbacks = new Array(length);
  for (var i = 0; i < length; i ++) {
    dcallbacks[i] = (function(i) {
      return function(value) {
        values[i] = value;
        dcount --;
        if (dcount === 0) {
          putAsync(dchan, values.slice(0));
        }
      };
    }(i));
  }
  go(function*() {
    while (true) {
      dcount = length;
      // We could just launch n goroutines here, but for effciency we
      // don't
      for (var i = 0; i < length; i ++) {
        try {
          takeAsync(chs[i], dcallbacks[i]);
        } catch (e) {
          // FIX: Hmm why catching here?
          dcount --;
        }
      }
      var values = yield take(dchan);
      for (i = 0; i < length; i ++) {
        if (values[i] === CLOSED) {
          out.close();
          return;
        }
      }
      yield put(out, f.apply(null, values));
    }
  });
  return out;
}

function merge(chs, bufferOrN) {
  var out = chan(bufferOrN);
  var actives = chs.slice(0);
  go(function*() {
    while (true) {
      if (actives.length === 0) {
        break;
      }
      var r = yield alts(actives);
      var value = r.value;
      if (value === CLOSED) {
        // Remove closed channel
        var i = actives.indexOf(r.channel);
        actives.splice(i, 1);
        continue;
      }
      yield put(out, value);
    }
    out.close();
  });
  return out;
}

function into(coll, ch) {
  var result = coll.slice(0);
  return reduce(function(result, item) {
    result.push(item);
    return result;
  }, result, ch);
}

function takeN(n, ch, bufferOrN) {
  var out = chan(bufferOrN);
  go(function*() {
    for (var i = 0; i < n; i ++) {
      var value = yield take(ch);
      if (value === CLOSED) {
        break;
      }
      yield put(out, value);
    }
    out.close();
  });
  return out;
}

var NOTHING = {};

function unique(ch, bufferOrN) {
  var out = chan(bufferOrN);
  var last = NOTHING;
  go(function*() {
    while (true) {
      var value = yield take(ch);
      if (value === CLOSED) {
        break;
      }
      if (value === last) {
        continue;
      }
      last = value;
      yield put(out, value);
    }
    out.close();
  });
  return out;
}

function partitionBy(f, ch, bufferOrN) {
  var out = chan(bufferOrN);
  var part = [];
  var last = NOTHING;
  go(function*() {
    while (true) {
      var value = yield take(ch);
      if (value === CLOSED) {
        if (part.length > 0) {
          yield put(out, part);
        }
        out.close();
        break;
      } else {
        var newItem = f(value);
        if (newItem === last || last === NOTHING) {
          part.push(value);
        } else {
          yield put(out, part);
          part = [value];
        }
        last = newItem;
      }
    }
  });
  return out;
}

function partition(n, ch, bufferOrN) {
  var out = chan(bufferOrN);
  go(function*() {
    while (true) {
      var part = new Array(n);
      for (var i = 0; i < n; i++) {
        var value = yield take(ch);
        if (value === CLOSED) {
          if (i > 0) {
            yield put(out, part.slice(0, i));
          }
          out.close();
          return;
        }
        part[i] = value;
      }
      yield put(out, part);
    }
  });
  return out;
}

// For channel identification
var genId = (function() {
  var i = 0;
  return function() {
    i ++;
    return "" + i;
  };
})();

var ID_ATTR = "__csp_channel_id";

// TODO: Do we need to check with hasOwnProperty?
function len(obj) {
  var count = 0;
  for (var p in obj) {
    count ++;
  }
  return count;
}

function chanId(ch) {
  var id = ch[ID_ATTR];
  if (id === undefined) {
    id = ch[ID_ATTR] = genId();
  }
  return id;
}

var Mult = function(ch) {
  this.taps = {};
  this.ch = ch;
};

var Tap = function(channel, keepOpen) {
  this.channel = channel;
  this.keepOpen = keepOpen;
};

Mult.prototype.muxch = function() {
  return this.ch;
};

Mult.prototype.tap = function(ch, keepOpen) {
  var id = chanId(ch);
  this.taps[id] = new Tap(ch, keepOpen);
};

Mult.prototype.untap = function(ch) {
  delete this.taps[chanId(ch)];
};

Mult.prototype.untapAll = function() {
  this.taps = {};
};

function mult(ch) {
  var m = new Mult(ch);
  var dchan = chan(1);
  var dcount;
  function makeDoneCallback(tap) {
    return function(stillOpen) {
      dcount --;
      if (dcount === 0) {
        putAsync(dchan, true);
      }
      if (!stillOpen) {
        m.untap(tap.channel);
      }
    };
  }
  go(function*() {
    while (true) {
      var value = yield take(ch);
      var id, t;
      var taps = m.taps;
      if (value === CLOSED) {
        for (id in taps) {
          t = taps[id];
          if (!t.keepOpen) {
            t.channel.close();
          }
        }
        // TODO: Is this necessary?
        m.untapAll();
        break;
      }
      dcount = len(taps);
      // XXX: This is because putAsync can actually call back
      // immediately. Fix that
      var initDcount = dcount;
      // Put value on tapping channels...
      for (id in taps) {
        t = taps[id];
        putAsync(t.channel, value, makeDoneCallback(t));
      }
      // ... waiting for all puts to complete
      if (initDcount > 0) {
        yield take(dchan);
      }
    }
  });
  return m;
}

mult.tap = function tap(m, ch, keepOpen) {
  m.tap(ch, keepOpen);
  return ch;
};

mult.untap = function untap(m, ch) {
  m.untap(ch);
};

mult.untapAll = function untapAll(m) {
  m.untapAll();
};

var Mix = function(ch) {
  this.ch = ch;
  this.stateMap = {};
  this.change = chan();
  this.soloMode = mix.MUTE;
};

Mix.prototype._changed = function() {
  putAsync(this.change, true);
};

Mix.prototype._getAllState = function() {
  var allState = {};
  var stateMap = this.stateMap;
  var solos = [];
  var mutes = [];
  var pauses = [];
  var reads;
  for (var id in stateMap) {
    var chanData = stateMap[id];
    var state = chanData.state;
    var channel = chanData.channel;
    if (state[mix.SOLO]) {
      solos.push(channel);
    }
    // TODO
    if (state[mix.MUTE]) {
      mutes.push(channel);
    }
    if (state[mix.PAUSE]) {
      pauses.push(channel);
    }
  }
  var i, n;
  if (this.soloMode === mix.PAUSE && solos.length > 0) {
    n = solos.length;
    reads = new Array(n + 1);
    for (i = 0; i < n; i++) {
      reads[i] = solos[i];
    }
    reads[n] = this.change;
  } else {
    reads = [];
    for (id in stateMap) {
      chanData = stateMap[id];
      channel = chanData.channel;
      if (pauses.indexOf(channel) < 0) {
        reads.push(channel);
      }
    }
    reads.push(this.change);
  }

  return {
    solos: solos,
    mutes: mutes,
    reads: reads
  };
};

Mix.prototype.admix = function(ch) {
  this.stateMap[chanId(ch)] = {
    channel: ch,
    state: {}
  };
  this._changed();
};

Mix.prototype.unmix = function(ch) {
  delete this.stateMap[chanId(ch)];
  this._changed();
};

Mix.prototype.unmixAll = function() {
  this.stateMap = {};
  this._changed();
};

Mix.prototype.toggle = function(updateStateList) {
  // [[ch1, {}], [ch2, {solo: true}]];
  var length = updateStateList.length;
  for (var i = 0; i < length; i++) {
    var ch = updateStateList[i][0];
    var id = chanId(ch);
    var updateState = updateStateList[i][1];
    var chanData = this.stateMap[id];
    if (!chanData) {
      chanData = this.stateMap[id] = {
        channel: ch,
        state: {}
      };
    }
    for (var mode in updateState) {
      chanData.state[mode] = updateState[mode];
    }
  }
  this._changed();
};

Mix.prototype.setSoloMode = function(mode) {
  if (VALID_SOLO_MODES.indexOf(mode) < 0) {
    throw new Error("Mode must be one of: ", VALID_SOLO_MODES.join(", "));
  }
  this.soloMode = mode;
  this._changed();
};

function mix(out) {
  var m = new Mix(out);
  go(function*() {
    var state = m._getAllState();
    while (true) {
      var result = yield alts(state.reads);
      var value = result.value;
      var channel = result.channel;
      if (value === CLOSED) {
        delete m.stateMap[chanId(channel)];
        state = m._getAllState();
        continue;
      }
      if (channel === m.change) {
        state = m._getAllState();
        continue;
      }
      var solos = state.solos;
      if (solos.indexOf(channel) > -1 ||
          (solos.length === 0 && !(state.mutes.indexOf(channel) > -1))) {
        var stillOpen = yield put(out, value);
        if (!stillOpen) {
          break;
        }
      }
    }
  });
  return m;
}

mix.MUTE = "mute";
mix.PAUSE = "pause";
mix.SOLO = "solo";
var VALID_SOLO_MODES = [mix.MUTE, mix.PAUSE];

mix.add = function admix(m, ch) {
  m.admix(ch);
};

mix.remove = function unmix(m, ch) {
  m.unmix(ch);
};

mix.removeAll = function unmixAll(m) {
  m.unmixAll();
};

mix.toggle = function toggle(m, updateStateList) {
  m.toggle(updateStateList);
};

mix.setSoloMode = function setSoloMode(m, mode) {
  m.setSoloMode(mode);
};

function constantlyNull() {
  return null;
}

var Pub = function(ch, topicFn, bufferFn) {
  this.ch = ch;
  this.topicFn = topicFn;
  this.bufferFn = bufferFn;
  this.mults = {};
};

Pub.prototype._ensureMult = function(topic) {
  var m = this.mults[topic];
  var bufferFn = this.bufferFn;
  if (!m) {
    m = this.mults[topic] = mult(chan(bufferFn(topic)));
  }
  return m;
};

Pub.prototype.sub = function(topic, ch, keepOpen) {
  var m = this._ensureMult(topic);
  return mult.tap(m, ch, keepOpen);
};

Pub.prototype.unsub = function(topic, ch) {
  var m = this.mults[topic];
  if (m) {
    mult.untap(m, ch);
  }
};

Pub.prototype.unsubAll = function(topic) {
  if (topic === undefined) {
    this.mults = {};
  } else {
    delete this.mults[topic];
  }
};

function pub(ch, topicFn, bufferFn) {
  bufferFn = bufferFn || constantlyNull;
  var p = new Pub(ch, topicFn, bufferFn);
  go(function*() {
    while (true) {
      var value = yield take(ch);
      var mults = p.mults;
      var topic;
      if (value === CLOSED) {
        for (topic in mults) {
          mults[topic].muxch().close();
        }
        break;
      }
      // TODO: Somehow ensure/document that this must return a string
      // (otherwise use proper (hash)maps)
      topic = topicFn(value);
      var m = mults[topic];
      if (m) {
        var stillOpen = yield put(m.muxch(), value);
        if (!stillOpen) {
          delete mults[topic];
        }
      }
    }
  });
  return p;
}

pub.sub = function sub(p, topic, ch, keepOpen) {
  return p.sub(topic, ch, keepOpen);
};

pub.unsub = function unsub(p, topic, ch) {
  p.unsub(topic, ch);
};

pub.unsubAll = function unsubAll(p, topic) {
  p.unsubAll(topic);
};

module.exports = {
  mapFrom: mapFrom,
  mapInto: mapInto,
  filterFrom: filterFrom,
  filterInto: filterInto,
  removeFrom: removeFrom,
  removeInto: removeInto,
  mapcatFrom: mapcatFrom,
  mapcatInto: mapcatInto,

  pipe: pipe,
  split: split,
  reduce: reduce,
  onto: onto,
  fromColl: fromColl,

  map: map,
  merge: merge,
  into: into,
  take: takeN,
  unique: unique,
  partition: partition,
  partitionBy: partitionBy,

  mult: mult,
  mix: mix,
  pub: pub
};


// Possible "fluid" interfaces:

// thread(
//   [fromColl, [1, 2, 3, 4]],
//   [mapFrom, inc],
//   [into, []]
// )

// thread(
//   [fromColl, [1, 2, 3, 4]],
//   [mapFrom, inc, _],
//   [into, [], _]
// )

// wrap()
//   .fromColl([1, 2, 3, 4])
//   .mapFrom(inc)
//   .into([])
//   .unwrap();

},{"./csp.core":2,"./impl/channels":7}],5:[function(require,module,exports){
"use strict";

var csp = require('./csp.core');

function pipelineInternal(n, to, from, close, taskFn) {
  if (n <= 0) {
    throw new Error('n must be positive');
  }

  var jobs = csp.chan(n);
  var results = csp.chan(n);

  for(var _ = 0; _ < n; _++) {
    csp.go(function* (taskFn, jobs, results) {
      while (true) {
        var job = yield csp.take(jobs);

        if (!taskFn(job)) {
          results.close();
          break;
        }
      }
    }, [taskFn, jobs, results]);
  }

  csp.go(function* (jobs, from, results) {
    while (true) {
      var v = yield csp.take(from);
      if (v === csp.CLOSED) {
        jobs.close();
        break;
      } else {
        var p = csp.chan(1);

        yield csp.put(jobs, [v, p]);
        yield csp.put(results, p);
      }
    }
  }, [jobs, from, results]);

  csp.go(function* (results, close, to) {
    while(true) {
      var p = yield csp.take(results);
      if (p === csp.CLOSED) {
        if (close) {
          to.close();
        }
        break;
      } else {
        var res = yield csp.take(p);
        while(true) {
          var v = yield csp.take(res);
          if (v !== csp.CLOSED) {
            yield csp.put(to, v);
          } else {
            break;
          }
        }
      }
    }
  }, [results, close, to]);

  return to;
}

function pipeline(to, xf, from, keepOpen, exHandler) {

  function taskFn(job) {
    if (job === csp.CLOSED) {
      return null;
    } else {
      var v = job[0];
      var p = job[1];
      var res = csp.chan(1, xf, exHandler);

      csp.go(function* (res, v) {
        yield csp.put(res, v);
        res.close();
      }, [res, v]);

      csp.putAsync(p, res);

      return true;
    }
  }

  return pipelineInternal(1, to, from, !keepOpen, taskFn);
}

function pipelineAsync(n, to, af, from, keepOpen) {

  function taskFn(job) {
    if (job === csp.CLOSED) {
      return null;
    } else {
      var v = job[0];
      var p = job[1];
      var res = csp.chan(1);
      af(v, res);
      csp.putAsync(p, res);
      return true;
    }
  }

  return pipelineInternal(n, to, from, !keepOpen, taskFn);
}

module.exports = {
  pipeline: pipeline,
  pipelineAsync: pipelineAsync
};

},{"./csp.core":2}],6:[function(require,module,exports){
"use strict";

// TODO: Consider EmptyError & FullError to avoid redundant bound
// checks, to improve performance (may need benchmarks)

function acopy(src, src_start, dst, dst_start, length) {
  var count = 0;
  while (true) {
    if (count >= length) {
      break;
    }
    dst[dst_start + count] = src[src_start + count];
    count ++;
  }
}

function noop() {};

var EMPTY = {
  toString: function() {
    return "[object EMPTY]";
  }
};

var RingBuffer = function(head, tail, length, array) {
  this.length = length;
  this.array = array;
  this.head = head;
  this.tail = tail;
};

// Internal method, callers must do bound check
RingBuffer.prototype._unshift = function(item) {
  var array = this.array;
  var head = this.head;
  array[head] = item;
  this.head = (head + 1) % array.length;
  this.length ++;
};

RingBuffer.prototype._resize = function() {
  var array = this.array;
  var new_length = 2 * array.length;
  var new_array = new Array(new_length);
  var head = this.head;
  var tail = this.tail;
  var length = this.length;
  if (tail < head) {
    acopy(array, tail, new_array, 0, length);
    this.tail = 0;
    this.head = length;
    this.array = new_array;
  } else if (tail > head) {
    acopy(array, tail, new_array, 0, array.length - tail);
    acopy(array, 0, new_array, array.length - tail, head);
    this.tail = 0;
    this.head = length;
    this.array = new_array;
  } else if (tail === head) {
    this.tail = 0;
    this.head = 0;
    this.array = new_array;
  }
};

RingBuffer.prototype.unbounded_unshift = function(item) {
  if (this.length + 1 === this.array.length) {
    this._resize();
  }
  this._unshift(item);
};

RingBuffer.prototype.pop = function() {
  if (this.length === 0) {
    return EMPTY;
  }
  var array = this.array;
  var tail = this.tail;
  var item = array[tail];
  array[tail] = null;
  this.tail = (tail + 1) % array.length;
  this.length --;
  return item;
};

RingBuffer.prototype.cleanup = function(predicate) {
  var length = this.length;
  for (var i = 0; i < length; i++) {
    var item = this.pop();
    if (predicate(item)) {
      this._unshift(item);
    }
  }
};

var FixedBuffer = function(buf,  n) {
  this.buf = buf;
  this.n = n;
};

FixedBuffer.prototype.is_full = function() {
  return this.buf.length >= this.n;
};

FixedBuffer.prototype.remove = function() {
  return this.buf.pop();
};

FixedBuffer.prototype.add = function(item) {
  // Note that even though the underlying buffer may grow, "n" is
  // fixed so after overflowing the buffer is still considered full.
  this.buf.unbounded_unshift(item);
};

FixedBuffer.prototype.count = function() {
  return this.buf.length;
};

FixedBuffer.prototype.close = noop;

var DroppingBuffer = function(buf, n) {
  this.buf = buf;
  this.n = n;
};

DroppingBuffer.prototype.is_full = function() {
  return false;
};

DroppingBuffer.prototype.remove = function() {
  return this.buf.pop();
};

DroppingBuffer.prototype.add = function(item) {
  if (this.buf.length < this.n) {
    this.buf._unshift(item);
  }
};

DroppingBuffer.prototype.count = function() {
  return this.buf.length;
};

DroppingBuffer.prototype.close = noop;

var SlidingBuffer = function(buf, n) {
  this.buf = buf;
  this.n = n;
};

SlidingBuffer.prototype.is_full = function() {
  return false;
};

SlidingBuffer.prototype.remove = function() {
  return this.buf.pop();
};

SlidingBuffer.prototype.add = function(item) {
  if (this.buf.length === this.n) {
    this.buf.pop();
  }
  this.buf._unshift(item);
};

SlidingBuffer.prototype.count = function() {
  return this.buf.length;
};

SlidingBuffer.prototype.close = noop;

var PromiseBuffer = function PromiseBuffer() {
  this.val = EMPTY;
};

PromiseBuffer.prototype.count = function() {
  return (this.val === EMPTY) ? 0 : 1;
};

PromiseBuffer.prototype.add = function(item) {
  if (this.val === EMPTY) {
    this.val = item;
  }
};

PromiseBuffer.prototype.is_full = function() {
  return false;
};

PromiseBuffer.prototype.remove = function() {
  return this.val;
};

PromiseBuffer.prototype.close = function() {
  this.val = EMPTY;
};

var ring = exports.ring = function ring_buffer(n) {
  return new RingBuffer(0, 0, 0, new Array(n));
};

/**
 * Returns a buffer that is considered "full" when it reaches size n,
 * but still accepts additional items, effectively allow overflowing.
 * The overflowing behavior is useful for supporting "expanding"
 * transducers, where we want to check if a buffer is full before
 * running the transduced step function, while still allowing a
 * transduced step to expand into multiple "essence" steps.
 */
exports.fixed = function fixed_buffer(n) {
  return new FixedBuffer(ring(n), n);
};

exports.dropping = function dropping_buffer(n) {
  return new DroppingBuffer(ring(n), n);
};

exports.sliding = function sliding_buffer(n) {
  return new SlidingBuffer(ring(n), n);
};

exports.promise = function promise_buffer() {
  return new PromiseBuffer();
};

exports.EMPTY = EMPTY;

},{}],7:[function(require,module,exports){
"use strict";

var buffers = require("./buffers");
var dispatch = require("./dispatch");

var MAX_DIRTY = 64;
var MAX_QUEUE_SIZE = 1024;

var CLOSED = null;

var Box = function(value) {
  this.value = value;
};

var PutBox = function(handler, value) {
  this.handler = handler;
  this.value = value;
};

var Channel = function(takes, puts, buf, xform) {
  this.buf = buf;
  this.xform = xform;
  this.takes = takes;
  this.puts = puts;

  this.dirty_takes = 0;
  this.dirty_puts = 0;
  this.closed = false;
};

function isReduced(v) {
  return v && v["@@transducer/reduced"];
}

function schedule(f, v) {
  dispatch.run(function() {
    f(v);
  });
}

Channel.prototype._put = function(value, handler) {
  if (value === CLOSED) {
    throw new Error("Cannot put CLOSED on a channel.");
  }

  // TODO: I'm not sure how this can happen, because the operations
  // are registered in 1 tick, and the only way for this to be inactive
  // is for a previous operation in the same alt to have returned
  // immediately, which would have short-circuited to prevent this to
  // be ever register anyway. The same thing goes for the active check
  // in "_take".
  if (!handler.is_active()) {
    return null;
  }

  if (this.closed) {
    handler.commit();
    return new Box(false);
  }

  var taker, callback;

  // Soak the value through the buffer first, even if there is a
  // pending taker. This way the step function has a chance to act on the
  // value.
  if (this.buf && !this.buf.is_full()) {
    handler.commit();
    var done = isReduced(this.xform["@@transducer/step"](this.buf, value));
    while (true) {
      if (this.buf.count() === 0) {
        break;
      }
      taker = this.takes.pop();
      if (taker === buffers.EMPTY) {
        break;
      }
      if (taker.is_active()) {
        value = this.buf.remove();
        callback = taker.commit();
        schedule(callback, value);
      }
    }
    if (done) {
      this.close();
    }
    return new Box(true);
  }

  // Either the buffer is full, in which case there won't be any
  // pending takes, or we don't have a buffer, in which case this loop
  // fulfills the first of them that is active (note that we don't
  // have to worry about transducers here since we require a buffer
  // for that).
  while (true) {
    taker = this.takes.pop();
    if (taker === buffers.EMPTY) {
      break;
    }
    if (taker.is_active()) {
      handler.commit();
      callback = taker.commit();
      schedule(callback, value);
      return new Box(true);
    }
  }

  // No buffer, full buffer, no pending takes. Queue this put now.
  if (this.dirty_puts > MAX_DIRTY) {
    this.puts.cleanup(function(putter) {
      return putter.handler.is_active();
    });
    this.dirty_puts = 0;
  } else {
    this.dirty_puts ++;
  }
  if (this.puts.length >= MAX_QUEUE_SIZE) {
    throw new Error("No more than " + MAX_QUEUE_SIZE + " pending puts are allowed on a single channel.");
  }
  this.puts.unbounded_unshift(new PutBox(handler, value));
  return null;
};

Channel.prototype._take = function(handler) {
  if (!handler.is_active()) {
    return null;
  }

  var putter, put_handler, callback, value;

  if (this.buf && this.buf.count() > 0) {
    handler.commit();
    value = this.buf.remove();
    // We need to check pending puts here, other wise they won't
    // be able to proceed until their number reaches MAX_DIRTY
    while (true) {
      if (this.buf.is_full()) {
        break;
      }
      putter = this.puts.pop();
      if (putter === buffers.EMPTY) {
        break;
      }
      put_handler = putter.handler;
      if (put_handler.is_active()) {
        callback = put_handler.commit();
        if (callback) {
          schedule(callback, true);
        }
        if (isReduced(this.xform["@@transducer/step"](this.buf, putter.value))) {
          this.close();
        }
      }
    }
    return new Box(value);
  }

  // Either the buffer is empty, in which case there won't be any
  // pending puts, or we don't have a buffer, in which case this loop
  // fulfills the first of them that is active (note that we don't
  // have to worry about transducers here since we require a buffer
  // for that).
  while (true) {
    putter = this.puts.pop();
    value = putter.value;
    if (putter === buffers.EMPTY) {
      break;
    }
    put_handler = putter.handler;
    if (put_handler.is_active()) {
      handler.commit();
      callback = put_handler.commit();
      if (callback) {
        schedule(callback, true);
      }
      return new Box(value);
    }
  }

  if (this.closed) {
    handler.commit();
    return new Box(CLOSED);
  }

  // No buffer, empty buffer, no pending puts. Queue this take now.
  if (this.dirty_takes > MAX_DIRTY) {
    this.takes.cleanup(function(handler) {
      return handler.is_active();
    });
    this.dirty_takes = 0;
  } else {
    this.dirty_takes ++;
  }
  if (this.takes.length >= MAX_QUEUE_SIZE) {
    throw new Error("No more than " + MAX_QUEUE_SIZE + " pending takes are allowed on a single channel.");
  }
  this.takes.unbounded_unshift(handler);
  return null;
};

Channel.prototype.close = function() {
  if (this.closed) {
    return;
  }
  this.closed = true;

  // TODO: Duplicate code. Make a "_flush" function or something
  if (this.buf) {
    this.buf.close();
    this.xform["@@transducer/result"](this.buf);
    while (true) {
      if (this.buf.count() === 0) {
        break;
      }
      taker = this.takes.pop();
      if (taker === buffers.EMPTY) {
        break;
      }
      if (taker.is_active()) {
        callback = taker.commit();
        var value = this.buf.remove();
        schedule(callback, value);
      }
    }
  }

  while (true) {
    var taker = this.takes.pop();
    if (taker === buffers.EMPTY) {
      break;
    }
    if (taker.is_active()) {
      var callback = taker.commit();
      schedule(callback, CLOSED);
    }
  }

  while (true) {
    var putter = this.puts.pop();
    if (putter === buffers.EMPTY) {
      break;
    }
    if (putter.handler.is_active()) {
      var put_callback = putter.handler.commit();
      if (put_callback) {
        schedule(put_callback, false);
      }
    }
  }
};


Channel.prototype.is_closed = function() {
  return this.closed;
};

function defaultHandler(e) {
  console.log('error in channel transformer', e.stack);
  return CLOSED;
}

function handleEx(buf, exHandler, e) {
  var def = (exHandler || defaultHandler)(e);
  if (def !== CLOSED) {
    buf.add(def);
  }
  return buf;
}

// The base transformer object to use with transducers
function AddTransformer() {
}

AddTransformer.prototype["@@transducer/init"] = function() {
  throw new Error('init not available');
};

AddTransformer.prototype["@@transducer/result"] = function(v) {
  return v;
};

AddTransformer.prototype["@@transducer/step"] = function(buffer, input) {
  buffer.add(input);
  return buffer;
};


function handleException(exHandler) {
  return function(xform) {
    return {
      "@@transducer/step": function(buffer, input) {
        try {
          return xform["@@transducer/step"](buffer, input);
        } catch (e) {
          return handleEx(buffer, exHandler, e);
        }
      },
      "@@transducer/result": function(buffer) {
        try {
          return xform["@@transducer/result"](buffer);
        } catch (e) {
          return handleEx(buffer, exHandler, e);
        }
      }
    };
  };
}

// XXX: This is inconsistent. We should either call the reducing
// function xform, or call the transducer xform, not both
exports.chan = function(buf, xform, exHandler) {
  if (xform) {
    if (!buf) {
      throw new Error("Only buffered channels can use transducers");
    }

    xform = xform(new AddTransformer());
  } else {
    xform = new AddTransformer();
  }
  xform = handleException(exHandler)(xform);

  return new Channel(buffers.ring(32), buffers.ring(32), buf, xform);
};

exports.Box = Box;
exports.Channel = Channel;
exports.CLOSED = CLOSED;

},{"./buffers":6,"./dispatch":8}],8:[function(require,module,exports){
"use strict";

// TODO: Use process.nextTick if it's available since it's more
// efficient
// http://howtonode.org/understanding-process-next-tick
// Maybe we don't even need to queue ourselves in that case?

// XXX: But http://blog.nodejs.org/2013/03/11/node-v0-10-0-stable/
// Looks like it will blow up the stack (or is that just about
// pre-empting IO (but that's already bad enough IMO)?)

// Looks like
// http://nodejs.org/api/process.html#process_process_nexttick_callback
// is the equivalent of our TASK_BATCH_SIZE

var buffers = require("./buffers");

var TASK_BATCH_SIZE = 1024;

var tasks = buffers.ring(32);
var running = false;
var queued = false;

var queue_dispatcher;

function process_messages() {
  running = true;
  queued = false;
  var count = 0;
  while (true) {
    var task = tasks.pop();
    if (task === buffers.EMPTY) {
      break;
    }
    // TODO: Don't we need a try/finally here?
    task();
    if (count >= TASK_BATCH_SIZE) {
      break;
    }
    count ++;
  }
  running = false;
  if (tasks.length > 0) {
    queue_dispatcher();
  }
}

if (typeof MessageChannel !== "undefined") {
  var message_channel = new MessageChannel();
  message_channel.port1.onmessage = function(_) {
    process_messages();
  };
  queue_dispatcher = function()  {
    if (!(queued && running)) {
      queued = true;
      message_channel.port2.postMessage(0);
    }
  };
} else if (typeof setImmediate !== "undefined") {
  queue_dispatcher = function() {
    if (!(queued && running)) {
      queued = true;
      setImmediate(process_messages);
    }
  };
} else {
  queue_dispatcher = function() {
    if (!(queued && running)) {
      queued = true;
      setTimeout(process_messages, 0);
    }
  };
}

exports.run = function (f) {
  tasks.unbounded_unshift(f);
  queue_dispatcher();
};

exports.queue_delay = function(f, delay) {
  setTimeout(f, delay);
};

},{"./buffers":6}],9:[function(require,module,exports){
"use strict";

var dispatch = require("./dispatch");
var select = require("./select");
var Channel = require("./channels").Channel;

var FnHandler = function(f) {
  this.f = f;
};

FnHandler.prototype.is_active = function() {
  return true;
};

FnHandler.prototype.commit = function() {
  return this.f;
};

function put_then_callback(channel, value, callback) {
  var result = channel._put(value, new FnHandler(callback));
  if (result && callback) {
    callback(result.value);
  }
}

function take_then_callback(channel, callback) {
  var result = channel._take(new FnHandler(callback));
  if (result) {
    callback(result.value);
  }
}

var Process = function(gen, onFinish, creator) {
  this.gen = gen;
  this.creatorFunc = creator;
  this.finished = false;
  this.onFinish = onFinish;
};

var Instruction = function(op, data) {
  this.op = op;
  this.data = data;
};

var TAKE = "take";
var PUT = "put";
var SLEEP = "sleep";
var ALTS = "alts";

// TODO FIX XXX: This is a (probably) temporary hack to avoid blowing
// up the stack, but it means double queueing when the value is not
// immediately available
Process.prototype._continue = function(response) {
  var self = this;
  dispatch.run(function() {
    self.run(response);
  });
};

Process.prototype._done = function(value) {
  if (!this.finished) {
    this.finished = true;
    var onFinish = this.onFinish;
    if (typeof onFinish === "function") {
      dispatch.run(function() {
        onFinish(value);
      });
    }
  }
};

Process.prototype.run = function(response) {
  if (this.finished) {
    return;
  }

  // TODO: Shouldn't we (optionally) stop error propagation here (and
  // signal the error through a channel or something)? Otherwise the
  // uncaught exception will crash some runtimes (e.g. Node)
  var iter = this.gen.next(response);
  if (iter.done) {
    this._done(iter.value);
    return;
  }

  var ins = iter.value;
  var self = this;

  if (ins instanceof Instruction) {
    switch (ins.op) {
    case PUT:
      var data = ins.data;
      put_then_callback(data.channel, data.value, function(ok) {
        self._continue(ok);
      });
      break;

    case TAKE:
      var channel = ins.data;
      take_then_callback(channel, function(value) {
        self._continue(value);
      });
      break;

    case SLEEP:
      var msecs = ins.data;
      dispatch.queue_delay(function() {
        self.run(null);
      }, msecs);
      break;

    case ALTS:
      select.do_alts(ins.data.operations, function(result) {
        self._continue(result);
      }, ins.data.options);
      break;
    }
  }
  else if(ins instanceof Channel) {
    var channel = ins;
    take_then_callback(channel, function(value) {
      self._continue(value);
    });
  }
  else {
    this._continue(ins);
  }
};

function take(channel) {
  return new Instruction(TAKE, channel);
}

function put(channel, value) {
  return new Instruction(PUT, {
    channel: channel,
    value: value
  });
}

function sleep(msecs) {
  return new Instruction(SLEEP, msecs);
}

function alts(operations, options) {
  return new Instruction(ALTS, {
    operations: operations,
    options: options
  });
}

exports.put_then_callback = put_then_callback;
exports.take_then_callback = take_then_callback;
exports.put = put;
exports.take = take;
exports.sleep = sleep;
exports.alts = alts;
exports.Instruction = Instruction;
exports.Process = Process;

},{"./channels":7,"./dispatch":8,"./select":10}],10:[function(require,module,exports){
"use strict";

var Box = require("./channels").Box;

var AltHandler = function(flag, f) {
  this.f = f;
  this.flag = flag;
};

AltHandler.prototype.is_active = function() {
  return this.flag.value;
};

AltHandler.prototype.commit = function() {
  this.flag.value = false;
  return this.f;
};

var AltResult = function(value, channel) {
  this.value = value;
  this.channel = channel;
};

function rand_int(n) {
  return Math.floor(Math.random() * (n + 1));
}

function random_array(n) {
  var a = new Array(n);
  var i;
  for (i = 0; i < n; i++) {
    a[i] = 0;
  }
  for (i = 1; i < n; i++) {
    var j = rand_int(i);
    a[i] = a[j];
    a[j] = i;
  }
  return a;
}

var hasOwnProperty = Object.prototype.hasOwnProperty;

var DEFAULT = {
  toString: function() {
    return "[object DEFAULT]";
  }
};

// TODO: Accept a priority function or something
exports.do_alts = function(operations, callback, options) {
  var length = operations.length;
  // XXX Hmm
  if (length === 0) {
    throw new Error("Empty alt list");
  }

  var priority = (options && options.priority) ? true : false;
  if (!priority) {
    var indexes = random_array(length);
  }

  var flag = new Box(true);

  for (var i = 0; i < length; i++) {
    var operation = operations[priority ? i : indexes[i]];
    var port, result;
    // XXX Hmm
    if (operation instanceof Array) {
      var value = operation[1];
      port = operation[0];
      // We wrap this in a function to capture the value of "port",
      // because js' closure captures vars by "references", not
      // values. "let port" would have worked, but I don't want to
      // raise the runtime requirement yet. TODO: So change this when
      // most runtimes are modern enough.
      result = port._put(value, (function(port) {
        return new AltHandler(flag, function(ok) {
          callback(new AltResult(ok, port));
        });
      })(port));
    } else {
      port = operation;
      result = port._take((function(port) {
        return new AltHandler(flag, function(value) {
          callback(new AltResult(value, port));
        });
      })(port));
    }
    // XXX Hmm
    if (result instanceof Box) {
      callback(new AltResult(result.value, port));
      break;
    }
  }

  if (!(result instanceof Box)
      && options
      && hasOwnProperty.call(options, "default")) {
    if (flag.value) {
      flag.value = false;
      callback(new AltResult(options["default"], DEFAULT));
    }
  }
};

exports.DEFAULT = DEFAULT;

},{"./channels":7}],11:[function(require,module,exports){
"use strict";

var dispatch = require("./dispatch");
var channels = require("./channels");

exports.timeout = function timeout_channel(msecs) {
  var chan = channels.chan();
  dispatch.queue_delay(function() {
    chan.close();
  }, msecs);
  return chan;
};

},{"./channels":7,"./dispatch":8}],12:[function(require,module,exports){

// basic protocol helpers

var symbolExists = typeof Symbol !== 'undefined';

var protocols = {
  iterator: symbolExists ? Symbol.iterator : '@@iterator'
};

function throwProtocolError(name, coll) {
  throw new Error("don't know how to " + name + " collection: " +
                  coll);
}

function fulfillsProtocol(obj, name) {
  if(name === 'iterator') {
    // Accept ill-formed iterators that don't conform to the
    // protocol by accepting just next()
    return obj[protocols.iterator] || obj.next;
  }

  return obj[protocols[name]];
}

function getProtocolProperty(obj, name) {
  return obj[protocols[name]];
}

function iterator(coll) {
  var iter = getProtocolProperty(coll, 'iterator');
  if(iter) {
    return iter.call(coll);
  }
  else if(coll.next) {
    // Basic duck typing to accept an ill-formed iterator that doesn't
    // conform to the iterator protocol (all iterators should have the
    // @@iterator method and return themselves, but some engines don't
    // have that on generators like older v8)
    return coll;
  }
  else if(isArray(coll)) {
    return new ArrayIterator(coll);
  }
  else if(isObject(coll)) {
    return new ObjectIterator(coll);
  }
}

function ArrayIterator(arr) {
  this.arr = arr;
  this.index = 0;
}

ArrayIterator.prototype.next = function() {
  if(this.index < this.arr.length) {
    return {
      value: this.arr[this.index++],
      done: false
    };
  }
  return {
    done: true
  }
};

function ObjectIterator(obj) {
  this.obj = obj;
  this.keys = Object.keys(obj);
  this.index = 0;
}

ObjectIterator.prototype.next = function() {
  if(this.index < this.keys.length) {
    var k = this.keys[this.index++];
    return {
      value: [k, this.obj[k]],
      done: false
    };
  }
  return {
    done: true
  }
};

// helpers

var toString = Object.prototype.toString;
var isArray = typeof Array.isArray === 'function' ? Array.isArray : function(obj) {
  return toString.call(obj) == '[object Array]';
};

function isFunction(x) {
  return typeof x === 'function';
}

function isObject(x) {
  return x instanceof Object &&
    Object.getPrototypeOf(x) === Object.getPrototypeOf({});
}

function isNumber(x) {
  return typeof x === 'number';
}

function Reduced(value) {
  this['@@transducer/reduced'] = true;
  this['@@transducer/value'] = value;
}

function isReduced(x) {
  return (x instanceof Reduced) || (x && x['@@transducer/reduced']);
}

function deref(x) {
  return x['@@transducer/value'];
}

/**
 * This is for transforms that may call their nested transforms before
 * Reduced-wrapping the result (e.g. "take"), to avoid nested Reduced.
 */
function ensureReduced(val) {
  if(isReduced(val)) {
    return val;
  } else {
    return new Reduced(val);
  }
}

/**
 * This is for tranforms that call their nested transforms when
 * performing completion (like "partition"), to avoid signaling
 * termination after already completing.
 */
function ensureUnreduced(v) {
  if(isReduced(v)) {
    return deref(v);
  } else {
    return v;
  }
}

function reduce(coll, xform, init) {
  if(isArray(coll)) {
    var result = init;
    var index = -1;
    var len = coll.length;
    while(++index < len) {
      result = xform['@@transducer/step'](result, coll[index]);
      if(isReduced(result)) {
        result = deref(result);
        break;
      }
    }
    return xform['@@transducer/result'](result);
  }
  else if(isObject(coll) || fulfillsProtocol(coll, 'iterator')) {
    var result = init;
    var iter = iterator(coll);
    var val = iter.next();
    while(!val.done) {
      result = xform['@@transducer/step'](result, val.value);
      if(isReduced(result)) {
        result = deref(result);
        break;
      }
      val = iter.next();
    }
    return xform['@@transducer/result'](result);
  }
  throwProtocolError('iterate', coll);
}

function transduce(coll, xform, reducer, init) {
  xform = xform(reducer);
  if(init === undefined) {
    init = xform['@@transducer/init']();
  }
  return reduce(coll, xform, init);
}

function compose() {
  var funcs = Array.prototype.slice.call(arguments);
  return function(r) {
    var value = r;
    for(var i=funcs.length-1; i>=0; i--) {
      value = funcs[i](value);
    }
    return value;
  }
}

// transformations

function transformer(f) {
  var t = {};
  t['@@transducer/init'] = function() {
    throw new Error('init value unavailable');
  };
  t['@@transducer/result'] = function(v) {
    return v;
  };
  t['@@transducer/step'] = f;
  return t;
}

function bound(f, ctx, count) {
  count = count != null ? count : 1;

  if(!ctx) {
    return f;
  }
  else {
    switch(count) {
    case 1:
      return function(x) {
        return f.call(ctx, x);
      }
    case 2:
      return function(x, y) {
        return f.call(ctx, x, y);
      }
    default:
      return f.bind(ctx);
    }
  }
}

function arrayMap(arr, f, ctx) {
  var index = -1;
  var length = arr.length;
  var result = Array(length);
  f = bound(f, ctx, 2);

  while (++index < length) {
    result[index] = f(arr[index], index);
  }
  return result;
}

function arrayFilter(arr, f, ctx) {
  var len = arr.length;
  var result = [];
  f = bound(f, ctx, 2);

  for(var i=0; i<len; i++) {
    if(f(arr[i], i)) {
      result.push(arr[i]);
    }
  }
  return result;
}

function Map(f, xform) {
  this.xform = xform;
  this.f = f;
}

Map.prototype['@@transducer/init'] = function() {
  return this.xform['@@transducer/init']();
};

Map.prototype['@@transducer/result'] = function(v) {
  return this.xform['@@transducer/result'](v);
};

Map.prototype['@@transducer/step'] = function(res, input) {
  return this.xform['@@transducer/step'](res, this.f(input));
};

function map(coll, f, ctx) {
  if(isFunction(coll)) { ctx = f; f = coll; coll = null; }
  f = bound(f, ctx);

  if(coll) {
    if(isArray(coll)) {
      return arrayMap(coll, f, ctx);
    }
    return seq(coll, map(f));
  }

  return function(xform) {
    return new Map(f, xform);
  }
}

function Filter(f, xform) {
  this.xform = xform;
  this.f = f;
}

Filter.prototype['@@transducer/init'] = function() {
  return this.xform['@@transducer/init']();
};

Filter.prototype['@@transducer/result'] = function(v) {
  return this.xform['@@transducer/result'](v);
};

Filter.prototype['@@transducer/step'] = function(res, input) {
  if(this.f(input)) {
    return this.xform['@@transducer/step'](res, input);
  }
  return res;
};

function filter(coll, f, ctx) {
  if(isFunction(coll)) { ctx = f; f = coll; coll = null; }
  f = bound(f, ctx);

  if(coll) {
    if(isArray(coll)) {
      return arrayFilter(coll, f, ctx);
    }
    return seq(coll, filter(f));
  }

  return function(xform) {
    return new Filter(f, xform);
  };
}

function remove(coll, f, ctx) {
  if(isFunction(coll)) { ctx = f; f = coll; coll = null; }
  f = bound(f, ctx);
  return filter(coll, function(x) { return !f(x); });
}

function keep(coll) {
  return filter(coll, function(x) { return x != null });
}

function Dedupe(xform) {
  this.xform = xform;
  this.last = undefined;
}

Dedupe.prototype['@@transducer/init'] = function() {
  return this.xform['@@transducer/init']();
};

Dedupe.prototype['@@transducer/result'] = function(v) {
  return this.xform['@@transducer/result'](v);
};

Dedupe.prototype['@@transducer/step'] = function(result, input) {
  if(input !== this.last) {
    this.last = input;
    return this.xform['@@transducer/step'](result, input);
  }
  return result;
};

function dedupe(coll) {
  if(coll) {
    return seq(coll, dedupe());
  }

  return function(xform) {
    return new Dedupe(xform);
  }
}

function TakeWhile(f, xform) {
  this.xform = xform;
  this.f = f;
}

TakeWhile.prototype['@@transducer/init'] = function() {
  return this.xform['@@transducer/init']();
};

TakeWhile.prototype['@@transducer/result'] = function(v) {
  return this.xform['@@transducer/result'](v);
};

TakeWhile.prototype['@@transducer/step'] = function(result, input) {
  if(this.f(input)) {
    return this.xform['@@transducer/step'](result, input);
  }
  return new Reduced(result);
};

function takeWhile(coll, f, ctx) {
  if(isFunction(coll)) { ctx = f; f = coll; coll = null; }
  f = bound(f, ctx);

  if(coll) {
    return seq(coll, takeWhile(f));
  }

  return function(xform) {
    return new TakeWhile(f, xform);
  }
}

function Take(n, xform) {
  this.n = n;
  this.i = 0;
  this.xform = xform;
}

Take.prototype['@@transducer/init'] = function() {
  return this.xform['@@transducer/init']();
};

Take.prototype['@@transducer/result'] = function(v) {
  return this.xform['@@transducer/result'](v);
};

Take.prototype['@@transducer/step'] = function(result, input) {
  if (this.i < this.n) {
    result = this.xform['@@transducer/step'](result, input);
    if(this.i + 1 >= this.n) {
      // Finish reducing on the same step as the final value. TODO:
      // double-check that this doesn't break any semantics
      result = ensureReduced(result);
    }
  }
  this.i++;
  return result;
};

function take(coll, n) {
  if(isNumber(coll)) { n = coll; coll = null }

  if(coll) {
    return seq(coll, take(n));
  }

  return function(xform) {
    return new Take(n, xform);
  }
}

function Drop(n, xform) {
  this.n = n;
  this.i = 0;
  this.xform = xform;
}

Drop.prototype['@@transducer/init'] = function() {
  return this.xform['@@transducer/init']();
};

Drop.prototype['@@transducer/result'] = function(v) {
  return this.xform['@@transducer/result'](v);
};

Drop.prototype['@@transducer/step'] = function(result, input) {
  if(this.i++ < this.n) {
    return result;
  }
  return this.xform['@@transducer/step'](result, input);
};

function drop(coll, n) {
  if(isNumber(coll)) { n = coll; coll = null }

  if(coll) {
    return seq(coll, drop(n));
  }

  return function(xform) {
    return new Drop(n, xform);
  }
}

function DropWhile(f, xform) {
  this.xform = xform;
  this.f = f;
  this.dropping = true;
}

DropWhile.prototype['@@transducer/init'] = function() {
  return this.xform['@@transducer/init']();
};

DropWhile.prototype['@@transducer/result'] = function(v) {
  return this.xform['@@transducer/result'](v);
};

DropWhile.prototype['@@transducer/step'] = function(result, input) {
  if(this.dropping) {
    if(this.f(input)) {
      return result;
    }
    else {
      this.dropping = false;
    }
  }
  return this.xform['@@transducer/step'](result, input);
};

function dropWhile(coll, f, ctx) {
  if(isFunction(coll)) { ctx = f; f = coll; coll = null; }
  f = bound(f, ctx);

  if(coll) {
    return seq(coll, dropWhile(f));
  }

  return function(xform) {
    return new DropWhile(f, xform);
  }
}

function Partition(n, xform) {
  this.n = n;
  this.i = 0;
  this.xform = xform;
  this.part = new Array(n);
}

Partition.prototype['@@transducer/init'] = function() {
  return this.xform['@@transducer/init']();
};

Partition.prototype['@@transducer/result'] = function(v) {
  if (this.i > 0) {
    return ensureUnreduced(this.xform['@@transducer/step'](v, this.part.slice(0, this.i)));
  }
  return this.xform['@@transducer/result'](v);
};

Partition.prototype['@@transducer/step'] = function(result, input) {
  this.part[this.i] = input;
  this.i += 1;
  if (this.i === this.n) {
    var out = this.part.slice(0, this.n);
    this.part = new Array(this.n);
    this.i = 0;
    return this.xform['@@transducer/step'](result, out);
  }
  return result;
};

function partition(coll, n) {
  if (isNumber(coll)) {
    n = coll; coll = null;
  }

  if (coll) {
    return seq(coll, partition(n));
  }

  return function(xform) {
    return new Partition(n, xform);
  };
}

var NOTHING = {};

function PartitionBy(f, xform) {
  // TODO: take an "opts" object that allows the user to specify
  // equality
  this.f = f;
  this.xform = xform;
  this.part = [];
  this.last = NOTHING;
}

PartitionBy.prototype['@@transducer/init'] = function() {
  return this.xform['@@transducer/init']();
};

PartitionBy.prototype['@@transducer/result'] = function(v) {
  var l = this.part.length;
  if (l > 0) {
    return ensureUnreduced(this.xform['@@transducer/step'](v, this.part.slice(0, l)));
  }
  return this.xform['@@transducer/result'](v);
};

PartitionBy.prototype['@@transducer/step'] = function(result, input) {
  var current = this.f(input);
  if (current === this.last || this.last === NOTHING) {
    this.part.push(input);
  } else {
    result = this.xform['@@transducer/step'](result, this.part);
    this.part = [input];
  }
  this.last = current;
  return result;
};

function partitionBy(coll, f, ctx) {
  if (isFunction(coll)) { ctx = f; f = coll; coll = null; }
  f = bound(f, ctx);

  if (coll) {
    return seq(coll, partitionBy(f));
  }

  return function(xform) {
    return new PartitionBy(f, xform);
  };
}

function Interpose(sep, xform) {
  this.sep = sep;
  this.xform = xform;
  this.started = false;
}

Interpose.prototype['@@transducer/init'] = function() {
  return this.xform['@@transducer/init']();
};

Interpose.prototype['@@transducer/result'] = function(v) {
  return this.xform['@@transducer/result'](v);
};

Interpose.prototype['@@transducer/step'] = function(result, input) {
  if (this.started) {
    var withSep = this.xform['@@transducer/step'](result, this.sep);
    if (isReduced(withSep)) {
      return withSep;
    } else {
      return this.xform['@@transducer/step'](withSep, input);
    }
  } else {
    this.started = true;
    return this.xform['@@transducer/step'](result, input);
  }
};

/**
 * Returns a new collection containing elements of the given
 * collection, separated by the specified separator. Returns a
 * transducer if a collection is not provided.
 */
function interpose(coll, separator) {
  if (arguments.length === 1) {
    separator = coll;
    return function(xform) {
      return new Interpose(separator, xform);
    };
  }
  return seq(coll, interpose(separator));
}

function Repeat(n, xform) {
  this.xform = xform;
  this.n = n;
}

Repeat.prototype['@@transducer/init'] = function() {
  return this.xform['@@transducer/init']();
};

Repeat.prototype['@@transducer/result'] = function(v) {
  return this.xform['@@transducer/result'](v);
};

Repeat.prototype['@@transducer/step'] = function(result, input) {
  var n = this.n;
  var r = result;
  for (var i = 0; i < n; i++) {
    r = this.xform['@@transducer/step'](r, input);
    if (isReduced(r)) {
      break;
    }
  }
  return r;
};

/**
 * Returns a new collection containing elements of the given
 * collection, each repeated n times. Returns a transducer if a
 * collection is not provided.
 */
function repeat(coll, n) {
  if (arguments.length === 1) {
    n = coll;
    return function(xform) {
      return new Repeat(n, xform);
    };
  }
  return seq(coll, repeat(n));
}

function TakeNth(n, xform) {
  this.xform = xform;
  this.n = n;
  this.i = -1;
}

TakeNth.prototype['@@transducer/init'] = function() {
  return this.xform['@@transducer/init']();
};

TakeNth.prototype['@@transducer/result'] = function(v) {
  return this.xform['@@transducer/result'](v);
};

TakeNth.prototype['@@transducer/step'] = function(result, input) {
  this.i += 1;
  if (this.i % this.n === 0) {
    return this.xform['@@transducer/step'](result, input);
  }
  return result;
};

/**
 * Returns a new collection of every nth element of the given
 * collection. Returns a transducer if a collection is not provided.
 */
function takeNth(coll, nth) {
  if (arguments.length === 1) {
    nth = coll;
    return function(xform) {
      return new TakeNth(nth, xform);
    };
  }
  return seq(coll, takeNth(nth));
}

// pure transducers (cannot take collections)

function Cat(xform) {
  this.xform = xform;
}

Cat.prototype['@@transducer/init'] = function() {
  return this.xform['@@transducer/init']();
};

Cat.prototype['@@transducer/result'] = function(v) {
  return this.xform['@@transducer/result'](v);
};

Cat.prototype['@@transducer/step'] = function(result, input) {
  var xform = this.xform;
  var newxform = {};
  newxform['@@transducer/init'] = function() {
    return xform['@@transducer/init']();
  };
  newxform['@@transducer/result'] = function(v) {
    return v;
  };
  newxform['@@transducer/step'] = function(result, input) {
    var val = xform['@@transducer/step'](result, input);
    return isReduced(val) ? deref(val) : val;
  };

  return reduce(input, newxform, result);
};

function cat(xform) {
  return new Cat(xform);
}

function mapcat(f, ctx) {
  f = bound(f, ctx);
  return compose(map(f), cat);
}

// collection helpers

function push(arr, x) {
  arr.push(x);
  return arr;
}

function merge(obj, x) {
  if(isArray(x) && x.length === 2) {
    obj[x[0]] = x[1];
  }
  else {
    var keys = Object.keys(x);
    var len = keys.length;
    for(var i=0; i<len; i++) {
      obj[keys[i]] = x[keys[i]];
    }
  }
  return obj;
}

var arrayReducer = {};
arrayReducer['@@transducer/init'] = function() {
  return [];
};
arrayReducer['@@transducer/result'] = function(v) {
  return v;
};
arrayReducer['@@transducer/step'] = push;

var objReducer = {};
objReducer['@@transducer/init'] = function() {
  return {};
};
objReducer['@@transducer/result'] = function(v) {
  return v;
};
objReducer['@@transducer/step'] = merge;

// building new collections

function toArray(coll, xform) {
  if(!xform) {
    return reduce(coll, arrayReducer, []);
  }
  return transduce(coll, xform, arrayReducer, []);
}

function toObj(coll, xform) {
  if(!xform) {
    return reduce(coll, objReducer, {});
  }
  return transduce(coll, xform, objReducer, {});
}

function toIter(coll, xform) {
  if(!xform) {
    return iterator(coll);
  }
  return new LazyTransformer(xform, coll);
}

function seq(coll, xform) {
  if(isArray(coll)) {
    return transduce(coll, xform, arrayReducer, []);
  }
  else if(isObject(coll)) {
    return transduce(coll, xform, objReducer, {});
  }
  else if(coll['@@transducer/step']) {
    var init;
    if(coll['@@transducer/init']) {
      init = coll['@@transducer/init']();
    }
    else {
      init = new coll.constructor();
    }

    return transduce(coll, xform, coll, init);
  }
  else if(fulfillsProtocol(coll, 'iterator')) {
    return new LazyTransformer(xform, coll);
  }
  throwProtocolError('sequence', coll);
}

function into(to, xform, from) {
  if(isArray(to)) {
    return transduce(from, xform, arrayReducer, to);
  }
  else if(isObject(to)) {
    return transduce(from, xform, objReducer, to);
  }
  else if(to['@@transducer/step']) {
    return transduce(from,
                     xform,
                     to,
                     to);
  }
  throwProtocolError('into', to);
}

// laziness

var stepper = {};
stepper['@@transducer/result'] = function(v) {
  return isReduced(v) ? deref(v) : v;
};
stepper['@@transducer/step'] = function(lt, x) {
  lt.items.push(x);
  return lt.rest;
};

function Stepper(xform, iter) {
  this.xform = xform(stepper);
  this.iter = iter;
}

Stepper.prototype['@@transducer/step'] = function(lt) {
  var len = lt.items.length;
  while(lt.items.length === len) {
    var n = this.iter.next();
    if(n.done || isReduced(n.value)) {
      // finalize
      this.xform['@@transducer/result'](this);
      break;
    }

    // step
    this.xform['@@transducer/step'](lt, n.value);
  }
}

function LazyTransformer(xform, coll) {
  this.iter = iterator(coll);
  this.items = [];
  this.stepper = new Stepper(xform, iterator(coll));
}

LazyTransformer.prototype[protocols.iterator] = function() {
  return this;
}

LazyTransformer.prototype.next = function() {
  this['@@transducer/step']();

  if(this.items.length) {
    return {
      value: this.items.pop(),
      done: false
    }
  }
  else {
    return { done: true };
  }
};

LazyTransformer.prototype['@@transducer/step'] = function() {
  if(!this.items.length) {
    this.stepper['@@transducer/step'](this);
  }
}

// util

function range(n) {
  var arr = new Array(n);
  for(var i=0; i<arr.length; i++) {
    arr[i] = i;
  }
  return arr;
}

module.exports = {
  reduce: reduce,
  transformer: transformer,
  Reduced: Reduced,
  isReduced: isReduced,
  iterator: iterator,
  push: push,
  merge: merge,
  transduce: transduce,
  seq: seq,
  toArray: toArray,
  toObj: toObj,
  toIter: toIter,
  into: into,
  compose: compose,
  map: map,
  filter: filter,
  remove: remove,
  cat: cat,
  mapcat: mapcat,
  keep: keep,
  dedupe: dedupe,
  take: take,
  takeWhile: takeWhile,
  takeNth: takeNth,
  drop: drop,
  dropWhile: dropWhile,
  partition: partition,
  partitionBy: partitionBy,
  interpose: interpose,
  repeat: repeat,
  range: range,

  LazyTransformer: LazyTransformer
};

},{}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.defineDispatcher = defineDispatcher;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _jsCsp = require('js-csp');

function defineDispatcher(_ref) {
  var transformers = _ref.transformers;

  return (function () {
    var _class = function () {
      _classCallCheck(this, _class);

      this.outCh = _jsCsp.chan(_jsCsp.buffers.fixed(10));
      this.outMult = _jsCsp.operations.mult(this.outCh);
    };

    _createClass(_class, [{
      key: 'listen',
      value: function listen(source) {

        if (source.outMult && source.throughMult) {
          source = source.throughMult;
        } else if (source.outMult) {
          source = source.outMult;
        }

        var ch = _jsCsp.chan();
        var that = this;
        _jsCsp.operations.mult.tap(source, ch);

        _jsCsp.go(regeneratorRuntime.mark(function callee$3$0() {
          var value;
          return regeneratorRuntime.wrap(function callee$3$0$(context$4$0) {
            while (1) switch (context$4$0.prev = context$4$0.next) {
              case 0:
                context$4$0.next = 2;
                return _jsCsp.take(ch);

              case 2:
                value = context$4$0.sent;

              case 3:
                if (!(value !== _jsCsp.CLOSED)) {
                  context$4$0.next = 10;
                  break;
                }

                that.trigger(value);
                context$4$0.next = 7;
                return _jsCsp.take(ch);

              case 7:
                value = context$4$0.sent;
                context$4$0.next = 3;
                break;

              case 10:
              case 'end':
                return context$4$0.stop();
            }
          }, callee$3$0, this);
        }));

        return this;
      }
    }, {
      key: 'emit',
      value: function emit() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        this.trigger.apply(this, args);
      }
    }, {
      key: 'trigger',
      value: function trigger(name, payload, promise) {
        if (typeof name === 'string') {
          var obj = transformers[name] ? transformers[name]({ name: name, payload: payload, promise: promise }) : { name: name, payload: payload, promise: promise };
          _jsCsp.putAsync(this.outCh, obj);
        } else if (typeof name === 'object' && typeof name.name === 'object') {
          var obj = transformers[name] ? transformers[name](name) : name;
          _jsCsp.putAsync(this.outCh, obj);
        } else {
          console.warn('dispatched event without a name', name);
        }
      }
    }]);

    return _class;
  })();
}

},{"js-csp":3}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.defineStore = defineStore;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _defineProperty(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

var _jsCsp = require('js-csp');

var _transducersJs = require('transducers.js');

function defineStore(_ref) {
  var _ref$primaryKey = _ref.primaryKey;
  var primaryKey = _ref$primaryKey === undefined ? 'id' : _ref$primaryKey;
  var consumers = _ref.consumers;
  var transformers = _ref.transformers;

  var ctx = _objectWithoutProperties(_ref, ['primaryKey', 'consumers', 'transformers']);

  return (function () {
    var _class = function (initialData) {
      _classCallCheck(this, _class);

      this.data = !initialData ? _immutable2['default'].Map() : Array.isArray(initialData) && primaryKey ? _immutable2['default'].Map(initialData.reduce(function (collection, obj) {
        return Object.assign(collection, _defineProperty({}, obj[primaryKey], obj));
      }, {})) : typeof initialData === 'object' ? _immutable2['default'].Map(initialData) : _immutable2['default'].Map();

      this.reducers = _immutable2['default'].OrderedMap();

      this.inCh = _jsCsp.chan();
      this.outCh = _jsCsp.chan(_jsCsp.buffers.fixed(100), _transducersJs.compose(_transducersJs.dedupe()));
      this.outMult = _jsCsp.operations.mult(this.outCh);
      this.sources = _immutable2['default'].Set();
      this.throughCh = _jsCsp.chan(_jsCsp.buffers.fixed(100));
      this.throughMult = _jsCsp.operations.mult(this.throughCh);
    };

    _createClass(_class, [{
      key: 'toJSON',
      value: function toJSON() {
        return JSON.stringify(this.data);
      }
    }, {
      key: 'listen',
      value: function listen(source) {

        if (source.outMult && source.throughMult) {
          source = source.throughMult;
        } else if (source.outMult) {
          source = source.outMult;
        }

        var ch = _jsCsp.chan();
        var that = this;
        _jsCsp.operations.mult.tap(source, ch);

        _jsCsp.go(regeneratorRuntime.mark(function callee$3$0() {
          var value;
          return regeneratorRuntime.wrap(function callee$3$0$(context$4$0) {
            while (1) switch (context$4$0.prev = context$4$0.next) {
              case 0:
                context$4$0.next = 2;
                return _jsCsp.take(ch);

              case 2:
                value = context$4$0.sent;

              case 3:
                if (!(value !== _jsCsp.CLOSED)) {
                  context$4$0.next = 10;
                  break;
                }

                that.handleAction(value);
                context$4$0.next = 7;
                return _jsCsp.take(ch);

              case 7:
                value = context$4$0.sent;
                context$4$0.next = 3;
                break;

              case 10:
              case 'end':
                return context$4$0.stop();
            }
          }, callee$3$0, this);
        }));

        return this;
      }
    }, {
      key: 'trigger',
      value: function trigger() {
        // const oldData = this.data
        var fnsToApply = this.reducers.takeWhile(function (v) {
          return v > 0;
        });
        this.reducers = this.reducers.skipWhile(function (v) {
          return v > 0;
        }).filter(function (v) {
          return v >= 0;
        });
        this.data = fnsToApply.reduce(function (value, val, fn) {
          return fn(value);
        }, this.data);

        var dataToSend = this.reducers.reduce(function (value, val, fn) {
          return fn(value);
        }, this.data);

        _jsCsp.putAsync(this.outCh, dataToSend);
      }
    }, {
      key: 'getObservable',
      value: function getObservable(transformer) {

        transformer = transformer || function (a) {
          return a;
        };
        var that = this;

        return {
          subscribe: function subscribe(onNext, onError, onCompleted) {

            onNext(transformer(that.reducers.filter(function (v) {
              return v >= 0;
            }).reduce(function (value, val, fn) {
              return fn(value);
            }, that.data)));

            var tempCh = _jsCsp.chan();
            _jsCsp.operations.mult.tap(that.outMult, tempCh);
            var completed = false;

            _jsCsp.go(regeneratorRuntime.mark(function callee$4$0() {
              var value;
              return regeneratorRuntime.wrap(function callee$4$0$(context$5$0) {
                while (1) switch (context$5$0.prev = context$5$0.next) {
                  case 0:
                    context$5$0.prev = 0;
                    context$5$0.next = 3;
                    return _jsCsp.take(tempCh);

                  case 3:
                    value = context$5$0.sent;

                  case 4:
                    if (!(value !== _jsCsp.CLOSED)) {
                      context$5$0.next = 11;
                      break;
                    }

                    onNext(transformer(value));
                    context$5$0.next = 8;
                    return _jsCsp.take(tempCh);

                  case 8:
                    value = context$5$0.sent;
                    context$5$0.next = 4;
                    break;

                  case 11:
                    if (completed) {
                      onCompleted();
                    }
                    context$5$0.next = 17;
                    break;

                  case 14:
                    context$5$0.prev = 14;
                    context$5$0.t0 = context$5$0['catch'](0);

                    onError(context$5$0.t0);

                  case 17:
                  case 'end':
                    return context$5$0.stop();
                }
              }, callee$4$0, this, [[0, 14]]);
            }));

            return {
              dispose: function dispose() {
                _jsCsp.operations.mult.untap(that.outMult, tempCh);
                tempCh.close();
              }
            };
          }
        };
      }
    }, {
      key: 'subscribe',
      value: function subscribe(onNext, onError, onCompleted) {

        var tempCh = _jsCsp.chan();
        _jsCsp.operations.mult.tap(this.outMult, tempCh);
        var completed = false;

        _jsCsp.go(regeneratorRuntime.mark(function callee$3$0() {
          var value;
          return regeneratorRuntime.wrap(function callee$3$0$(context$4$0) {
            while (1) switch (context$4$0.prev = context$4$0.next) {
              case 0:
                context$4$0.prev = 0;
                context$4$0.next = 3;
                return _jsCsp.take(tempCh);

              case 3:
                value = context$4$0.sent;

              case 4:
                if (!(value !== _jsCsp.CLOSED)) {
                  context$4$0.next = 11;
                  break;
                }

                onNext(value);
                context$4$0.next = 8;
                return _jsCsp.take(tempCh);

              case 8:
                value = context$4$0.sent;
                context$4$0.next = 4;
                break;

              case 11:
                if (completed) {
                  onCompleted();
                }
                context$4$0.next = 17;
                break;

              case 14:
                context$4$0.prev = 14;
                context$4$0.t1 = context$4$0['catch'](0);

                onError(context$4$0.t1);

              case 17:
              case 'end':
                return context$4$0.stop();
            }
          }, callee$3$0, this, [[0, 14]]);
        }));

        return {
          dispose: function dispose() {
            _jsCsp.operations.mult.untap(this.outMult, tempCh);
            tempCh.close();
          }
        };
      }
    }, {
      key: 'tap',
      value: function tap(channel) {
        _jsCsp.operations.mult.tap(this.outMult, channel);
        return this;
      }
    }, {
      key: 'untap',
      value: function untap(channel) {
        _jsCsp.operations.mult.untap(this.outMult, channel);
        return this;
      }
    }, {
      key: 'handleAction',
      value: function handleAction(action) {
        var that = this;
        var name = action.name;
        var payload = action.payload;
        var promise = action.promise;

        // in case of full consumer. We provide, (controls, action)
        // controls is an object of three functions — apply, commit, and reject
        // in case of sync operations, the consumer is expected to call apply with a reducer function and then immediately call commit
        // in case of async ops, the consumer should call apply with a reducer function. Then if the async op is successful call commit,
        // if the async operation fails, reject should be called. This will roll back the change.
        if (consumers[name]) {
          (function () {
            var cached = null;
            consumers[name].call(ctx, { apply: function apply(fn) {
                if (cached) {
                  that.reducers = that.reducers.set(cached, -1);
                }
                cached = fn;
                that.reducers = that.reducers.set(fn, 0);
                that.trigger();
              },
              commit: function commit() {
                if (!cached) {
                  return false;
                }
                that.reducers = that.reducers.set(cached, 1);
                that.trigger();
                cached = null;
                _jsCsp.putAsync(that.throughCh, action);
                return true;
              },
              reject: function reject() {
                if (!cached) {
                  return false;
                }
                that.reducers = that.reducers.set(cached, -1);
                that.trigger();
                cached = null;
                _jsCsp.putAsync(that.throughCh, action);
                return true;
              }
            }, { payload: payload, promise: promise });
          })();
        } else if (transformers[name]) {
          (function () {
            var cached = function cached(data) {
              return transformers[name].call(ctx, data, payload);
            };
            that.reducers = that.reducers.set(cached, 0);
            if (promise) {
              that.trigger();
              promise.then(function () {
                that.reducers = that.reducers.set(cached, 1);
                that.trigger();
                _jsCsp.putAsync(that.throughCh, action);
              })['catch'](function (err) {
                that.reducers = that.reducers.set(cached, -1);
                that.trigger();
                console.error(err);
                _jsCsp.putAsync(that.throughCh, action);
              });
            } else {
              that.reducers = that.reducers.set(cached, 1);
              that.trigger();
              _jsCsp.putAsync(that.throughCh, action);
            }
          })();
        } else {
          _jsCsp.putAsync(that.throughCh, action);
        }
      }
    }]);

    return _class;
  })();
}

},{"immutable":1,"js-csp":3,"transducers.js":12}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _store = require('./store');

var _dispatcher = require('./dispatcher');

exports.defineStore = _store.defineStore;
exports.defineDispatcher = _dispatcher.defineDispatcher;

},{"./dispatcher":13,"./store":14}]},{},[15])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW1tdXRhYmxlL2Rpc3QvaW1tdXRhYmxlLmpzIiwibm9kZV9tb2R1bGVzL2pzLWNzcC9zcmMvY3NwLmNvcmUuanMiLCJub2RlX21vZHVsZXMvanMtY3NwL3NyYy9jc3AuanMiLCJub2RlX21vZHVsZXMvanMtY3NwL3NyYy9jc3Aub3BlcmF0aW9ucy5qcyIsIm5vZGVfbW9kdWxlcy9qcy1jc3Avc3JjL2NzcC5waXBlbGluZS5qcyIsIm5vZGVfbW9kdWxlcy9qcy1jc3Avc3JjL2ltcGwvYnVmZmVycy5qcyIsIm5vZGVfbW9kdWxlcy9qcy1jc3Avc3JjL2ltcGwvY2hhbm5lbHMuanMiLCJub2RlX21vZHVsZXMvanMtY3NwL3NyYy9pbXBsL2Rpc3BhdGNoLmpzIiwibm9kZV9tb2R1bGVzL2pzLWNzcC9zcmMvaW1wbC9wcm9jZXNzLmpzIiwibm9kZV9tb2R1bGVzL2pzLWNzcC9zcmMvaW1wbC9zZWxlY3QuanMiLCJub2RlX21vZHVsZXMvanMtY3NwL3NyYy9pbXBsL3RpbWVycy5qcyIsIm5vZGVfbW9kdWxlcy90cmFuc2R1Y2Vycy5qcy90cmFuc2R1Y2Vycy5qcyIsIi9Vc2Vycy9ubW4vRHJvcGJveC9jb2RlL0ZsZXh5L3NyYy9kaXNwYXRjaGVyLmpzIiwiL1VzZXJzL25tbi9Ecm9wYm94L2NvZGUvRmxleHkvc3JjL3N0b3JlLmpzIiwiL1VzZXJzL25tbi9Ecm9wYm94L2NvZGUvRmxleHkvc3JjL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNXlKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3R4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7OztRQ3A4QmdCLGdCQUFnQixHQUFoQixnQkFBZ0I7Ozs7cUJBRm9ELFFBQVE7O0FBRXJGLFNBQVMsZ0JBQWdCLENBQUMsSUFBYyxFQUFDO01BQWQsWUFBWSxHQUFiLElBQWMsQ0FBYixZQUFZOztBQUM1QztpQkFFYSxZQUFFOzs7QUFDWCxVQUFJLENBQUMsS0FBSyxHQUFHLE9BTlgsSUFBSSxDQU1ZLE9BTk0sT0FBTyxDQU1MLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO0FBQ3BDLFVBQUksQ0FBQyxPQUFPLEdBQUcsT0FQSCxVQUFVLENBT0ksSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtLQUMzQzs7OzthQUVLLGdCQUFDLE1BQU0sRUFBQzs7QUFFWixZQUFHLE1BQU0sQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLFdBQVcsRUFBQztBQUN0QyxnQkFBTSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUE7U0FDNUIsTUFBTSxJQUFHLE1BQU0sQ0FBQyxPQUFPLEVBQUM7QUFDdkIsZ0JBQU0sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFBO1NBQ3hCOztBQUVELFlBQU0sRUFBRSxHQUFHLE9BbEJULElBQUksRUFrQlcsQ0FBQTtBQUNqQixZQUFNLElBQUksR0FBRyxJQUFJLENBQUE7QUFDakIsZUFwQlksVUFBVSxDQW9CWCxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQTs7QUFFL0IsZUF0QlEsRUFBRSx5QkFzQlA7Y0FDRyxLQUFLOzs7Ozt1QkFBUyxPQXZCYSxJQUFJLENBdUJaLEVBQUUsQ0FBQzs7O0FBQXRCLHFCQUFLOzs7c0JBQ0YsS0FBSyxZQXhCbUQsTUFBTSxDQXdCOUM7Ozs7O0FBQ3JCLG9CQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFBOzt1QkFDTCxPQTFCZSxJQUFJLENBMEJkLEVBQUUsQ0FBQzs7O0FBQXRCLHFCQUFLOzs7Ozs7Ozs7U0FFUixFQUFDLENBQUE7O0FBRUYsZUFBTyxJQUFJLENBQUE7T0FDWjs7O2FBRUcsZ0JBQVM7MENBQUwsSUFBSTtBQUFKLGNBQUk7OztBQUNWLFlBQUksQ0FBQyxPQUFPLE1BQUEsQ0FBWixJQUFJLEVBQVksSUFBSSxDQUFDLENBQUE7T0FDdEI7OzthQUVNLGlCQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFDO0FBQzdCLFlBQUcsT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFDO0FBQzFCLGNBQUksR0FBRyxHQUNMLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBQyxJQUFJLEVBQUosSUFBSSxFQUFFLE9BQU8sRUFBUCxPQUFPLEVBQUUsT0FBTyxFQUFQLE9BQU8sRUFBQyxDQUFDLEdBQy9ELEVBQUMsSUFBSSxFQUFKLElBQUksRUFBRSxPQUFPLEVBQVAsT0FBTyxFQUFFLE9BQU8sRUFBUCxPQUFPLEVBQUMsQ0FBQTtBQUM1QixpQkExQ3FELFFBQVEsQ0EwQ3BELElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUE7U0FDMUIsTUFBTSxJQUFHLE9BQU8sSUFBSSxLQUFLLFFBQVEsSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFDO0FBQ2xFLGNBQUksR0FBRyxHQUNMLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQzNDLElBQUksQ0FBQTtBQUNSLGlCQS9DcUQsUUFBUSxDQStDcEQsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQTtTQUMxQixNQUFNO0FBQ0wsaUJBQU8sQ0FBQyxJQUFJLENBQUMsaUNBQWlDLEVBQUUsSUFBSSxDQUFDLENBQUE7U0FDdEQ7T0FDRjs7OztPQUNGO0NBQ0Y7Ozs7Ozs7Ozs7O1FDakRlLFdBQVcsR0FBWCxXQUFXOzs7Ozs7Ozs7O3lCQUpiLFdBQVc7Ozs7cUJBQzJELFFBQVE7OzZCQUNqRCxnQkFBZ0I7O0FBRXBELFNBQVMsV0FBVyxDQUFDLElBQW9ELEVBQUM7d0JBQXJELElBQW9ELENBQW5ELFVBQVU7TUFBVixVQUFVLG1DQUFHLElBQUk7TUFBRSxTQUFTLEdBQTdCLElBQW9ELENBQWhDLFNBQVM7TUFBRSxZQUFZLEdBQTNDLElBQW9ELENBQXJCLFlBQVk7O01BQUssR0FBRyw0QkFBbkQsSUFBb0Q7O0FBQzlFO2lCQUNhLFVBQUMsV0FBVyxFQUFDOzs7QUFDdEIsVUFBSSxDQUFDLElBQUksR0FDUCxDQUFDLFdBQVcsR0FDVix1QkFBRSxHQUFHLEVBQUUsR0FDUCxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLFVBQVUsR0FDeEMsdUJBQUUsR0FBRyxDQUFFLFdBQVcsQ0FBQyxNQUFNLENBQUMsVUFBQyxVQUFVLEVBQUUsR0FBRztlQUFLLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxzQkFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUcsR0FBRyxFQUFFO09BQUEsRUFBRSxFQUFFLENBQUMsQ0FBRSxHQUN6RyxPQUFPLFdBQVcsS0FBSyxRQUFRLEdBQy9CLHVCQUFFLEdBQUcsQ0FBRSxXQUFXLENBQUUsR0FDcEIsdUJBQUUsR0FBRyxFQUFFLENBQUE7O0FBRVgsVUFBSSxDQUFDLFFBQVEsR0FBRyx1QkFBRSxVQUFVLEVBQUUsQ0FBQTs7QUFFOUIsVUFBSSxDQUFDLElBQUksR0FBRyxPQWpCVixJQUFJLEVBaUJZLENBQUE7QUFDbEIsVUFBSSxDQUFDLEtBQUssR0FBRyxPQWxCWCxJQUFJLENBa0JhLE9BbEJLLE9BQU8sQ0FrQkosS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLGVBakJyQyxPQUFPLENBaUJzQyxlQWpCdkIsTUFBTSxFQWlCeUIsQ0FBQyxDQUFFLENBQUE7QUFDMUQsVUFBSSxDQUFDLE9BQU8sR0FBRyxPQW5CSCxVQUFVLENBbUJJLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDMUMsVUFBSSxDQUFDLE9BQU8sR0FBRyx1QkFBRSxHQUFHLEVBQUUsQ0FBQTtBQUN0QixVQUFJLENBQUMsU0FBUyxHQUFHLE9BckJmLElBQUksQ0FxQmdCLE9BckJFLE9BQU8sQ0FxQkQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7QUFDekMsVUFBSSxDQUFDLFdBQVcsR0FBRyxPQXRCUCxVQUFVLENBc0JRLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUE7S0FDbkQ7Ozs7YUFFSyxrQkFBRTtBQUNOLGVBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7T0FDakM7OzthQUVLLGdCQUFDLE1BQU0sRUFBQzs7QUFFWixZQUFHLE1BQU0sQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLFdBQVcsRUFBQztBQUN0QyxnQkFBTSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUE7U0FDNUIsTUFBTSxJQUFHLE1BQU0sQ0FBQyxPQUFPLEVBQUM7QUFDdkIsZ0JBQU0sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFBO1NBQ3hCOztBQUVELFlBQU0sRUFBRSxHQUFHLE9BckNULElBQUksRUFxQ1csQ0FBQTtBQUNqQixZQUFNLElBQUksR0FBRyxJQUFJLENBQUE7QUFDakIsZUF2Q1ksVUFBVSxDQXVDWCxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQTs7QUFFL0IsZUF6Q1EsRUFBRSx5QkF5Q1A7Y0FDRyxLQUFLOzs7Ozt1QkFBUyxPQTFDYSxJQUFJLENBMENaLEVBQUUsQ0FBQzs7O0FBQXRCLHFCQUFLOzs7c0JBQ0YsS0FBSyxZQTNDbUQsTUFBTSxDQTJDOUM7Ozs7O0FBQ3JCLG9CQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFBOzt1QkFDVixPQTdDZSxJQUFJLENBNkNkLEVBQUUsQ0FBQzs7O0FBQXRCLHFCQUFLOzs7Ozs7Ozs7U0FFUixFQUFDLENBQUE7O0FBRUYsZUFBTyxJQUFJLENBQUE7T0FDWjs7O2FBRU0sbUJBQUU7O0FBRVAsWUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsVUFBQSxDQUFDO2lCQUFJLENBQUMsR0FBRyxDQUFDO1NBQUEsQ0FBQyxDQUFBO0FBQ3RELFlBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsVUFBQSxDQUFDO2lCQUFJLENBQUMsR0FBRyxDQUFDO1NBQUEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFBLENBQUM7aUJBQUksQ0FBQyxJQUFJLENBQUM7U0FBQSxDQUFDLENBQUE7QUFDdkUsWUFBSSxDQUFDLElBQUksR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLFVBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFO2lCQUFLLEVBQUUsQ0FBQyxLQUFLLENBQUM7U0FBQSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTs7QUFFdkUsWUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsVUFBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUU7aUJBQUssRUFBRSxDQUFDLEtBQUssQ0FBQztTQUFBLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBOztBQUVqRixlQTVEdUQsUUFBUSxDQTREdEQsSUFBSSxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQTtPQUNqQzs7O2FBRVksdUJBQUMsV0FBVyxFQUFDOztBQUV4QixtQkFBVyxHQUFHLFdBQVcsSUFBSSxVQUFTLENBQUMsRUFBQztBQUFDLGlCQUFPLENBQUMsQ0FBQTtTQUFDLENBQUE7QUFDbEQsWUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFBOztBQUVqQixlQUFPO0FBQ0wsbUJBQVMsRUFBQSxtQkFBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBQzs7QUFFckMsa0JBQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsVUFBQSxDQUFDO3FCQUFJLENBQUMsSUFBSSxDQUFDO2FBQUEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRTtxQkFBSyxFQUFFLENBQUMsS0FBSyxDQUFDO2FBQUEsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBOztBQUV2RyxnQkFBTSxNQUFNLEdBQUcsT0F6RWpCLElBQUksRUF5RW1CLENBQUE7QUFDckIsbUJBMUVRLFVBQVUsQ0EwRVAsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFBO0FBQ3pDLGdCQUFJLFNBQVMsR0FBRyxLQUFLLENBQUE7O0FBRXJCLG1CQTdFSSxFQUFFLHlCQTZFSDtrQkFFSyxLQUFLOzs7Ozs7MkJBQVMsT0EvRU8sSUFBSSxDQStFTixNQUFNLENBQUM7OztBQUExQix5QkFBSzs7OzBCQUNILEtBQUssWUFoRjhDLE1BQU0sQ0FnRnpDOzs7OztBQUNwQiwwQkFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBOzsyQkFDWixPQWxGUyxJQUFJLENBa0ZSLE1BQU0sQ0FBQzs7O0FBQTFCLHlCQUFLOzs7OztBQUVQLHdCQUFHLFNBQVMsRUFBQztBQUNYLGlDQUFXLEVBQUUsQ0FBQTtxQkFDZDs7Ozs7Ozs7QUFFRCwyQkFBTyxnQkFBRyxDQUFBOzs7Ozs7O2FBRWIsRUFBQyxDQUFBOztBQUVGLG1CQUFPO0FBQ0wscUJBQU8sRUFBQSxtQkFBRTtBQUNQLHVCQTlGSSxVQUFVLENBOEZILElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQTtBQUMzQyxzQkFBTSxDQUFDLEtBQUssRUFBRSxDQUFBO2VBQ2Y7YUFDRixDQUFBO1dBQ0Y7U0FDRixDQUFBO09BQ0Y7OzthQUVRLG1CQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFDOztBQUVyQyxZQUFNLE1BQU0sR0FBRyxPQXhHYixJQUFJLEVBd0dlLENBQUE7QUFDckIsZUF6R1ksVUFBVSxDQXlHWCxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFDekMsWUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFBOztBQUVyQixlQTVHUSxFQUFFLHlCQTRHUDtjQUVLLEtBQUs7Ozs7Ozt1QkFBUyxPQTlHVyxJQUFJLENBOEdWLE1BQU0sQ0FBQzs7O0FBQTFCLHFCQUFLOzs7c0JBQ0gsS0FBSyxZQS9Ha0QsTUFBTSxDQStHN0M7Ozs7O0FBQ3BCLHNCQUFNLENBQUMsS0FBSyxDQUFDLENBQUE7O3VCQUNDLE9BakhhLElBQUksQ0FpSFosTUFBTSxDQUFDOzs7QUFBMUIscUJBQUs7Ozs7O0FBRVAsb0JBQUcsU0FBUyxFQUFDO0FBQ1gsNkJBQVcsRUFBRSxDQUFBO2lCQUNkOzs7Ozs7OztBQUVELHVCQUFPLGdCQUFHLENBQUE7Ozs7Ozs7U0FFYixFQUFDLENBQUE7O0FBRUYsZUFBTztBQUNMLGlCQUFPLEVBQUEsbUJBQUU7QUFDUCxtQkE3SFEsVUFBVSxDQTZIUCxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFDM0Msa0JBQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQTtXQUNmO1NBQ0YsQ0FBQTtPQUNGOzs7YUFFRSxhQUFDLE9BQU8sRUFBQztBQUNWLGVBcElZLFVBQVUsQ0FvSVgsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0FBQzFDLGVBQU8sSUFBSSxDQUFBO09BQ1o7OzthQUVJLGVBQUMsT0FBTyxFQUFDO0FBQ1osZUF6SVksVUFBVSxDQXlJWCxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUE7QUFDNUMsZUFBTyxJQUFJLENBQUE7T0FDWjs7O2FBRVcsc0JBQUMsTUFBTSxFQUFDO0FBQ2xCLFlBQU0sSUFBSSxHQUFHLElBQUksQ0FBQTtZQUNWLElBQUksR0FBc0IsTUFBTSxDQUFoQyxJQUFJO1lBQUUsT0FBTyxHQUFhLE1BQU0sQ0FBMUIsT0FBTztZQUFFLE9BQU8sR0FBSSxNQUFNLENBQWpCLE9BQU87Ozs7Ozs7QUFPN0IsWUFBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUM7O0FBQ2pCLGdCQUFJLE1BQU0sR0FBRyxJQUFJLENBQUE7QUFDakIscUJBQVMsQ0FBQyxJQUFJLENBQUMsQ0FDWCxJQUFJLENBQUUsR0FBRyxFQUNILEVBQUUsS0FBSyxFQUFBLGVBQUMsRUFBRSxFQUFDO0FBQ1Asb0JBQUcsTUFBTSxFQUFDO0FBQ1Isc0JBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7aUJBQzlDO0FBQ0Qsc0JBQU0sR0FBRyxFQUFFLENBQUE7QUFDWCxvQkFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUE7QUFDeEMsb0JBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQTtlQUNmO0FBQ0Qsb0JBQU0sRUFBQSxrQkFBRTtBQUNOLG9CQUFHLENBQUMsTUFBTSxFQUFDO0FBQ1QseUJBQU8sS0FBSyxDQUFBO2lCQUNiO0FBQ0Qsb0JBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFBO0FBQzVDLG9CQUFJLENBQUMsT0FBTyxFQUFFLENBQUE7QUFDZCxzQkFBTSxHQUFHLElBQUksQ0FBQTtBQUNiLHVCQXpLdUMsUUFBUSxDQXlLdEMsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQTtBQUNoQyx1QkFBTyxJQUFJLENBQUE7ZUFDWjtBQUNELG9CQUFNLEVBQUEsa0JBQUU7QUFDTixvQkFBRyxDQUFDLE1BQU0sRUFBQztBQUNULHlCQUFPLEtBQUssQ0FBQTtpQkFDYjtBQUNELG9CQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQzdDLG9CQUFJLENBQUMsT0FBTyxFQUFFLENBQUE7QUFDZCxzQkFBTSxHQUFHLElBQUksQ0FBQTtBQUNiLHVCQW5MdUMsUUFBUSxDQW1MdEMsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQTtBQUNoQyx1QkFBTyxJQUFJLENBQUE7ZUFDWjthQUNGLEVBQ0QsRUFBRSxPQUFPLEVBQVAsT0FBTyxFQUFFLE9BQU8sRUFBUCxPQUFPLEVBQUMsQ0FDcEIsQ0FBQTs7U0FDVixNQUFNLElBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFDOztBQUMzQixnQkFBSSxNQUFNLEdBQUcsU0FBVCxNQUFNLENBQUksSUFBSTtxQkFBSyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDO2FBQUEsQ0FBQTtBQUNsRSxnQkFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUE7QUFDNUMsZ0JBQUcsT0FBTyxFQUFDO0FBQ1Qsa0JBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQTtBQUNkLHFCQUFPLENBQ0osSUFBSSxDQUFDLFlBQU07QUFDVixvQkFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUE7QUFDNUMsb0JBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQTtBQUNkLHVCQWxNK0MsUUFBUSxDQWtNOUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQTtlQUNqQyxDQUFDLFNBQ0ksQ0FBQyxVQUFDLEdBQUcsRUFBSztBQUNkLG9CQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQzdDLG9CQUFJLENBQUMsT0FBTyxFQUFFLENBQUE7QUFDZCx1QkFBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNsQix1QkF4TStDLFFBQVEsQ0F3TTlDLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUE7ZUFDakMsQ0FBQyxDQUFBO2FBQ0wsTUFBTTtBQUNMLGtCQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQTtBQUM1QyxrQkFBSSxDQUFDLE9BQU8sRUFBRSxDQUFBO0FBQ2QscUJBN01tRCxRQUFRLENBNk1sRCxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFBO2FBQ2pDOztTQUNGLE1BQU07QUFDTCxpQkFoTnFELFFBQVEsQ0FnTnBELElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUE7U0FDakM7T0FDRjs7OztPQUNGO0NBQ0Y7Ozs7Ozs7OztxQkNyTnlCLFNBQVM7OzBCQUNKLGNBQWM7O1FBRXBDLFdBQVcsVUFIWixXQUFXO1FBR0csZ0JBQWdCLGVBRjlCLGdCQUFnQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqICBDb3B5cmlnaHQgKGMpIDIwMTQtMjAxNSwgRmFjZWJvb2ssIEluYy5cbiAqICBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqICBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqICBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqICBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqL1xuKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCkgOlxuICB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoZmFjdG9yeSkgOlxuICBnbG9iYWwuSW1tdXRhYmxlID0gZmFjdG9yeSgpXG59KHRoaXMsIGZ1bmN0aW9uICgpIHsgJ3VzZSBzdHJpY3QnO3ZhciBTTElDRSQwID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xuXG4gIGZ1bmN0aW9uIGNyZWF0ZUNsYXNzKGN0b3IsIHN1cGVyQ2xhc3MpIHtcbiAgICBpZiAoc3VwZXJDbGFzcykge1xuICAgICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MucHJvdG90eXBlKTtcbiAgICB9XG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yO1xuICB9XG5cbiAgLy8gVXNlZCBmb3Igc2V0dGluZyBwcm90b3R5cGUgbWV0aG9kcyB0aGF0IElFOCBjaG9rZXMgb24uXG4gIHZhciBERUxFVEUgPSAnZGVsZXRlJztcblxuICAvLyBDb25zdGFudHMgZGVzY3JpYmluZyB0aGUgc2l6ZSBvZiB0cmllIG5vZGVzLlxuICB2YXIgU0hJRlQgPSA1OyAvLyBSZXN1bHRlZCBpbiBiZXN0IHBlcmZvcm1hbmNlIGFmdGVyIF9fX19fXz9cbiAgdmFyIFNJWkUgPSAxIDw8IFNISUZUO1xuICB2YXIgTUFTSyA9IFNJWkUgLSAxO1xuXG4gIC8vIEEgY29uc2lzdGVudCBzaGFyZWQgdmFsdWUgcmVwcmVzZW50aW5nIFwibm90IHNldFwiIHdoaWNoIGVxdWFscyBub3RoaW5nIG90aGVyXG4gIC8vIHRoYW4gaXRzZWxmLCBhbmQgbm90aGluZyB0aGF0IGNvdWxkIGJlIHByb3ZpZGVkIGV4dGVybmFsbHkuXG4gIHZhciBOT1RfU0VUID0ge307XG5cbiAgLy8gQm9vbGVhbiByZWZlcmVuY2VzLCBSb3VnaCBlcXVpdmFsZW50IG9mIGBib29sICZgLlxuICB2YXIgQ0hBTkdFX0xFTkdUSCA9IHsgdmFsdWU6IGZhbHNlIH07XG4gIHZhciBESURfQUxURVIgPSB7IHZhbHVlOiBmYWxzZSB9O1xuXG4gIGZ1bmN0aW9uIE1ha2VSZWYocmVmKSB7XG4gICAgcmVmLnZhbHVlID0gZmFsc2U7XG4gICAgcmV0dXJuIHJlZjtcbiAgfVxuXG4gIGZ1bmN0aW9uIFNldFJlZihyZWYpIHtcbiAgICByZWYgJiYgKHJlZi52YWx1ZSA9IHRydWUpO1xuICB9XG5cbiAgLy8gQSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIGEgdmFsdWUgcmVwcmVzZW50aW5nIGFuIFwib3duZXJcIiBmb3IgdHJhbnNpZW50IHdyaXRlc1xuICAvLyB0byB0cmllcy4gVGhlIHJldHVybiB2YWx1ZSB3aWxsIG9ubHkgZXZlciBlcXVhbCBpdHNlbGYsIGFuZCB3aWxsIG5vdCBlcXVhbFxuICAvLyB0aGUgcmV0dXJuIG9mIGFueSBzdWJzZXF1ZW50IGNhbGwgb2YgdGhpcyBmdW5jdGlvbi5cbiAgZnVuY3Rpb24gT3duZXJJRCgpIHt9XG5cbiAgLy8gaHR0cDovL2pzcGVyZi5jb20vY29weS1hcnJheS1pbmxpbmVcbiAgZnVuY3Rpb24gYXJyQ29weShhcnIsIG9mZnNldCkge1xuICAgIG9mZnNldCA9IG9mZnNldCB8fCAwO1xuICAgIHZhciBsZW4gPSBNYXRoLm1heCgwLCBhcnIubGVuZ3RoIC0gb2Zmc2V0KTtcbiAgICB2YXIgbmV3QXJyID0gbmV3IEFycmF5KGxlbik7XG4gICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IGxlbjsgaWkrKykge1xuICAgICAgbmV3QXJyW2lpXSA9IGFycltpaSArIG9mZnNldF07XG4gICAgfVxuICAgIHJldHVybiBuZXdBcnI7XG4gIH1cblxuICBmdW5jdGlvbiBlbnN1cmVTaXplKGl0ZXIpIHtcbiAgICBpZiAoaXRlci5zaXplID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGl0ZXIuc2l6ZSA9IGl0ZXIuX19pdGVyYXRlKHJldHVyblRydWUpO1xuICAgIH1cbiAgICByZXR1cm4gaXRlci5zaXplO1xuICB9XG5cbiAgZnVuY3Rpb24gd3JhcEluZGV4KGl0ZXIsIGluZGV4KSB7XG4gICAgcmV0dXJuIGluZGV4ID49IDAgPyAoK2luZGV4KSA6IGVuc3VyZVNpemUoaXRlcikgKyAoK2luZGV4KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJldHVyblRydWUoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBmdW5jdGlvbiB3aG9sZVNsaWNlKGJlZ2luLCBlbmQsIHNpemUpIHtcbiAgICByZXR1cm4gKGJlZ2luID09PSAwIHx8IChzaXplICE9PSB1bmRlZmluZWQgJiYgYmVnaW4gPD0gLXNpemUpKSAmJlxuICAgICAgKGVuZCA9PT0gdW5kZWZpbmVkIHx8IChzaXplICE9PSB1bmRlZmluZWQgJiYgZW5kID49IHNpemUpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlc29sdmVCZWdpbihiZWdpbiwgc2l6ZSkge1xuICAgIHJldHVybiByZXNvbHZlSW5kZXgoYmVnaW4sIHNpemUsIDApO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVzb2x2ZUVuZChlbmQsIHNpemUpIHtcbiAgICByZXR1cm4gcmVzb2x2ZUluZGV4KGVuZCwgc2l6ZSwgc2l6ZSk7XG4gIH1cblxuICBmdW5jdGlvbiByZXNvbHZlSW5kZXgoaW5kZXgsIHNpemUsIGRlZmF1bHRJbmRleCkge1xuICAgIHJldHVybiBpbmRleCA9PT0gdW5kZWZpbmVkID9cbiAgICAgIGRlZmF1bHRJbmRleCA6XG4gICAgICBpbmRleCA8IDAgP1xuICAgICAgICBNYXRoLm1heCgwLCBzaXplICsgaW5kZXgpIDpcbiAgICAgICAgc2l6ZSA9PT0gdW5kZWZpbmVkID9cbiAgICAgICAgICBpbmRleCA6XG4gICAgICAgICAgTWF0aC5taW4oc2l6ZSwgaW5kZXgpO1xuICB9XG5cbiAgZnVuY3Rpb24gSXRlcmFibGUodmFsdWUpIHtcbiAgICAgIHJldHVybiBpc0l0ZXJhYmxlKHZhbHVlKSA/IHZhbHVlIDogU2VxKHZhbHVlKTtcbiAgICB9XG5cblxuICBjcmVhdGVDbGFzcyhLZXllZEl0ZXJhYmxlLCBJdGVyYWJsZSk7XG4gICAgZnVuY3Rpb24gS2V5ZWRJdGVyYWJsZSh2YWx1ZSkge1xuICAgICAgcmV0dXJuIGlzS2V5ZWQodmFsdWUpID8gdmFsdWUgOiBLZXllZFNlcSh2YWx1ZSk7XG4gICAgfVxuXG5cbiAgY3JlYXRlQ2xhc3MoSW5kZXhlZEl0ZXJhYmxlLCBJdGVyYWJsZSk7XG4gICAgZnVuY3Rpb24gSW5kZXhlZEl0ZXJhYmxlKHZhbHVlKSB7XG4gICAgICByZXR1cm4gaXNJbmRleGVkKHZhbHVlKSA/IHZhbHVlIDogSW5kZXhlZFNlcSh2YWx1ZSk7XG4gICAgfVxuXG5cbiAgY3JlYXRlQ2xhc3MoU2V0SXRlcmFibGUsIEl0ZXJhYmxlKTtcbiAgICBmdW5jdGlvbiBTZXRJdGVyYWJsZSh2YWx1ZSkge1xuICAgICAgcmV0dXJuIGlzSXRlcmFibGUodmFsdWUpICYmICFpc0Fzc29jaWF0aXZlKHZhbHVlKSA/IHZhbHVlIDogU2V0U2VxKHZhbHVlKTtcbiAgICB9XG5cblxuXG4gIGZ1bmN0aW9uIGlzSXRlcmFibGUobWF5YmVJdGVyYWJsZSkge1xuICAgIHJldHVybiAhIShtYXliZUl0ZXJhYmxlICYmIG1heWJlSXRlcmFibGVbSVNfSVRFUkFCTEVfU0VOVElORUxdKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzS2V5ZWQobWF5YmVLZXllZCkge1xuICAgIHJldHVybiAhIShtYXliZUtleWVkICYmIG1heWJlS2V5ZWRbSVNfS0VZRURfU0VOVElORUxdKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzSW5kZXhlZChtYXliZUluZGV4ZWQpIHtcbiAgICByZXR1cm4gISEobWF5YmVJbmRleGVkICYmIG1heWJlSW5kZXhlZFtJU19JTkRFWEVEX1NFTlRJTkVMXSk7XG4gIH1cblxuICBmdW5jdGlvbiBpc0Fzc29jaWF0aXZlKG1heWJlQXNzb2NpYXRpdmUpIHtcbiAgICByZXR1cm4gaXNLZXllZChtYXliZUFzc29jaWF0aXZlKSB8fCBpc0luZGV4ZWQobWF5YmVBc3NvY2lhdGl2ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBpc09yZGVyZWQobWF5YmVPcmRlcmVkKSB7XG4gICAgcmV0dXJuICEhKG1heWJlT3JkZXJlZCAmJiBtYXliZU9yZGVyZWRbSVNfT1JERVJFRF9TRU5USU5FTF0pO1xuICB9XG5cbiAgSXRlcmFibGUuaXNJdGVyYWJsZSA9IGlzSXRlcmFibGU7XG4gIEl0ZXJhYmxlLmlzS2V5ZWQgPSBpc0tleWVkO1xuICBJdGVyYWJsZS5pc0luZGV4ZWQgPSBpc0luZGV4ZWQ7XG4gIEl0ZXJhYmxlLmlzQXNzb2NpYXRpdmUgPSBpc0Fzc29jaWF0aXZlO1xuICBJdGVyYWJsZS5pc09yZGVyZWQgPSBpc09yZGVyZWQ7XG5cbiAgSXRlcmFibGUuS2V5ZWQgPSBLZXllZEl0ZXJhYmxlO1xuICBJdGVyYWJsZS5JbmRleGVkID0gSW5kZXhlZEl0ZXJhYmxlO1xuICBJdGVyYWJsZS5TZXQgPSBTZXRJdGVyYWJsZTtcblxuXG4gIHZhciBJU19JVEVSQUJMRV9TRU5USU5FTCA9ICdAQF9fSU1NVVRBQkxFX0lURVJBQkxFX19AQCc7XG4gIHZhciBJU19LRVlFRF9TRU5USU5FTCA9ICdAQF9fSU1NVVRBQkxFX0tFWUVEX19AQCc7XG4gIHZhciBJU19JTkRFWEVEX1NFTlRJTkVMID0gJ0BAX19JTU1VVEFCTEVfSU5ERVhFRF9fQEAnO1xuICB2YXIgSVNfT1JERVJFRF9TRU5USU5FTCA9ICdAQF9fSU1NVVRBQkxFX09SREVSRURfX0BAJztcblxuICAvKiBnbG9iYWwgU3ltYm9sICovXG5cbiAgdmFyIElURVJBVEVfS0VZUyA9IDA7XG4gIHZhciBJVEVSQVRFX1ZBTFVFUyA9IDE7XG4gIHZhciBJVEVSQVRFX0VOVFJJRVMgPSAyO1xuXG4gIHZhciBSRUFMX0lURVJBVE9SX1NZTUJPTCA9IHR5cGVvZiBTeW1ib2wgPT09ICdmdW5jdGlvbicgJiYgU3ltYm9sLml0ZXJhdG9yO1xuICB2YXIgRkFVWF9JVEVSQVRPUl9TWU1CT0wgPSAnQEBpdGVyYXRvcic7XG5cbiAgdmFyIElURVJBVE9SX1NZTUJPTCA9IFJFQUxfSVRFUkFUT1JfU1lNQk9MIHx8IEZBVVhfSVRFUkFUT1JfU1lNQk9MO1xuXG5cbiAgZnVuY3Rpb24gc3JjX0l0ZXJhdG9yX19JdGVyYXRvcihuZXh0KSB7XG4gICAgICB0aGlzLm5leHQgPSBuZXh0O1xuICAgIH1cblxuICAgIHNyY19JdGVyYXRvcl9fSXRlcmF0b3IucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJ1tJdGVyYXRvcl0nO1xuICAgIH07XG5cblxuICBzcmNfSXRlcmF0b3JfX0l0ZXJhdG9yLktFWVMgPSBJVEVSQVRFX0tFWVM7XG4gIHNyY19JdGVyYXRvcl9fSXRlcmF0b3IuVkFMVUVTID0gSVRFUkFURV9WQUxVRVM7XG4gIHNyY19JdGVyYXRvcl9fSXRlcmF0b3IuRU5UUklFUyA9IElURVJBVEVfRU5UUklFUztcblxuICBzcmNfSXRlcmF0b3JfX0l0ZXJhdG9yLnByb3RvdHlwZS5pbnNwZWN0ID1cbiAgc3JjX0l0ZXJhdG9yX19JdGVyYXRvci5wcm90b3R5cGUudG9Tb3VyY2UgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLnRvU3RyaW5nKCk7IH1cbiAgc3JjX0l0ZXJhdG9yX19JdGVyYXRvci5wcm90b3R5cGVbSVRFUkFUT1JfU1lNQk9MXSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuXG4gIGZ1bmN0aW9uIGl0ZXJhdG9yVmFsdWUodHlwZSwgaywgdiwgaXRlcmF0b3JSZXN1bHQpIHtcbiAgICB2YXIgdmFsdWUgPSB0eXBlID09PSAwID8gayA6IHR5cGUgPT09IDEgPyB2IDogW2ssIHZdO1xuICAgIGl0ZXJhdG9yUmVzdWx0ID8gKGl0ZXJhdG9yUmVzdWx0LnZhbHVlID0gdmFsdWUpIDogKGl0ZXJhdG9yUmVzdWx0ID0ge1xuICAgICAgdmFsdWU6IHZhbHVlLCBkb25lOiBmYWxzZVxuICAgIH0pO1xuICAgIHJldHVybiBpdGVyYXRvclJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGl0ZXJhdG9yRG9uZSgpIHtcbiAgICByZXR1cm4geyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH07XG4gIH1cblxuICBmdW5jdGlvbiBoYXNJdGVyYXRvcihtYXliZUl0ZXJhYmxlKSB7XG4gICAgcmV0dXJuICEhZ2V0SXRlcmF0b3JGbihtYXliZUl0ZXJhYmxlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzSXRlcmF0b3IobWF5YmVJdGVyYXRvcikge1xuICAgIHJldHVybiBtYXliZUl0ZXJhdG9yICYmIHR5cGVvZiBtYXliZUl0ZXJhdG9yLm5leHQgPT09ICdmdW5jdGlvbic7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRJdGVyYXRvcihpdGVyYWJsZSkge1xuICAgIHZhciBpdGVyYXRvckZuID0gZ2V0SXRlcmF0b3JGbihpdGVyYWJsZSk7XG4gICAgcmV0dXJuIGl0ZXJhdG9yRm4gJiYgaXRlcmF0b3JGbi5jYWxsKGl0ZXJhYmxlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEl0ZXJhdG9yRm4oaXRlcmFibGUpIHtcbiAgICB2YXIgaXRlcmF0b3JGbiA9IGl0ZXJhYmxlICYmIChcbiAgICAgIChSRUFMX0lURVJBVE9SX1NZTUJPTCAmJiBpdGVyYWJsZVtSRUFMX0lURVJBVE9SX1NZTUJPTF0pIHx8XG4gICAgICBpdGVyYWJsZVtGQVVYX0lURVJBVE9SX1NZTUJPTF1cbiAgICApO1xuICAgIGlmICh0eXBlb2YgaXRlcmF0b3JGbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIGl0ZXJhdG9yRm47XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaXNBcnJheUxpa2UodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlLmxlbmd0aCA9PT0gJ251bWJlcic7XG4gIH1cblxuICBjcmVhdGVDbGFzcyhTZXEsIEl0ZXJhYmxlKTtcbiAgICBmdW5jdGlvbiBTZXEodmFsdWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkID8gZW1wdHlTZXF1ZW5jZSgpIDpcbiAgICAgICAgaXNJdGVyYWJsZSh2YWx1ZSkgPyB2YWx1ZS50b1NlcSgpIDogc2VxRnJvbVZhbHVlKHZhbHVlKTtcbiAgICB9XG5cbiAgICBTZXEub2YgPSBmdW5jdGlvbigvKi4uLnZhbHVlcyovKSB7XG4gICAgICByZXR1cm4gU2VxKGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICAgIFNlcS5wcm90b3R5cGUudG9TZXEgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBTZXEucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX3RvU3RyaW5nKCdTZXEgeycsICd9Jyk7XG4gICAgfTtcblxuICAgIFNlcS5wcm90b3R5cGUuY2FjaGVSZXN1bHQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghdGhpcy5fY2FjaGUgJiYgdGhpcy5fX2l0ZXJhdGVVbmNhY2hlZCkge1xuICAgICAgICB0aGlzLl9jYWNoZSA9IHRoaXMuZW50cnlTZXEoKS50b0FycmF5KCk7XG4gICAgICAgIHRoaXMuc2l6ZSA9IHRoaXMuX2NhY2hlLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvLyBhYnN0cmFjdCBfX2l0ZXJhdGVVbmNhY2hlZChmbiwgcmV2ZXJzZSlcblxuICAgIFNlcS5wcm90b3R5cGUuX19pdGVyYXRlID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHtcbiAgICAgIHJldHVybiBzZXFJdGVyYXRlKHRoaXMsIGZuLCByZXZlcnNlLCB0cnVlKTtcbiAgICB9O1xuXG4gICAgLy8gYWJzdHJhY3QgX19pdGVyYXRvclVuY2FjaGVkKHR5cGUsIHJldmVyc2UpXG5cbiAgICBTZXEucHJvdG90eXBlLl9faXRlcmF0b3IgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICByZXR1cm4gc2VxSXRlcmF0b3IodGhpcywgdHlwZSwgcmV2ZXJzZSwgdHJ1ZSk7XG4gICAgfTtcblxuXG5cbiAgY3JlYXRlQ2xhc3MoS2V5ZWRTZXEsIFNlcSk7XG4gICAgZnVuY3Rpb24gS2V5ZWRTZXEodmFsdWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkID9cbiAgICAgICAgZW1wdHlTZXF1ZW5jZSgpLnRvS2V5ZWRTZXEoKSA6XG4gICAgICAgIGlzSXRlcmFibGUodmFsdWUpID9cbiAgICAgICAgICAoaXNLZXllZCh2YWx1ZSkgPyB2YWx1ZS50b1NlcSgpIDogdmFsdWUuZnJvbUVudHJ5U2VxKCkpIDpcbiAgICAgICAgICBrZXllZFNlcUZyb21WYWx1ZSh2YWx1ZSk7XG4gICAgfVxuXG4gICAgS2V5ZWRTZXEucHJvdG90eXBlLnRvS2V5ZWRTZXEgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cblxuXG4gIGNyZWF0ZUNsYXNzKEluZGV4ZWRTZXEsIFNlcSk7XG4gICAgZnVuY3Rpb24gSW5kZXhlZFNlcSh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQgPyBlbXB0eVNlcXVlbmNlKCkgOlxuICAgICAgICAhaXNJdGVyYWJsZSh2YWx1ZSkgPyBpbmRleGVkU2VxRnJvbVZhbHVlKHZhbHVlKSA6XG4gICAgICAgIGlzS2V5ZWQodmFsdWUpID8gdmFsdWUuZW50cnlTZXEoKSA6IHZhbHVlLnRvSW5kZXhlZFNlcSgpO1xuICAgIH1cblxuICAgIEluZGV4ZWRTZXEub2YgPSBmdW5jdGlvbigvKi4uLnZhbHVlcyovKSB7XG4gICAgICByZXR1cm4gSW5kZXhlZFNlcShhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBJbmRleGVkU2VxLnByb3RvdHlwZS50b0luZGV4ZWRTZXEgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBJbmRleGVkU2VxLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX190b1N0cmluZygnU2VxIFsnLCAnXScpO1xuICAgIH07XG5cbiAgICBJbmRleGVkU2VxLnByb3RvdHlwZS5fX2l0ZXJhdGUgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge1xuICAgICAgcmV0dXJuIHNlcUl0ZXJhdGUodGhpcywgZm4sIHJldmVyc2UsIGZhbHNlKTtcbiAgICB9O1xuXG4gICAgSW5kZXhlZFNlcS5wcm90b3R5cGUuX19pdGVyYXRvciA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIHJldHVybiBzZXFJdGVyYXRvcih0aGlzLCB0eXBlLCByZXZlcnNlLCBmYWxzZSk7XG4gICAgfTtcblxuXG5cbiAgY3JlYXRlQ2xhc3MoU2V0U2VxLCBTZXEpO1xuICAgIGZ1bmN0aW9uIFNldFNlcSh2YWx1ZSkge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCA/IGVtcHR5U2VxdWVuY2UoKSA6XG4gICAgICAgICFpc0l0ZXJhYmxlKHZhbHVlKSA/IGluZGV4ZWRTZXFGcm9tVmFsdWUodmFsdWUpIDpcbiAgICAgICAgaXNLZXllZCh2YWx1ZSkgPyB2YWx1ZS5lbnRyeVNlcSgpIDogdmFsdWVcbiAgICAgICkudG9TZXRTZXEoKTtcbiAgICB9XG5cbiAgICBTZXRTZXEub2YgPSBmdW5jdGlvbigvKi4uLnZhbHVlcyovKSB7XG4gICAgICByZXR1cm4gU2V0U2VxKGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICAgIFNldFNlcS5wcm90b3R5cGUudG9TZXRTZXEgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cblxuXG4gIFNlcS5pc1NlcSA9IGlzU2VxO1xuICBTZXEuS2V5ZWQgPSBLZXllZFNlcTtcbiAgU2VxLlNldCA9IFNldFNlcTtcbiAgU2VxLkluZGV4ZWQgPSBJbmRleGVkU2VxO1xuXG4gIHZhciBJU19TRVFfU0VOVElORUwgPSAnQEBfX0lNTVVUQUJMRV9TRVFfX0BAJztcblxuICBTZXEucHJvdG90eXBlW0lTX1NFUV9TRU5USU5FTF0gPSB0cnVlO1xuXG5cblxuICAvLyAjcHJhZ21hIFJvb3QgU2VxdWVuY2VzXG5cbiAgY3JlYXRlQ2xhc3MoQXJyYXlTZXEsIEluZGV4ZWRTZXEpO1xuICAgIGZ1bmN0aW9uIEFycmF5U2VxKGFycmF5KSB7XG4gICAgICB0aGlzLl9hcnJheSA9IGFycmF5O1xuICAgICAgdGhpcy5zaXplID0gYXJyYXkubGVuZ3RoO1xuICAgIH1cblxuICAgIEFycmF5U2VxLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihpbmRleCwgbm90U2V0VmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmhhcyhpbmRleCkgPyB0aGlzLl9hcnJheVt3cmFwSW5kZXgodGhpcywgaW5kZXgpXSA6IG5vdFNldFZhbHVlO1xuICAgIH07XG5cbiAgICBBcnJheVNlcS5wcm90b3R5cGUuX19pdGVyYXRlID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHtcbiAgICAgIHZhciBhcnJheSA9IHRoaXMuX2FycmF5O1xuICAgICAgdmFyIG1heEluZGV4ID0gYXJyYXkubGVuZ3RoIC0gMTtcbiAgICAgIGZvciAodmFyIGlpID0gMDsgaWkgPD0gbWF4SW5kZXg7IGlpKyspIHtcbiAgICAgICAgaWYgKGZuKGFycmF5W3JldmVyc2UgPyBtYXhJbmRleCAtIGlpIDogaWldLCBpaSwgdGhpcykgPT09IGZhbHNlKSB7XG4gICAgICAgICAgcmV0dXJuIGlpICsgMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGlpO1xuICAgIH07XG5cbiAgICBBcnJheVNlcS5wcm90b3R5cGUuX19pdGVyYXRvciA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIHZhciBhcnJheSA9IHRoaXMuX2FycmF5O1xuICAgICAgdmFyIG1heEluZGV4ID0gYXJyYXkubGVuZ3RoIC0gMTtcbiAgICAgIHZhciBpaSA9IDA7XG4gICAgICByZXR1cm4gbmV3IHNyY19JdGVyYXRvcl9fSXRlcmF0b3IoZnVuY3Rpb24oKSBcbiAgICAgICAge3JldHVybiBpaSA+IG1heEluZGV4ID9cbiAgICAgICAgICBpdGVyYXRvckRvbmUoKSA6XG4gICAgICAgICAgaXRlcmF0b3JWYWx1ZSh0eXBlLCBpaSwgYXJyYXlbcmV2ZXJzZSA/IG1heEluZGV4IC0gaWkrKyA6IGlpKytdKX1cbiAgICAgICk7XG4gICAgfTtcblxuXG5cbiAgY3JlYXRlQ2xhc3MoT2JqZWN0U2VxLCBLZXllZFNlcSk7XG4gICAgZnVuY3Rpb24gT2JqZWN0U2VxKG9iamVjdCkge1xuICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmplY3QpO1xuICAgICAgdGhpcy5fb2JqZWN0ID0gb2JqZWN0O1xuICAgICAgdGhpcy5fa2V5cyA9IGtleXM7XG4gICAgICB0aGlzLnNpemUgPSBrZXlzLmxlbmd0aDtcbiAgICB9XG5cbiAgICBPYmplY3RTZXEucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGtleSwgbm90U2V0VmFsdWUpIHtcbiAgICAgIGlmIChub3RTZXRWYWx1ZSAhPT0gdW5kZWZpbmVkICYmICF0aGlzLmhhcyhrZXkpKSB7XG4gICAgICAgIHJldHVybiBub3RTZXRWYWx1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9vYmplY3Rba2V5XTtcbiAgICB9O1xuXG4gICAgT2JqZWN0U2VxLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiB0aGlzLl9vYmplY3QuaGFzT3duUHJvcGVydHkoa2V5KTtcbiAgICB9O1xuXG4gICAgT2JqZWN0U2VxLnByb3RvdHlwZS5fX2l0ZXJhdGUgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge1xuICAgICAgdmFyIG9iamVjdCA9IHRoaXMuX29iamVjdDtcbiAgICAgIHZhciBrZXlzID0gdGhpcy5fa2V5cztcbiAgICAgIHZhciBtYXhJbmRleCA9IGtleXMubGVuZ3RoIC0gMTtcbiAgICAgIGZvciAodmFyIGlpID0gMDsgaWkgPD0gbWF4SW5kZXg7IGlpKyspIHtcbiAgICAgICAgdmFyIGtleSA9IGtleXNbcmV2ZXJzZSA/IG1heEluZGV4IC0gaWkgOiBpaV07XG4gICAgICAgIGlmIChmbihvYmplY3Rba2V5XSwga2V5LCB0aGlzKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICByZXR1cm4gaWkgKyAxO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gaWk7XG4gICAgfTtcblxuICAgIE9iamVjdFNlcS5wcm90b3R5cGUuX19pdGVyYXRvciA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIHZhciBvYmplY3QgPSB0aGlzLl9vYmplY3Q7XG4gICAgICB2YXIga2V5cyA9IHRoaXMuX2tleXM7XG4gICAgICB2YXIgbWF4SW5kZXggPSBrZXlzLmxlbmd0aCAtIDE7XG4gICAgICB2YXIgaWkgPSAwO1xuICAgICAgcmV0dXJuIG5ldyBzcmNfSXRlcmF0b3JfX0l0ZXJhdG9yKGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgdmFyIGtleSA9IGtleXNbcmV2ZXJzZSA/IG1heEluZGV4IC0gaWkgOiBpaV07XG4gICAgICAgIHJldHVybiBpaSsrID4gbWF4SW5kZXggP1xuICAgICAgICAgIGl0ZXJhdG9yRG9uZSgpIDpcbiAgICAgICAgICBpdGVyYXRvclZhbHVlKHR5cGUsIGtleSwgb2JqZWN0W2tleV0pO1xuICAgICAgfSk7XG4gICAgfTtcblxuICBPYmplY3RTZXEucHJvdG90eXBlW0lTX09SREVSRURfU0VOVElORUxdID0gdHJ1ZTtcblxuXG4gIGNyZWF0ZUNsYXNzKEl0ZXJhYmxlU2VxLCBJbmRleGVkU2VxKTtcbiAgICBmdW5jdGlvbiBJdGVyYWJsZVNlcShpdGVyYWJsZSkge1xuICAgICAgdGhpcy5faXRlcmFibGUgPSBpdGVyYWJsZTtcbiAgICAgIHRoaXMuc2l6ZSA9IGl0ZXJhYmxlLmxlbmd0aCB8fCBpdGVyYWJsZS5zaXplO1xuICAgIH1cblxuICAgIEl0ZXJhYmxlU2VxLnByb3RvdHlwZS5fX2l0ZXJhdGVVbmNhY2hlZCA9IGZ1bmN0aW9uKGZuLCByZXZlcnNlKSB7XG4gICAgICBpZiAocmV2ZXJzZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWNoZVJlc3VsdCgpLl9faXRlcmF0ZShmbiwgcmV2ZXJzZSk7XG4gICAgICB9XG4gICAgICB2YXIgaXRlcmFibGUgPSB0aGlzLl9pdGVyYWJsZTtcbiAgICAgIHZhciBpdGVyYXRvciA9IGdldEl0ZXJhdG9yKGl0ZXJhYmxlKTtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIGlmIChpc0l0ZXJhdG9yKGl0ZXJhdG9yKSkge1xuICAgICAgICB2YXIgc3RlcDtcbiAgICAgICAgd2hpbGUgKCEoc3RlcCA9IGl0ZXJhdG9yLm5leHQoKSkuZG9uZSkge1xuICAgICAgICAgIGlmIChmbihzdGVwLnZhbHVlLCBpdGVyYXRpb25zKyssIHRoaXMpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gaXRlcmF0aW9ucztcbiAgICB9O1xuXG4gICAgSXRlcmFibGVTZXEucHJvdG90eXBlLl9faXRlcmF0b3JVbmNhY2hlZCA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIGlmIChyZXZlcnNlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhY2hlUmVzdWx0KCkuX19pdGVyYXRvcih0eXBlLCByZXZlcnNlKTtcbiAgICAgIH1cbiAgICAgIHZhciBpdGVyYWJsZSA9IHRoaXMuX2l0ZXJhYmxlO1xuICAgICAgdmFyIGl0ZXJhdG9yID0gZ2V0SXRlcmF0b3IoaXRlcmFibGUpO1xuICAgICAgaWYgKCFpc0l0ZXJhdG9yKGl0ZXJhdG9yKSkge1xuICAgICAgICByZXR1cm4gbmV3IHNyY19JdGVyYXRvcl9fSXRlcmF0b3IoaXRlcmF0b3JEb25lKTtcbiAgICAgIH1cbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHJldHVybiBuZXcgc3JjX0l0ZXJhdG9yX19JdGVyYXRvcihmdW5jdGlvbigpICB7XG4gICAgICAgIHZhciBzdGVwID0gaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICByZXR1cm4gc3RlcC5kb25lID8gc3RlcCA6IGl0ZXJhdG9yVmFsdWUodHlwZSwgaXRlcmF0aW9ucysrLCBzdGVwLnZhbHVlKTtcbiAgICAgIH0pO1xuICAgIH07XG5cblxuXG4gIGNyZWF0ZUNsYXNzKEl0ZXJhdG9yU2VxLCBJbmRleGVkU2VxKTtcbiAgICBmdW5jdGlvbiBJdGVyYXRvclNlcShpdGVyYXRvcikge1xuICAgICAgdGhpcy5faXRlcmF0b3IgPSBpdGVyYXRvcjtcbiAgICAgIHRoaXMuX2l0ZXJhdG9yQ2FjaGUgPSBbXTtcbiAgICB9XG5cbiAgICBJdGVyYXRvclNlcS5wcm90b3R5cGUuX19pdGVyYXRlVW5jYWNoZWQgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge1xuICAgICAgaWYgKHJldmVyc2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVSZXN1bHQoKS5fX2l0ZXJhdGUoZm4sIHJldmVyc2UpO1xuICAgICAgfVxuICAgICAgdmFyIGl0ZXJhdG9yID0gdGhpcy5faXRlcmF0b3I7XG4gICAgICB2YXIgY2FjaGUgPSB0aGlzLl9pdGVyYXRvckNhY2hlO1xuICAgICAgdmFyIGl0ZXJhdGlvbnMgPSAwO1xuICAgICAgd2hpbGUgKGl0ZXJhdGlvbnMgPCBjYWNoZS5sZW5ndGgpIHtcbiAgICAgICAgaWYgKGZuKGNhY2hlW2l0ZXJhdGlvbnNdLCBpdGVyYXRpb25zKyssIHRoaXMpID09PSBmYWxzZSkge1xuICAgICAgICAgIHJldHVybiBpdGVyYXRpb25zO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB2YXIgc3RlcDtcbiAgICAgIHdoaWxlICghKHN0ZXAgPSBpdGVyYXRvci5uZXh0KCkpLmRvbmUpIHtcbiAgICAgICAgdmFyIHZhbCA9IHN0ZXAudmFsdWU7XG4gICAgICAgIGNhY2hlW2l0ZXJhdGlvbnNdID0gdmFsO1xuICAgICAgICBpZiAoZm4odmFsLCBpdGVyYXRpb25zKyssIHRoaXMpID09PSBmYWxzZSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gaXRlcmF0aW9ucztcbiAgICB9O1xuXG4gICAgSXRlcmF0b3JTZXEucHJvdG90eXBlLl9faXRlcmF0b3JVbmNhY2hlZCA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIGlmIChyZXZlcnNlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhY2hlUmVzdWx0KCkuX19pdGVyYXRvcih0eXBlLCByZXZlcnNlKTtcbiAgICAgIH1cbiAgICAgIHZhciBpdGVyYXRvciA9IHRoaXMuX2l0ZXJhdG9yO1xuICAgICAgdmFyIGNhY2hlID0gdGhpcy5faXRlcmF0b3JDYWNoZTtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHJldHVybiBuZXcgc3JjX0l0ZXJhdG9yX19JdGVyYXRvcihmdW5jdGlvbigpICB7XG4gICAgICAgIGlmIChpdGVyYXRpb25zID49IGNhY2hlLmxlbmd0aCkge1xuICAgICAgICAgIHZhciBzdGVwID0gaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICAgIGlmIChzdGVwLmRvbmUpIHtcbiAgICAgICAgICAgIHJldHVybiBzdGVwO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjYWNoZVtpdGVyYXRpb25zXSA9IHN0ZXAudmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGl0ZXJhdG9yVmFsdWUodHlwZSwgaXRlcmF0aW9ucywgY2FjaGVbaXRlcmF0aW9ucysrXSk7XG4gICAgICB9KTtcbiAgICB9O1xuXG5cblxuXG4gIC8vICMgcHJhZ21hIEhlbHBlciBmdW5jdGlvbnNcblxuICBmdW5jdGlvbiBpc1NlcShtYXliZVNlcSkge1xuICAgIHJldHVybiAhIShtYXliZVNlcSAmJiBtYXliZVNlcVtJU19TRVFfU0VOVElORUxdKTtcbiAgfVxuXG4gIHZhciBFTVBUWV9TRVE7XG5cbiAgZnVuY3Rpb24gZW1wdHlTZXF1ZW5jZSgpIHtcbiAgICByZXR1cm4gRU1QVFlfU0VRIHx8IChFTVBUWV9TRVEgPSBuZXcgQXJyYXlTZXEoW10pKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGtleWVkU2VxRnJvbVZhbHVlKHZhbHVlKSB7XG4gICAgdmFyIHNlcSA9XG4gICAgICBBcnJheS5pc0FycmF5KHZhbHVlKSA/IG5ldyBBcnJheVNlcSh2YWx1ZSkuZnJvbUVudHJ5U2VxKCkgOlxuICAgICAgaXNJdGVyYXRvcih2YWx1ZSkgPyBuZXcgSXRlcmF0b3JTZXEodmFsdWUpLmZyb21FbnRyeVNlcSgpIDpcbiAgICAgIGhhc0l0ZXJhdG9yKHZhbHVlKSA/IG5ldyBJdGVyYWJsZVNlcSh2YWx1ZSkuZnJvbUVudHJ5U2VxKCkgOlxuICAgICAgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyA/IG5ldyBPYmplY3RTZXEodmFsdWUpIDpcbiAgICAgIHVuZGVmaW5lZDtcbiAgICBpZiAoIXNlcSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgJ0V4cGVjdGVkIEFycmF5IG9yIGl0ZXJhYmxlIG9iamVjdCBvZiBbaywgdl0gZW50cmllcywgJytcbiAgICAgICAgJ29yIGtleWVkIG9iamVjdDogJyArIHZhbHVlXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gc2VxO1xuICB9XG5cbiAgZnVuY3Rpb24gaW5kZXhlZFNlcUZyb21WYWx1ZSh2YWx1ZSkge1xuICAgIHZhciBzZXEgPSBtYXliZUluZGV4ZWRTZXFGcm9tVmFsdWUodmFsdWUpO1xuICAgIGlmICghc2VxKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAnRXhwZWN0ZWQgQXJyYXkgb3IgaXRlcmFibGUgb2JqZWN0IG9mIHZhbHVlczogJyArIHZhbHVlXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gc2VxO1xuICB9XG5cbiAgZnVuY3Rpb24gc2VxRnJvbVZhbHVlKHZhbHVlKSB7XG4gICAgdmFyIHNlcSA9IG1heWJlSW5kZXhlZFNlcUZyb21WYWx1ZSh2YWx1ZSkgfHxcbiAgICAgICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIG5ldyBPYmplY3RTZXEodmFsdWUpKTtcbiAgICBpZiAoIXNlcSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgJ0V4cGVjdGVkIEFycmF5IG9yIGl0ZXJhYmxlIG9iamVjdCBvZiB2YWx1ZXMsIG9yIGtleWVkIG9iamVjdDogJyArIHZhbHVlXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gc2VxO1xuICB9XG5cbiAgZnVuY3Rpb24gbWF5YmVJbmRleGVkU2VxRnJvbVZhbHVlKHZhbHVlKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIGlzQXJyYXlMaWtlKHZhbHVlKSA/IG5ldyBBcnJheVNlcSh2YWx1ZSkgOlxuICAgICAgaXNJdGVyYXRvcih2YWx1ZSkgPyBuZXcgSXRlcmF0b3JTZXEodmFsdWUpIDpcbiAgICAgIGhhc0l0ZXJhdG9yKHZhbHVlKSA/IG5ldyBJdGVyYWJsZVNlcSh2YWx1ZSkgOlxuICAgICAgdW5kZWZpbmVkXG4gICAgKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlcUl0ZXJhdGUoc2VxLCBmbiwgcmV2ZXJzZSwgdXNlS2V5cykge1xuICAgIHZhciBjYWNoZSA9IHNlcS5fY2FjaGU7XG4gICAgaWYgKGNhY2hlKSB7XG4gICAgICB2YXIgbWF4SW5kZXggPSBjYWNoZS5sZW5ndGggLSAxO1xuICAgICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8PSBtYXhJbmRleDsgaWkrKykge1xuICAgICAgICB2YXIgZW50cnkgPSBjYWNoZVtyZXZlcnNlID8gbWF4SW5kZXggLSBpaSA6IGlpXTtcbiAgICAgICAgaWYgKGZuKGVudHJ5WzFdLCB1c2VLZXlzID8gZW50cnlbMF0gOiBpaSwgc2VxKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICByZXR1cm4gaWkgKyAxO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gaWk7XG4gICAgfVxuICAgIHJldHVybiBzZXEuX19pdGVyYXRlVW5jYWNoZWQoZm4sIHJldmVyc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2VxSXRlcmF0b3Ioc2VxLCB0eXBlLCByZXZlcnNlLCB1c2VLZXlzKSB7XG4gICAgdmFyIGNhY2hlID0gc2VxLl9jYWNoZTtcbiAgICBpZiAoY2FjaGUpIHtcbiAgICAgIHZhciBtYXhJbmRleCA9IGNhY2hlLmxlbmd0aCAtIDE7XG4gICAgICB2YXIgaWkgPSAwO1xuICAgICAgcmV0dXJuIG5ldyBzcmNfSXRlcmF0b3JfX0l0ZXJhdG9yKGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgdmFyIGVudHJ5ID0gY2FjaGVbcmV2ZXJzZSA/IG1heEluZGV4IC0gaWkgOiBpaV07XG4gICAgICAgIHJldHVybiBpaSsrID4gbWF4SW5kZXggP1xuICAgICAgICAgIGl0ZXJhdG9yRG9uZSgpIDpcbiAgICAgICAgICBpdGVyYXRvclZhbHVlKHR5cGUsIHVzZUtleXMgPyBlbnRyeVswXSA6IGlpIC0gMSwgZW50cnlbMV0pO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBzZXEuX19pdGVyYXRvclVuY2FjaGVkKHR5cGUsIHJldmVyc2UpO1xuICB9XG5cbiAgY3JlYXRlQ2xhc3MoQ29sbGVjdGlvbiwgSXRlcmFibGUpO1xuICAgIGZ1bmN0aW9uIENvbGxlY3Rpb24oKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoJ0Fic3RyYWN0Jyk7XG4gICAgfVxuXG5cbiAgY3JlYXRlQ2xhc3MoS2V5ZWRDb2xsZWN0aW9uLCBDb2xsZWN0aW9uKTtmdW5jdGlvbiBLZXllZENvbGxlY3Rpb24oKSB7fVxuXG4gIGNyZWF0ZUNsYXNzKEluZGV4ZWRDb2xsZWN0aW9uLCBDb2xsZWN0aW9uKTtmdW5jdGlvbiBJbmRleGVkQ29sbGVjdGlvbigpIHt9XG5cbiAgY3JlYXRlQ2xhc3MoU2V0Q29sbGVjdGlvbiwgQ29sbGVjdGlvbik7ZnVuY3Rpb24gU2V0Q29sbGVjdGlvbigpIHt9XG5cblxuICBDb2xsZWN0aW9uLktleWVkID0gS2V5ZWRDb2xsZWN0aW9uO1xuICBDb2xsZWN0aW9uLkluZGV4ZWQgPSBJbmRleGVkQ29sbGVjdGlvbjtcbiAgQ29sbGVjdGlvbi5TZXQgPSBTZXRDb2xsZWN0aW9uO1xuXG4gIC8qKlxuICAgKiBBbiBleHRlbnNpb24gb2YgdGhlIFwic2FtZS12YWx1ZVwiIGFsZ29yaXRobSBhcyBbZGVzY3JpYmVkIGZvciB1c2UgYnkgRVM2IE1hcFxuICAgKiBhbmQgU2V0XShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9NYXAjS2V5X2VxdWFsaXR5KVxuICAgKlxuICAgKiBOYU4gaXMgY29uc2lkZXJlZCB0aGUgc2FtZSBhcyBOYU4sIGhvd2V2ZXIgLTAgYW5kIDAgYXJlIGNvbnNpZGVyZWQgdGhlIHNhbWVcbiAgICogdmFsdWUsIHdoaWNoIGlzIGRpZmZlcmVudCBmcm9tIHRoZSBhbGdvcml0aG0gZGVzY3JpYmVkIGJ5XG4gICAqIFtgT2JqZWN0LmlzYF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvT2JqZWN0L2lzKS5cbiAgICpcbiAgICogVGhpcyBpcyBleHRlbmRlZCBmdXJ0aGVyIHRvIGFsbG93IE9iamVjdHMgdG8gZGVzY3JpYmUgdGhlIHZhbHVlcyB0aGV5XG4gICAqIHJlcHJlc2VudCwgYnkgd2F5IG9mIGB2YWx1ZU9mYCBvciBgZXF1YWxzYCAoYW5kIGBoYXNoQ29kZWApLlxuICAgKlxuICAgKiBOb3RlOiBiZWNhdXNlIG9mIHRoaXMgZXh0ZW5zaW9uLCB0aGUga2V5IGVxdWFsaXR5IG9mIEltbXV0YWJsZS5NYXAgYW5kIHRoZVxuICAgKiB2YWx1ZSBlcXVhbGl0eSBvZiBJbW11dGFibGUuU2V0IHdpbGwgZGlmZmVyIGZyb20gRVM2IE1hcCBhbmQgU2V0LlxuICAgKlxuICAgKiAjIyMgRGVmaW5pbmcgY3VzdG9tIHZhbHVlc1xuICAgKlxuICAgKiBUaGUgZWFzaWVzdCB3YXkgdG8gZGVzY3JpYmUgdGhlIHZhbHVlIGFuIG9iamVjdCByZXByZXNlbnRzIGlzIGJ5IGltcGxlbWVudGluZ1xuICAgKiBgdmFsdWVPZmAuIEZvciBleGFtcGxlLCBgRGF0ZWAgcmVwcmVzZW50cyBhIHZhbHVlIGJ5IHJldHVybmluZyBhIHVuaXhcbiAgICogdGltZXN0YW1wIGZvciBgdmFsdWVPZmA6XG4gICAqXG4gICAqICAgICB2YXIgZGF0ZTEgPSBuZXcgRGF0ZSgxMjM0NTY3ODkwMDAwKTsgLy8gRnJpIEZlYiAxMyAyMDA5IC4uLlxuICAgKiAgICAgdmFyIGRhdGUyID0gbmV3IERhdGUoMTIzNDU2Nzg5MDAwMCk7XG4gICAqICAgICBkYXRlMS52YWx1ZU9mKCk7IC8vIDEyMzQ1Njc4OTAwMDBcbiAgICogICAgIGFzc2VydCggZGF0ZTEgIT09IGRhdGUyICk7XG4gICAqICAgICBhc3NlcnQoIEltbXV0YWJsZS5pcyggZGF0ZTEsIGRhdGUyICkgKTtcbiAgICpcbiAgICogTm90ZTogb3ZlcnJpZGluZyBgdmFsdWVPZmAgbWF5IGhhdmUgb3RoZXIgaW1wbGljYXRpb25zIGlmIHlvdSB1c2UgdGhpcyBvYmplY3RcbiAgICogd2hlcmUgSmF2YVNjcmlwdCBleHBlY3RzIGEgcHJpbWl0aXZlLCBzdWNoIGFzIGltcGxpY2l0IHN0cmluZyBjb2VyY2lvbi5cbiAgICpcbiAgICogRm9yIG1vcmUgY29tcGxleCB0eXBlcywgZXNwZWNpYWxseSBjb2xsZWN0aW9ucywgaW1wbGVtZW50aW5nIGB2YWx1ZU9mYCBtYXlcbiAgICogbm90IGJlIHBlcmZvcm1hbnQuIEFuIGFsdGVybmF0aXZlIGlzIHRvIGltcGxlbWVudCBgZXF1YWxzYCBhbmQgYGhhc2hDb2RlYC5cbiAgICpcbiAgICogYGVxdWFsc2AgdGFrZXMgYW5vdGhlciBvYmplY3QsIHByZXN1bWFibHkgb2Ygc2ltaWxhciB0eXBlLCBhbmQgcmV0dXJucyB0cnVlXG4gICAqIGlmIHRoZSBpdCBpcyBlcXVhbC4gRXF1YWxpdHkgaXMgc3ltbWV0cmljYWwsIHNvIHRoZSBzYW1lIHJlc3VsdCBzaG91bGQgYmVcbiAgICogcmV0dXJuZWQgaWYgdGhpcyBhbmQgdGhlIGFyZ3VtZW50IGFyZSBmbGlwcGVkLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0KCBhLmVxdWFscyhiKSA9PT0gYi5lcXVhbHMoYSkgKTtcbiAgICpcbiAgICogYGhhc2hDb2RlYCByZXR1cm5zIGEgMzJiaXQgaW50ZWdlciBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSBvYmplY3Qgd2hpY2ggd2lsbFxuICAgKiBiZSB1c2VkIHRvIGRldGVybWluZSBob3cgdG8gc3RvcmUgdGhlIHZhbHVlIG9iamVjdCBpbiBhIE1hcCBvciBTZXQuIFlvdSBtdXN0XG4gICAqIHByb3ZpZGUgYm90aCBvciBuZWl0aGVyIG1ldGhvZHMsIG9uZSBtdXN0IG5vdCBleGlzdCB3aXRob3V0IHRoZSBvdGhlci5cbiAgICpcbiAgICogQWxzbywgYW4gaW1wb3J0YW50IHJlbGF0aW9uc2hpcCBiZXR3ZWVuIHRoZXNlIG1ldGhvZHMgbXVzdCBiZSB1cGhlbGQ6IGlmIHR3b1xuICAgKiB2YWx1ZXMgYXJlIGVxdWFsLCB0aGV5ICptdXN0KiByZXR1cm4gdGhlIHNhbWUgaGFzaENvZGUuIElmIHRoZSB2YWx1ZXMgYXJlIG5vdFxuICAgKiBlcXVhbCwgdGhleSBtaWdodCBoYXZlIHRoZSBzYW1lIGhhc2hDb2RlOyB0aGlzIGlzIGNhbGxlZCBhIGhhc2ggY29sbGlzaW9uLFxuICAgKiBhbmQgd2hpbGUgdW5kZXNpcmFibGUgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsIGl0IGlzIGFjY2VwdGFibGUuXG4gICAqXG4gICAqICAgICBpZiAoYS5lcXVhbHMoYikpIHtcbiAgICogICAgICAgYXNzZXJ0KCBhLmhhc2hDb2RlKCkgPT09IGIuaGFzaENvZGUoKSApO1xuICAgKiAgICAgfVxuICAgKlxuICAgKiBBbGwgSW1tdXRhYmxlIGNvbGxlY3Rpb25zIGltcGxlbWVudCBgZXF1YWxzYCBhbmQgYGhhc2hDb2RlYC5cbiAgICpcbiAgICovXG4gIGZ1bmN0aW9uIGlzKHZhbHVlQSwgdmFsdWVCKSB7XG4gICAgaWYgKHZhbHVlQSA9PT0gdmFsdWVCIHx8ICh2YWx1ZUEgIT09IHZhbHVlQSAmJiB2YWx1ZUIgIT09IHZhbHVlQikpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoIXZhbHVlQSB8fCAhdmFsdWVCKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdmFsdWVBLnZhbHVlT2YgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgICAgdHlwZW9mIHZhbHVlQi52YWx1ZU9mID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2YWx1ZUEgPSB2YWx1ZUEudmFsdWVPZigpO1xuICAgICAgdmFsdWVCID0gdmFsdWVCLnZhbHVlT2YoKTtcbiAgICAgIGlmICh2YWx1ZUEgPT09IHZhbHVlQiB8fCAodmFsdWVBICE9PSB2YWx1ZUEgJiYgdmFsdWVCICE9PSB2YWx1ZUIpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKCF2YWx1ZUEgfHwgIXZhbHVlQikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdmFsdWVBLmVxdWFscyA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgICB0eXBlb2YgdmFsdWVCLmVxdWFscyA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgICB2YWx1ZUEuZXF1YWxzKHZhbHVlQikpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBmcm9tSlMoanNvbiwgY29udmVydGVyKSB7XG4gICAgcmV0dXJuIGNvbnZlcnRlciA/XG4gICAgICBmcm9tSlNXaXRoKGNvbnZlcnRlciwganNvbiwgJycsIHsnJzoganNvbn0pIDpcbiAgICAgIGZyb21KU0RlZmF1bHQoanNvbik7XG4gIH1cblxuICBmdW5jdGlvbiBmcm9tSlNXaXRoKGNvbnZlcnRlciwganNvbiwga2V5LCBwYXJlbnRKU09OKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoanNvbikpIHtcbiAgICAgIHJldHVybiBjb252ZXJ0ZXIuY2FsbChwYXJlbnRKU09OLCBrZXksIEluZGV4ZWRTZXEoanNvbikubWFwKGZ1bmN0aW9uKHYsIGspICB7cmV0dXJuIGZyb21KU1dpdGgoY29udmVydGVyLCB2LCBrLCBqc29uKX0pKTtcbiAgICB9XG4gICAgaWYgKGlzUGxhaW5PYmooanNvbikpIHtcbiAgICAgIHJldHVybiBjb252ZXJ0ZXIuY2FsbChwYXJlbnRKU09OLCBrZXksIEtleWVkU2VxKGpzb24pLm1hcChmdW5jdGlvbih2LCBrKSAge3JldHVybiBmcm9tSlNXaXRoKGNvbnZlcnRlciwgdiwgaywganNvbil9KSk7XG4gICAgfVxuICAgIHJldHVybiBqc29uO1xuICB9XG5cbiAgZnVuY3Rpb24gZnJvbUpTRGVmYXVsdChqc29uKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoanNvbikpIHtcbiAgICAgIHJldHVybiBJbmRleGVkU2VxKGpzb24pLm1hcChmcm9tSlNEZWZhdWx0KS50b0xpc3QoKTtcbiAgICB9XG4gICAgaWYgKGlzUGxhaW5PYmooanNvbikpIHtcbiAgICAgIHJldHVybiBLZXllZFNlcShqc29uKS5tYXAoZnJvbUpTRGVmYXVsdCkudG9NYXAoKTtcbiAgICB9XG4gICAgcmV0dXJuIGpzb247XG4gIH1cblxuICBmdW5jdGlvbiBpc1BsYWluT2JqKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlICYmICh2YWx1ZS5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0IHx8IHZhbHVlLmNvbnN0cnVjdG9yID09PSB1bmRlZmluZWQpO1xuICB9XG5cbiAgdmFyIHNyY19NYXRoX19pbXVsID1cbiAgICB0eXBlb2YgTWF0aC5pbXVsID09PSAnZnVuY3Rpb24nICYmIE1hdGguaW11bCgweGZmZmZmZmZmLCAyKSA9PT0gLTIgP1xuICAgIE1hdGguaW11bCA6XG4gICAgZnVuY3Rpb24gaW11bChhLCBiKSB7XG4gICAgICBhID0gYSB8IDA7IC8vIGludFxuICAgICAgYiA9IGIgfCAwOyAvLyBpbnRcbiAgICAgIHZhciBjID0gYSAmIDB4ZmZmZjtcbiAgICAgIHZhciBkID0gYiAmIDB4ZmZmZjtcbiAgICAgIC8vIFNoaWZ0IGJ5IDAgZml4ZXMgdGhlIHNpZ24gb24gdGhlIGhpZ2ggcGFydC5cbiAgICAgIHJldHVybiAoYyAqIGQpICsgKCgoKGEgPj4+IDE2KSAqIGQgKyBjICogKGIgPj4+IDE2KSkgPDwgMTYpID4+PiAwKSB8IDA7IC8vIGludFxuICAgIH07XG5cbiAgLy8gdjggaGFzIGFuIG9wdGltaXphdGlvbiBmb3Igc3RvcmluZyAzMS1iaXQgc2lnbmVkIG51bWJlcnMuXG4gIC8vIFZhbHVlcyB3aGljaCBoYXZlIGVpdGhlciAwMCBvciAxMSBhcyB0aGUgaGlnaCBvcmRlciBiaXRzIHF1YWxpZnkuXG4gIC8vIFRoaXMgZnVuY3Rpb24gZHJvcHMgdGhlIGhpZ2hlc3Qgb3JkZXIgYml0IGluIGEgc2lnbmVkIG51bWJlciwgbWFpbnRhaW5pbmdcbiAgLy8gdGhlIHNpZ24gYml0LlxuICBmdW5jdGlvbiBzbWkoaTMyKSB7XG4gICAgcmV0dXJuICgoaTMyID4+PiAxKSAmIDB4NDAwMDAwMDApIHwgKGkzMiAmIDB4QkZGRkZGRkYpO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFzaChvKSB7XG4gICAgaWYgKG8gPT09IGZhbHNlIHx8IG8gPT09IG51bGwgfHwgbyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBvLnZhbHVlT2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIG8gPSBvLnZhbHVlT2YoKTtcbiAgICAgIGlmIChvID09PSBmYWxzZSB8fCBvID09PSBudWxsIHx8IG8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG8gPT09IHRydWUpIHtcbiAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICB2YXIgdHlwZSA9IHR5cGVvZiBvO1xuICAgIGlmICh0eXBlID09PSAnbnVtYmVyJykge1xuICAgICAgdmFyIGggPSBvIHwgMDtcbiAgICAgIGlmIChoICE9PSBvKSB7XG4gICAgICAgIGggXj0gbyAqIDB4RkZGRkZGRkY7XG4gICAgICB9XG4gICAgICB3aGlsZSAobyA+IDB4RkZGRkZGRkYpIHtcbiAgICAgICAgbyAvPSAweEZGRkZGRkZGO1xuICAgICAgICBoIF49IG87XG4gICAgICB9XG4gICAgICByZXR1cm4gc21pKGgpO1xuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiBvLmxlbmd0aCA+IFNUUklOR19IQVNIX0NBQ0hFX01JTl9TVFJMRU4gPyBjYWNoZWRIYXNoU3RyaW5nKG8pIDogaGFzaFN0cmluZyhvKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBvLmhhc2hDb2RlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gby5oYXNoQ29kZSgpO1xuICAgIH1cbiAgICByZXR1cm4gaGFzaEpTT2JqKG8pO1xuICB9XG5cbiAgZnVuY3Rpb24gY2FjaGVkSGFzaFN0cmluZyhzdHJpbmcpIHtcbiAgICB2YXIgaGFzaCA9IHN0cmluZ0hhc2hDYWNoZVtzdHJpbmddO1xuICAgIGlmIChoYXNoID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGhhc2ggPSBoYXNoU3RyaW5nKHN0cmluZyk7XG4gICAgICBpZiAoU1RSSU5HX0hBU0hfQ0FDSEVfU0laRSA9PT0gU1RSSU5HX0hBU0hfQ0FDSEVfTUFYX1NJWkUpIHtcbiAgICAgICAgU1RSSU5HX0hBU0hfQ0FDSEVfU0laRSA9IDA7XG4gICAgICAgIHN0cmluZ0hhc2hDYWNoZSA9IHt9O1xuICAgICAgfVxuICAgICAgU1RSSU5HX0hBU0hfQ0FDSEVfU0laRSsrO1xuICAgICAgc3RyaW5nSGFzaENhY2hlW3N0cmluZ10gPSBoYXNoO1xuICAgIH1cbiAgICByZXR1cm4gaGFzaDtcbiAgfVxuXG4gIC8vIGh0dHA6Ly9qc3BlcmYuY29tL2hhc2hpbmctc3RyaW5nc1xuICBmdW5jdGlvbiBoYXNoU3RyaW5nKHN0cmluZykge1xuICAgIC8vIFRoaXMgaXMgdGhlIGhhc2ggZnJvbSBKVk1cbiAgICAvLyBUaGUgaGFzaCBjb2RlIGZvciBhIHN0cmluZyBpcyBjb21wdXRlZCBhc1xuICAgIC8vIHNbMF0gKiAzMSBeIChuIC0gMSkgKyBzWzFdICogMzEgXiAobiAtIDIpICsgLi4uICsgc1tuIC0gMV0sXG4gICAgLy8gd2hlcmUgc1tpXSBpcyB0aGUgaXRoIGNoYXJhY3RlciBvZiB0aGUgc3RyaW5nIGFuZCBuIGlzIHRoZSBsZW5ndGggb2ZcbiAgICAvLyB0aGUgc3RyaW5nLiBXZSBcIm1vZFwiIHRoZSByZXN1bHQgdG8gbWFrZSBpdCBiZXR3ZWVuIDAgKGluY2x1c2l2ZSkgYW5kIDJeMzFcbiAgICAvLyAoZXhjbHVzaXZlKSBieSBkcm9wcGluZyBoaWdoIGJpdHMuXG4gICAgdmFyIGhhc2ggPSAwO1xuICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCBzdHJpbmcubGVuZ3RoOyBpaSsrKSB7XG4gICAgICBoYXNoID0gMzEgKiBoYXNoICsgc3RyaW5nLmNoYXJDb2RlQXQoaWkpIHwgMDtcbiAgICB9XG4gICAgcmV0dXJuIHNtaShoYXNoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhc2hKU09iaihvYmopIHtcbiAgICB2YXIgaGFzaDtcbiAgICBpZiAodXNpbmdXZWFrTWFwKSB7XG4gICAgICBoYXNoID0gd2Vha01hcC5nZXQob2JqKTtcbiAgICAgIGlmIChoYXNoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGhhc2g7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaGFzaCA9IG9ialtVSURfSEFTSF9LRVldO1xuICAgIGlmIChoYXNoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBoYXNoO1xuICAgIH1cblxuICAgIGlmICghY2FuRGVmaW5lUHJvcGVydHkpIHtcbiAgICAgIGhhc2ggPSBvYmoucHJvcGVydHlJc0VudW1lcmFibGUgJiYgb2JqLnByb3BlcnR5SXNFbnVtZXJhYmxlW1VJRF9IQVNIX0tFWV07XG4gICAgICBpZiAoaGFzaCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBoYXNoO1xuICAgICAgfVxuXG4gICAgICBoYXNoID0gZ2V0SUVOb2RlSGFzaChvYmopO1xuICAgICAgaWYgKGhhc2ggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gaGFzaDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBoYXNoID0gKytvYmpIYXNoVUlEO1xuICAgIGlmIChvYmpIYXNoVUlEICYgMHg0MDAwMDAwMCkge1xuICAgICAgb2JqSGFzaFVJRCA9IDA7XG4gICAgfVxuXG4gICAgaWYgKHVzaW5nV2Vha01hcCkge1xuICAgICAgd2Vha01hcC5zZXQob2JqLCBoYXNoKTtcbiAgICB9IGVsc2UgaWYgKGlzRXh0ZW5zaWJsZSAhPT0gdW5kZWZpbmVkICYmIGlzRXh0ZW5zaWJsZShvYmopID09PSBmYWxzZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb24tZXh0ZW5zaWJsZSBvYmplY3RzIGFyZSBub3QgYWxsb3dlZCBhcyBrZXlzLicpO1xuICAgIH0gZWxzZSBpZiAoY2FuRGVmaW5lUHJvcGVydHkpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIFVJRF9IQVNIX0tFWSwge1xuICAgICAgICAnZW51bWVyYWJsZSc6IGZhbHNlLFxuICAgICAgICAnY29uZmlndXJhYmxlJzogZmFsc2UsXG4gICAgICAgICd3cml0YWJsZSc6IGZhbHNlLFxuICAgICAgICAndmFsdWUnOiBoYXNoXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKG9iai5wcm9wZXJ0eUlzRW51bWVyYWJsZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICAgICBvYmoucHJvcGVydHlJc0VudW1lcmFibGUgPT09IG9iai5jb25zdHJ1Y3Rvci5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGUpIHtcbiAgICAgIC8vIFNpbmNlIHdlIGNhbid0IGRlZmluZSBhIG5vbi1lbnVtZXJhYmxlIHByb3BlcnR5IG9uIHRoZSBvYmplY3RcbiAgICAgIC8vIHdlJ2xsIGhpamFjayBvbmUgb2YgdGhlIGxlc3MtdXNlZCBub24tZW51bWVyYWJsZSBwcm9wZXJ0aWVzIHRvXG4gICAgICAvLyBzYXZlIG91ciBoYXNoIG9uIGl0LiBTaW5jZSB0aGlzIGlzIGEgZnVuY3Rpb24gaXQgd2lsbCBub3Qgc2hvdyB1cCBpblxuICAgICAgLy8gYEpTT04uc3RyaW5naWZ5YCB3aGljaCBpcyB3aGF0IHdlIHdhbnQuXG4gICAgICBvYmoucHJvcGVydHlJc0VudW1lcmFibGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgICAgb2JqLnByb3BlcnR5SXNFbnVtZXJhYmxlW1VJRF9IQVNIX0tFWV0gPSBoYXNoO1xuICAgIH0gZWxzZSBpZiAob2JqLm5vZGVUeXBlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIEF0IHRoaXMgcG9pbnQgd2UgY291bGRuJ3QgZ2V0IHRoZSBJRSBgdW5pcXVlSURgIHRvIHVzZSBhcyBhIGhhc2hcbiAgICAgIC8vIGFuZCB3ZSBjb3VsZG4ndCB1c2UgYSBub24tZW51bWVyYWJsZSBwcm9wZXJ0eSB0byBleHBsb2l0IHRoZVxuICAgICAgLy8gZG9udEVudW0gYnVnIHNvIHdlIHNpbXBseSBhZGQgdGhlIGBVSURfSEFTSF9LRVlgIG9uIHRoZSBub2RlXG4gICAgICAvLyBpdHNlbGYuXG4gICAgICBvYmpbVUlEX0hBU0hfS0VZXSA9IGhhc2g7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIHNldCBhIG5vbi1lbnVtZXJhYmxlIHByb3BlcnR5IG9uIG9iamVjdC4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaGFzaDtcbiAgfVxuXG4gIC8vIEdldCByZWZlcmVuY2VzIHRvIEVTNSBvYmplY3QgbWV0aG9kcy5cbiAgdmFyIGlzRXh0ZW5zaWJsZSA9IE9iamVjdC5pc0V4dGVuc2libGU7XG5cbiAgLy8gVHJ1ZSBpZiBPYmplY3QuZGVmaW5lUHJvcGVydHkgd29ya3MgYXMgZXhwZWN0ZWQuIElFOCBmYWlscyB0aGlzIHRlc3QuXG4gIHZhciBjYW5EZWZpbmVQcm9wZXJ0eSA9IChmdW5jdGlvbigpIHtcbiAgICB0cnkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHt9LCAnQCcsIHt9KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0oKSk7XG5cbiAgLy8gSUUgaGFzIGEgYHVuaXF1ZUlEYCBwcm9wZXJ0eSBvbiBET00gbm9kZXMuIFdlIGNhbiBjb25zdHJ1Y3QgdGhlIGhhc2ggZnJvbSBpdFxuICAvLyBhbmQgYXZvaWQgbWVtb3J5IGxlYWtzIGZyb20gdGhlIElFIGNsb25lTm9kZSBidWcuXG4gIGZ1bmN0aW9uIGdldElFTm9kZUhhc2gobm9kZSkge1xuICAgIGlmIChub2RlICYmIG5vZGUubm9kZVR5cGUgPiAwKSB7XG4gICAgICBzd2l0Y2ggKG5vZGUubm9kZVR5cGUpIHtcbiAgICAgICAgY2FzZSAxOiAvLyBFbGVtZW50XG4gICAgICAgICAgcmV0dXJuIG5vZGUudW5pcXVlSUQ7XG4gICAgICAgIGNhc2UgOTogLy8gRG9jdW1lbnRcbiAgICAgICAgICByZXR1cm4gbm9kZS5kb2N1bWVudEVsZW1lbnQgJiYgbm9kZS5kb2N1bWVudEVsZW1lbnQudW5pcXVlSUQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gSWYgcG9zc2libGUsIHVzZSBhIFdlYWtNYXAuXG4gIHZhciB1c2luZ1dlYWtNYXAgPSB0eXBlb2YgV2Vha01hcCA9PT0gJ2Z1bmN0aW9uJztcbiAgdmFyIHdlYWtNYXA7XG4gIGlmICh1c2luZ1dlYWtNYXApIHtcbiAgICB3ZWFrTWFwID0gbmV3IFdlYWtNYXAoKTtcbiAgfVxuXG4gIHZhciBvYmpIYXNoVUlEID0gMDtcblxuICB2YXIgVUlEX0hBU0hfS0VZID0gJ19faW1tdXRhYmxlaGFzaF9fJztcbiAgaWYgKHR5cGVvZiBTeW1ib2wgPT09ICdmdW5jdGlvbicpIHtcbiAgICBVSURfSEFTSF9LRVkgPSBTeW1ib2woVUlEX0hBU0hfS0VZKTtcbiAgfVxuXG4gIHZhciBTVFJJTkdfSEFTSF9DQUNIRV9NSU5fU1RSTEVOID0gMTY7XG4gIHZhciBTVFJJTkdfSEFTSF9DQUNIRV9NQVhfU0laRSA9IDI1NTtcbiAgdmFyIFNUUklOR19IQVNIX0NBQ0hFX1NJWkUgPSAwO1xuICB2YXIgc3RyaW5nSGFzaENhY2hlID0ge307XG5cbiAgZnVuY3Rpb24gaW52YXJpYW50KGNvbmRpdGlvbiwgZXJyb3IpIHtcbiAgICBpZiAoIWNvbmRpdGlvbikgdGhyb3cgbmV3IEVycm9yKGVycm9yKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFzc2VydE5vdEluZmluaXRlKHNpemUpIHtcbiAgICBpbnZhcmlhbnQoXG4gICAgICBzaXplICE9PSBJbmZpbml0eSxcbiAgICAgICdDYW5ub3QgcGVyZm9ybSB0aGlzIGFjdGlvbiB3aXRoIGFuIGluZmluaXRlIHNpemUuJ1xuICAgICk7XG4gIH1cblxuICBjcmVhdGVDbGFzcyhUb0tleWVkU2VxdWVuY2UsIEtleWVkU2VxKTtcbiAgICBmdW5jdGlvbiBUb0tleWVkU2VxdWVuY2UoaW5kZXhlZCwgdXNlS2V5cykge1xuICAgICAgdGhpcy5faXRlciA9IGluZGV4ZWQ7XG4gICAgICB0aGlzLl91c2VLZXlzID0gdXNlS2V5cztcbiAgICAgIHRoaXMuc2l6ZSA9IGluZGV4ZWQuc2l6ZTtcbiAgICB9XG5cbiAgICBUb0tleWVkU2VxdWVuY2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGtleSwgbm90U2V0VmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLl9pdGVyLmdldChrZXksIG5vdFNldFZhbHVlKTtcbiAgICB9O1xuXG4gICAgVG9LZXllZFNlcXVlbmNlLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiB0aGlzLl9pdGVyLmhhcyhrZXkpO1xuICAgIH07XG5cbiAgICBUb0tleWVkU2VxdWVuY2UucHJvdG90eXBlLnZhbHVlU2VxID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5faXRlci52YWx1ZVNlcSgpO1xuICAgIH07XG5cbiAgICBUb0tleWVkU2VxdWVuY2UucHJvdG90eXBlLnJldmVyc2UgPSBmdW5jdGlvbigpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgIHZhciByZXZlcnNlZFNlcXVlbmNlID0gcmV2ZXJzZUZhY3RvcnkodGhpcywgdHJ1ZSk7XG4gICAgICBpZiAoIXRoaXMuX3VzZUtleXMpIHtcbiAgICAgICAgcmV2ZXJzZWRTZXF1ZW5jZS52YWx1ZVNlcSA9IGZ1bmN0aW9uKCkgIHtyZXR1cm4gdGhpcyQwLl9pdGVyLnRvU2VxKCkucmV2ZXJzZSgpfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXZlcnNlZFNlcXVlbmNlO1xuICAgIH07XG5cbiAgICBUb0tleWVkU2VxdWVuY2UucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uKG1hcHBlciwgY29udGV4dCkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgdmFyIG1hcHBlZFNlcXVlbmNlID0gbWFwRmFjdG9yeSh0aGlzLCBtYXBwZXIsIGNvbnRleHQpO1xuICAgICAgaWYgKCF0aGlzLl91c2VLZXlzKSB7XG4gICAgICAgIG1hcHBlZFNlcXVlbmNlLnZhbHVlU2VxID0gZnVuY3Rpb24oKSAge3JldHVybiB0aGlzJDAuX2l0ZXIudG9TZXEoKS5tYXAobWFwcGVyLCBjb250ZXh0KX07XG4gICAgICB9XG4gICAgICByZXR1cm4gbWFwcGVkU2VxdWVuY2U7XG4gICAgfTtcblxuICAgIFRvS2V5ZWRTZXF1ZW5jZS5wcm90b3R5cGUuX19pdGVyYXRlID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgIHZhciBpaTtcbiAgICAgIHJldHVybiB0aGlzLl9pdGVyLl9faXRlcmF0ZShcbiAgICAgICAgdGhpcy5fdXNlS2V5cyA/XG4gICAgICAgICAgZnVuY3Rpb24odiwgaykgIHtyZXR1cm4gZm4odiwgaywgdGhpcyQwKX0gOlxuICAgICAgICAgICgoaWkgPSByZXZlcnNlID8gcmVzb2x2ZVNpemUodGhpcykgOiAwKSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKHYgKSB7cmV0dXJuIGZuKHYsIHJldmVyc2UgPyAtLWlpIDogaWkrKywgdGhpcyQwKX0pLFxuICAgICAgICByZXZlcnNlXG4gICAgICApO1xuICAgIH07XG5cbiAgICBUb0tleWVkU2VxdWVuY2UucHJvdG90eXBlLl9faXRlcmF0b3IgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICBpZiAodGhpcy5fdXNlS2V5cykge1xuICAgICAgICByZXR1cm4gdGhpcy5faXRlci5fX2l0ZXJhdG9yKHR5cGUsIHJldmVyc2UpO1xuICAgICAgfVxuICAgICAgdmFyIGl0ZXJhdG9yID0gdGhpcy5faXRlci5fX2l0ZXJhdG9yKElURVJBVEVfVkFMVUVTLCByZXZlcnNlKTtcbiAgICAgIHZhciBpaSA9IHJldmVyc2UgPyByZXNvbHZlU2l6ZSh0aGlzKSA6IDA7XG4gICAgICByZXR1cm4gbmV3IHNyY19JdGVyYXRvcl9fSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICB2YXIgc3RlcCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgcmV0dXJuIHN0ZXAuZG9uZSA/IHN0ZXAgOlxuICAgICAgICAgIGl0ZXJhdG9yVmFsdWUodHlwZSwgcmV2ZXJzZSA/IC0taWkgOiBpaSsrLCBzdGVwLnZhbHVlLCBzdGVwKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgVG9LZXllZFNlcXVlbmNlLnByb3RvdHlwZVtJU19PUkRFUkVEX1NFTlRJTkVMXSA9IHRydWU7XG5cblxuICBjcmVhdGVDbGFzcyhUb0luZGV4ZWRTZXF1ZW5jZSwgSW5kZXhlZFNlcSk7XG4gICAgZnVuY3Rpb24gVG9JbmRleGVkU2VxdWVuY2UoaXRlcikge1xuICAgICAgdGhpcy5faXRlciA9IGl0ZXI7XG4gICAgICB0aGlzLnNpemUgPSBpdGVyLnNpemU7XG4gICAgfVxuXG4gICAgVG9JbmRleGVkU2VxdWVuY2UucHJvdG90eXBlLmluY2x1ZGVzID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLl9pdGVyLmluY2x1ZGVzKHZhbHVlKTtcbiAgICB9O1xuXG4gICAgVG9JbmRleGVkU2VxdWVuY2UucHJvdG90eXBlLl9faXRlcmF0ZSA9IGZ1bmN0aW9uKGZuLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICByZXR1cm4gdGhpcy5faXRlci5fX2l0ZXJhdGUoZnVuY3Rpb24odiApIHtyZXR1cm4gZm4odiwgaXRlcmF0aW9ucysrLCB0aGlzJDApfSwgcmV2ZXJzZSk7XG4gICAgfTtcblxuICAgIFRvSW5kZXhlZFNlcXVlbmNlLnByb3RvdHlwZS5fX2l0ZXJhdG9yID0gZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkge1xuICAgICAgdmFyIGl0ZXJhdG9yID0gdGhpcy5faXRlci5fX2l0ZXJhdG9yKElURVJBVEVfVkFMVUVTLCByZXZlcnNlKTtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHJldHVybiBuZXcgc3JjX0l0ZXJhdG9yX19JdGVyYXRvcihmdW5jdGlvbigpICB7XG4gICAgICAgIHZhciBzdGVwID0gaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICByZXR1cm4gc3RlcC5kb25lID8gc3RlcCA6XG4gICAgICAgICAgaXRlcmF0b3JWYWx1ZSh0eXBlLCBpdGVyYXRpb25zKyssIHN0ZXAudmFsdWUsIHN0ZXApXG4gICAgICB9KTtcbiAgICB9O1xuXG5cblxuICBjcmVhdGVDbGFzcyhUb1NldFNlcXVlbmNlLCBTZXRTZXEpO1xuICAgIGZ1bmN0aW9uIFRvU2V0U2VxdWVuY2UoaXRlcikge1xuICAgICAgdGhpcy5faXRlciA9IGl0ZXI7XG4gICAgICB0aGlzLnNpemUgPSBpdGVyLnNpemU7XG4gICAgfVxuXG4gICAgVG9TZXRTZXF1ZW5jZS5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gdGhpcy5faXRlci5pbmNsdWRlcyhrZXkpO1xuICAgIH07XG5cbiAgICBUb1NldFNlcXVlbmNlLnByb3RvdHlwZS5fX2l0ZXJhdGUgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgcmV0dXJuIHRoaXMuX2l0ZXIuX19pdGVyYXRlKGZ1bmN0aW9uKHYgKSB7cmV0dXJuIGZuKHYsIHYsIHRoaXMkMCl9LCByZXZlcnNlKTtcbiAgICB9O1xuXG4gICAgVG9TZXRTZXF1ZW5jZS5wcm90b3R5cGUuX19pdGVyYXRvciA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIHZhciBpdGVyYXRvciA9IHRoaXMuX2l0ZXIuX19pdGVyYXRvcihJVEVSQVRFX1ZBTFVFUywgcmV2ZXJzZSk7XG4gICAgICByZXR1cm4gbmV3IHNyY19JdGVyYXRvcl9fSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICB2YXIgc3RlcCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgcmV0dXJuIHN0ZXAuZG9uZSA/IHN0ZXAgOlxuICAgICAgICAgIGl0ZXJhdG9yVmFsdWUodHlwZSwgc3RlcC52YWx1ZSwgc3RlcC52YWx1ZSwgc3RlcCk7XG4gICAgICB9KTtcbiAgICB9O1xuXG5cblxuICBjcmVhdGVDbGFzcyhGcm9tRW50cmllc1NlcXVlbmNlLCBLZXllZFNlcSk7XG4gICAgZnVuY3Rpb24gRnJvbUVudHJpZXNTZXF1ZW5jZShlbnRyaWVzKSB7XG4gICAgICB0aGlzLl9pdGVyID0gZW50cmllcztcbiAgICAgIHRoaXMuc2l6ZSA9IGVudHJpZXMuc2l6ZTtcbiAgICB9XG5cbiAgICBGcm9tRW50cmllc1NlcXVlbmNlLnByb3RvdHlwZS5lbnRyeVNlcSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2l0ZXIudG9TZXEoKTtcbiAgICB9O1xuXG4gICAgRnJvbUVudHJpZXNTZXF1ZW5jZS5wcm90b3R5cGUuX19pdGVyYXRlID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgIHJldHVybiB0aGlzLl9pdGVyLl9faXRlcmF0ZShmdW5jdGlvbihlbnRyeSApIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgZW50cnkgZXhpc3RzIGZpcnN0IHNvIGFycmF5IGFjY2VzcyBkb2Vzbid0IHRocm93IGZvciBob2xlc1xuICAgICAgICAvLyBpbiB0aGUgcGFyZW50IGl0ZXJhdGlvbi5cbiAgICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgICAgdmFsaWRhdGVFbnRyeShlbnRyeSk7XG4gICAgICAgICAgdmFyIGluZGV4ZWRJdGVyYWJsZSA9IGlzSXRlcmFibGUoZW50cnkpO1xuICAgICAgICAgIHJldHVybiBmbihcbiAgICAgICAgICAgIGluZGV4ZWRJdGVyYWJsZSA/IGVudHJ5LmdldCgxKSA6IGVudHJ5WzFdLFxuICAgICAgICAgICAgaW5kZXhlZEl0ZXJhYmxlID8gZW50cnkuZ2V0KDApIDogZW50cnlbMF0sXG4gICAgICAgICAgICB0aGlzJDBcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9LCByZXZlcnNlKTtcbiAgICB9O1xuXG4gICAgRnJvbUVudHJpZXNTZXF1ZW5jZS5wcm90b3R5cGUuX19pdGVyYXRvciA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIHZhciBpdGVyYXRvciA9IHRoaXMuX2l0ZXIuX19pdGVyYXRvcihJVEVSQVRFX1ZBTFVFUywgcmV2ZXJzZSk7XG4gICAgICByZXR1cm4gbmV3IHNyY19JdGVyYXRvcl9fSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgIHZhciBzdGVwID0gaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICAgIGlmIChzdGVwLmRvbmUpIHtcbiAgICAgICAgICAgIHJldHVybiBzdGVwO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgZW50cnkgPSBzdGVwLnZhbHVlO1xuICAgICAgICAgIC8vIENoZWNrIGlmIGVudHJ5IGV4aXN0cyBmaXJzdCBzbyBhcnJheSBhY2Nlc3MgZG9lc24ndCB0aHJvdyBmb3IgaG9sZXNcbiAgICAgICAgICAvLyBpbiB0aGUgcGFyZW50IGl0ZXJhdGlvbi5cbiAgICAgICAgICBpZiAoZW50cnkpIHtcbiAgICAgICAgICAgIHZhbGlkYXRlRW50cnkoZW50cnkpO1xuICAgICAgICAgICAgdmFyIGluZGV4ZWRJdGVyYWJsZSA9IGlzSXRlcmFibGUoZW50cnkpO1xuICAgICAgICAgICAgcmV0dXJuIGl0ZXJhdG9yVmFsdWUoXG4gICAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICAgIGluZGV4ZWRJdGVyYWJsZSA/IGVudHJ5LmdldCgwKSA6IGVudHJ5WzBdLFxuICAgICAgICAgICAgICBpbmRleGVkSXRlcmFibGUgPyBlbnRyeS5nZXQoMSkgOiBlbnRyeVsxXSxcbiAgICAgICAgICAgICAgc3RlcFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG5cblxuICBUb0luZGV4ZWRTZXF1ZW5jZS5wcm90b3R5cGUuY2FjaGVSZXN1bHQgPVxuICBUb0tleWVkU2VxdWVuY2UucHJvdG90eXBlLmNhY2hlUmVzdWx0ID1cbiAgVG9TZXRTZXF1ZW5jZS5wcm90b3R5cGUuY2FjaGVSZXN1bHQgPVxuICBGcm9tRW50cmllc1NlcXVlbmNlLnByb3RvdHlwZS5jYWNoZVJlc3VsdCA9XG4gICAgY2FjaGVSZXN1bHRUaHJvdWdoO1xuXG5cbiAgZnVuY3Rpb24gZmxpcEZhY3RvcnkoaXRlcmFibGUpIHtcbiAgICB2YXIgZmxpcFNlcXVlbmNlID0gbWFrZVNlcXVlbmNlKGl0ZXJhYmxlKTtcbiAgICBmbGlwU2VxdWVuY2UuX2l0ZXIgPSBpdGVyYWJsZTtcbiAgICBmbGlwU2VxdWVuY2Uuc2l6ZSA9IGl0ZXJhYmxlLnNpemU7XG4gICAgZmxpcFNlcXVlbmNlLmZsaXAgPSBmdW5jdGlvbigpICB7cmV0dXJuIGl0ZXJhYmxlfTtcbiAgICBmbGlwU2VxdWVuY2UucmV2ZXJzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciByZXZlcnNlZFNlcXVlbmNlID0gaXRlcmFibGUucmV2ZXJzZS5hcHBseSh0aGlzKTsgLy8gc3VwZXIucmV2ZXJzZSgpXG4gICAgICByZXZlcnNlZFNlcXVlbmNlLmZsaXAgPSBmdW5jdGlvbigpICB7cmV0dXJuIGl0ZXJhYmxlLnJldmVyc2UoKX07XG4gICAgICByZXR1cm4gcmV2ZXJzZWRTZXF1ZW5jZTtcbiAgICB9O1xuICAgIGZsaXBTZXF1ZW5jZS5oYXMgPSBmdW5jdGlvbihrZXkgKSB7cmV0dXJuIGl0ZXJhYmxlLmluY2x1ZGVzKGtleSl9O1xuICAgIGZsaXBTZXF1ZW5jZS5pbmNsdWRlcyA9IGZ1bmN0aW9uKGtleSApIHtyZXR1cm4gaXRlcmFibGUuaGFzKGtleSl9O1xuICAgIGZsaXBTZXF1ZW5jZS5jYWNoZVJlc3VsdCA9IGNhY2hlUmVzdWx0VGhyb3VnaDtcbiAgICBmbGlwU2VxdWVuY2UuX19pdGVyYXRlVW5jYWNoZWQgPSBmdW5jdGlvbiAoZm4sIHJldmVyc2UpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgIHJldHVybiBpdGVyYWJsZS5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaykgIHtyZXR1cm4gZm4oaywgdiwgdGhpcyQwKSAhPT0gZmFsc2V9LCByZXZlcnNlKTtcbiAgICB9XG4gICAgZmxpcFNlcXVlbmNlLl9faXRlcmF0b3JVbmNhY2hlZCA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIGlmICh0eXBlID09PSBJVEVSQVRFX0VOVFJJRVMpIHtcbiAgICAgICAgdmFyIGl0ZXJhdG9yID0gaXRlcmFibGUuX19pdGVyYXRvcih0eXBlLCByZXZlcnNlKTtcbiAgICAgICAgcmV0dXJuIG5ldyBzcmNfSXRlcmF0b3JfX0l0ZXJhdG9yKGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgICB2YXIgc3RlcCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICBpZiAoIXN0ZXAuZG9uZSkge1xuICAgICAgICAgICAgdmFyIGsgPSBzdGVwLnZhbHVlWzBdO1xuICAgICAgICAgICAgc3RlcC52YWx1ZVswXSA9IHN0ZXAudmFsdWVbMV07XG4gICAgICAgICAgICBzdGVwLnZhbHVlWzFdID0gaztcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHN0ZXA7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGl0ZXJhYmxlLl9faXRlcmF0b3IoXG4gICAgICAgIHR5cGUgPT09IElURVJBVEVfVkFMVUVTID8gSVRFUkFURV9LRVlTIDogSVRFUkFURV9WQUxVRVMsXG4gICAgICAgIHJldmVyc2VcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBmbGlwU2VxdWVuY2U7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIG1hcEZhY3RvcnkoaXRlcmFibGUsIG1hcHBlciwgY29udGV4dCkge1xuICAgIHZhciBtYXBwZWRTZXF1ZW5jZSA9IG1ha2VTZXF1ZW5jZShpdGVyYWJsZSk7XG4gICAgbWFwcGVkU2VxdWVuY2Uuc2l6ZSA9IGl0ZXJhYmxlLnNpemU7XG4gICAgbWFwcGVkU2VxdWVuY2UuaGFzID0gZnVuY3Rpb24oa2V5ICkge3JldHVybiBpdGVyYWJsZS5oYXMoa2V5KX07XG4gICAgbWFwcGVkU2VxdWVuY2UuZ2V0ID0gZnVuY3Rpb24oa2V5LCBub3RTZXRWYWx1ZSkgIHtcbiAgICAgIHZhciB2ID0gaXRlcmFibGUuZ2V0KGtleSwgTk9UX1NFVCk7XG4gICAgICByZXR1cm4gdiA9PT0gTk9UX1NFVCA/XG4gICAgICAgIG5vdFNldFZhbHVlIDpcbiAgICAgICAgbWFwcGVyLmNhbGwoY29udGV4dCwgdiwga2V5LCBpdGVyYWJsZSk7XG4gICAgfTtcbiAgICBtYXBwZWRTZXF1ZW5jZS5fX2l0ZXJhdGVVbmNhY2hlZCA9IGZ1bmN0aW9uIChmbiwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgcmV0dXJuIGl0ZXJhYmxlLl9faXRlcmF0ZShcbiAgICAgICAgZnVuY3Rpb24odiwgaywgYykgIHtyZXR1cm4gZm4obWFwcGVyLmNhbGwoY29udGV4dCwgdiwgaywgYyksIGssIHRoaXMkMCkgIT09IGZhbHNlfSxcbiAgICAgICAgcmV2ZXJzZVxuICAgICAgKTtcbiAgICB9XG4gICAgbWFwcGVkU2VxdWVuY2UuX19pdGVyYXRvclVuY2FjaGVkID0gZnVuY3Rpb24gKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIHZhciBpdGVyYXRvciA9IGl0ZXJhYmxlLl9faXRlcmF0b3IoSVRFUkFURV9FTlRSSUVTLCByZXZlcnNlKTtcbiAgICAgIHJldHVybiBuZXcgc3JjX0l0ZXJhdG9yX19JdGVyYXRvcihmdW5jdGlvbigpICB7XG4gICAgICAgIHZhciBzdGVwID0gaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICBpZiAoc3RlcC5kb25lKSB7XG4gICAgICAgICAgcmV0dXJuIHN0ZXA7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGVudHJ5ID0gc3RlcC52YWx1ZTtcbiAgICAgICAgdmFyIGtleSA9IGVudHJ5WzBdO1xuICAgICAgICByZXR1cm4gaXRlcmF0b3JWYWx1ZShcbiAgICAgICAgICB0eXBlLFxuICAgICAgICAgIGtleSxcbiAgICAgICAgICBtYXBwZXIuY2FsbChjb250ZXh0LCBlbnRyeVsxXSwga2V5LCBpdGVyYWJsZSksXG4gICAgICAgICAgc3RlcFxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBtYXBwZWRTZXF1ZW5jZTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gcmV2ZXJzZUZhY3RvcnkoaXRlcmFibGUsIHVzZUtleXMpIHtcbiAgICB2YXIgcmV2ZXJzZWRTZXF1ZW5jZSA9IG1ha2VTZXF1ZW5jZShpdGVyYWJsZSk7XG4gICAgcmV2ZXJzZWRTZXF1ZW5jZS5faXRlciA9IGl0ZXJhYmxlO1xuICAgIHJldmVyc2VkU2VxdWVuY2Uuc2l6ZSA9IGl0ZXJhYmxlLnNpemU7XG4gICAgcmV2ZXJzZWRTZXF1ZW5jZS5yZXZlcnNlID0gZnVuY3Rpb24oKSAge3JldHVybiBpdGVyYWJsZX07XG4gICAgaWYgKGl0ZXJhYmxlLmZsaXApIHtcbiAgICAgIHJldmVyc2VkU2VxdWVuY2UuZmxpcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGZsaXBTZXF1ZW5jZSA9IGZsaXBGYWN0b3J5KGl0ZXJhYmxlKTtcbiAgICAgICAgZmxpcFNlcXVlbmNlLnJldmVyc2UgPSBmdW5jdGlvbigpICB7cmV0dXJuIGl0ZXJhYmxlLmZsaXAoKX07XG4gICAgICAgIHJldHVybiBmbGlwU2VxdWVuY2U7XG4gICAgICB9O1xuICAgIH1cbiAgICByZXZlcnNlZFNlcXVlbmNlLmdldCA9IGZ1bmN0aW9uKGtleSwgbm90U2V0VmFsdWUpIFxuICAgICAge3JldHVybiBpdGVyYWJsZS5nZXQodXNlS2V5cyA/IGtleSA6IC0xIC0ga2V5LCBub3RTZXRWYWx1ZSl9O1xuICAgIHJldmVyc2VkU2VxdWVuY2UuaGFzID0gZnVuY3Rpb24oa2V5IClcbiAgICAgIHtyZXR1cm4gaXRlcmFibGUuaGFzKHVzZUtleXMgPyBrZXkgOiAtMSAtIGtleSl9O1xuICAgIHJldmVyc2VkU2VxdWVuY2UuaW5jbHVkZXMgPSBmdW5jdGlvbih2YWx1ZSApIHtyZXR1cm4gaXRlcmFibGUuaW5jbHVkZXModmFsdWUpfTtcbiAgICByZXZlcnNlZFNlcXVlbmNlLmNhY2hlUmVzdWx0ID0gY2FjaGVSZXN1bHRUaHJvdWdoO1xuICAgIHJldmVyc2VkU2VxdWVuY2UuX19pdGVyYXRlID0gZnVuY3Rpb24gKGZuLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICByZXR1cm4gaXRlcmFibGUuX19pdGVyYXRlKGZ1bmN0aW9uKHYsIGspICB7cmV0dXJuIGZuKHYsIGssIHRoaXMkMCl9LCAhcmV2ZXJzZSk7XG4gICAgfTtcbiAgICByZXZlcnNlZFNlcXVlbmNlLl9faXRlcmF0b3IgPVxuICAgICAgZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkgIHtyZXR1cm4gaXRlcmFibGUuX19pdGVyYXRvcih0eXBlLCAhcmV2ZXJzZSl9O1xuICAgIHJldHVybiByZXZlcnNlZFNlcXVlbmNlO1xuICB9XG5cblxuICBmdW5jdGlvbiBmaWx0ZXJGYWN0b3J5KGl0ZXJhYmxlLCBwcmVkaWNhdGUsIGNvbnRleHQsIHVzZUtleXMpIHtcbiAgICB2YXIgZmlsdGVyU2VxdWVuY2UgPSBtYWtlU2VxdWVuY2UoaXRlcmFibGUpO1xuICAgIGlmICh1c2VLZXlzKSB7XG4gICAgICBmaWx0ZXJTZXF1ZW5jZS5oYXMgPSBmdW5jdGlvbihrZXkgKSB7XG4gICAgICAgIHZhciB2ID0gaXRlcmFibGUuZ2V0KGtleSwgTk9UX1NFVCk7XG4gICAgICAgIHJldHVybiB2ICE9PSBOT1RfU0VUICYmICEhcHJlZGljYXRlLmNhbGwoY29udGV4dCwgdiwga2V5LCBpdGVyYWJsZSk7XG4gICAgICB9O1xuICAgICAgZmlsdGVyU2VxdWVuY2UuZ2V0ID0gZnVuY3Rpb24oa2V5LCBub3RTZXRWYWx1ZSkgIHtcbiAgICAgICAgdmFyIHYgPSBpdGVyYWJsZS5nZXQoa2V5LCBOT1RfU0VUKTtcbiAgICAgICAgcmV0dXJuIHYgIT09IE5PVF9TRVQgJiYgcHJlZGljYXRlLmNhbGwoY29udGV4dCwgdiwga2V5LCBpdGVyYWJsZSkgP1xuICAgICAgICAgIHYgOiBub3RTZXRWYWx1ZTtcbiAgICAgIH07XG4gICAgfVxuICAgIGZpbHRlclNlcXVlbmNlLl9faXRlcmF0ZVVuY2FjaGVkID0gZnVuY3Rpb24gKGZuLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICBpdGVyYWJsZS5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaywgYykgIHtcbiAgICAgICAgaWYgKHByZWRpY2F0ZS5jYWxsKGNvbnRleHQsIHYsIGssIGMpKSB7XG4gICAgICAgICAgaXRlcmF0aW9ucysrO1xuICAgICAgICAgIHJldHVybiBmbih2LCB1c2VLZXlzID8gayA6IGl0ZXJhdGlvbnMgLSAxLCB0aGlzJDApO1xuICAgICAgICB9XG4gICAgICB9LCByZXZlcnNlKTtcbiAgICAgIHJldHVybiBpdGVyYXRpb25zO1xuICAgIH07XG4gICAgZmlsdGVyU2VxdWVuY2UuX19pdGVyYXRvclVuY2FjaGVkID0gZnVuY3Rpb24gKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIHZhciBpdGVyYXRvciA9IGl0ZXJhYmxlLl9faXRlcmF0b3IoSVRFUkFURV9FTlRSSUVTLCByZXZlcnNlKTtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHJldHVybiBuZXcgc3JjX0l0ZXJhdG9yX19JdGVyYXRvcihmdW5jdGlvbigpICB7XG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgdmFyIHN0ZXAgPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgICAgICAgaWYgKHN0ZXAuZG9uZSkge1xuICAgICAgICAgICAgcmV0dXJuIHN0ZXA7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBlbnRyeSA9IHN0ZXAudmFsdWU7XG4gICAgICAgICAgdmFyIGtleSA9IGVudHJ5WzBdO1xuICAgICAgICAgIHZhciB2YWx1ZSA9IGVudHJ5WzFdO1xuICAgICAgICAgIGlmIChwcmVkaWNhdGUuY2FsbChjb250ZXh0LCB2YWx1ZSwga2V5LCBpdGVyYWJsZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVyYXRvclZhbHVlKHR5cGUsIHVzZUtleXMgPyBrZXkgOiBpdGVyYXRpb25zKyssIHZhbHVlLCBzdGVwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gZmlsdGVyU2VxdWVuY2U7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIGNvdW50QnlGYWN0b3J5KGl0ZXJhYmxlLCBncm91cGVyLCBjb250ZXh0KSB7XG4gICAgdmFyIGdyb3VwcyA9IHNyY19NYXBfX01hcCgpLmFzTXV0YWJsZSgpO1xuICAgIGl0ZXJhYmxlLl9faXRlcmF0ZShmdW5jdGlvbih2LCBrKSAge1xuICAgICAgZ3JvdXBzLnVwZGF0ZShcbiAgICAgICAgZ3JvdXBlci5jYWxsKGNvbnRleHQsIHYsIGssIGl0ZXJhYmxlKSxcbiAgICAgICAgMCxcbiAgICAgICAgZnVuY3Rpb24oYSApIHtyZXR1cm4gYSArIDF9XG4gICAgICApO1xuICAgIH0pO1xuICAgIHJldHVybiBncm91cHMuYXNJbW11dGFibGUoKTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gZ3JvdXBCeUZhY3RvcnkoaXRlcmFibGUsIGdyb3VwZXIsIGNvbnRleHQpIHtcbiAgICB2YXIgaXNLZXllZEl0ZXIgPSBpc0tleWVkKGl0ZXJhYmxlKTtcbiAgICB2YXIgZ3JvdXBzID0gKGlzT3JkZXJlZChpdGVyYWJsZSkgPyBPcmRlcmVkTWFwKCkgOiBzcmNfTWFwX19NYXAoKSkuYXNNdXRhYmxlKCk7XG4gICAgaXRlcmFibGUuX19pdGVyYXRlKGZ1bmN0aW9uKHYsIGspICB7XG4gICAgICBncm91cHMudXBkYXRlKFxuICAgICAgICBncm91cGVyLmNhbGwoY29udGV4dCwgdiwgaywgaXRlcmFibGUpLFxuICAgICAgICBmdW5jdGlvbihhICkge3JldHVybiAoYSA9IGEgfHwgW10sIGEucHVzaChpc0tleWVkSXRlciA/IFtrLCB2XSA6IHYpLCBhKX1cbiAgICAgICk7XG4gICAgfSk7XG4gICAgdmFyIGNvZXJjZSA9IGl0ZXJhYmxlQ2xhc3MoaXRlcmFibGUpO1xuICAgIHJldHVybiBncm91cHMubWFwKGZ1bmN0aW9uKGFyciApIHtyZXR1cm4gcmVpZnkoaXRlcmFibGUsIGNvZXJjZShhcnIpKX0pO1xuICB9XG5cblxuICBmdW5jdGlvbiBzbGljZUZhY3RvcnkoaXRlcmFibGUsIGJlZ2luLCBlbmQsIHVzZUtleXMpIHtcbiAgICB2YXIgb3JpZ2luYWxTaXplID0gaXRlcmFibGUuc2l6ZTtcblxuICAgIGlmICh3aG9sZVNsaWNlKGJlZ2luLCBlbmQsIG9yaWdpbmFsU2l6ZSkpIHtcbiAgICAgIHJldHVybiBpdGVyYWJsZTtcbiAgICB9XG5cbiAgICB2YXIgcmVzb2x2ZWRCZWdpbiA9IHJlc29sdmVCZWdpbihiZWdpbiwgb3JpZ2luYWxTaXplKTtcbiAgICB2YXIgcmVzb2x2ZWRFbmQgPSByZXNvbHZlRW5kKGVuZCwgb3JpZ2luYWxTaXplKTtcblxuICAgIC8vIGJlZ2luIG9yIGVuZCB3aWxsIGJlIE5hTiBpZiB0aGV5IHdlcmUgcHJvdmlkZWQgYXMgbmVnYXRpdmUgbnVtYmVycyBhbmRcbiAgICAvLyB0aGlzIGl0ZXJhYmxlJ3Mgc2l6ZSBpcyB1bmtub3duLiBJbiB0aGF0IGNhc2UsIGNhY2hlIGZpcnN0IHNvIHRoZXJlIGlzXG4gICAgLy8gYSBrbm93biBzaXplLlxuICAgIGlmIChyZXNvbHZlZEJlZ2luICE9PSByZXNvbHZlZEJlZ2luIHx8IHJlc29sdmVkRW5kICE9PSByZXNvbHZlZEVuZCkge1xuICAgICAgcmV0dXJuIHNsaWNlRmFjdG9yeShpdGVyYWJsZS50b1NlcSgpLmNhY2hlUmVzdWx0KCksIGJlZ2luLCBlbmQsIHVzZUtleXMpO1xuICAgIH1cblxuICAgIHZhciBzbGljZVNpemUgPSByZXNvbHZlZEVuZCAtIHJlc29sdmVkQmVnaW47XG4gICAgaWYgKHNsaWNlU2l6ZSA8IDApIHtcbiAgICAgIHNsaWNlU2l6ZSA9IDA7XG4gICAgfVxuXG4gICAgdmFyIHNsaWNlU2VxID0gbWFrZVNlcXVlbmNlKGl0ZXJhYmxlKTtcblxuICAgIHNsaWNlU2VxLnNpemUgPSBzbGljZVNpemUgPT09IDAgPyBzbGljZVNpemUgOiBpdGVyYWJsZS5zaXplICYmIHNsaWNlU2l6ZSB8fCB1bmRlZmluZWQ7XG5cbiAgICBpZiAoIXVzZUtleXMgJiYgaXNTZXEoaXRlcmFibGUpICYmIHNsaWNlU2l6ZSA+PSAwKSB7XG4gICAgICBzbGljZVNlcS5nZXQgPSBmdW5jdGlvbiAoaW5kZXgsIG5vdFNldFZhbHVlKSB7XG4gICAgICAgIGluZGV4ID0gd3JhcEluZGV4KHRoaXMsIGluZGV4KTtcbiAgICAgICAgcmV0dXJuIGluZGV4ID49IDAgJiYgaW5kZXggPCBzbGljZVNpemUgP1xuICAgICAgICAgIGl0ZXJhYmxlLmdldChpbmRleCArIHJlc29sdmVkQmVnaW4sIG5vdFNldFZhbHVlKSA6XG4gICAgICAgICAgbm90U2V0VmFsdWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc2xpY2VTZXEuX19pdGVyYXRlVW5jYWNoZWQgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgaWYgKHNsaWNlU2l6ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH1cbiAgICAgIGlmIChyZXZlcnNlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhY2hlUmVzdWx0KCkuX19pdGVyYXRlKGZuLCByZXZlcnNlKTtcbiAgICAgIH1cbiAgICAgIHZhciBza2lwcGVkID0gMDtcbiAgICAgIHZhciBpc1NraXBwaW5nID0gdHJ1ZTtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIGl0ZXJhYmxlLl9faXRlcmF0ZShmdW5jdGlvbih2LCBrKSAge1xuICAgICAgICBpZiAoIShpc1NraXBwaW5nICYmIChpc1NraXBwaW5nID0gc2tpcHBlZCsrIDwgcmVzb2x2ZWRCZWdpbikpKSB7XG4gICAgICAgICAgaXRlcmF0aW9ucysrO1xuICAgICAgICAgIHJldHVybiBmbih2LCB1c2VLZXlzID8gayA6IGl0ZXJhdGlvbnMgLSAxLCB0aGlzJDApICE9PSBmYWxzZSAmJlxuICAgICAgICAgICAgICAgICBpdGVyYXRpb25zICE9PSBzbGljZVNpemU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGl0ZXJhdGlvbnM7XG4gICAgfTtcblxuICAgIHNsaWNlU2VxLl9faXRlcmF0b3JVbmNhY2hlZCA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIGlmIChzbGljZVNpemUgJiYgcmV2ZXJzZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWNoZVJlc3VsdCgpLl9faXRlcmF0b3IodHlwZSwgcmV2ZXJzZSk7XG4gICAgICB9XG4gICAgICAvLyBEb24ndCBib3RoZXIgaW5zdGFudGlhdGluZyBwYXJlbnQgaXRlcmF0b3IgaWYgdGFraW5nIDAuXG4gICAgICB2YXIgaXRlcmF0b3IgPSBzbGljZVNpemUgJiYgaXRlcmFibGUuX19pdGVyYXRvcih0eXBlLCByZXZlcnNlKTtcbiAgICAgIHZhciBza2lwcGVkID0gMDtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHJldHVybiBuZXcgc3JjX0l0ZXJhdG9yX19JdGVyYXRvcihmdW5jdGlvbigpICB7XG4gICAgICAgIHdoaWxlIChza2lwcGVkKysgPCByZXNvbHZlZEJlZ2luKSB7XG4gICAgICAgICAgaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICgrK2l0ZXJhdGlvbnMgPiBzbGljZVNpemUpIHtcbiAgICAgICAgICByZXR1cm4gaXRlcmF0b3JEb25lKCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN0ZXAgPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgICAgIGlmICh1c2VLZXlzIHx8IHR5cGUgPT09IElURVJBVEVfVkFMVUVTKSB7XG4gICAgICAgICAgcmV0dXJuIHN0ZXA7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gSVRFUkFURV9LRVlTKSB7XG4gICAgICAgICAgcmV0dXJuIGl0ZXJhdG9yVmFsdWUodHlwZSwgaXRlcmF0aW9ucyAtIDEsIHVuZGVmaW5lZCwgc3RlcCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGl0ZXJhdG9yVmFsdWUodHlwZSwgaXRlcmF0aW9ucyAtIDEsIHN0ZXAudmFsdWVbMV0sIHN0ZXApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2xpY2VTZXE7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIHRha2VXaGlsZUZhY3RvcnkoaXRlcmFibGUsIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIHZhciB0YWtlU2VxdWVuY2UgPSBtYWtlU2VxdWVuY2UoaXRlcmFibGUpO1xuICAgIHRha2VTZXF1ZW5jZS5fX2l0ZXJhdGVVbmNhY2hlZCA9IGZ1bmN0aW9uKGZuLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICBpZiAocmV2ZXJzZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWNoZVJlc3VsdCgpLl9faXRlcmF0ZShmbiwgcmV2ZXJzZSk7XG4gICAgICB9XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICBpdGVyYWJsZS5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaywgYykgXG4gICAgICAgIHtyZXR1cm4gcHJlZGljYXRlLmNhbGwoY29udGV4dCwgdiwgaywgYykgJiYgKytpdGVyYXRpb25zICYmIGZuKHYsIGssIHRoaXMkMCl9XG4gICAgICApO1xuICAgICAgcmV0dXJuIGl0ZXJhdGlvbnM7XG4gICAgfTtcbiAgICB0YWtlU2VxdWVuY2UuX19pdGVyYXRvclVuY2FjaGVkID0gZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgaWYgKHJldmVyc2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVSZXN1bHQoKS5fX2l0ZXJhdG9yKHR5cGUsIHJldmVyc2UpO1xuICAgICAgfVxuICAgICAgdmFyIGl0ZXJhdG9yID0gaXRlcmFibGUuX19pdGVyYXRvcihJVEVSQVRFX0VOVFJJRVMsIHJldmVyc2UpO1xuICAgICAgdmFyIGl0ZXJhdGluZyA9IHRydWU7XG4gICAgICByZXR1cm4gbmV3IHNyY19JdGVyYXRvcl9fSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICBpZiAoIWl0ZXJhdGluZykge1xuICAgICAgICAgIHJldHVybiBpdGVyYXRvckRvbmUoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3RlcCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgaWYgKHN0ZXAuZG9uZSkge1xuICAgICAgICAgIHJldHVybiBzdGVwO1xuICAgICAgICB9XG4gICAgICAgIHZhciBlbnRyeSA9IHN0ZXAudmFsdWU7XG4gICAgICAgIHZhciBrID0gZW50cnlbMF07XG4gICAgICAgIHZhciB2ID0gZW50cnlbMV07XG4gICAgICAgIGlmICghcHJlZGljYXRlLmNhbGwoY29udGV4dCwgdiwgaywgdGhpcyQwKSkge1xuICAgICAgICAgIGl0ZXJhdGluZyA9IGZhbHNlO1xuICAgICAgICAgIHJldHVybiBpdGVyYXRvckRvbmUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHlwZSA9PT0gSVRFUkFURV9FTlRSSUVTID8gc3RlcCA6XG4gICAgICAgICAgaXRlcmF0b3JWYWx1ZSh0eXBlLCBrLCB2LCBzdGVwKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIHRha2VTZXF1ZW5jZTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gc2tpcFdoaWxlRmFjdG9yeShpdGVyYWJsZSwgcHJlZGljYXRlLCBjb250ZXh0LCB1c2VLZXlzKSB7XG4gICAgdmFyIHNraXBTZXF1ZW5jZSA9IG1ha2VTZXF1ZW5jZShpdGVyYWJsZSk7XG4gICAgc2tpcFNlcXVlbmNlLl9faXRlcmF0ZVVuY2FjaGVkID0gZnVuY3Rpb24gKGZuLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICBpZiAocmV2ZXJzZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWNoZVJlc3VsdCgpLl9faXRlcmF0ZShmbiwgcmV2ZXJzZSk7XG4gICAgICB9XG4gICAgICB2YXIgaXNTa2lwcGluZyA9IHRydWU7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICBpdGVyYWJsZS5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaywgYykgIHtcbiAgICAgICAgaWYgKCEoaXNTa2lwcGluZyAmJiAoaXNTa2lwcGluZyA9IHByZWRpY2F0ZS5jYWxsKGNvbnRleHQsIHYsIGssIGMpKSkpIHtcbiAgICAgICAgICBpdGVyYXRpb25zKys7XG4gICAgICAgICAgcmV0dXJuIGZuKHYsIHVzZUtleXMgPyBrIDogaXRlcmF0aW9ucyAtIDEsIHRoaXMkMCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGl0ZXJhdGlvbnM7XG4gICAgfTtcbiAgICBza2lwU2VxdWVuY2UuX19pdGVyYXRvclVuY2FjaGVkID0gZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgaWYgKHJldmVyc2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVSZXN1bHQoKS5fX2l0ZXJhdG9yKHR5cGUsIHJldmVyc2UpO1xuICAgICAgfVxuICAgICAgdmFyIGl0ZXJhdG9yID0gaXRlcmFibGUuX19pdGVyYXRvcihJVEVSQVRFX0VOVFJJRVMsIHJldmVyc2UpO1xuICAgICAgdmFyIHNraXBwaW5nID0gdHJ1ZTtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHJldHVybiBuZXcgc3JjX0l0ZXJhdG9yX19JdGVyYXRvcihmdW5jdGlvbigpICB7XG4gICAgICAgIHZhciBzdGVwLCBrLCB2O1xuICAgICAgICBkbyB7XG4gICAgICAgICAgc3RlcCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICBpZiAoc3RlcC5kb25lKSB7XG4gICAgICAgICAgICBpZiAodXNlS2V5cyB8fCB0eXBlID09PSBJVEVSQVRFX1ZBTFVFUykge1xuICAgICAgICAgICAgICByZXR1cm4gc3RlcDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gSVRFUkFURV9LRVlTKSB7XG4gICAgICAgICAgICAgIHJldHVybiBpdGVyYXRvclZhbHVlKHR5cGUsIGl0ZXJhdGlvbnMrKywgdW5kZWZpbmVkLCBzdGVwKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBpdGVyYXRvclZhbHVlKHR5cGUsIGl0ZXJhdGlvbnMrKywgc3RlcC52YWx1ZVsxXSwgc3RlcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBlbnRyeSA9IHN0ZXAudmFsdWU7XG4gICAgICAgICAgayA9IGVudHJ5WzBdO1xuICAgICAgICAgIHYgPSBlbnRyeVsxXTtcbiAgICAgICAgICBza2lwcGluZyAmJiAoc2tpcHBpbmcgPSBwcmVkaWNhdGUuY2FsbChjb250ZXh0LCB2LCBrLCB0aGlzJDApKTtcbiAgICAgICAgfSB3aGlsZSAoc2tpcHBpbmcpO1xuICAgICAgICByZXR1cm4gdHlwZSA9PT0gSVRFUkFURV9FTlRSSUVTID8gc3RlcCA6XG4gICAgICAgICAgaXRlcmF0b3JWYWx1ZSh0eXBlLCBrLCB2LCBzdGVwKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIHNraXBTZXF1ZW5jZTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gY29uY2F0RmFjdG9yeShpdGVyYWJsZSwgdmFsdWVzKSB7XG4gICAgdmFyIGlzS2V5ZWRJdGVyYWJsZSA9IGlzS2V5ZWQoaXRlcmFibGUpO1xuICAgIHZhciBpdGVycyA9IFtpdGVyYWJsZV0uY29uY2F0KHZhbHVlcykubWFwKGZ1bmN0aW9uKHYgKSB7XG4gICAgICBpZiAoIWlzSXRlcmFibGUodikpIHtcbiAgICAgICAgdiA9IGlzS2V5ZWRJdGVyYWJsZSA/XG4gICAgICAgICAga2V5ZWRTZXFGcm9tVmFsdWUodikgOlxuICAgICAgICAgIGluZGV4ZWRTZXFGcm9tVmFsdWUoQXJyYXkuaXNBcnJheSh2KSA/IHYgOiBbdl0pO1xuICAgICAgfSBlbHNlIGlmIChpc0tleWVkSXRlcmFibGUpIHtcbiAgICAgICAgdiA9IEtleWVkSXRlcmFibGUodik7XG4gICAgICB9XG4gICAgICByZXR1cm4gdjtcbiAgICB9KS5maWx0ZXIoZnVuY3Rpb24odiApIHtyZXR1cm4gdi5zaXplICE9PSAwfSk7XG5cbiAgICBpZiAoaXRlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gaXRlcmFibGU7XG4gICAgfVxuXG4gICAgaWYgKGl0ZXJzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgdmFyIHNpbmdsZXRvbiA9IGl0ZXJzWzBdO1xuICAgICAgaWYgKHNpbmdsZXRvbiA9PT0gaXRlcmFibGUgfHxcbiAgICAgICAgICBpc0tleWVkSXRlcmFibGUgJiYgaXNLZXllZChzaW5nbGV0b24pIHx8XG4gICAgICAgICAgaXNJbmRleGVkKGl0ZXJhYmxlKSAmJiBpc0luZGV4ZWQoc2luZ2xldG9uKSkge1xuICAgICAgICByZXR1cm4gc2luZ2xldG9uO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBjb25jYXRTZXEgPSBuZXcgQXJyYXlTZXEoaXRlcnMpO1xuICAgIGlmIChpc0tleWVkSXRlcmFibGUpIHtcbiAgICAgIGNvbmNhdFNlcSA9IGNvbmNhdFNlcS50b0tleWVkU2VxKCk7XG4gICAgfSBlbHNlIGlmICghaXNJbmRleGVkKGl0ZXJhYmxlKSkge1xuICAgICAgY29uY2F0U2VxID0gY29uY2F0U2VxLnRvU2V0U2VxKCk7XG4gICAgfVxuICAgIGNvbmNhdFNlcSA9IGNvbmNhdFNlcS5mbGF0dGVuKHRydWUpO1xuICAgIGNvbmNhdFNlcS5zaXplID0gaXRlcnMucmVkdWNlKFxuICAgICAgZnVuY3Rpb24oc3VtLCBzZXEpICB7XG4gICAgICAgIGlmIChzdW0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHZhciBzaXplID0gc2VxLnNpemU7XG4gICAgICAgICAgaWYgKHNpemUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIHN1bSArIHNpemU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgMFxuICAgICk7XG4gICAgcmV0dXJuIGNvbmNhdFNlcTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gZmxhdHRlbkZhY3RvcnkoaXRlcmFibGUsIGRlcHRoLCB1c2VLZXlzKSB7XG4gICAgdmFyIGZsYXRTZXF1ZW5jZSA9IG1ha2VTZXF1ZW5jZShpdGVyYWJsZSk7XG4gICAgZmxhdFNlcXVlbmNlLl9faXRlcmF0ZVVuY2FjaGVkID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHZhciBzdG9wcGVkID0gZmFsc2U7XG4gICAgICBmdW5jdGlvbiBmbGF0RGVlcChpdGVyLCBjdXJyZW50RGVwdGgpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgICAgaXRlci5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaykgIHtcbiAgICAgICAgICBpZiAoKCFkZXB0aCB8fCBjdXJyZW50RGVwdGggPCBkZXB0aCkgJiYgaXNJdGVyYWJsZSh2KSkge1xuICAgICAgICAgICAgZmxhdERlZXAodiwgY3VycmVudERlcHRoICsgMSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChmbih2LCB1c2VLZXlzID8gayA6IGl0ZXJhdGlvbnMrKywgdGhpcyQwKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHN0b3BwZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gIXN0b3BwZWQ7XG4gICAgICAgIH0sIHJldmVyc2UpO1xuICAgICAgfVxuICAgICAgZmxhdERlZXAoaXRlcmFibGUsIDApO1xuICAgICAgcmV0dXJuIGl0ZXJhdGlvbnM7XG4gICAgfVxuICAgIGZsYXRTZXF1ZW5jZS5fX2l0ZXJhdG9yVW5jYWNoZWQgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICB2YXIgaXRlcmF0b3IgPSBpdGVyYWJsZS5fX2l0ZXJhdG9yKHR5cGUsIHJldmVyc2UpO1xuICAgICAgdmFyIHN0YWNrID0gW107XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICByZXR1cm4gbmV3IHNyY19JdGVyYXRvcl9fSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICB3aGlsZSAoaXRlcmF0b3IpIHtcbiAgICAgICAgICB2YXIgc3RlcCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICBpZiAoc3RlcC5kb25lICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgaXRlcmF0b3IgPSBzdGFjay5wb3AoKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgdiA9IHN0ZXAudmFsdWU7XG4gICAgICAgICAgaWYgKHR5cGUgPT09IElURVJBVEVfRU5UUklFUykge1xuICAgICAgICAgICAgdiA9IHZbMV07XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICgoIWRlcHRoIHx8IHN0YWNrLmxlbmd0aCA8IGRlcHRoKSAmJiBpc0l0ZXJhYmxlKHYpKSB7XG4gICAgICAgICAgICBzdGFjay5wdXNoKGl0ZXJhdG9yKTtcbiAgICAgICAgICAgIGl0ZXJhdG9yID0gdi5fX2l0ZXJhdG9yKHR5cGUsIHJldmVyc2UpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdXNlS2V5cyA/IHN0ZXAgOiBpdGVyYXRvclZhbHVlKHR5cGUsIGl0ZXJhdGlvbnMrKywgdiwgc3RlcCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpdGVyYXRvckRvbmUoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gZmxhdFNlcXVlbmNlO1xuICB9XG5cblxuICBmdW5jdGlvbiBmbGF0TWFwRmFjdG9yeShpdGVyYWJsZSwgbWFwcGVyLCBjb250ZXh0KSB7XG4gICAgdmFyIGNvZXJjZSA9IGl0ZXJhYmxlQ2xhc3MoaXRlcmFibGUpO1xuICAgIHJldHVybiBpdGVyYWJsZS50b1NlcSgpLm1hcChcbiAgICAgIGZ1bmN0aW9uKHYsIGspICB7cmV0dXJuIGNvZXJjZShtYXBwZXIuY2FsbChjb250ZXh0LCB2LCBrLCBpdGVyYWJsZSkpfVxuICAgICkuZmxhdHRlbih0cnVlKTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gaW50ZXJwb3NlRmFjdG9yeShpdGVyYWJsZSwgc2VwYXJhdG9yKSB7XG4gICAgdmFyIGludGVycG9zZWRTZXF1ZW5jZSA9IG1ha2VTZXF1ZW5jZShpdGVyYWJsZSk7XG4gICAgaW50ZXJwb3NlZFNlcXVlbmNlLnNpemUgPSBpdGVyYWJsZS5zaXplICYmIGl0ZXJhYmxlLnNpemUgKiAyIC0xO1xuICAgIGludGVycG9zZWRTZXF1ZW5jZS5fX2l0ZXJhdGVVbmNhY2hlZCA9IGZ1bmN0aW9uKGZuLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICBpdGVyYWJsZS5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaykgXG4gICAgICAgIHtyZXR1cm4gKCFpdGVyYXRpb25zIHx8IGZuKHNlcGFyYXRvciwgaXRlcmF0aW9ucysrLCB0aGlzJDApICE9PSBmYWxzZSkgJiZcbiAgICAgICAgZm4odiwgaXRlcmF0aW9ucysrLCB0aGlzJDApICE9PSBmYWxzZX0sXG4gICAgICAgIHJldmVyc2VcbiAgICAgICk7XG4gICAgICByZXR1cm4gaXRlcmF0aW9ucztcbiAgICB9O1xuICAgIGludGVycG9zZWRTZXF1ZW5jZS5fX2l0ZXJhdG9yVW5jYWNoZWQgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICB2YXIgaXRlcmF0b3IgPSBpdGVyYWJsZS5fX2l0ZXJhdG9yKElURVJBVEVfVkFMVUVTLCByZXZlcnNlKTtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHZhciBzdGVwO1xuICAgICAgcmV0dXJuIG5ldyBzcmNfSXRlcmF0b3JfX0l0ZXJhdG9yKGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgaWYgKCFzdGVwIHx8IGl0ZXJhdGlvbnMgJSAyKSB7XG4gICAgICAgICAgc3RlcCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICBpZiAoc3RlcC5kb25lKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RlcDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGl0ZXJhdGlvbnMgJSAyID9cbiAgICAgICAgICBpdGVyYXRvclZhbHVlKHR5cGUsIGl0ZXJhdGlvbnMrKywgc2VwYXJhdG9yKSA6XG4gICAgICAgICAgaXRlcmF0b3JWYWx1ZSh0eXBlLCBpdGVyYXRpb25zKyssIHN0ZXAudmFsdWUsIHN0ZXApO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gaW50ZXJwb3NlZFNlcXVlbmNlO1xuICB9XG5cblxuICBmdW5jdGlvbiBzb3J0RmFjdG9yeShpdGVyYWJsZSwgY29tcGFyYXRvciwgbWFwcGVyKSB7XG4gICAgaWYgKCFjb21wYXJhdG9yKSB7XG4gICAgICBjb21wYXJhdG9yID0gZGVmYXVsdENvbXBhcmF0b3I7XG4gICAgfVxuICAgIHZhciBpc0tleWVkSXRlcmFibGUgPSBpc0tleWVkKGl0ZXJhYmxlKTtcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIHZhciBlbnRyaWVzID0gaXRlcmFibGUudG9TZXEoKS5tYXAoXG4gICAgICBmdW5jdGlvbih2LCBrKSAge3JldHVybiBbaywgdiwgaW5kZXgrKywgbWFwcGVyID8gbWFwcGVyKHYsIGssIGl0ZXJhYmxlKSA6IHZdfVxuICAgICkudG9BcnJheSgpO1xuICAgIGVudHJpZXMuc29ydChmdW5jdGlvbihhLCBiKSAge3JldHVybiBjb21wYXJhdG9yKGFbM10sIGJbM10pIHx8IGFbMl0gLSBiWzJdfSkuZm9yRWFjaChcbiAgICAgIGlzS2V5ZWRJdGVyYWJsZSA/XG4gICAgICBmdW5jdGlvbih2LCBpKSAgeyBlbnRyaWVzW2ldLmxlbmd0aCA9IDI7IH0gOlxuICAgICAgZnVuY3Rpb24odiwgaSkgIHsgZW50cmllc1tpXSA9IHZbMV07IH1cbiAgICApO1xuICAgIHJldHVybiBpc0tleWVkSXRlcmFibGUgPyBLZXllZFNlcShlbnRyaWVzKSA6XG4gICAgICBpc0luZGV4ZWQoaXRlcmFibGUpID8gSW5kZXhlZFNlcShlbnRyaWVzKSA6XG4gICAgICBTZXRTZXEoZW50cmllcyk7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIG1heEZhY3RvcnkoaXRlcmFibGUsIGNvbXBhcmF0b3IsIG1hcHBlcikge1xuICAgIGlmICghY29tcGFyYXRvcikge1xuICAgICAgY29tcGFyYXRvciA9IGRlZmF1bHRDb21wYXJhdG9yO1xuICAgIH1cbiAgICBpZiAobWFwcGVyKSB7XG4gICAgICB2YXIgZW50cnkgPSBpdGVyYWJsZS50b1NlcSgpXG4gICAgICAgIC5tYXAoZnVuY3Rpb24odiwgaykgIHtyZXR1cm4gW3YsIG1hcHBlcih2LCBrLCBpdGVyYWJsZSldfSlcbiAgICAgICAgLnJlZHVjZShmdW5jdGlvbihhLCBiKSAge3JldHVybiBtYXhDb21wYXJlKGNvbXBhcmF0b3IsIGFbMV0sIGJbMV0pID8gYiA6IGF9KTtcbiAgICAgIHJldHVybiBlbnRyeSAmJiBlbnRyeVswXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGl0ZXJhYmxlLnJlZHVjZShmdW5jdGlvbihhLCBiKSAge3JldHVybiBtYXhDb21wYXJlKGNvbXBhcmF0b3IsIGEsIGIpID8gYiA6IGF9KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBtYXhDb21wYXJlKGNvbXBhcmF0b3IsIGEsIGIpIHtcbiAgICB2YXIgY29tcCA9IGNvbXBhcmF0b3IoYiwgYSk7XG4gICAgLy8gYiBpcyBjb25zaWRlcmVkIHRoZSBuZXcgbWF4IGlmIHRoZSBjb21wYXJhdG9yIGRlY2xhcmVzIHRoZW0gZXF1YWwsIGJ1dFxuICAgIC8vIHRoZXkgYXJlIG5vdCBlcXVhbCBhbmQgYiBpcyBpbiBmYWN0IGEgbnVsbGlzaCB2YWx1ZS5cbiAgICByZXR1cm4gKGNvbXAgPT09IDAgJiYgYiAhPT0gYSAmJiAoYiA9PT0gdW5kZWZpbmVkIHx8IGIgPT09IG51bGwgfHwgYiAhPT0gYikpIHx8IGNvbXAgPiAwO1xuICB9XG5cblxuICBmdW5jdGlvbiB6aXBXaXRoRmFjdG9yeShrZXlJdGVyLCB6aXBwZXIsIGl0ZXJzKSB7XG4gICAgdmFyIHppcFNlcXVlbmNlID0gbWFrZVNlcXVlbmNlKGtleUl0ZXIpO1xuICAgIHppcFNlcXVlbmNlLnNpemUgPSBuZXcgQXJyYXlTZXEoaXRlcnMpLm1hcChmdW5jdGlvbihpICkge3JldHVybiBpLnNpemV9KS5taW4oKTtcbiAgICAvLyBOb3RlOiB0aGlzIGEgZ2VuZXJpYyBiYXNlIGltcGxlbWVudGF0aW9uIG9mIF9faXRlcmF0ZSBpbiB0ZXJtcyBvZlxuICAgIC8vIF9faXRlcmF0b3Igd2hpY2ggbWF5IGJlIG1vcmUgZ2VuZXJpY2FsbHkgdXNlZnVsIGluIHRoZSBmdXR1cmUuXG4gICAgemlwU2VxdWVuY2UuX19pdGVyYXRlID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHtcbiAgICAgIC8qIGdlbmVyaWM6XG4gICAgICB2YXIgaXRlcmF0b3IgPSB0aGlzLl9faXRlcmF0b3IoSVRFUkFURV9FTlRSSUVTLCByZXZlcnNlKTtcbiAgICAgIHZhciBzdGVwO1xuICAgICAgdmFyIGl0ZXJhdGlvbnMgPSAwO1xuICAgICAgd2hpbGUgKCEoc3RlcCA9IGl0ZXJhdG9yLm5leHQoKSkuZG9uZSkge1xuICAgICAgICBpdGVyYXRpb25zKys7XG4gICAgICAgIGlmIChmbihzdGVwLnZhbHVlWzFdLCBzdGVwLnZhbHVlWzBdLCB0aGlzKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGl0ZXJhdGlvbnM7XG4gICAgICAqL1xuICAgICAgLy8gaW5kZXhlZDpcbiAgICAgIHZhciBpdGVyYXRvciA9IHRoaXMuX19pdGVyYXRvcihJVEVSQVRFX1ZBTFVFUywgcmV2ZXJzZSk7XG4gICAgICB2YXIgc3RlcDtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHdoaWxlICghKHN0ZXAgPSBpdGVyYXRvci5uZXh0KCkpLmRvbmUpIHtcbiAgICAgICAgaWYgKGZuKHN0ZXAudmFsdWUsIGl0ZXJhdGlvbnMrKywgdGhpcykgPT09IGZhbHNlKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBpdGVyYXRpb25zO1xuICAgIH07XG4gICAgemlwU2VxdWVuY2UuX19pdGVyYXRvclVuY2FjaGVkID0gZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkge1xuICAgICAgdmFyIGl0ZXJhdG9ycyA9IGl0ZXJzLm1hcChmdW5jdGlvbihpIClcbiAgICAgICAge3JldHVybiAoaSA9IEl0ZXJhYmxlKGkpLCBnZXRJdGVyYXRvcihyZXZlcnNlID8gaS5yZXZlcnNlKCkgOiBpKSl9XG4gICAgICApO1xuICAgICAgdmFyIGl0ZXJhdGlvbnMgPSAwO1xuICAgICAgdmFyIGlzRG9uZSA9IGZhbHNlO1xuICAgICAgcmV0dXJuIG5ldyBzcmNfSXRlcmF0b3JfX0l0ZXJhdG9yKGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgdmFyIHN0ZXBzO1xuICAgICAgICBpZiAoIWlzRG9uZSkge1xuICAgICAgICAgIHN0ZXBzID0gaXRlcmF0b3JzLm1hcChmdW5jdGlvbihpICkge3JldHVybiBpLm5leHQoKX0pO1xuICAgICAgICAgIGlzRG9uZSA9IHN0ZXBzLnNvbWUoZnVuY3Rpb24ocyApIHtyZXR1cm4gcy5kb25lfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzRG9uZSkge1xuICAgICAgICAgIHJldHVybiBpdGVyYXRvckRvbmUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaXRlcmF0b3JWYWx1ZShcbiAgICAgICAgICB0eXBlLFxuICAgICAgICAgIGl0ZXJhdGlvbnMrKyxcbiAgICAgICAgICB6aXBwZXIuYXBwbHkobnVsbCwgc3RlcHMubWFwKGZ1bmN0aW9uKHMgKSB7cmV0dXJuIHMudmFsdWV9KSlcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIHppcFNlcXVlbmNlXG4gIH1cblxuXG4gIC8vICNwcmFnbWEgSGVscGVyIEZ1bmN0aW9uc1xuXG4gIGZ1bmN0aW9uIHJlaWZ5KGl0ZXIsIHNlcSkge1xuICAgIHJldHVybiBpc1NlcShpdGVyKSA/IHNlcSA6IGl0ZXIuY29uc3RydWN0b3Ioc2VxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHZhbGlkYXRlRW50cnkoZW50cnkpIHtcbiAgICBpZiAoZW50cnkgIT09IE9iamVjdChlbnRyeSkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFtLLCBWXSB0dXBsZTogJyArIGVudHJ5KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZXNvbHZlU2l6ZShpdGVyKSB7XG4gICAgYXNzZXJ0Tm90SW5maW5pdGUoaXRlci5zaXplKTtcbiAgICByZXR1cm4gZW5zdXJlU2l6ZShpdGVyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGl0ZXJhYmxlQ2xhc3MoaXRlcmFibGUpIHtcbiAgICByZXR1cm4gaXNLZXllZChpdGVyYWJsZSkgPyBLZXllZEl0ZXJhYmxlIDpcbiAgICAgIGlzSW5kZXhlZChpdGVyYWJsZSkgPyBJbmRleGVkSXRlcmFibGUgOlxuICAgICAgU2V0SXRlcmFibGU7XG4gIH1cblxuICBmdW5jdGlvbiBtYWtlU2VxdWVuY2UoaXRlcmFibGUpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShcbiAgICAgIChcbiAgICAgICAgaXNLZXllZChpdGVyYWJsZSkgPyBLZXllZFNlcSA6XG4gICAgICAgIGlzSW5kZXhlZChpdGVyYWJsZSkgPyBJbmRleGVkU2VxIDpcbiAgICAgICAgU2V0U2VxXG4gICAgICApLnByb3RvdHlwZVxuICAgICk7XG4gIH1cblxuICBmdW5jdGlvbiBjYWNoZVJlc3VsdFRocm91Z2goKSB7XG4gICAgaWYgKHRoaXMuX2l0ZXIuY2FjaGVSZXN1bHQpIHtcbiAgICAgIHRoaXMuX2l0ZXIuY2FjaGVSZXN1bHQoKTtcbiAgICAgIHRoaXMuc2l6ZSA9IHRoaXMuX2l0ZXIuc2l6ZTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gU2VxLnByb3RvdHlwZS5jYWNoZVJlc3VsdC5jYWxsKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZmF1bHRDb21wYXJhdG9yKGEsIGIpIHtcbiAgICByZXR1cm4gYSA+IGIgPyAxIDogYSA8IGIgPyAtMSA6IDA7XG4gIH1cblxuICBmdW5jdGlvbiBmb3JjZUl0ZXJhdG9yKGtleVBhdGgpIHtcbiAgICB2YXIgaXRlciA9IGdldEl0ZXJhdG9yKGtleVBhdGgpO1xuICAgIGlmICghaXRlcikge1xuICAgICAgLy8gQXJyYXkgbWlnaHQgbm90IGJlIGl0ZXJhYmxlIGluIHRoaXMgZW52aXJvbm1lbnQsIHNvIHdlIG5lZWQgYSBmYWxsYmFja1xuICAgICAgLy8gdG8gb3VyIHdyYXBwZWQgdHlwZS5cbiAgICAgIGlmICghaXNBcnJheUxpa2Uoa2V5UGF0aCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgaXRlcmFibGUgb3IgYXJyYXktbGlrZTogJyArIGtleVBhdGgpO1xuICAgICAgfVxuICAgICAgaXRlciA9IGdldEl0ZXJhdG9yKEl0ZXJhYmxlKGtleVBhdGgpKTtcbiAgICB9XG4gICAgcmV0dXJuIGl0ZXI7XG4gIH1cblxuICBjcmVhdGVDbGFzcyhzcmNfTWFwX19NYXAsIEtleWVkQ29sbGVjdGlvbik7XG5cbiAgICAvLyBAcHJhZ21hIENvbnN0cnVjdGlvblxuXG4gICAgZnVuY3Rpb24gc3JjX01hcF9fTWFwKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCA/IGVtcHR5TWFwKCkgOlxuICAgICAgICBpc01hcCh2YWx1ZSkgPyB2YWx1ZSA6XG4gICAgICAgIGVtcHR5TWFwKCkud2l0aE11dGF0aW9ucyhmdW5jdGlvbihtYXAgKSB7XG4gICAgICAgICAgdmFyIGl0ZXIgPSBLZXllZEl0ZXJhYmxlKHZhbHVlKTtcbiAgICAgICAgICBhc3NlcnROb3RJbmZpbml0ZShpdGVyLnNpemUpO1xuICAgICAgICAgIGl0ZXIuZm9yRWFjaChmdW5jdGlvbih2LCBrKSAge3JldHVybiBtYXAuc2V0KGssIHYpfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNyY19NYXBfX01hcC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9fdG9TdHJpbmcoJ01hcCB7JywgJ30nKTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBBY2Nlc3NcblxuICAgIHNyY19NYXBfX01hcC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oaywgbm90U2V0VmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLl9yb290ID9cbiAgICAgICAgdGhpcy5fcm9vdC5nZXQoMCwgdW5kZWZpbmVkLCBrLCBub3RTZXRWYWx1ZSkgOlxuICAgICAgICBub3RTZXRWYWx1ZTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBNb2RpZmljYXRpb25cblxuICAgIHNyY19NYXBfX01hcC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24oaywgdikge1xuICAgICAgcmV0dXJuIHVwZGF0ZU1hcCh0aGlzLCBrLCB2KTtcbiAgICB9O1xuXG4gICAgc3JjX01hcF9fTWFwLnByb3RvdHlwZS5zZXRJbiA9IGZ1bmN0aW9uKGtleVBhdGgsIHYpIHtcbiAgICAgIHJldHVybiB0aGlzLnVwZGF0ZUluKGtleVBhdGgsIE5PVF9TRVQsIGZ1bmN0aW9uKCkgIHtyZXR1cm4gdn0pO1xuICAgIH07XG5cbiAgICBzcmNfTWFwX19NYXAucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKGspIHtcbiAgICAgIHJldHVybiB1cGRhdGVNYXAodGhpcywgaywgTk9UX1NFVCk7XG4gICAgfTtcblxuICAgIHNyY19NYXBfX01hcC5wcm90b3R5cGUuZGVsZXRlSW4gPSBmdW5jdGlvbihrZXlQYXRoKSB7XG4gICAgICByZXR1cm4gdGhpcy51cGRhdGVJbihrZXlQYXRoLCBmdW5jdGlvbigpICB7cmV0dXJuIE5PVF9TRVR9KTtcbiAgICB9O1xuXG4gICAgc3JjX01hcF9fTWFwLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihrLCBub3RTZXRWYWx1ZSwgdXBkYXRlcikge1xuICAgICAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPT09IDEgP1xuICAgICAgICBrKHRoaXMpIDpcbiAgICAgICAgdGhpcy51cGRhdGVJbihba10sIG5vdFNldFZhbHVlLCB1cGRhdGVyKTtcbiAgICB9O1xuXG4gICAgc3JjX01hcF9fTWFwLnByb3RvdHlwZS51cGRhdGVJbiA9IGZ1bmN0aW9uKGtleVBhdGgsIG5vdFNldFZhbHVlLCB1cGRhdGVyKSB7XG4gICAgICBpZiAoIXVwZGF0ZXIpIHtcbiAgICAgICAgdXBkYXRlciA9IG5vdFNldFZhbHVlO1xuICAgICAgICBub3RTZXRWYWx1ZSA9IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICAgIHZhciB1cGRhdGVkVmFsdWUgPSB1cGRhdGVJbkRlZXBNYXAoXG4gICAgICAgIHRoaXMsXG4gICAgICAgIGZvcmNlSXRlcmF0b3Ioa2V5UGF0aCksXG4gICAgICAgIG5vdFNldFZhbHVlLFxuICAgICAgICB1cGRhdGVyXG4gICAgICApO1xuICAgICAgcmV0dXJuIHVwZGF0ZWRWYWx1ZSA9PT0gTk9UX1NFVCA/IHVuZGVmaW5lZCA6IHVwZGF0ZWRWYWx1ZTtcbiAgICB9O1xuXG4gICAgc3JjX01hcF9fTWFwLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuc2l6ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9fb3duZXJJRCkge1xuICAgICAgICB0aGlzLnNpemUgPSAwO1xuICAgICAgICB0aGlzLl9yb290ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fX2hhc2ggPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX19hbHRlcmVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gZW1wdHlNYXAoKTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBDb21wb3NpdGlvblxuXG4gICAgc3JjX01hcF9fTWFwLnByb3RvdHlwZS5tZXJnZSA9IGZ1bmN0aW9uKC8qLi4uaXRlcnMqLykge1xuICAgICAgcmV0dXJuIG1lcmdlSW50b01hcFdpdGgodGhpcywgdW5kZWZpbmVkLCBhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBzcmNfTWFwX19NYXAucHJvdG90eXBlLm1lcmdlV2l0aCA9IGZ1bmN0aW9uKG1lcmdlcikge3ZhciBpdGVycyA9IFNMSUNFJDAuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgcmV0dXJuIG1lcmdlSW50b01hcFdpdGgodGhpcywgbWVyZ2VyLCBpdGVycyk7XG4gICAgfTtcblxuICAgIHNyY19NYXBfX01hcC5wcm90b3R5cGUubWVyZ2VJbiA9IGZ1bmN0aW9uKGtleVBhdGgpIHt2YXIgaXRlcnMgPSBTTElDRSQwLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgIHJldHVybiB0aGlzLnVwZGF0ZUluKGtleVBhdGgsIGVtcHR5TWFwKCksIGZ1bmN0aW9uKG0gKSB7cmV0dXJuIG0ubWVyZ2UuYXBwbHkobSwgaXRlcnMpfSk7XG4gICAgfTtcblxuICAgIHNyY19NYXBfX01hcC5wcm90b3R5cGUubWVyZ2VEZWVwID0gZnVuY3Rpb24oLyouLi5pdGVycyovKSB7XG4gICAgICByZXR1cm4gbWVyZ2VJbnRvTWFwV2l0aCh0aGlzLCBkZWVwTWVyZ2VyKHVuZGVmaW5lZCksIGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICAgIHNyY19NYXBfX01hcC5wcm90b3R5cGUubWVyZ2VEZWVwV2l0aCA9IGZ1bmN0aW9uKG1lcmdlcikge3ZhciBpdGVycyA9IFNMSUNFJDAuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgcmV0dXJuIG1lcmdlSW50b01hcFdpdGgodGhpcywgZGVlcE1lcmdlcihtZXJnZXIpLCBpdGVycyk7XG4gICAgfTtcblxuICAgIHNyY19NYXBfX01hcC5wcm90b3R5cGUubWVyZ2VEZWVwSW4gPSBmdW5jdGlvbihrZXlQYXRoKSB7dmFyIGl0ZXJzID0gU0xJQ0UkMC5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICByZXR1cm4gdGhpcy51cGRhdGVJbihrZXlQYXRoLCBlbXB0eU1hcCgpLCBmdW5jdGlvbihtICkge3JldHVybiBtLm1lcmdlRGVlcC5hcHBseShtLCBpdGVycyl9KTtcbiAgICB9O1xuXG4gICAgc3JjX01hcF9fTWFwLnByb3RvdHlwZS5zb3J0ID0gZnVuY3Rpb24oY29tcGFyYXRvcikge1xuICAgICAgLy8gTGF0ZSBiaW5kaW5nXG4gICAgICByZXR1cm4gT3JkZXJlZE1hcChzb3J0RmFjdG9yeSh0aGlzLCBjb21wYXJhdG9yKSk7XG4gICAgfTtcblxuICAgIHNyY19NYXBfX01hcC5wcm90b3R5cGUuc29ydEJ5ID0gZnVuY3Rpb24obWFwcGVyLCBjb21wYXJhdG9yKSB7XG4gICAgICAvLyBMYXRlIGJpbmRpbmdcbiAgICAgIHJldHVybiBPcmRlcmVkTWFwKHNvcnRGYWN0b3J5KHRoaXMsIGNvbXBhcmF0b3IsIG1hcHBlcikpO1xuICAgIH07XG5cbiAgICAvLyBAcHJhZ21hIE11dGFiaWxpdHlcblxuICAgIHNyY19NYXBfX01hcC5wcm90b3R5cGUud2l0aE11dGF0aW9ucyA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgICB2YXIgbXV0YWJsZSA9IHRoaXMuYXNNdXRhYmxlKCk7XG4gICAgICBmbihtdXRhYmxlKTtcbiAgICAgIHJldHVybiBtdXRhYmxlLndhc0FsdGVyZWQoKSA/IG11dGFibGUuX19lbnN1cmVPd25lcih0aGlzLl9fb3duZXJJRCkgOiB0aGlzO1xuICAgIH07XG5cbiAgICBzcmNfTWFwX19NYXAucHJvdG90eXBlLmFzTXV0YWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX19vd25lcklEID8gdGhpcyA6IHRoaXMuX19lbnN1cmVPd25lcihuZXcgT3duZXJJRCgpKTtcbiAgICB9O1xuXG4gICAgc3JjX01hcF9fTWFwLnByb3RvdHlwZS5hc0ltbXV0YWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX19lbnN1cmVPd25lcigpO1xuICAgIH07XG5cbiAgICBzcmNfTWFwX19NYXAucHJvdG90eXBlLndhc0FsdGVyZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9fYWx0ZXJlZDtcbiAgICB9O1xuXG4gICAgc3JjX01hcF9fTWFwLnByb3RvdHlwZS5fX2l0ZXJhdG9yID0gZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkge1xuICAgICAgcmV0dXJuIG5ldyBNYXBJdGVyYXRvcih0aGlzLCB0eXBlLCByZXZlcnNlKTtcbiAgICB9O1xuXG4gICAgc3JjX01hcF9fTWFwLnByb3RvdHlwZS5fX2l0ZXJhdGUgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgdmFyIGl0ZXJhdGlvbnMgPSAwO1xuICAgICAgdGhpcy5fcm9vdCAmJiB0aGlzLl9yb290Lml0ZXJhdGUoZnVuY3Rpb24oZW50cnkgKSB7XG4gICAgICAgIGl0ZXJhdGlvbnMrKztcbiAgICAgICAgcmV0dXJuIGZuKGVudHJ5WzFdLCBlbnRyeVswXSwgdGhpcyQwKTtcbiAgICAgIH0sIHJldmVyc2UpO1xuICAgICAgcmV0dXJuIGl0ZXJhdGlvbnM7XG4gICAgfTtcblxuICAgIHNyY19NYXBfX01hcC5wcm90b3R5cGUuX19lbnN1cmVPd25lciA9IGZ1bmN0aW9uKG93bmVySUQpIHtcbiAgICAgIGlmIChvd25lcklEID09PSB0aGlzLl9fb3duZXJJRCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIGlmICghb3duZXJJRCkge1xuICAgICAgICB0aGlzLl9fb3duZXJJRCA9IG93bmVySUQ7XG4gICAgICAgIHRoaXMuX19hbHRlcmVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1ha2VNYXAodGhpcy5zaXplLCB0aGlzLl9yb290LCBvd25lcklELCB0aGlzLl9faGFzaCk7XG4gICAgfTtcblxuXG4gIGZ1bmN0aW9uIGlzTWFwKG1heWJlTWFwKSB7XG4gICAgcmV0dXJuICEhKG1heWJlTWFwICYmIG1heWJlTWFwW0lTX01BUF9TRU5USU5FTF0pO1xuICB9XG5cbiAgc3JjX01hcF9fTWFwLmlzTWFwID0gaXNNYXA7XG5cbiAgdmFyIElTX01BUF9TRU5USU5FTCA9ICdAQF9fSU1NVVRBQkxFX01BUF9fQEAnO1xuXG4gIHZhciBNYXBQcm90b3R5cGUgPSBzcmNfTWFwX19NYXAucHJvdG90eXBlO1xuICBNYXBQcm90b3R5cGVbSVNfTUFQX1NFTlRJTkVMXSA9IHRydWU7XG4gIE1hcFByb3RvdHlwZVtERUxFVEVdID0gTWFwUHJvdG90eXBlLnJlbW92ZTtcbiAgTWFwUHJvdG90eXBlLnJlbW92ZUluID0gTWFwUHJvdG90eXBlLmRlbGV0ZUluO1xuXG5cbiAgLy8gI3ByYWdtYSBUcmllIE5vZGVzXG5cblxuXG4gICAgZnVuY3Rpb24gQXJyYXlNYXBOb2RlKG93bmVySUQsIGVudHJpZXMpIHtcbiAgICAgIHRoaXMub3duZXJJRCA9IG93bmVySUQ7XG4gICAgICB0aGlzLmVudHJpZXMgPSBlbnRyaWVzO1xuICAgIH1cblxuICAgIEFycmF5TWFwTm9kZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oc2hpZnQsIGtleUhhc2gsIGtleSwgbm90U2V0VmFsdWUpIHtcbiAgICAgIHZhciBlbnRyaWVzID0gdGhpcy5lbnRyaWVzO1xuICAgICAgZm9yICh2YXIgaWkgPSAwLCBsZW4gPSBlbnRyaWVzLmxlbmd0aDsgaWkgPCBsZW47IGlpKyspIHtcbiAgICAgICAgaWYgKGlzKGtleSwgZW50cmllc1tpaV1bMF0pKSB7XG4gICAgICAgICAgcmV0dXJuIGVudHJpZXNbaWldWzFdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbm90U2V0VmFsdWU7XG4gICAgfTtcblxuICAgIEFycmF5TWFwTm9kZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24ob3duZXJJRCwgc2hpZnQsIGtleUhhc2gsIGtleSwgdmFsdWUsIGRpZENoYW5nZVNpemUsIGRpZEFsdGVyKSB7XG4gICAgICB2YXIgcmVtb3ZlZCA9IHZhbHVlID09PSBOT1RfU0VUO1xuXG4gICAgICB2YXIgZW50cmllcyA9IHRoaXMuZW50cmllcztcbiAgICAgIHZhciBpZHggPSAwO1xuICAgICAgZm9yICh2YXIgbGVuID0gZW50cmllcy5sZW5ndGg7IGlkeCA8IGxlbjsgaWR4KyspIHtcbiAgICAgICAgaWYgKGlzKGtleSwgZW50cmllc1tpZHhdWzBdKSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB2YXIgZXhpc3RzID0gaWR4IDwgbGVuO1xuXG4gICAgICBpZiAoZXhpc3RzID8gZW50cmllc1tpZHhdWzFdID09PSB2YWx1ZSA6IHJlbW92ZWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIFNldFJlZihkaWRBbHRlcik7XG4gICAgICAocmVtb3ZlZCB8fCAhZXhpc3RzKSAmJiBTZXRSZWYoZGlkQ2hhbmdlU2l6ZSk7XG5cbiAgICAgIGlmIChyZW1vdmVkICYmIGVudHJpZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybjsgLy8gdW5kZWZpbmVkXG4gICAgICB9XG5cbiAgICAgIGlmICghZXhpc3RzICYmICFyZW1vdmVkICYmIGVudHJpZXMubGVuZ3RoID49IE1BWF9BUlJBWV9NQVBfU0laRSkge1xuICAgICAgICByZXR1cm4gY3JlYXRlTm9kZXMob3duZXJJRCwgZW50cmllcywga2V5LCB2YWx1ZSk7XG4gICAgICB9XG5cbiAgICAgIHZhciBpc0VkaXRhYmxlID0gb3duZXJJRCAmJiBvd25lcklEID09PSB0aGlzLm93bmVySUQ7XG4gICAgICB2YXIgbmV3RW50cmllcyA9IGlzRWRpdGFibGUgPyBlbnRyaWVzIDogYXJyQ29weShlbnRyaWVzKTtcblxuICAgICAgaWYgKGV4aXN0cykge1xuICAgICAgICBpZiAocmVtb3ZlZCkge1xuICAgICAgICAgIGlkeCA9PT0gbGVuIC0gMSA/IG5ld0VudHJpZXMucG9wKCkgOiAobmV3RW50cmllc1tpZHhdID0gbmV3RW50cmllcy5wb3AoKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3RW50cmllc1tpZHhdID0gW2tleSwgdmFsdWVdO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdFbnRyaWVzLnB1c2goW2tleSwgdmFsdWVdKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzRWRpdGFibGUpIHtcbiAgICAgICAgdGhpcy5lbnRyaWVzID0gbmV3RW50cmllcztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgQXJyYXlNYXBOb2RlKG93bmVySUQsIG5ld0VudHJpZXMpO1xuICAgIH07XG5cblxuXG5cbiAgICBmdW5jdGlvbiBCaXRtYXBJbmRleGVkTm9kZShvd25lcklELCBiaXRtYXAsIG5vZGVzKSB7XG4gICAgICB0aGlzLm93bmVySUQgPSBvd25lcklEO1xuICAgICAgdGhpcy5iaXRtYXAgPSBiaXRtYXA7XG4gICAgICB0aGlzLm5vZGVzID0gbm9kZXM7XG4gICAgfVxuXG4gICAgQml0bWFwSW5kZXhlZE5vZGUucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKHNoaWZ0LCBrZXlIYXNoLCBrZXksIG5vdFNldFZhbHVlKSB7XG4gICAgICBpZiAoa2V5SGFzaCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGtleUhhc2ggPSBoYXNoKGtleSk7XG4gICAgICB9XG4gICAgICB2YXIgYml0ID0gKDEgPDwgKChzaGlmdCA9PT0gMCA/IGtleUhhc2ggOiBrZXlIYXNoID4+PiBzaGlmdCkgJiBNQVNLKSk7XG4gICAgICB2YXIgYml0bWFwID0gdGhpcy5iaXRtYXA7XG4gICAgICByZXR1cm4gKGJpdG1hcCAmIGJpdCkgPT09IDAgPyBub3RTZXRWYWx1ZSA6XG4gICAgICAgIHRoaXMubm9kZXNbcG9wQ291bnQoYml0bWFwICYgKGJpdCAtIDEpKV0uZ2V0KHNoaWZ0ICsgU0hJRlQsIGtleUhhc2gsIGtleSwgbm90U2V0VmFsdWUpO1xuICAgIH07XG5cbiAgICBCaXRtYXBJbmRleGVkTm9kZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24ob3duZXJJRCwgc2hpZnQsIGtleUhhc2gsIGtleSwgdmFsdWUsIGRpZENoYW5nZVNpemUsIGRpZEFsdGVyKSB7XG4gICAgICBpZiAoa2V5SGFzaCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGtleUhhc2ggPSBoYXNoKGtleSk7XG4gICAgICB9XG4gICAgICB2YXIga2V5SGFzaEZyYWcgPSAoc2hpZnQgPT09IDAgPyBrZXlIYXNoIDoga2V5SGFzaCA+Pj4gc2hpZnQpICYgTUFTSztcbiAgICAgIHZhciBiaXQgPSAxIDw8IGtleUhhc2hGcmFnO1xuICAgICAgdmFyIGJpdG1hcCA9IHRoaXMuYml0bWFwO1xuICAgICAgdmFyIGV4aXN0cyA9IChiaXRtYXAgJiBiaXQpICE9PSAwO1xuXG4gICAgICBpZiAoIWV4aXN0cyAmJiB2YWx1ZSA9PT0gTk9UX1NFVCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgdmFyIGlkeCA9IHBvcENvdW50KGJpdG1hcCAmIChiaXQgLSAxKSk7XG4gICAgICB2YXIgbm9kZXMgPSB0aGlzLm5vZGVzO1xuICAgICAgdmFyIG5vZGUgPSBleGlzdHMgPyBub2Rlc1tpZHhdIDogdW5kZWZpbmVkO1xuICAgICAgdmFyIG5ld05vZGUgPSB1cGRhdGVOb2RlKG5vZGUsIG93bmVySUQsIHNoaWZ0ICsgU0hJRlQsIGtleUhhc2gsIGtleSwgdmFsdWUsIGRpZENoYW5nZVNpemUsIGRpZEFsdGVyKTtcblxuICAgICAgaWYgKG5ld05vZGUgPT09IG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIGlmICghZXhpc3RzICYmIG5ld05vZGUgJiYgbm9kZXMubGVuZ3RoID49IE1BWF9CSVRNQVBfSU5ERVhFRF9TSVpFKSB7XG4gICAgICAgIHJldHVybiBleHBhbmROb2Rlcyhvd25lcklELCBub2RlcywgYml0bWFwLCBrZXlIYXNoRnJhZywgbmV3Tm9kZSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChleGlzdHMgJiYgIW5ld05vZGUgJiYgbm9kZXMubGVuZ3RoID09PSAyICYmIGlzTGVhZk5vZGUobm9kZXNbaWR4IF4gMV0pKSB7XG4gICAgICAgIHJldHVybiBub2Rlc1tpZHggXiAxXTtcbiAgICAgIH1cblxuICAgICAgaWYgKGV4aXN0cyAmJiBuZXdOb2RlICYmIG5vZGVzLmxlbmd0aCA9PT0gMSAmJiBpc0xlYWZOb2RlKG5ld05vZGUpKSB7XG4gICAgICAgIHJldHVybiBuZXdOb2RlO1xuICAgICAgfVxuXG4gICAgICB2YXIgaXNFZGl0YWJsZSA9IG93bmVySUQgJiYgb3duZXJJRCA9PT0gdGhpcy5vd25lcklEO1xuICAgICAgdmFyIG5ld0JpdG1hcCA9IGV4aXN0cyA/IG5ld05vZGUgPyBiaXRtYXAgOiBiaXRtYXAgXiBiaXQgOiBiaXRtYXAgfCBiaXQ7XG4gICAgICB2YXIgbmV3Tm9kZXMgPSBleGlzdHMgPyBuZXdOb2RlID9cbiAgICAgICAgc2V0SW4obm9kZXMsIGlkeCwgbmV3Tm9kZSwgaXNFZGl0YWJsZSkgOlxuICAgICAgICBzcGxpY2VPdXQobm9kZXMsIGlkeCwgaXNFZGl0YWJsZSkgOlxuICAgICAgICBzcGxpY2VJbihub2RlcywgaWR4LCBuZXdOb2RlLCBpc0VkaXRhYmxlKTtcblxuICAgICAgaWYgKGlzRWRpdGFibGUpIHtcbiAgICAgICAgdGhpcy5iaXRtYXAgPSBuZXdCaXRtYXA7XG4gICAgICAgIHRoaXMubm9kZXMgPSBuZXdOb2RlcztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgQml0bWFwSW5kZXhlZE5vZGUob3duZXJJRCwgbmV3Qml0bWFwLCBuZXdOb2Rlcyk7XG4gICAgfTtcblxuXG5cblxuICAgIGZ1bmN0aW9uIEhhc2hBcnJheU1hcE5vZGUob3duZXJJRCwgY291bnQsIG5vZGVzKSB7XG4gICAgICB0aGlzLm93bmVySUQgPSBvd25lcklEO1xuICAgICAgdGhpcy5jb3VudCA9IGNvdW50O1xuICAgICAgdGhpcy5ub2RlcyA9IG5vZGVzO1xuICAgIH1cblxuICAgIEhhc2hBcnJheU1hcE5vZGUucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKHNoaWZ0LCBrZXlIYXNoLCBrZXksIG5vdFNldFZhbHVlKSB7XG4gICAgICBpZiAoa2V5SGFzaCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGtleUhhc2ggPSBoYXNoKGtleSk7XG4gICAgICB9XG4gICAgICB2YXIgaWR4ID0gKHNoaWZ0ID09PSAwID8ga2V5SGFzaCA6IGtleUhhc2ggPj4+IHNoaWZ0KSAmIE1BU0s7XG4gICAgICB2YXIgbm9kZSA9IHRoaXMubm9kZXNbaWR4XTtcbiAgICAgIHJldHVybiBub2RlID8gbm9kZS5nZXQoc2hpZnQgKyBTSElGVCwga2V5SGFzaCwga2V5LCBub3RTZXRWYWx1ZSkgOiBub3RTZXRWYWx1ZTtcbiAgICB9O1xuXG4gICAgSGFzaEFycmF5TWFwTm9kZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24ob3duZXJJRCwgc2hpZnQsIGtleUhhc2gsIGtleSwgdmFsdWUsIGRpZENoYW5nZVNpemUsIGRpZEFsdGVyKSB7XG4gICAgICBpZiAoa2V5SGFzaCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGtleUhhc2ggPSBoYXNoKGtleSk7XG4gICAgICB9XG4gICAgICB2YXIgaWR4ID0gKHNoaWZ0ID09PSAwID8ga2V5SGFzaCA6IGtleUhhc2ggPj4+IHNoaWZ0KSAmIE1BU0s7XG4gICAgICB2YXIgcmVtb3ZlZCA9IHZhbHVlID09PSBOT1RfU0VUO1xuICAgICAgdmFyIG5vZGVzID0gdGhpcy5ub2RlcztcbiAgICAgIHZhciBub2RlID0gbm9kZXNbaWR4XTtcblxuICAgICAgaWYgKHJlbW92ZWQgJiYgIW5vZGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIHZhciBuZXdOb2RlID0gdXBkYXRlTm9kZShub2RlLCBvd25lcklELCBzaGlmdCArIFNISUZULCBrZXlIYXNoLCBrZXksIHZhbHVlLCBkaWRDaGFuZ2VTaXplLCBkaWRBbHRlcik7XG4gICAgICBpZiAobmV3Tm9kZSA9PT0gbm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgdmFyIG5ld0NvdW50ID0gdGhpcy5jb3VudDtcbiAgICAgIGlmICghbm9kZSkge1xuICAgICAgICBuZXdDb3VudCsrO1xuICAgICAgfSBlbHNlIGlmICghbmV3Tm9kZSkge1xuICAgICAgICBuZXdDb3VudC0tO1xuICAgICAgICBpZiAobmV3Q291bnQgPCBNSU5fSEFTSF9BUlJBWV9NQVBfU0laRSkge1xuICAgICAgICAgIHJldHVybiBwYWNrTm9kZXMob3duZXJJRCwgbm9kZXMsIG5ld0NvdW50LCBpZHgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBpc0VkaXRhYmxlID0gb3duZXJJRCAmJiBvd25lcklEID09PSB0aGlzLm93bmVySUQ7XG4gICAgICB2YXIgbmV3Tm9kZXMgPSBzZXRJbihub2RlcywgaWR4LCBuZXdOb2RlLCBpc0VkaXRhYmxlKTtcblxuICAgICAgaWYgKGlzRWRpdGFibGUpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IG5ld0NvdW50O1xuICAgICAgICB0aGlzLm5vZGVzID0gbmV3Tm9kZXM7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IEhhc2hBcnJheU1hcE5vZGUob3duZXJJRCwgbmV3Q291bnQsIG5ld05vZGVzKTtcbiAgICB9O1xuXG5cblxuXG4gICAgZnVuY3Rpb24gSGFzaENvbGxpc2lvbk5vZGUob3duZXJJRCwga2V5SGFzaCwgZW50cmllcykge1xuICAgICAgdGhpcy5vd25lcklEID0gb3duZXJJRDtcbiAgICAgIHRoaXMua2V5SGFzaCA9IGtleUhhc2g7XG4gICAgICB0aGlzLmVudHJpZXMgPSBlbnRyaWVzO1xuICAgIH1cblxuICAgIEhhc2hDb2xsaXNpb25Ob2RlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihzaGlmdCwga2V5SGFzaCwga2V5LCBub3RTZXRWYWx1ZSkge1xuICAgICAgdmFyIGVudHJpZXMgPSB0aGlzLmVudHJpZXM7XG4gICAgICBmb3IgKHZhciBpaSA9IDAsIGxlbiA9IGVudHJpZXMubGVuZ3RoOyBpaSA8IGxlbjsgaWkrKykge1xuICAgICAgICBpZiAoaXMoa2V5LCBlbnRyaWVzW2lpXVswXSkpIHtcbiAgICAgICAgICByZXR1cm4gZW50cmllc1tpaV1bMV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBub3RTZXRWYWx1ZTtcbiAgICB9O1xuXG4gICAgSGFzaENvbGxpc2lvbk5vZGUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKG93bmVySUQsIHNoaWZ0LCBrZXlIYXNoLCBrZXksIHZhbHVlLCBkaWRDaGFuZ2VTaXplLCBkaWRBbHRlcikge1xuICAgICAgaWYgKGtleUhhc2ggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBrZXlIYXNoID0gaGFzaChrZXkpO1xuICAgICAgfVxuXG4gICAgICB2YXIgcmVtb3ZlZCA9IHZhbHVlID09PSBOT1RfU0VUO1xuXG4gICAgICBpZiAoa2V5SGFzaCAhPT0gdGhpcy5rZXlIYXNoKSB7XG4gICAgICAgIGlmIChyZW1vdmVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgU2V0UmVmKGRpZEFsdGVyKTtcbiAgICAgICAgU2V0UmVmKGRpZENoYW5nZVNpemUpO1xuICAgICAgICByZXR1cm4gbWVyZ2VJbnRvTm9kZSh0aGlzLCBvd25lcklELCBzaGlmdCwga2V5SGFzaCwgW2tleSwgdmFsdWVdKTtcbiAgICAgIH1cblxuICAgICAgdmFyIGVudHJpZXMgPSB0aGlzLmVudHJpZXM7XG4gICAgICB2YXIgaWR4ID0gMDtcbiAgICAgIGZvciAodmFyIGxlbiA9IGVudHJpZXMubGVuZ3RoOyBpZHggPCBsZW47IGlkeCsrKSB7XG4gICAgICAgIGlmIChpcyhrZXksIGVudHJpZXNbaWR4XVswXSkpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdmFyIGV4aXN0cyA9IGlkeCA8IGxlbjtcblxuICAgICAgaWYgKGV4aXN0cyA/IGVudHJpZXNbaWR4XVsxXSA9PT0gdmFsdWUgOiByZW1vdmVkKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICBTZXRSZWYoZGlkQWx0ZXIpO1xuICAgICAgKHJlbW92ZWQgfHwgIWV4aXN0cykgJiYgU2V0UmVmKGRpZENoYW5nZVNpemUpO1xuXG4gICAgICBpZiAocmVtb3ZlZCAmJiBsZW4gPT09IDIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWYWx1ZU5vZGUob3duZXJJRCwgdGhpcy5rZXlIYXNoLCBlbnRyaWVzW2lkeCBeIDFdKTtcbiAgICAgIH1cblxuICAgICAgdmFyIGlzRWRpdGFibGUgPSBvd25lcklEICYmIG93bmVySUQgPT09IHRoaXMub3duZXJJRDtcbiAgICAgIHZhciBuZXdFbnRyaWVzID0gaXNFZGl0YWJsZSA/IGVudHJpZXMgOiBhcnJDb3B5KGVudHJpZXMpO1xuXG4gICAgICBpZiAoZXhpc3RzKSB7XG4gICAgICAgIGlmIChyZW1vdmVkKSB7XG4gICAgICAgICAgaWR4ID09PSBsZW4gLSAxID8gbmV3RW50cmllcy5wb3AoKSA6IChuZXdFbnRyaWVzW2lkeF0gPSBuZXdFbnRyaWVzLnBvcCgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXdFbnRyaWVzW2lkeF0gPSBba2V5LCB2YWx1ZV07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld0VudHJpZXMucHVzaChba2V5LCB2YWx1ZV0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNFZGl0YWJsZSkge1xuICAgICAgICB0aGlzLmVudHJpZXMgPSBuZXdFbnRyaWVzO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBIYXNoQ29sbGlzaW9uTm9kZShvd25lcklELCB0aGlzLmtleUhhc2gsIG5ld0VudHJpZXMpO1xuICAgIH07XG5cblxuXG5cbiAgICBmdW5jdGlvbiBWYWx1ZU5vZGUob3duZXJJRCwga2V5SGFzaCwgZW50cnkpIHtcbiAgICAgIHRoaXMub3duZXJJRCA9IG93bmVySUQ7XG4gICAgICB0aGlzLmtleUhhc2ggPSBrZXlIYXNoO1xuICAgICAgdGhpcy5lbnRyeSA9IGVudHJ5O1xuICAgIH1cblxuICAgIFZhbHVlTm9kZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oc2hpZnQsIGtleUhhc2gsIGtleSwgbm90U2V0VmFsdWUpIHtcbiAgICAgIHJldHVybiBpcyhrZXksIHRoaXMuZW50cnlbMF0pID8gdGhpcy5lbnRyeVsxXSA6IG5vdFNldFZhbHVlO1xuICAgIH07XG5cbiAgICBWYWx1ZU5vZGUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKG93bmVySUQsIHNoaWZ0LCBrZXlIYXNoLCBrZXksIHZhbHVlLCBkaWRDaGFuZ2VTaXplLCBkaWRBbHRlcikge1xuICAgICAgdmFyIHJlbW92ZWQgPSB2YWx1ZSA9PT0gTk9UX1NFVDtcbiAgICAgIHZhciBrZXlNYXRjaCA9IGlzKGtleSwgdGhpcy5lbnRyeVswXSk7XG4gICAgICBpZiAoa2V5TWF0Y2ggPyB2YWx1ZSA9PT0gdGhpcy5lbnRyeVsxXSA6IHJlbW92ZWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIFNldFJlZihkaWRBbHRlcik7XG5cbiAgICAgIGlmIChyZW1vdmVkKSB7XG4gICAgICAgIFNldFJlZihkaWRDaGFuZ2VTaXplKTtcbiAgICAgICAgcmV0dXJuOyAvLyB1bmRlZmluZWRcbiAgICAgIH1cblxuICAgICAgaWYgKGtleU1hdGNoKSB7XG4gICAgICAgIGlmIChvd25lcklEICYmIG93bmVySUQgPT09IHRoaXMub3duZXJJRCkge1xuICAgICAgICAgIHRoaXMuZW50cnlbMV0gPSB2YWx1ZTtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFZhbHVlTm9kZShvd25lcklELCB0aGlzLmtleUhhc2gsIFtrZXksIHZhbHVlXSk7XG4gICAgICB9XG5cbiAgICAgIFNldFJlZihkaWRDaGFuZ2VTaXplKTtcbiAgICAgIHJldHVybiBtZXJnZUludG9Ob2RlKHRoaXMsIG93bmVySUQsIHNoaWZ0LCBoYXNoKGtleSksIFtrZXksIHZhbHVlXSk7XG4gICAgfTtcblxuXG5cbiAgLy8gI3ByYWdtYSBJdGVyYXRvcnNcblxuICBBcnJheU1hcE5vZGUucHJvdG90eXBlLml0ZXJhdGUgPVxuICBIYXNoQ29sbGlzaW9uTm9kZS5wcm90b3R5cGUuaXRlcmF0ZSA9IGZ1bmN0aW9uIChmbiwgcmV2ZXJzZSkge1xuICAgIHZhciBlbnRyaWVzID0gdGhpcy5lbnRyaWVzO1xuICAgIGZvciAodmFyIGlpID0gMCwgbWF4SW5kZXggPSBlbnRyaWVzLmxlbmd0aCAtIDE7IGlpIDw9IG1heEluZGV4OyBpaSsrKSB7XG4gICAgICBpZiAoZm4oZW50cmllc1tyZXZlcnNlID8gbWF4SW5kZXggLSBpaSA6IGlpXSkgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBCaXRtYXBJbmRleGVkTm9kZS5wcm90b3R5cGUuaXRlcmF0ZSA9XG4gIEhhc2hBcnJheU1hcE5vZGUucHJvdG90eXBlLml0ZXJhdGUgPSBmdW5jdGlvbiAoZm4sIHJldmVyc2UpIHtcbiAgICB2YXIgbm9kZXMgPSB0aGlzLm5vZGVzO1xuICAgIGZvciAodmFyIGlpID0gMCwgbWF4SW5kZXggPSBub2Rlcy5sZW5ndGggLSAxOyBpaSA8PSBtYXhJbmRleDsgaWkrKykge1xuICAgICAgdmFyIG5vZGUgPSBub2Rlc1tyZXZlcnNlID8gbWF4SW5kZXggLSBpaSA6IGlpXTtcbiAgICAgIGlmIChub2RlICYmIG5vZGUuaXRlcmF0ZShmbiwgcmV2ZXJzZSkgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBWYWx1ZU5vZGUucHJvdG90eXBlLml0ZXJhdGUgPSBmdW5jdGlvbiAoZm4sIHJldmVyc2UpIHtcbiAgICByZXR1cm4gZm4odGhpcy5lbnRyeSk7XG4gIH1cblxuICBjcmVhdGVDbGFzcyhNYXBJdGVyYXRvciwgc3JjX0l0ZXJhdG9yX19JdGVyYXRvcik7XG5cbiAgICBmdW5jdGlvbiBNYXBJdGVyYXRvcihtYXAsIHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIHRoaXMuX3R5cGUgPSB0eXBlO1xuICAgICAgdGhpcy5fcmV2ZXJzZSA9IHJldmVyc2U7XG4gICAgICB0aGlzLl9zdGFjayA9IG1hcC5fcm9vdCAmJiBtYXBJdGVyYXRvckZyYW1lKG1hcC5fcm9vdCk7XG4gICAgfVxuXG4gICAgTWFwSXRlcmF0b3IucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB0eXBlID0gdGhpcy5fdHlwZTtcbiAgICAgIHZhciBzdGFjayA9IHRoaXMuX3N0YWNrO1xuICAgICAgd2hpbGUgKHN0YWNrKSB7XG4gICAgICAgIHZhciBub2RlID0gc3RhY2subm9kZTtcbiAgICAgICAgdmFyIGluZGV4ID0gc3RhY2suaW5kZXgrKztcbiAgICAgICAgdmFyIG1heEluZGV4O1xuICAgICAgICBpZiAobm9kZS5lbnRyeSkge1xuICAgICAgICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG1hcEl0ZXJhdG9yVmFsdWUodHlwZSwgbm9kZS5lbnRyeSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKG5vZGUuZW50cmllcykge1xuICAgICAgICAgIG1heEluZGV4ID0gbm9kZS5lbnRyaWVzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgaWYgKGluZGV4IDw9IG1heEluZGV4KSB7XG4gICAgICAgICAgICByZXR1cm4gbWFwSXRlcmF0b3JWYWx1ZSh0eXBlLCBub2RlLmVudHJpZXNbdGhpcy5fcmV2ZXJzZSA/IG1heEluZGV4IC0gaW5kZXggOiBpbmRleF0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtYXhJbmRleCA9IG5vZGUubm9kZXMubGVuZ3RoIC0gMTtcbiAgICAgICAgICBpZiAoaW5kZXggPD0gbWF4SW5kZXgpIHtcbiAgICAgICAgICAgIHZhciBzdWJOb2RlID0gbm9kZS5ub2Rlc1t0aGlzLl9yZXZlcnNlID8gbWF4SW5kZXggLSBpbmRleCA6IGluZGV4XTtcbiAgICAgICAgICAgIGlmIChzdWJOb2RlKSB7XG4gICAgICAgICAgICAgIGlmIChzdWJOb2RlLmVudHJ5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcEl0ZXJhdG9yVmFsdWUodHlwZSwgc3ViTm9kZS5lbnRyeSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc3RhY2sgPSB0aGlzLl9zdGFjayA9IG1hcEl0ZXJhdG9yRnJhbWUoc3ViTm9kZSwgc3RhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN0YWNrID0gdGhpcy5fc3RhY2sgPSB0aGlzLl9zdGFjay5fX3ByZXY7XG4gICAgICB9XG4gICAgICByZXR1cm4gaXRlcmF0b3JEb25lKCk7XG4gICAgfTtcblxuXG4gIGZ1bmN0aW9uIG1hcEl0ZXJhdG9yVmFsdWUodHlwZSwgZW50cnkpIHtcbiAgICByZXR1cm4gaXRlcmF0b3JWYWx1ZSh0eXBlLCBlbnRyeVswXSwgZW50cnlbMV0pO1xuICB9XG5cbiAgZnVuY3Rpb24gbWFwSXRlcmF0b3JGcmFtZShub2RlLCBwcmV2KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5vZGU6IG5vZGUsXG4gICAgICBpbmRleDogMCxcbiAgICAgIF9fcHJldjogcHJldlxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBtYWtlTWFwKHNpemUsIHJvb3QsIG93bmVySUQsIGhhc2gpIHtcbiAgICB2YXIgbWFwID0gT2JqZWN0LmNyZWF0ZShNYXBQcm90b3R5cGUpO1xuICAgIG1hcC5zaXplID0gc2l6ZTtcbiAgICBtYXAuX3Jvb3QgPSByb290O1xuICAgIG1hcC5fX293bmVySUQgPSBvd25lcklEO1xuICAgIG1hcC5fX2hhc2ggPSBoYXNoO1xuICAgIG1hcC5fX2FsdGVyZWQgPSBmYWxzZTtcbiAgICByZXR1cm4gbWFwO1xuICB9XG5cbiAgdmFyIEVNUFRZX01BUDtcbiAgZnVuY3Rpb24gZW1wdHlNYXAoKSB7XG4gICAgcmV0dXJuIEVNUFRZX01BUCB8fCAoRU1QVFlfTUFQID0gbWFrZU1hcCgwKSk7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVNYXAobWFwLCBrLCB2KSB7XG4gICAgdmFyIG5ld1Jvb3Q7XG4gICAgdmFyIG5ld1NpemU7XG4gICAgaWYgKCFtYXAuX3Jvb3QpIHtcbiAgICAgIGlmICh2ID09PSBOT1RfU0VUKSB7XG4gICAgICAgIHJldHVybiBtYXA7XG4gICAgICB9XG4gICAgICBuZXdTaXplID0gMTtcbiAgICAgIG5ld1Jvb3QgPSBuZXcgQXJyYXlNYXBOb2RlKG1hcC5fX293bmVySUQsIFtbaywgdl1dKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGRpZENoYW5nZVNpemUgPSBNYWtlUmVmKENIQU5HRV9MRU5HVEgpO1xuICAgICAgdmFyIGRpZEFsdGVyID0gTWFrZVJlZihESURfQUxURVIpO1xuICAgICAgbmV3Um9vdCA9IHVwZGF0ZU5vZGUobWFwLl9yb290LCBtYXAuX19vd25lcklELCAwLCB1bmRlZmluZWQsIGssIHYsIGRpZENoYW5nZVNpemUsIGRpZEFsdGVyKTtcbiAgICAgIGlmICghZGlkQWx0ZXIudmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG1hcDtcbiAgICAgIH1cbiAgICAgIG5ld1NpemUgPSBtYXAuc2l6ZSArIChkaWRDaGFuZ2VTaXplLnZhbHVlID8gdiA9PT0gTk9UX1NFVCA/IC0xIDogMSA6IDApO1xuICAgIH1cbiAgICBpZiAobWFwLl9fb3duZXJJRCkge1xuICAgICAgbWFwLnNpemUgPSBuZXdTaXplO1xuICAgICAgbWFwLl9yb290ID0gbmV3Um9vdDtcbiAgICAgIG1hcC5fX2hhc2ggPSB1bmRlZmluZWQ7XG4gICAgICBtYXAuX19hbHRlcmVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBtYXA7XG4gICAgfVxuICAgIHJldHVybiBuZXdSb290ID8gbWFrZU1hcChuZXdTaXplLCBuZXdSb290KSA6IGVtcHR5TWFwKCk7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVOb2RlKG5vZGUsIG93bmVySUQsIHNoaWZ0LCBrZXlIYXNoLCBrZXksIHZhbHVlLCBkaWRDaGFuZ2VTaXplLCBkaWRBbHRlcikge1xuICAgIGlmICghbm9kZSkge1xuICAgICAgaWYgKHZhbHVlID09PSBOT1RfU0VUKSB7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgICAgfVxuICAgICAgU2V0UmVmKGRpZEFsdGVyKTtcbiAgICAgIFNldFJlZihkaWRDaGFuZ2VTaXplKTtcbiAgICAgIHJldHVybiBuZXcgVmFsdWVOb2RlKG93bmVySUQsIGtleUhhc2gsIFtrZXksIHZhbHVlXSk7XG4gICAgfVxuICAgIHJldHVybiBub2RlLnVwZGF0ZShvd25lcklELCBzaGlmdCwga2V5SGFzaCwga2V5LCB2YWx1ZSwgZGlkQ2hhbmdlU2l6ZSwgZGlkQWx0ZXIpO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNMZWFmTm9kZShub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUuY29uc3RydWN0b3IgPT09IFZhbHVlTm9kZSB8fCBub2RlLmNvbnN0cnVjdG9yID09PSBIYXNoQ29sbGlzaW9uTm9kZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1lcmdlSW50b05vZGUobm9kZSwgb3duZXJJRCwgc2hpZnQsIGtleUhhc2gsIGVudHJ5KSB7XG4gICAgaWYgKG5vZGUua2V5SGFzaCA9PT0ga2V5SGFzaCkge1xuICAgICAgcmV0dXJuIG5ldyBIYXNoQ29sbGlzaW9uTm9kZShvd25lcklELCBrZXlIYXNoLCBbbm9kZS5lbnRyeSwgZW50cnldKTtcbiAgICB9XG5cbiAgICB2YXIgaWR4MSA9IChzaGlmdCA9PT0gMCA/IG5vZGUua2V5SGFzaCA6IG5vZGUua2V5SGFzaCA+Pj4gc2hpZnQpICYgTUFTSztcbiAgICB2YXIgaWR4MiA9IChzaGlmdCA9PT0gMCA/IGtleUhhc2ggOiBrZXlIYXNoID4+PiBzaGlmdCkgJiBNQVNLO1xuXG4gICAgdmFyIG5ld05vZGU7XG4gICAgdmFyIG5vZGVzID0gaWR4MSA9PT0gaWR4MiA/XG4gICAgICBbbWVyZ2VJbnRvTm9kZShub2RlLCBvd25lcklELCBzaGlmdCArIFNISUZULCBrZXlIYXNoLCBlbnRyeSldIDpcbiAgICAgICgobmV3Tm9kZSA9IG5ldyBWYWx1ZU5vZGUob3duZXJJRCwga2V5SGFzaCwgZW50cnkpKSwgaWR4MSA8IGlkeDIgPyBbbm9kZSwgbmV3Tm9kZV0gOiBbbmV3Tm9kZSwgbm9kZV0pO1xuXG4gICAgcmV0dXJuIG5ldyBCaXRtYXBJbmRleGVkTm9kZShvd25lcklELCAoMSA8PCBpZHgxKSB8ICgxIDw8IGlkeDIpLCBub2Rlcyk7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVOb2Rlcyhvd25lcklELCBlbnRyaWVzLCBrZXksIHZhbHVlKSB7XG4gICAgaWYgKCFvd25lcklEKSB7XG4gICAgICBvd25lcklEID0gbmV3IE93bmVySUQoKTtcbiAgICB9XG4gICAgdmFyIG5vZGUgPSBuZXcgVmFsdWVOb2RlKG93bmVySUQsIGhhc2goa2V5KSwgW2tleSwgdmFsdWVdKTtcbiAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgZW50cmllcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgIHZhciBlbnRyeSA9IGVudHJpZXNbaWldO1xuICAgICAgbm9kZSA9IG5vZGUudXBkYXRlKG93bmVySUQsIDAsIHVuZGVmaW5lZCwgZW50cnlbMF0sIGVudHJ5WzFdKTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cblxuICBmdW5jdGlvbiBwYWNrTm9kZXMob3duZXJJRCwgbm9kZXMsIGNvdW50LCBleGNsdWRpbmcpIHtcbiAgICB2YXIgYml0bWFwID0gMDtcbiAgICB2YXIgcGFja2VkSUkgPSAwO1xuICAgIHZhciBwYWNrZWROb2RlcyA9IG5ldyBBcnJheShjb3VudCk7XG4gICAgZm9yICh2YXIgaWkgPSAwLCBiaXQgPSAxLCBsZW4gPSBub2Rlcy5sZW5ndGg7IGlpIDwgbGVuOyBpaSsrLCBiaXQgPDw9IDEpIHtcbiAgICAgIHZhciBub2RlID0gbm9kZXNbaWldO1xuICAgICAgaWYgKG5vZGUgIT09IHVuZGVmaW5lZCAmJiBpaSAhPT0gZXhjbHVkaW5nKSB7XG4gICAgICAgIGJpdG1hcCB8PSBiaXQ7XG4gICAgICAgIHBhY2tlZE5vZGVzW3BhY2tlZElJKytdID0gbm9kZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5ldyBCaXRtYXBJbmRleGVkTm9kZShvd25lcklELCBiaXRtYXAsIHBhY2tlZE5vZGVzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGV4cGFuZE5vZGVzKG93bmVySUQsIG5vZGVzLCBiaXRtYXAsIGluY2x1ZGluZywgbm9kZSkge1xuICAgIHZhciBjb3VudCA9IDA7XG4gICAgdmFyIGV4cGFuZGVkTm9kZXMgPSBuZXcgQXJyYXkoU0laRSk7XG4gICAgZm9yICh2YXIgaWkgPSAwOyBiaXRtYXAgIT09IDA7IGlpKyssIGJpdG1hcCA+Pj49IDEpIHtcbiAgICAgIGV4cGFuZGVkTm9kZXNbaWldID0gYml0bWFwICYgMSA/IG5vZGVzW2NvdW50KytdIDogdW5kZWZpbmVkO1xuICAgIH1cbiAgICBleHBhbmRlZE5vZGVzW2luY2x1ZGluZ10gPSBub2RlO1xuICAgIHJldHVybiBuZXcgSGFzaEFycmF5TWFwTm9kZShvd25lcklELCBjb3VudCArIDEsIGV4cGFuZGVkTm9kZXMpO1xuICB9XG5cbiAgZnVuY3Rpb24gbWVyZ2VJbnRvTWFwV2l0aChtYXAsIG1lcmdlciwgaXRlcmFibGVzKSB7XG4gICAgdmFyIGl0ZXJzID0gW107XG4gICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IGl0ZXJhYmxlcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgIHZhciB2YWx1ZSA9IGl0ZXJhYmxlc1tpaV07XG4gICAgICB2YXIgaXRlciA9IEtleWVkSXRlcmFibGUodmFsdWUpO1xuICAgICAgaWYgKCFpc0l0ZXJhYmxlKHZhbHVlKSkge1xuICAgICAgICBpdGVyID0gaXRlci5tYXAoZnVuY3Rpb24odiApIHtyZXR1cm4gZnJvbUpTKHYpfSk7XG4gICAgICB9XG4gICAgICBpdGVycy5wdXNoKGl0ZXIpO1xuICAgIH1cbiAgICByZXR1cm4gbWVyZ2VJbnRvQ29sbGVjdGlvbldpdGgobWFwLCBtZXJnZXIsIGl0ZXJzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZXBNZXJnZXIobWVyZ2VyKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGV4aXN0aW5nLCB2YWx1ZSwga2V5KSBcbiAgICAgIHtyZXR1cm4gZXhpc3RpbmcgJiYgZXhpc3RpbmcubWVyZ2VEZWVwV2l0aCAmJiBpc0l0ZXJhYmxlKHZhbHVlKSA/XG4gICAgICAgIGV4aXN0aW5nLm1lcmdlRGVlcFdpdGgobWVyZ2VyLCB2YWx1ZSkgOlxuICAgICAgICBtZXJnZXIgPyBtZXJnZXIoZXhpc3RpbmcsIHZhbHVlLCBrZXkpIDogdmFsdWV9O1xuICB9XG5cbiAgZnVuY3Rpb24gbWVyZ2VJbnRvQ29sbGVjdGlvbldpdGgoY29sbGVjdGlvbiwgbWVyZ2VyLCBpdGVycykge1xuICAgIGl0ZXJzID0gaXRlcnMuZmlsdGVyKGZ1bmN0aW9uKHggKSB7cmV0dXJuIHguc2l6ZSAhPT0gMH0pO1xuICAgIGlmIChpdGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICAgIH1cbiAgICBpZiAoY29sbGVjdGlvbi5zaXplID09PSAwICYmICFjb2xsZWN0aW9uLl9fb3duZXJJRCAmJiBpdGVycy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHJldHVybiBjb2xsZWN0aW9uLmNvbnN0cnVjdG9yKGl0ZXJzWzBdKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24ud2l0aE11dGF0aW9ucyhmdW5jdGlvbihjb2xsZWN0aW9uICkge1xuICAgICAgdmFyIG1lcmdlSW50b01hcCA9IG1lcmdlciA/XG4gICAgICAgIGZ1bmN0aW9uKHZhbHVlLCBrZXkpICB7XG4gICAgICAgICAgY29sbGVjdGlvbi51cGRhdGUoa2V5LCBOT1RfU0VULCBmdW5jdGlvbihleGlzdGluZyApXG4gICAgICAgICAgICB7cmV0dXJuIGV4aXN0aW5nID09PSBOT1RfU0VUID8gdmFsdWUgOiBtZXJnZXIoZXhpc3RpbmcsIHZhbHVlLCBrZXkpfVxuICAgICAgICAgICk7XG4gICAgICAgIH0gOlxuICAgICAgICBmdW5jdGlvbih2YWx1ZSwga2V5KSAge1xuICAgICAgICAgIGNvbGxlY3Rpb24uc2V0KGtleSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgaXRlcnMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgIGl0ZXJzW2lpXS5mb3JFYWNoKG1lcmdlSW50b01hcCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVJbkRlZXBNYXAoZXhpc3RpbmcsIGtleVBhdGhJdGVyLCBub3RTZXRWYWx1ZSwgdXBkYXRlcikge1xuICAgIHZhciBpc05vdFNldCA9IGV4aXN0aW5nID09PSBOT1RfU0VUO1xuICAgIHZhciBzdGVwID0ga2V5UGF0aEl0ZXIubmV4dCgpO1xuICAgIGlmIChzdGVwLmRvbmUpIHtcbiAgICAgIHZhciBleGlzdGluZ1ZhbHVlID0gaXNOb3RTZXQgPyBub3RTZXRWYWx1ZSA6IGV4aXN0aW5nO1xuICAgICAgdmFyIG5ld1ZhbHVlID0gdXBkYXRlcihleGlzdGluZ1ZhbHVlKTtcbiAgICAgIHJldHVybiBuZXdWYWx1ZSA9PT0gZXhpc3RpbmdWYWx1ZSA/IGV4aXN0aW5nIDogbmV3VmFsdWU7XG4gICAgfVxuICAgIGludmFyaWFudChcbiAgICAgIGlzTm90U2V0IHx8IChleGlzdGluZyAmJiBleGlzdGluZy5zZXQpLFxuICAgICAgJ2ludmFsaWQga2V5UGF0aCdcbiAgICApO1xuICAgIHZhciBrZXkgPSBzdGVwLnZhbHVlO1xuICAgIHZhciBuZXh0RXhpc3RpbmcgPSBpc05vdFNldCA/IE5PVF9TRVQgOiBleGlzdGluZy5nZXQoa2V5LCBOT1RfU0VUKTtcbiAgICB2YXIgbmV4dFVwZGF0ZWQgPSB1cGRhdGVJbkRlZXBNYXAoXG4gICAgICBuZXh0RXhpc3RpbmcsXG4gICAgICBrZXlQYXRoSXRlcixcbiAgICAgIG5vdFNldFZhbHVlLFxuICAgICAgdXBkYXRlclxuICAgICk7XG4gICAgcmV0dXJuIG5leHRVcGRhdGVkID09PSBuZXh0RXhpc3RpbmcgPyBleGlzdGluZyA6XG4gICAgICBuZXh0VXBkYXRlZCA9PT0gTk9UX1NFVCA/IGV4aXN0aW5nLnJlbW92ZShrZXkpIDpcbiAgICAgIChpc05vdFNldCA/IGVtcHR5TWFwKCkgOiBleGlzdGluZykuc2V0KGtleSwgbmV4dFVwZGF0ZWQpO1xuICB9XG5cbiAgZnVuY3Rpb24gcG9wQ291bnQoeCkge1xuICAgIHggPSB4IC0gKCh4ID4+IDEpICYgMHg1NTU1NTU1NSk7XG4gICAgeCA9ICh4ICYgMHgzMzMzMzMzMykgKyAoKHggPj4gMikgJiAweDMzMzMzMzMzKTtcbiAgICB4ID0gKHggKyAoeCA+PiA0KSkgJiAweDBmMGYwZjBmO1xuICAgIHggPSB4ICsgKHggPj4gOCk7XG4gICAgeCA9IHggKyAoeCA+PiAxNik7XG4gICAgcmV0dXJuIHggJiAweDdmO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0SW4oYXJyYXksIGlkeCwgdmFsLCBjYW5FZGl0KSB7XG4gICAgdmFyIG5ld0FycmF5ID0gY2FuRWRpdCA/IGFycmF5IDogYXJyQ29weShhcnJheSk7XG4gICAgbmV3QXJyYXlbaWR4XSA9IHZhbDtcbiAgICByZXR1cm4gbmV3QXJyYXk7XG4gIH1cblxuICBmdW5jdGlvbiBzcGxpY2VJbihhcnJheSwgaWR4LCB2YWwsIGNhbkVkaXQpIHtcbiAgICB2YXIgbmV3TGVuID0gYXJyYXkubGVuZ3RoICsgMTtcbiAgICBpZiAoY2FuRWRpdCAmJiBpZHggKyAxID09PSBuZXdMZW4pIHtcbiAgICAgIGFycmF5W2lkeF0gPSB2YWw7XG4gICAgICByZXR1cm4gYXJyYXk7XG4gICAgfVxuICAgIHZhciBuZXdBcnJheSA9IG5ldyBBcnJheShuZXdMZW4pO1xuICAgIHZhciBhZnRlciA9IDA7XG4gICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IG5ld0xlbjsgaWkrKykge1xuICAgICAgaWYgKGlpID09PSBpZHgpIHtcbiAgICAgICAgbmV3QXJyYXlbaWldID0gdmFsO1xuICAgICAgICBhZnRlciA9IC0xO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3QXJyYXlbaWldID0gYXJyYXlbaWkgKyBhZnRlcl07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBuZXdBcnJheTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNwbGljZU91dChhcnJheSwgaWR4LCBjYW5FZGl0KSB7XG4gICAgdmFyIG5ld0xlbiA9IGFycmF5Lmxlbmd0aCAtIDE7XG4gICAgaWYgKGNhbkVkaXQgJiYgaWR4ID09PSBuZXdMZW4pIHtcbiAgICAgIGFycmF5LnBvcCgpO1xuICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cbiAgICB2YXIgbmV3QXJyYXkgPSBuZXcgQXJyYXkobmV3TGVuKTtcbiAgICB2YXIgYWZ0ZXIgPSAwO1xuICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCBuZXdMZW47IGlpKyspIHtcbiAgICAgIGlmIChpaSA9PT0gaWR4KSB7XG4gICAgICAgIGFmdGVyID0gMTtcbiAgICAgIH1cbiAgICAgIG5ld0FycmF5W2lpXSA9IGFycmF5W2lpICsgYWZ0ZXJdO1xuICAgIH1cbiAgICByZXR1cm4gbmV3QXJyYXk7XG4gIH1cblxuICB2YXIgTUFYX0FSUkFZX01BUF9TSVpFID0gU0laRSAvIDQ7XG4gIHZhciBNQVhfQklUTUFQX0lOREVYRURfU0laRSA9IFNJWkUgLyAyO1xuICB2YXIgTUlOX0hBU0hfQVJSQVlfTUFQX1NJWkUgPSBTSVpFIC8gNDtcblxuICBjcmVhdGVDbGFzcyhMaXN0LCBJbmRleGVkQ29sbGVjdGlvbik7XG5cbiAgICAvLyBAcHJhZ21hIENvbnN0cnVjdGlvblxuXG4gICAgZnVuY3Rpb24gTGlzdCh2YWx1ZSkge1xuICAgICAgdmFyIGVtcHR5ID0gZW1wdHlMaXN0KCk7XG4gICAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gZW1wdHk7XG4gICAgICB9XG4gICAgICBpZiAoaXNMaXN0KHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9XG4gICAgICB2YXIgaXRlciA9IEluZGV4ZWRJdGVyYWJsZSh2YWx1ZSk7XG4gICAgICB2YXIgc2l6ZSA9IGl0ZXIuc2l6ZTtcbiAgICAgIGlmIChzaXplID09PSAwKSB7XG4gICAgICAgIHJldHVybiBlbXB0eTtcbiAgICAgIH1cbiAgICAgIGFzc2VydE5vdEluZmluaXRlKHNpemUpO1xuICAgICAgaWYgKHNpemUgPiAwICYmIHNpemUgPCBTSVpFKSB7XG4gICAgICAgIHJldHVybiBtYWtlTGlzdCgwLCBzaXplLCBTSElGVCwgbnVsbCwgbmV3IFZOb2RlKGl0ZXIudG9BcnJheSgpKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZW1wdHkud2l0aE11dGF0aW9ucyhmdW5jdGlvbihsaXN0ICkge1xuICAgICAgICBsaXN0LnNldFNpemUoc2l6ZSk7XG4gICAgICAgIGl0ZXIuZm9yRWFjaChmdW5jdGlvbih2LCBpKSAge3JldHVybiBsaXN0LnNldChpLCB2KX0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgTGlzdC5vZiA9IGZ1bmN0aW9uKC8qLi4udmFsdWVzKi8pIHtcbiAgICAgIHJldHVybiB0aGlzKGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICAgIExpc3QucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX3RvU3RyaW5nKCdMaXN0IFsnLCAnXScpO1xuICAgIH07XG5cbiAgICAvLyBAcHJhZ21hIEFjY2Vzc1xuXG4gICAgTGlzdC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oaW5kZXgsIG5vdFNldFZhbHVlKSB7XG4gICAgICBpbmRleCA9IHdyYXBJbmRleCh0aGlzLCBpbmRleCk7XG4gICAgICBpZiAoaW5kZXggPCAwIHx8IGluZGV4ID49IHRoaXMuc2l6ZSkge1xuICAgICAgICByZXR1cm4gbm90U2V0VmFsdWU7XG4gICAgICB9XG4gICAgICBpbmRleCArPSB0aGlzLl9vcmlnaW47XG4gICAgICB2YXIgbm9kZSA9IGxpc3ROb2RlRm9yKHRoaXMsIGluZGV4KTtcbiAgICAgIHJldHVybiBub2RlICYmIG5vZGUuYXJyYXlbaW5kZXggJiBNQVNLXTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBNb2RpZmljYXRpb25cblxuICAgIExpc3QucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKGluZGV4LCB2YWx1ZSkge1xuICAgICAgcmV0dXJuIHVwZGF0ZUxpc3QodGhpcywgaW5kZXgsIHZhbHVlKTtcbiAgICB9O1xuXG4gICAgTGlzdC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgIHJldHVybiAhdGhpcy5oYXMoaW5kZXgpID8gdGhpcyA6XG4gICAgICAgIGluZGV4ID09PSAwID8gdGhpcy5zaGlmdCgpIDpcbiAgICAgICAgaW5kZXggPT09IHRoaXMuc2l6ZSAtIDEgPyB0aGlzLnBvcCgpIDpcbiAgICAgICAgdGhpcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH07XG5cbiAgICBMaXN0LnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuc2l6ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9fb3duZXJJRCkge1xuICAgICAgICB0aGlzLnNpemUgPSB0aGlzLl9vcmlnaW4gPSB0aGlzLl9jYXBhY2l0eSA9IDA7XG4gICAgICAgIHRoaXMuX2xldmVsID0gU0hJRlQ7XG4gICAgICAgIHRoaXMuX3Jvb3QgPSB0aGlzLl90YWlsID0gbnVsbDtcbiAgICAgICAgdGhpcy5fX2hhc2ggPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX19hbHRlcmVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gZW1wdHlMaXN0KCk7XG4gICAgfTtcblxuICAgIExpc3QucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbigvKi4uLnZhbHVlcyovKSB7XG4gICAgICB2YXIgdmFsdWVzID0gYXJndW1lbnRzO1xuICAgICAgdmFyIG9sZFNpemUgPSB0aGlzLnNpemU7XG4gICAgICByZXR1cm4gdGhpcy53aXRoTXV0YXRpb25zKGZ1bmN0aW9uKGxpc3QgKSB7XG4gICAgICAgIHNldExpc3RCb3VuZHMobGlzdCwgMCwgb2xkU2l6ZSArIHZhbHVlcy5sZW5ndGgpO1xuICAgICAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgdmFsdWVzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgIGxpc3Quc2V0KG9sZFNpemUgKyBpaSwgdmFsdWVzW2lpXSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBMaXN0LnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBzZXRMaXN0Qm91bmRzKHRoaXMsIDAsIC0xKTtcbiAgICB9O1xuXG4gICAgTGlzdC5wcm90b3R5cGUudW5zaGlmdCA9IGZ1bmN0aW9uKC8qLi4udmFsdWVzKi8pIHtcbiAgICAgIHZhciB2YWx1ZXMgPSBhcmd1bWVudHM7XG4gICAgICByZXR1cm4gdGhpcy53aXRoTXV0YXRpb25zKGZ1bmN0aW9uKGxpc3QgKSB7XG4gICAgICAgIHNldExpc3RCb3VuZHMobGlzdCwgLXZhbHVlcy5sZW5ndGgpO1xuICAgICAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgdmFsdWVzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgIGxpc3Quc2V0KGlpLCB2YWx1ZXNbaWldKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIExpc3QucHJvdG90eXBlLnNoaWZ0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gc2V0TGlzdEJvdW5kcyh0aGlzLCAxKTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBDb21wb3NpdGlvblxuXG4gICAgTGlzdC5wcm90b3R5cGUubWVyZ2UgPSBmdW5jdGlvbigvKi4uLml0ZXJzKi8pIHtcbiAgICAgIHJldHVybiBtZXJnZUludG9MaXN0V2l0aCh0aGlzLCB1bmRlZmluZWQsIGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICAgIExpc3QucHJvdG90eXBlLm1lcmdlV2l0aCA9IGZ1bmN0aW9uKG1lcmdlcikge3ZhciBpdGVycyA9IFNMSUNFJDAuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgcmV0dXJuIG1lcmdlSW50b0xpc3RXaXRoKHRoaXMsIG1lcmdlciwgaXRlcnMpO1xuICAgIH07XG5cbiAgICBMaXN0LnByb3RvdHlwZS5tZXJnZURlZXAgPSBmdW5jdGlvbigvKi4uLml0ZXJzKi8pIHtcbiAgICAgIHJldHVybiBtZXJnZUludG9MaXN0V2l0aCh0aGlzLCBkZWVwTWVyZ2VyKHVuZGVmaW5lZCksIGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICAgIExpc3QucHJvdG90eXBlLm1lcmdlRGVlcFdpdGggPSBmdW5jdGlvbihtZXJnZXIpIHt2YXIgaXRlcnMgPSBTTElDRSQwLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgIHJldHVybiBtZXJnZUludG9MaXN0V2l0aCh0aGlzLCBkZWVwTWVyZ2VyKG1lcmdlciksIGl0ZXJzKTtcbiAgICB9O1xuXG4gICAgTGlzdC5wcm90b3R5cGUuc2V0U2l6ZSA9IGZ1bmN0aW9uKHNpemUpIHtcbiAgICAgIHJldHVybiBzZXRMaXN0Qm91bmRzKHRoaXMsIDAsIHNpemUpO1xuICAgIH07XG5cbiAgICAvLyBAcHJhZ21hIEl0ZXJhdGlvblxuXG4gICAgTGlzdC5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbihiZWdpbiwgZW5kKSB7XG4gICAgICB2YXIgc2l6ZSA9IHRoaXMuc2l6ZTtcbiAgICAgIGlmICh3aG9sZVNsaWNlKGJlZ2luLCBlbmQsIHNpemUpKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNldExpc3RCb3VuZHMoXG4gICAgICAgIHRoaXMsXG4gICAgICAgIHJlc29sdmVCZWdpbihiZWdpbiwgc2l6ZSksXG4gICAgICAgIHJlc29sdmVFbmQoZW5kLCBzaXplKVxuICAgICAgKTtcbiAgICB9O1xuXG4gICAgTGlzdC5wcm90b3R5cGUuX19pdGVyYXRvciA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIHZhciBpbmRleCA9IDA7XG4gICAgICB2YXIgdmFsdWVzID0gaXRlcmF0ZUxpc3QodGhpcywgcmV2ZXJzZSk7XG4gICAgICByZXR1cm4gbmV3IHNyY19JdGVyYXRvcl9fSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICB2YXIgdmFsdWUgPSB2YWx1ZXMoKTtcbiAgICAgICAgcmV0dXJuIHZhbHVlID09PSBET05FID9cbiAgICAgICAgICBpdGVyYXRvckRvbmUoKSA6XG4gICAgICAgICAgaXRlcmF0b3JWYWx1ZSh0eXBlLCBpbmRleCsrLCB2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgTGlzdC5wcm90b3R5cGUuX19pdGVyYXRlID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHtcbiAgICAgIHZhciBpbmRleCA9IDA7XG4gICAgICB2YXIgdmFsdWVzID0gaXRlcmF0ZUxpc3QodGhpcywgcmV2ZXJzZSk7XG4gICAgICB2YXIgdmFsdWU7XG4gICAgICB3aGlsZSAoKHZhbHVlID0gdmFsdWVzKCkpICE9PSBET05FKSB7XG4gICAgICAgIGlmIChmbih2YWx1ZSwgaW5kZXgrKywgdGhpcykgPT09IGZhbHNlKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBpbmRleDtcbiAgICB9O1xuXG4gICAgTGlzdC5wcm90b3R5cGUuX19lbnN1cmVPd25lciA9IGZ1bmN0aW9uKG93bmVySUQpIHtcbiAgICAgIGlmIChvd25lcklEID09PSB0aGlzLl9fb3duZXJJRCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIGlmICghb3duZXJJRCkge1xuICAgICAgICB0aGlzLl9fb3duZXJJRCA9IG93bmVySUQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1ha2VMaXN0KHRoaXMuX29yaWdpbiwgdGhpcy5fY2FwYWNpdHksIHRoaXMuX2xldmVsLCB0aGlzLl9yb290LCB0aGlzLl90YWlsLCBvd25lcklELCB0aGlzLl9faGFzaCk7XG4gICAgfTtcblxuXG4gIGZ1bmN0aW9uIGlzTGlzdChtYXliZUxpc3QpIHtcbiAgICByZXR1cm4gISEobWF5YmVMaXN0ICYmIG1heWJlTGlzdFtJU19MSVNUX1NFTlRJTkVMXSk7XG4gIH1cblxuICBMaXN0LmlzTGlzdCA9IGlzTGlzdDtcblxuICB2YXIgSVNfTElTVF9TRU5USU5FTCA9ICdAQF9fSU1NVVRBQkxFX0xJU1RfX0BAJztcblxuICB2YXIgTGlzdFByb3RvdHlwZSA9IExpc3QucHJvdG90eXBlO1xuICBMaXN0UHJvdG90eXBlW0lTX0xJU1RfU0VOVElORUxdID0gdHJ1ZTtcbiAgTGlzdFByb3RvdHlwZVtERUxFVEVdID0gTGlzdFByb3RvdHlwZS5yZW1vdmU7XG4gIExpc3RQcm90b3R5cGUuc2V0SW4gPSBNYXBQcm90b3R5cGUuc2V0SW47XG4gIExpc3RQcm90b3R5cGUuZGVsZXRlSW4gPVxuICBMaXN0UHJvdG90eXBlLnJlbW92ZUluID0gTWFwUHJvdG90eXBlLnJlbW92ZUluO1xuICBMaXN0UHJvdG90eXBlLnVwZGF0ZSA9IE1hcFByb3RvdHlwZS51cGRhdGU7XG4gIExpc3RQcm90b3R5cGUudXBkYXRlSW4gPSBNYXBQcm90b3R5cGUudXBkYXRlSW47XG4gIExpc3RQcm90b3R5cGUubWVyZ2VJbiA9IE1hcFByb3RvdHlwZS5tZXJnZUluO1xuICBMaXN0UHJvdG90eXBlLm1lcmdlRGVlcEluID0gTWFwUHJvdG90eXBlLm1lcmdlRGVlcEluO1xuICBMaXN0UHJvdG90eXBlLndpdGhNdXRhdGlvbnMgPSBNYXBQcm90b3R5cGUud2l0aE11dGF0aW9ucztcbiAgTGlzdFByb3RvdHlwZS5hc011dGFibGUgPSBNYXBQcm90b3R5cGUuYXNNdXRhYmxlO1xuICBMaXN0UHJvdG90eXBlLmFzSW1tdXRhYmxlID0gTWFwUHJvdG90eXBlLmFzSW1tdXRhYmxlO1xuICBMaXN0UHJvdG90eXBlLndhc0FsdGVyZWQgPSBNYXBQcm90b3R5cGUud2FzQWx0ZXJlZDtcblxuXG5cbiAgICBmdW5jdGlvbiBWTm9kZShhcnJheSwgb3duZXJJRCkge1xuICAgICAgdGhpcy5hcnJheSA9IGFycmF5O1xuICAgICAgdGhpcy5vd25lcklEID0gb3duZXJJRDtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBzZWVtcyBsaWtlIHRoZXNlIG1ldGhvZHMgYXJlIHZlcnkgc2ltaWxhclxuXG4gICAgVk5vZGUucHJvdG90eXBlLnJlbW92ZUJlZm9yZSA9IGZ1bmN0aW9uKG93bmVySUQsIGxldmVsLCBpbmRleCkge1xuICAgICAgaWYgKGluZGV4ID09PSBsZXZlbCA/IDEgPDwgbGV2ZWwgOiAwIHx8IHRoaXMuYXJyYXkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgdmFyIG9yaWdpbkluZGV4ID0gKGluZGV4ID4+PiBsZXZlbCkgJiBNQVNLO1xuICAgICAgaWYgKG9yaWdpbkluZGV4ID49IHRoaXMuYXJyYXkubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBuZXcgVk5vZGUoW10sIG93bmVySUQpO1xuICAgICAgfVxuICAgICAgdmFyIHJlbW92aW5nRmlyc3QgPSBvcmlnaW5JbmRleCA9PT0gMDtcbiAgICAgIHZhciBuZXdDaGlsZDtcbiAgICAgIGlmIChsZXZlbCA+IDApIHtcbiAgICAgICAgdmFyIG9sZENoaWxkID0gdGhpcy5hcnJheVtvcmlnaW5JbmRleF07XG4gICAgICAgIG5ld0NoaWxkID0gb2xkQ2hpbGQgJiYgb2xkQ2hpbGQucmVtb3ZlQmVmb3JlKG93bmVySUQsIGxldmVsIC0gU0hJRlQsIGluZGV4KTtcbiAgICAgICAgaWYgKG5ld0NoaWxkID09PSBvbGRDaGlsZCAmJiByZW1vdmluZ0ZpcnN0KSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChyZW1vdmluZ0ZpcnN0ICYmICFuZXdDaGlsZCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHZhciBlZGl0YWJsZSA9IGVkaXRhYmxlVk5vZGUodGhpcywgb3duZXJJRCk7XG4gICAgICBpZiAoIXJlbW92aW5nRmlyc3QpIHtcbiAgICAgICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IG9yaWdpbkluZGV4OyBpaSsrKSB7XG4gICAgICAgICAgZWRpdGFibGUuYXJyYXlbaWldID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAobmV3Q2hpbGQpIHtcbiAgICAgICAgZWRpdGFibGUuYXJyYXlbb3JpZ2luSW5kZXhdID0gbmV3Q2hpbGQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gZWRpdGFibGU7XG4gICAgfTtcblxuICAgIFZOb2RlLnByb3RvdHlwZS5yZW1vdmVBZnRlciA9IGZ1bmN0aW9uKG93bmVySUQsIGxldmVsLCBpbmRleCkge1xuICAgICAgaWYgKGluZGV4ID09PSBsZXZlbCA/IDEgPDwgbGV2ZWwgOiAwIHx8IHRoaXMuYXJyYXkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgdmFyIHNpemVJbmRleCA9ICgoaW5kZXggLSAxKSA+Pj4gbGV2ZWwpICYgTUFTSztcbiAgICAgIGlmIChzaXplSW5kZXggPj0gdGhpcy5hcnJheS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICB2YXIgcmVtb3ZpbmdMYXN0ID0gc2l6ZUluZGV4ID09PSB0aGlzLmFycmF5Lmxlbmd0aCAtIDE7XG4gICAgICB2YXIgbmV3Q2hpbGQ7XG4gICAgICBpZiAobGV2ZWwgPiAwKSB7XG4gICAgICAgIHZhciBvbGRDaGlsZCA9IHRoaXMuYXJyYXlbc2l6ZUluZGV4XTtcbiAgICAgICAgbmV3Q2hpbGQgPSBvbGRDaGlsZCAmJiBvbGRDaGlsZC5yZW1vdmVBZnRlcihvd25lcklELCBsZXZlbCAtIFNISUZULCBpbmRleCk7XG4gICAgICAgIGlmIChuZXdDaGlsZCA9PT0gb2xkQ2hpbGQgJiYgcmVtb3ZpbmdMYXN0KSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChyZW1vdmluZ0xhc3QgJiYgIW5ld0NoaWxkKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgdmFyIGVkaXRhYmxlID0gZWRpdGFibGVWTm9kZSh0aGlzLCBvd25lcklEKTtcbiAgICAgIGlmICghcmVtb3ZpbmdMYXN0KSB7XG4gICAgICAgIGVkaXRhYmxlLmFycmF5LnBvcCgpO1xuICAgICAgfVxuICAgICAgaWYgKG5ld0NoaWxkKSB7XG4gICAgICAgIGVkaXRhYmxlLmFycmF5W3NpemVJbmRleF0gPSBuZXdDaGlsZDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlZGl0YWJsZTtcbiAgICB9O1xuXG5cblxuICB2YXIgRE9ORSA9IHt9O1xuXG4gIGZ1bmN0aW9uIGl0ZXJhdGVMaXN0KGxpc3QsIHJldmVyc2UpIHtcbiAgICB2YXIgbGVmdCA9IGxpc3QuX29yaWdpbjtcbiAgICB2YXIgcmlnaHQgPSBsaXN0Ll9jYXBhY2l0eTtcbiAgICB2YXIgdGFpbFBvcyA9IGdldFRhaWxPZmZzZXQocmlnaHQpO1xuICAgIHZhciB0YWlsID0gbGlzdC5fdGFpbDtcblxuICAgIHJldHVybiBpdGVyYXRlTm9kZU9yTGVhZihsaXN0Ll9yb290LCBsaXN0Ll9sZXZlbCwgMCk7XG5cbiAgICBmdW5jdGlvbiBpdGVyYXRlTm9kZU9yTGVhZihub2RlLCBsZXZlbCwgb2Zmc2V0KSB7XG4gICAgICByZXR1cm4gbGV2ZWwgPT09IDAgP1xuICAgICAgICBpdGVyYXRlTGVhZihub2RlLCBvZmZzZXQpIDpcbiAgICAgICAgaXRlcmF0ZU5vZGUobm9kZSwgbGV2ZWwsIG9mZnNldCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXRlcmF0ZUxlYWYobm9kZSwgb2Zmc2V0KSB7XG4gICAgICB2YXIgYXJyYXkgPSBvZmZzZXQgPT09IHRhaWxQb3MgPyB0YWlsICYmIHRhaWwuYXJyYXkgOiBub2RlICYmIG5vZGUuYXJyYXk7XG4gICAgICB2YXIgZnJvbSA9IG9mZnNldCA+IGxlZnQgPyAwIDogbGVmdCAtIG9mZnNldDtcbiAgICAgIHZhciB0byA9IHJpZ2h0IC0gb2Zmc2V0O1xuICAgICAgaWYgKHRvID4gU0laRSkge1xuICAgICAgICB0byA9IFNJWkU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSAge1xuICAgICAgICBpZiAoZnJvbSA9PT0gdG8pIHtcbiAgICAgICAgICByZXR1cm4gRE9ORTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaWR4ID0gcmV2ZXJzZSA/IC0tdG8gOiBmcm9tKys7XG4gICAgICAgIHJldHVybiBhcnJheSAmJiBhcnJheVtpZHhdO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpdGVyYXRlTm9kZShub2RlLCBsZXZlbCwgb2Zmc2V0KSB7XG4gICAgICB2YXIgdmFsdWVzO1xuICAgICAgdmFyIGFycmF5ID0gbm9kZSAmJiBub2RlLmFycmF5O1xuICAgICAgdmFyIGZyb20gPSBvZmZzZXQgPiBsZWZ0ID8gMCA6IChsZWZ0IC0gb2Zmc2V0KSA+PiBsZXZlbDtcbiAgICAgIHZhciB0byA9ICgocmlnaHQgLSBvZmZzZXQpID4+IGxldmVsKSArIDE7XG4gICAgICBpZiAodG8gPiBTSVpFKSB7XG4gICAgICAgIHRvID0gU0laRTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmdW5jdGlvbigpICB7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICBpZiAodmFsdWVzKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB2YWx1ZXMoKTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gRE9ORSkge1xuICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YWx1ZXMgPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZnJvbSA9PT0gdG8pIHtcbiAgICAgICAgICAgIHJldHVybiBET05FO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgaWR4ID0gcmV2ZXJzZSA/IC0tdG8gOiBmcm9tKys7XG4gICAgICAgICAgdmFsdWVzID0gaXRlcmF0ZU5vZGVPckxlYWYoXG4gICAgICAgICAgICBhcnJheSAmJiBhcnJheVtpZHhdLCBsZXZlbCAtIFNISUZULCBvZmZzZXQgKyAoaWR4IDw8IGxldmVsKVxuICAgICAgICAgICk7XG4gICAgICAgIH0gd2hpbGUgKHRydWUpO1xuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBtYWtlTGlzdChvcmlnaW4sIGNhcGFjaXR5LCBsZXZlbCwgcm9vdCwgdGFpbCwgb3duZXJJRCwgaGFzaCkge1xuICAgIHZhciBsaXN0ID0gT2JqZWN0LmNyZWF0ZShMaXN0UHJvdG90eXBlKTtcbiAgICBsaXN0LnNpemUgPSBjYXBhY2l0eSAtIG9yaWdpbjtcbiAgICBsaXN0Ll9vcmlnaW4gPSBvcmlnaW47XG4gICAgbGlzdC5fY2FwYWNpdHkgPSBjYXBhY2l0eTtcbiAgICBsaXN0Ll9sZXZlbCA9IGxldmVsO1xuICAgIGxpc3QuX3Jvb3QgPSByb290O1xuICAgIGxpc3QuX3RhaWwgPSB0YWlsO1xuICAgIGxpc3QuX19vd25lcklEID0gb3duZXJJRDtcbiAgICBsaXN0Ll9faGFzaCA9IGhhc2g7XG4gICAgbGlzdC5fX2FsdGVyZWQgPSBmYWxzZTtcbiAgICByZXR1cm4gbGlzdDtcbiAgfVxuXG4gIHZhciBFTVBUWV9MSVNUO1xuICBmdW5jdGlvbiBlbXB0eUxpc3QoKSB7XG4gICAgcmV0dXJuIEVNUFRZX0xJU1QgfHwgKEVNUFRZX0xJU1QgPSBtYWtlTGlzdCgwLCAwLCBTSElGVCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlTGlzdChsaXN0LCBpbmRleCwgdmFsdWUpIHtcbiAgICBpbmRleCA9IHdyYXBJbmRleChsaXN0LCBpbmRleCk7XG5cbiAgICBpZiAoaW5kZXggPj0gbGlzdC5zaXplIHx8IGluZGV4IDwgMCkge1xuICAgICAgcmV0dXJuIGxpc3Qud2l0aE11dGF0aW9ucyhmdW5jdGlvbihsaXN0ICkge1xuICAgICAgICBpbmRleCA8IDAgP1xuICAgICAgICAgIHNldExpc3RCb3VuZHMobGlzdCwgaW5kZXgpLnNldCgwLCB2YWx1ZSkgOlxuICAgICAgICAgIHNldExpc3RCb3VuZHMobGlzdCwgMCwgaW5kZXggKyAxKS5zZXQoaW5kZXgsIHZhbHVlKVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaW5kZXggKz0gbGlzdC5fb3JpZ2luO1xuXG4gICAgdmFyIG5ld1RhaWwgPSBsaXN0Ll90YWlsO1xuICAgIHZhciBuZXdSb290ID0gbGlzdC5fcm9vdDtcbiAgICB2YXIgZGlkQWx0ZXIgPSBNYWtlUmVmKERJRF9BTFRFUik7XG4gICAgaWYgKGluZGV4ID49IGdldFRhaWxPZmZzZXQobGlzdC5fY2FwYWNpdHkpKSB7XG4gICAgICBuZXdUYWlsID0gdXBkYXRlVk5vZGUobmV3VGFpbCwgbGlzdC5fX293bmVySUQsIDAsIGluZGV4LCB2YWx1ZSwgZGlkQWx0ZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdSb290ID0gdXBkYXRlVk5vZGUobmV3Um9vdCwgbGlzdC5fX293bmVySUQsIGxpc3QuX2xldmVsLCBpbmRleCwgdmFsdWUsIGRpZEFsdGVyKTtcbiAgICB9XG5cbiAgICBpZiAoIWRpZEFsdGVyLnZhbHVlKSB7XG4gICAgICByZXR1cm4gbGlzdDtcbiAgICB9XG5cbiAgICBpZiAobGlzdC5fX293bmVySUQpIHtcbiAgICAgIGxpc3QuX3Jvb3QgPSBuZXdSb290O1xuICAgICAgbGlzdC5fdGFpbCA9IG5ld1RhaWw7XG4gICAgICBsaXN0Ll9faGFzaCA9IHVuZGVmaW5lZDtcbiAgICAgIGxpc3QuX19hbHRlcmVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBsaXN0O1xuICAgIH1cbiAgICByZXR1cm4gbWFrZUxpc3QobGlzdC5fb3JpZ2luLCBsaXN0Ll9jYXBhY2l0eSwgbGlzdC5fbGV2ZWwsIG5ld1Jvb3QsIG5ld1RhaWwpO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlVk5vZGUobm9kZSwgb3duZXJJRCwgbGV2ZWwsIGluZGV4LCB2YWx1ZSwgZGlkQWx0ZXIpIHtcbiAgICB2YXIgaWR4ID0gKGluZGV4ID4+PiBsZXZlbCkgJiBNQVNLO1xuICAgIHZhciBub2RlSGFzID0gbm9kZSAmJiBpZHggPCBub2RlLmFycmF5Lmxlbmd0aDtcbiAgICBpZiAoIW5vZGVIYXMgJiYgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgdmFyIG5ld05vZGU7XG5cbiAgICBpZiAobGV2ZWwgPiAwKSB7XG4gICAgICB2YXIgbG93ZXJOb2RlID0gbm9kZSAmJiBub2RlLmFycmF5W2lkeF07XG4gICAgICB2YXIgbmV3TG93ZXJOb2RlID0gdXBkYXRlVk5vZGUobG93ZXJOb2RlLCBvd25lcklELCBsZXZlbCAtIFNISUZULCBpbmRleCwgdmFsdWUsIGRpZEFsdGVyKTtcbiAgICAgIGlmIChuZXdMb3dlck5vZGUgPT09IGxvd2VyTm9kZSkge1xuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgIH1cbiAgICAgIG5ld05vZGUgPSBlZGl0YWJsZVZOb2RlKG5vZGUsIG93bmVySUQpO1xuICAgICAgbmV3Tm9kZS5hcnJheVtpZHhdID0gbmV3TG93ZXJOb2RlO1xuICAgICAgcmV0dXJuIG5ld05vZGU7XG4gICAgfVxuXG4gICAgaWYgKG5vZGVIYXMgJiYgbm9kZS5hcnJheVtpZHhdID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgU2V0UmVmKGRpZEFsdGVyKTtcblxuICAgIG5ld05vZGUgPSBlZGl0YWJsZVZOb2RlKG5vZGUsIG93bmVySUQpO1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkICYmIGlkeCA9PT0gbmV3Tm9kZS5hcnJheS5sZW5ndGggLSAxKSB7XG4gICAgICBuZXdOb2RlLmFycmF5LnBvcCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdOb2RlLmFycmF5W2lkeF0gPSB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld05vZGU7XG4gIH1cblxuICBmdW5jdGlvbiBlZGl0YWJsZVZOb2RlKG5vZGUsIG93bmVySUQpIHtcbiAgICBpZiAob3duZXJJRCAmJiBub2RlICYmIG93bmVySUQgPT09IG5vZGUub3duZXJJRCkge1xuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuICAgIHJldHVybiBuZXcgVk5vZGUobm9kZSA/IG5vZGUuYXJyYXkuc2xpY2UoKSA6IFtdLCBvd25lcklEKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxpc3ROb2RlRm9yKGxpc3QsIHJhd0luZGV4KSB7XG4gICAgaWYgKHJhd0luZGV4ID49IGdldFRhaWxPZmZzZXQobGlzdC5fY2FwYWNpdHkpKSB7XG4gICAgICByZXR1cm4gbGlzdC5fdGFpbDtcbiAgICB9XG4gICAgaWYgKHJhd0luZGV4IDwgMSA8PCAobGlzdC5fbGV2ZWwgKyBTSElGVCkpIHtcbiAgICAgIHZhciBub2RlID0gbGlzdC5fcm9vdDtcbiAgICAgIHZhciBsZXZlbCA9IGxpc3QuX2xldmVsO1xuICAgICAgd2hpbGUgKG5vZGUgJiYgbGV2ZWwgPiAwKSB7XG4gICAgICAgIG5vZGUgPSBub2RlLmFycmF5WyhyYXdJbmRleCA+Pj4gbGV2ZWwpICYgTUFTS107XG4gICAgICAgIGxldmVsIC09IFNISUZUO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0TGlzdEJvdW5kcyhsaXN0LCBiZWdpbiwgZW5kKSB7XG4gICAgdmFyIG93bmVyID0gbGlzdC5fX293bmVySUQgfHwgbmV3IE93bmVySUQoKTtcbiAgICB2YXIgb2xkT3JpZ2luID0gbGlzdC5fb3JpZ2luO1xuICAgIHZhciBvbGRDYXBhY2l0eSA9IGxpc3QuX2NhcGFjaXR5O1xuICAgIHZhciBuZXdPcmlnaW4gPSBvbGRPcmlnaW4gKyBiZWdpbjtcbiAgICB2YXIgbmV3Q2FwYWNpdHkgPSBlbmQgPT09IHVuZGVmaW5lZCA/IG9sZENhcGFjaXR5IDogZW5kIDwgMCA/IG9sZENhcGFjaXR5ICsgZW5kIDogb2xkT3JpZ2luICsgZW5kO1xuICAgIGlmIChuZXdPcmlnaW4gPT09IG9sZE9yaWdpbiAmJiBuZXdDYXBhY2l0eSA9PT0gb2xkQ2FwYWNpdHkpIHtcbiAgICAgIHJldHVybiBsaXN0O1xuICAgIH1cblxuICAgIC8vIElmIGl0J3MgZ29pbmcgdG8gZW5kIGFmdGVyIGl0IHN0YXJ0cywgaXQncyBlbXB0eS5cbiAgICBpZiAobmV3T3JpZ2luID49IG5ld0NhcGFjaXR5KSB7XG4gICAgICByZXR1cm4gbGlzdC5jbGVhcigpO1xuICAgIH1cblxuICAgIHZhciBuZXdMZXZlbCA9IGxpc3QuX2xldmVsO1xuICAgIHZhciBuZXdSb290ID0gbGlzdC5fcm9vdDtcblxuICAgIC8vIE5ldyBvcmlnaW4gbWlnaHQgcmVxdWlyZSBjcmVhdGluZyBhIGhpZ2hlciByb290LlxuICAgIHZhciBvZmZzZXRTaGlmdCA9IDA7XG4gICAgd2hpbGUgKG5ld09yaWdpbiArIG9mZnNldFNoaWZ0IDwgMCkge1xuICAgICAgbmV3Um9vdCA9IG5ldyBWTm9kZShuZXdSb290ICYmIG5ld1Jvb3QuYXJyYXkubGVuZ3RoID8gW3VuZGVmaW5lZCwgbmV3Um9vdF0gOiBbXSwgb3duZXIpO1xuICAgICAgbmV3TGV2ZWwgKz0gU0hJRlQ7XG4gICAgICBvZmZzZXRTaGlmdCArPSAxIDw8IG5ld0xldmVsO1xuICAgIH1cbiAgICBpZiAob2Zmc2V0U2hpZnQpIHtcbiAgICAgIG5ld09yaWdpbiArPSBvZmZzZXRTaGlmdDtcbiAgICAgIG9sZE9yaWdpbiArPSBvZmZzZXRTaGlmdDtcbiAgICAgIG5ld0NhcGFjaXR5ICs9IG9mZnNldFNoaWZ0O1xuICAgICAgb2xkQ2FwYWNpdHkgKz0gb2Zmc2V0U2hpZnQ7XG4gICAgfVxuXG4gICAgdmFyIG9sZFRhaWxPZmZzZXQgPSBnZXRUYWlsT2Zmc2V0KG9sZENhcGFjaXR5KTtcbiAgICB2YXIgbmV3VGFpbE9mZnNldCA9IGdldFRhaWxPZmZzZXQobmV3Q2FwYWNpdHkpO1xuXG4gICAgLy8gTmV3IHNpemUgbWlnaHQgcmVxdWlyZSBjcmVhdGluZyBhIGhpZ2hlciByb290LlxuICAgIHdoaWxlIChuZXdUYWlsT2Zmc2V0ID49IDEgPDwgKG5ld0xldmVsICsgU0hJRlQpKSB7XG4gICAgICBuZXdSb290ID0gbmV3IFZOb2RlKG5ld1Jvb3QgJiYgbmV3Um9vdC5hcnJheS5sZW5ndGggPyBbbmV3Um9vdF0gOiBbXSwgb3duZXIpO1xuICAgICAgbmV3TGV2ZWwgKz0gU0hJRlQ7XG4gICAgfVxuXG4gICAgLy8gTG9jYXRlIG9yIGNyZWF0ZSB0aGUgbmV3IHRhaWwuXG4gICAgdmFyIG9sZFRhaWwgPSBsaXN0Ll90YWlsO1xuICAgIHZhciBuZXdUYWlsID0gbmV3VGFpbE9mZnNldCA8IG9sZFRhaWxPZmZzZXQgP1xuICAgICAgbGlzdE5vZGVGb3IobGlzdCwgbmV3Q2FwYWNpdHkgLSAxKSA6XG4gICAgICBuZXdUYWlsT2Zmc2V0ID4gb2xkVGFpbE9mZnNldCA/IG5ldyBWTm9kZShbXSwgb3duZXIpIDogb2xkVGFpbDtcblxuICAgIC8vIE1lcmdlIFRhaWwgaW50byB0cmVlLlxuICAgIGlmIChvbGRUYWlsICYmIG5ld1RhaWxPZmZzZXQgPiBvbGRUYWlsT2Zmc2V0ICYmIG5ld09yaWdpbiA8IG9sZENhcGFjaXR5ICYmIG9sZFRhaWwuYXJyYXkubGVuZ3RoKSB7XG4gICAgICBuZXdSb290ID0gZWRpdGFibGVWTm9kZShuZXdSb290LCBvd25lcik7XG4gICAgICB2YXIgbm9kZSA9IG5ld1Jvb3Q7XG4gICAgICBmb3IgKHZhciBsZXZlbCA9IG5ld0xldmVsOyBsZXZlbCA+IFNISUZUOyBsZXZlbCAtPSBTSElGVCkge1xuICAgICAgICB2YXIgaWR4ID0gKG9sZFRhaWxPZmZzZXQgPj4+IGxldmVsKSAmIE1BU0s7XG4gICAgICAgIG5vZGUgPSBub2RlLmFycmF5W2lkeF0gPSBlZGl0YWJsZVZOb2RlKG5vZGUuYXJyYXlbaWR4XSwgb3duZXIpO1xuICAgICAgfVxuICAgICAgbm9kZS5hcnJheVsob2xkVGFpbE9mZnNldCA+Pj4gU0hJRlQpICYgTUFTS10gPSBvbGRUYWlsO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBzaXplIGhhcyBiZWVuIHJlZHVjZWQsIHRoZXJlJ3MgYSBjaGFuY2UgdGhlIHRhaWwgbmVlZHMgdG8gYmUgdHJpbW1lZC5cbiAgICBpZiAobmV3Q2FwYWNpdHkgPCBvbGRDYXBhY2l0eSkge1xuICAgICAgbmV3VGFpbCA9IG5ld1RhaWwgJiYgbmV3VGFpbC5yZW1vdmVBZnRlcihvd25lciwgMCwgbmV3Q2FwYWNpdHkpO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBuZXcgb3JpZ2luIGlzIHdpdGhpbiB0aGUgdGFpbCwgdGhlbiB3ZSBkbyBub3QgbmVlZCBhIHJvb3QuXG4gICAgaWYgKG5ld09yaWdpbiA+PSBuZXdUYWlsT2Zmc2V0KSB7XG4gICAgICBuZXdPcmlnaW4gLT0gbmV3VGFpbE9mZnNldDtcbiAgICAgIG5ld0NhcGFjaXR5IC09IG5ld1RhaWxPZmZzZXQ7XG4gICAgICBuZXdMZXZlbCA9IFNISUZUO1xuICAgICAgbmV3Um9vdCA9IG51bGw7XG4gICAgICBuZXdUYWlsID0gbmV3VGFpbCAmJiBuZXdUYWlsLnJlbW92ZUJlZm9yZShvd25lciwgMCwgbmV3T3JpZ2luKTtcblxuICAgIC8vIE90aGVyd2lzZSwgaWYgdGhlIHJvb3QgaGFzIGJlZW4gdHJpbW1lZCwgZ2FyYmFnZSBjb2xsZWN0LlxuICAgIH0gZWxzZSBpZiAobmV3T3JpZ2luID4gb2xkT3JpZ2luIHx8IG5ld1RhaWxPZmZzZXQgPCBvbGRUYWlsT2Zmc2V0KSB7XG4gICAgICBvZmZzZXRTaGlmdCA9IDA7XG5cbiAgICAgIC8vIElkZW50aWZ5IHRoZSBuZXcgdG9wIHJvb3Qgbm9kZSBvZiB0aGUgc3VidHJlZSBvZiB0aGUgb2xkIHJvb3QuXG4gICAgICB3aGlsZSAobmV3Um9vdCkge1xuICAgICAgICB2YXIgYmVnaW5JbmRleCA9IChuZXdPcmlnaW4gPj4+IG5ld0xldmVsKSAmIE1BU0s7XG4gICAgICAgIGlmIChiZWdpbkluZGV4ICE9PSAobmV3VGFpbE9mZnNldCA+Pj4gbmV3TGV2ZWwpICYgTUFTSykge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChiZWdpbkluZGV4KSB7XG4gICAgICAgICAgb2Zmc2V0U2hpZnQgKz0gKDEgPDwgbmV3TGV2ZWwpICogYmVnaW5JbmRleDtcbiAgICAgICAgfVxuICAgICAgICBuZXdMZXZlbCAtPSBTSElGVDtcbiAgICAgICAgbmV3Um9vdCA9IG5ld1Jvb3QuYXJyYXlbYmVnaW5JbmRleF07XG4gICAgICB9XG5cbiAgICAgIC8vIFRyaW0gdGhlIG5ldyBzaWRlcyBvZiB0aGUgbmV3IHJvb3QuXG4gICAgICBpZiAobmV3Um9vdCAmJiBuZXdPcmlnaW4gPiBvbGRPcmlnaW4pIHtcbiAgICAgICAgbmV3Um9vdCA9IG5ld1Jvb3QucmVtb3ZlQmVmb3JlKG93bmVyLCBuZXdMZXZlbCwgbmV3T3JpZ2luIC0gb2Zmc2V0U2hpZnQpO1xuICAgICAgfVxuICAgICAgaWYgKG5ld1Jvb3QgJiYgbmV3VGFpbE9mZnNldCA8IG9sZFRhaWxPZmZzZXQpIHtcbiAgICAgICAgbmV3Um9vdCA9IG5ld1Jvb3QucmVtb3ZlQWZ0ZXIob3duZXIsIG5ld0xldmVsLCBuZXdUYWlsT2Zmc2V0IC0gb2Zmc2V0U2hpZnQpO1xuICAgICAgfVxuICAgICAgaWYgKG9mZnNldFNoaWZ0KSB7XG4gICAgICAgIG5ld09yaWdpbiAtPSBvZmZzZXRTaGlmdDtcbiAgICAgICAgbmV3Q2FwYWNpdHkgLT0gb2Zmc2V0U2hpZnQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGxpc3QuX19vd25lcklEKSB7XG4gICAgICBsaXN0LnNpemUgPSBuZXdDYXBhY2l0eSAtIG5ld09yaWdpbjtcbiAgICAgIGxpc3QuX29yaWdpbiA9IG5ld09yaWdpbjtcbiAgICAgIGxpc3QuX2NhcGFjaXR5ID0gbmV3Q2FwYWNpdHk7XG4gICAgICBsaXN0Ll9sZXZlbCA9IG5ld0xldmVsO1xuICAgICAgbGlzdC5fcm9vdCA9IG5ld1Jvb3Q7XG4gICAgICBsaXN0Ll90YWlsID0gbmV3VGFpbDtcbiAgICAgIGxpc3QuX19oYXNoID0gdW5kZWZpbmVkO1xuICAgICAgbGlzdC5fX2FsdGVyZWQgPSB0cnVlO1xuICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgfVxuICAgIHJldHVybiBtYWtlTGlzdChuZXdPcmlnaW4sIG5ld0NhcGFjaXR5LCBuZXdMZXZlbCwgbmV3Um9vdCwgbmV3VGFpbCk7XG4gIH1cblxuICBmdW5jdGlvbiBtZXJnZUludG9MaXN0V2l0aChsaXN0LCBtZXJnZXIsIGl0ZXJhYmxlcykge1xuICAgIHZhciBpdGVycyA9IFtdO1xuICAgIHZhciBtYXhTaXplID0gMDtcbiAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgaXRlcmFibGVzLmxlbmd0aDsgaWkrKykge1xuICAgICAgdmFyIHZhbHVlID0gaXRlcmFibGVzW2lpXTtcbiAgICAgIHZhciBpdGVyID0gSW5kZXhlZEl0ZXJhYmxlKHZhbHVlKTtcbiAgICAgIGlmIChpdGVyLnNpemUgPiBtYXhTaXplKSB7XG4gICAgICAgIG1heFNpemUgPSBpdGVyLnNpemU7XG4gICAgICB9XG4gICAgICBpZiAoIWlzSXRlcmFibGUodmFsdWUpKSB7XG4gICAgICAgIGl0ZXIgPSBpdGVyLm1hcChmdW5jdGlvbih2ICkge3JldHVybiBmcm9tSlModil9KTtcbiAgICAgIH1cbiAgICAgIGl0ZXJzLnB1c2goaXRlcik7XG4gICAgfVxuICAgIGlmIChtYXhTaXplID4gbGlzdC5zaXplKSB7XG4gICAgICBsaXN0ID0gbGlzdC5zZXRTaXplKG1heFNpemUpO1xuICAgIH1cbiAgICByZXR1cm4gbWVyZ2VJbnRvQ29sbGVjdGlvbldpdGgobGlzdCwgbWVyZ2VyLCBpdGVycyk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRUYWlsT2Zmc2V0KHNpemUpIHtcbiAgICByZXR1cm4gc2l6ZSA8IFNJWkUgPyAwIDogKCgoc2l6ZSAtIDEpID4+PiBTSElGVCkgPDwgU0hJRlQpO1xuICB9XG5cbiAgY3JlYXRlQ2xhc3MoT3JkZXJlZE1hcCwgc3JjX01hcF9fTWFwKTtcblxuICAgIC8vIEBwcmFnbWEgQ29uc3RydWN0aW9uXG5cbiAgICBmdW5jdGlvbiBPcmRlcmVkTWFwKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCA/IGVtcHR5T3JkZXJlZE1hcCgpIDpcbiAgICAgICAgaXNPcmRlcmVkTWFwKHZhbHVlKSA/IHZhbHVlIDpcbiAgICAgICAgZW1wdHlPcmRlcmVkTWFwKCkud2l0aE11dGF0aW9ucyhmdW5jdGlvbihtYXAgKSB7XG4gICAgICAgICAgdmFyIGl0ZXIgPSBLZXllZEl0ZXJhYmxlKHZhbHVlKTtcbiAgICAgICAgICBhc3NlcnROb3RJbmZpbml0ZShpdGVyLnNpemUpO1xuICAgICAgICAgIGl0ZXIuZm9yRWFjaChmdW5jdGlvbih2LCBrKSAge3JldHVybiBtYXAuc2V0KGssIHYpfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIE9yZGVyZWRNYXAub2YgPSBmdW5jdGlvbigvKi4uLnZhbHVlcyovKSB7XG4gICAgICByZXR1cm4gdGhpcyhhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBPcmRlcmVkTWFwLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX190b1N0cmluZygnT3JkZXJlZE1hcCB7JywgJ30nKTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBBY2Nlc3NcblxuICAgIE9yZGVyZWRNYXAucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGssIG5vdFNldFZhbHVlKSB7XG4gICAgICB2YXIgaW5kZXggPSB0aGlzLl9tYXAuZ2V0KGspO1xuICAgICAgcmV0dXJuIGluZGV4ICE9PSB1bmRlZmluZWQgPyB0aGlzLl9saXN0LmdldChpbmRleClbMV0gOiBub3RTZXRWYWx1ZTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBNb2RpZmljYXRpb25cblxuICAgIE9yZGVyZWRNYXAucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy5zaXplID09PSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX19vd25lcklEKSB7XG4gICAgICAgIHRoaXMuc2l6ZSA9IDA7XG4gICAgICAgIHRoaXMuX21hcC5jbGVhcigpO1xuICAgICAgICB0aGlzLl9saXN0LmNsZWFyKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVtcHR5T3JkZXJlZE1hcCgpO1xuICAgIH07XG5cbiAgICBPcmRlcmVkTWFwLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihrLCB2KSB7XG4gICAgICByZXR1cm4gdXBkYXRlT3JkZXJlZE1hcCh0aGlzLCBrLCB2KTtcbiAgICB9O1xuXG4gICAgT3JkZXJlZE1hcC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oaykge1xuICAgICAgcmV0dXJuIHVwZGF0ZU9yZGVyZWRNYXAodGhpcywgaywgTk9UX1NFVCk7XG4gICAgfTtcblxuICAgIE9yZGVyZWRNYXAucHJvdG90eXBlLndhc0FsdGVyZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9tYXAud2FzQWx0ZXJlZCgpIHx8IHRoaXMuX2xpc3Qud2FzQWx0ZXJlZCgpO1xuICAgIH07XG5cbiAgICBPcmRlcmVkTWFwLnByb3RvdHlwZS5fX2l0ZXJhdGUgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgcmV0dXJuIHRoaXMuX2xpc3QuX19pdGVyYXRlKFxuICAgICAgICBmdW5jdGlvbihlbnRyeSApIHtyZXR1cm4gZW50cnkgJiYgZm4oZW50cnlbMV0sIGVudHJ5WzBdLCB0aGlzJDApfSxcbiAgICAgICAgcmV2ZXJzZVxuICAgICAgKTtcbiAgICB9O1xuXG4gICAgT3JkZXJlZE1hcC5wcm90b3R5cGUuX19pdGVyYXRvciA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIHJldHVybiB0aGlzLl9saXN0LmZyb21FbnRyeVNlcSgpLl9faXRlcmF0b3IodHlwZSwgcmV2ZXJzZSk7XG4gICAgfTtcblxuICAgIE9yZGVyZWRNYXAucHJvdG90eXBlLl9fZW5zdXJlT3duZXIgPSBmdW5jdGlvbihvd25lcklEKSB7XG4gICAgICBpZiAob3duZXJJRCA9PT0gdGhpcy5fX293bmVySUQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICB2YXIgbmV3TWFwID0gdGhpcy5fbWFwLl9fZW5zdXJlT3duZXIob3duZXJJRCk7XG4gICAgICB2YXIgbmV3TGlzdCA9IHRoaXMuX2xpc3QuX19lbnN1cmVPd25lcihvd25lcklEKTtcbiAgICAgIGlmICghb3duZXJJRCkge1xuICAgICAgICB0aGlzLl9fb3duZXJJRCA9IG93bmVySUQ7XG4gICAgICAgIHRoaXMuX21hcCA9IG5ld01hcDtcbiAgICAgICAgdGhpcy5fbGlzdCA9IG5ld0xpc3Q7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1ha2VPcmRlcmVkTWFwKG5ld01hcCwgbmV3TGlzdCwgb3duZXJJRCwgdGhpcy5fX2hhc2gpO1xuICAgIH07XG5cblxuICBmdW5jdGlvbiBpc09yZGVyZWRNYXAobWF5YmVPcmRlcmVkTWFwKSB7XG4gICAgcmV0dXJuIGlzTWFwKG1heWJlT3JkZXJlZE1hcCkgJiYgaXNPcmRlcmVkKG1heWJlT3JkZXJlZE1hcCk7XG4gIH1cblxuICBPcmRlcmVkTWFwLmlzT3JkZXJlZE1hcCA9IGlzT3JkZXJlZE1hcDtcblxuICBPcmRlcmVkTWFwLnByb3RvdHlwZVtJU19PUkRFUkVEX1NFTlRJTkVMXSA9IHRydWU7XG4gIE9yZGVyZWRNYXAucHJvdG90eXBlW0RFTEVURV0gPSBPcmRlcmVkTWFwLnByb3RvdHlwZS5yZW1vdmU7XG5cblxuXG4gIGZ1bmN0aW9uIG1ha2VPcmRlcmVkTWFwKG1hcCwgbGlzdCwgb3duZXJJRCwgaGFzaCkge1xuICAgIHZhciBvbWFwID0gT2JqZWN0LmNyZWF0ZShPcmRlcmVkTWFwLnByb3RvdHlwZSk7XG4gICAgb21hcC5zaXplID0gbWFwID8gbWFwLnNpemUgOiAwO1xuICAgIG9tYXAuX21hcCA9IG1hcDtcbiAgICBvbWFwLl9saXN0ID0gbGlzdDtcbiAgICBvbWFwLl9fb3duZXJJRCA9IG93bmVySUQ7XG4gICAgb21hcC5fX2hhc2ggPSBoYXNoO1xuICAgIHJldHVybiBvbWFwO1xuICB9XG5cbiAgdmFyIEVNUFRZX09SREVSRURfTUFQO1xuICBmdW5jdGlvbiBlbXB0eU9yZGVyZWRNYXAoKSB7XG4gICAgcmV0dXJuIEVNUFRZX09SREVSRURfTUFQIHx8IChFTVBUWV9PUkRFUkVEX01BUCA9IG1ha2VPcmRlcmVkTWFwKGVtcHR5TWFwKCksIGVtcHR5TGlzdCgpKSk7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVPcmRlcmVkTWFwKG9tYXAsIGssIHYpIHtcbiAgICB2YXIgbWFwID0gb21hcC5fbWFwO1xuICAgIHZhciBsaXN0ID0gb21hcC5fbGlzdDtcbiAgICB2YXIgaSA9IG1hcC5nZXQoayk7XG4gICAgdmFyIGhhcyA9IGkgIT09IHVuZGVmaW5lZDtcbiAgICB2YXIgbmV3TWFwO1xuICAgIHZhciBuZXdMaXN0O1xuICAgIGlmICh2ID09PSBOT1RfU0VUKSB7IC8vIHJlbW92ZWRcbiAgICAgIGlmICghaGFzKSB7XG4gICAgICAgIHJldHVybiBvbWFwO1xuICAgICAgfVxuICAgICAgaWYgKGxpc3Quc2l6ZSA+PSBTSVpFICYmIGxpc3Quc2l6ZSA+PSBtYXAuc2l6ZSAqIDIpIHtcbiAgICAgICAgbmV3TGlzdCA9IGxpc3QuZmlsdGVyKGZ1bmN0aW9uKGVudHJ5LCBpZHgpICB7cmV0dXJuIGVudHJ5ICE9PSB1bmRlZmluZWQgJiYgaSAhPT0gaWR4fSk7XG4gICAgICAgIG5ld01hcCA9IG5ld0xpc3QudG9LZXllZFNlcSgpLm1hcChmdW5jdGlvbihlbnRyeSApIHtyZXR1cm4gZW50cnlbMF19KS5mbGlwKCkudG9NYXAoKTtcbiAgICAgICAgaWYgKG9tYXAuX19vd25lcklEKSB7XG4gICAgICAgICAgbmV3TWFwLl9fb3duZXJJRCA9IG5ld0xpc3QuX19vd25lcklEID0gb21hcC5fX293bmVySUQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld01hcCA9IG1hcC5yZW1vdmUoayk7XG4gICAgICAgIG5ld0xpc3QgPSBpID09PSBsaXN0LnNpemUgLSAxID8gbGlzdC5wb3AoKSA6IGxpc3Quc2V0KGksIHVuZGVmaW5lZCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChoYXMpIHtcbiAgICAgICAgaWYgKHYgPT09IGxpc3QuZ2V0KGkpWzFdKSB7XG4gICAgICAgICAgcmV0dXJuIG9tYXA7XG4gICAgICAgIH1cbiAgICAgICAgbmV3TWFwID0gbWFwO1xuICAgICAgICBuZXdMaXN0ID0gbGlzdC5zZXQoaSwgW2ssIHZdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld01hcCA9IG1hcC5zZXQoaywgbGlzdC5zaXplKTtcbiAgICAgICAgbmV3TGlzdCA9IGxpc3Quc2V0KGxpc3Quc2l6ZSwgW2ssIHZdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG9tYXAuX19vd25lcklEKSB7XG4gICAgICBvbWFwLnNpemUgPSBuZXdNYXAuc2l6ZTtcbiAgICAgIG9tYXAuX21hcCA9IG5ld01hcDtcbiAgICAgIG9tYXAuX2xpc3QgPSBuZXdMaXN0O1xuICAgICAgb21hcC5fX2hhc2ggPSB1bmRlZmluZWQ7XG4gICAgICByZXR1cm4gb21hcDtcbiAgICB9XG4gICAgcmV0dXJuIG1ha2VPcmRlcmVkTWFwKG5ld01hcCwgbmV3TGlzdCk7XG4gIH1cblxuICBjcmVhdGVDbGFzcyhTdGFjaywgSW5kZXhlZENvbGxlY3Rpb24pO1xuXG4gICAgLy8gQHByYWdtYSBDb25zdHJ1Y3Rpb25cblxuICAgIGZ1bmN0aW9uIFN0YWNrKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCA/IGVtcHR5U3RhY2soKSA6XG4gICAgICAgIGlzU3RhY2sodmFsdWUpID8gdmFsdWUgOlxuICAgICAgICBlbXB0eVN0YWNrKCkudW5zaGlmdEFsbCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgU3RhY2sub2YgPSBmdW5jdGlvbigvKi4uLnZhbHVlcyovKSB7XG4gICAgICByZXR1cm4gdGhpcyhhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBTdGFjay5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9fdG9TdHJpbmcoJ1N0YWNrIFsnLCAnXScpO1xuICAgIH07XG5cbiAgICAvLyBAcHJhZ21hIEFjY2Vzc1xuXG4gICAgU3RhY2sucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGluZGV4LCBub3RTZXRWYWx1ZSkge1xuICAgICAgdmFyIGhlYWQgPSB0aGlzLl9oZWFkO1xuICAgICAgaW5kZXggPSB3cmFwSW5kZXgodGhpcywgaW5kZXgpO1xuICAgICAgd2hpbGUgKGhlYWQgJiYgaW5kZXgtLSkge1xuICAgICAgICBoZWFkID0gaGVhZC5uZXh0O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGhlYWQgPyBoZWFkLnZhbHVlIDogbm90U2V0VmFsdWU7XG4gICAgfTtcblxuICAgIFN0YWNrLnByb3RvdHlwZS5wZWVrID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5faGVhZCAmJiB0aGlzLl9oZWFkLnZhbHVlO1xuICAgIH07XG5cbiAgICAvLyBAcHJhZ21hIE1vZGlmaWNhdGlvblxuXG4gICAgU3RhY2sucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbigvKi4uLnZhbHVlcyovKSB7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHZhciBuZXdTaXplID0gdGhpcy5zaXplICsgYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgIHZhciBoZWFkID0gdGhpcy5faGVhZDtcbiAgICAgIGZvciAodmFyIGlpID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7IGlpID49IDA7IGlpLS0pIHtcbiAgICAgICAgaGVhZCA9IHtcbiAgICAgICAgICB2YWx1ZTogYXJndW1lbnRzW2lpXSxcbiAgICAgICAgICBuZXh0OiBoZWFkXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fX293bmVySUQpIHtcbiAgICAgICAgdGhpcy5zaXplID0gbmV3U2l6ZTtcbiAgICAgICAgdGhpcy5faGVhZCA9IGhlYWQ7XG4gICAgICAgIHRoaXMuX19oYXNoID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLl9fYWx0ZXJlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1ha2VTdGFjayhuZXdTaXplLCBoZWFkKTtcbiAgICB9O1xuXG4gICAgU3RhY2sucHJvdG90eXBlLnB1c2hBbGwgPSBmdW5jdGlvbihpdGVyKSB7XG4gICAgICBpdGVyID0gSW5kZXhlZEl0ZXJhYmxlKGl0ZXIpO1xuICAgICAgaWYgKGl0ZXIuc2l6ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIGFzc2VydE5vdEluZmluaXRlKGl0ZXIuc2l6ZSk7XG4gICAgICB2YXIgbmV3U2l6ZSA9IHRoaXMuc2l6ZTtcbiAgICAgIHZhciBoZWFkID0gdGhpcy5faGVhZDtcbiAgICAgIGl0ZXIucmV2ZXJzZSgpLmZvckVhY2goZnVuY3Rpb24odmFsdWUgKSB7XG4gICAgICAgIG5ld1NpemUrKztcbiAgICAgICAgaGVhZCA9IHtcbiAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgbmV4dDogaGVhZFxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgICBpZiAodGhpcy5fX293bmVySUQpIHtcbiAgICAgICAgdGhpcy5zaXplID0gbmV3U2l6ZTtcbiAgICAgICAgdGhpcy5faGVhZCA9IGhlYWQ7XG4gICAgICAgIHRoaXMuX19oYXNoID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLl9fYWx0ZXJlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1ha2VTdGFjayhuZXdTaXplLCBoZWFkKTtcbiAgICB9O1xuXG4gICAgU3RhY2sucHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuc2xpY2UoMSk7XG4gICAgfTtcblxuICAgIFN0YWNrLnByb3RvdHlwZS51bnNoaWZ0ID0gZnVuY3Rpb24oLyouLi52YWx1ZXMqLykge1xuICAgICAgcmV0dXJuIHRoaXMucHVzaC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBTdGFjay5wcm90b3R5cGUudW5zaGlmdEFsbCA9IGZ1bmN0aW9uKGl0ZXIpIHtcbiAgICAgIHJldHVybiB0aGlzLnB1c2hBbGwoaXRlcik7XG4gICAgfTtcblxuICAgIFN0YWNrLnByb3RvdHlwZS5zaGlmdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMucG9wLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICAgIFN0YWNrLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuc2l6ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9fb3duZXJJRCkge1xuICAgICAgICB0aGlzLnNpemUgPSAwO1xuICAgICAgICB0aGlzLl9oZWFkID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLl9faGFzaCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5fX2FsdGVyZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHJldHVybiBlbXB0eVN0YWNrKCk7XG4gICAgfTtcblxuICAgIFN0YWNrLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uKGJlZ2luLCBlbmQpIHtcbiAgICAgIGlmICh3aG9sZVNsaWNlKGJlZ2luLCBlbmQsIHRoaXMuc2l6ZSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICB2YXIgcmVzb2x2ZWRCZWdpbiA9IHJlc29sdmVCZWdpbihiZWdpbiwgdGhpcy5zaXplKTtcbiAgICAgIHZhciByZXNvbHZlZEVuZCA9IHJlc29sdmVFbmQoZW5kLCB0aGlzLnNpemUpO1xuICAgICAgaWYgKHJlc29sdmVkRW5kICE9PSB0aGlzLnNpemUpIHtcbiAgICAgICAgLy8gc3VwZXIuc2xpY2UoYmVnaW4sIGVuZCk7XG4gICAgICAgIHJldHVybiBJbmRleGVkQ29sbGVjdGlvbi5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLCBiZWdpbiwgZW5kKTtcbiAgICAgIH1cbiAgICAgIHZhciBuZXdTaXplID0gdGhpcy5zaXplIC0gcmVzb2x2ZWRCZWdpbjtcbiAgICAgIHZhciBoZWFkID0gdGhpcy5faGVhZDtcbiAgICAgIHdoaWxlIChyZXNvbHZlZEJlZ2luLS0pIHtcbiAgICAgICAgaGVhZCA9IGhlYWQubmV4dDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9fb3duZXJJRCkge1xuICAgICAgICB0aGlzLnNpemUgPSBuZXdTaXplO1xuICAgICAgICB0aGlzLl9oZWFkID0gaGVhZDtcbiAgICAgICAgdGhpcy5fX2hhc2ggPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX19hbHRlcmVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gbWFrZVN0YWNrKG5ld1NpemUsIGhlYWQpO1xuICAgIH07XG5cbiAgICAvLyBAcHJhZ21hIE11dGFiaWxpdHlcblxuICAgIFN0YWNrLnByb3RvdHlwZS5fX2Vuc3VyZU93bmVyID0gZnVuY3Rpb24ob3duZXJJRCkge1xuICAgICAgaWYgKG93bmVySUQgPT09IHRoaXMuX19vd25lcklEKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgaWYgKCFvd25lcklEKSB7XG4gICAgICAgIHRoaXMuX19vd25lcklEID0gb3duZXJJRDtcbiAgICAgICAgdGhpcy5fX2FsdGVyZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gbWFrZVN0YWNrKHRoaXMuc2l6ZSwgdGhpcy5faGVhZCwgb3duZXJJRCwgdGhpcy5fX2hhc2gpO1xuICAgIH07XG5cbiAgICAvLyBAcHJhZ21hIEl0ZXJhdGlvblxuXG4gICAgU3RhY2sucHJvdG90eXBlLl9faXRlcmF0ZSA9IGZ1bmN0aW9uKGZuLCByZXZlcnNlKSB7XG4gICAgICBpZiAocmV2ZXJzZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZXZlcnNlKCkuX19pdGVyYXRlKGZuKTtcbiAgICAgIH1cbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHZhciBub2RlID0gdGhpcy5faGVhZDtcbiAgICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGlmIChmbihub2RlLnZhbHVlLCBpdGVyYXRpb25zKyssIHRoaXMpID09PSBmYWxzZSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlLm5leHQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gaXRlcmF0aW9ucztcbiAgICB9O1xuXG4gICAgU3RhY2sucHJvdG90eXBlLl9faXRlcmF0b3IgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICBpZiAocmV2ZXJzZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZXZlcnNlKCkuX19pdGVyYXRvcih0eXBlKTtcbiAgICAgIH1cbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHZhciBub2RlID0gdGhpcy5faGVhZDtcbiAgICAgIHJldHVybiBuZXcgc3JjX0l0ZXJhdG9yX19JdGVyYXRvcihmdW5jdGlvbigpICB7XG4gICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgdmFyIHZhbHVlID0gbm9kZS52YWx1ZTtcbiAgICAgICAgICBub2RlID0gbm9kZS5uZXh0O1xuICAgICAgICAgIHJldHVybiBpdGVyYXRvclZhbHVlKHR5cGUsIGl0ZXJhdGlvbnMrKywgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpdGVyYXRvckRvbmUoKTtcbiAgICAgIH0pO1xuICAgIH07XG5cblxuICBmdW5jdGlvbiBpc1N0YWNrKG1heWJlU3RhY2spIHtcbiAgICByZXR1cm4gISEobWF5YmVTdGFjayAmJiBtYXliZVN0YWNrW0lTX1NUQUNLX1NFTlRJTkVMXSk7XG4gIH1cblxuICBTdGFjay5pc1N0YWNrID0gaXNTdGFjaztcblxuICB2YXIgSVNfU1RBQ0tfU0VOVElORUwgPSAnQEBfX0lNTVVUQUJMRV9TVEFDS19fQEAnO1xuXG4gIHZhciBTdGFja1Byb3RvdHlwZSA9IFN0YWNrLnByb3RvdHlwZTtcbiAgU3RhY2tQcm90b3R5cGVbSVNfU1RBQ0tfU0VOVElORUxdID0gdHJ1ZTtcbiAgU3RhY2tQcm90b3R5cGUud2l0aE11dGF0aW9ucyA9IE1hcFByb3RvdHlwZS53aXRoTXV0YXRpb25zO1xuICBTdGFja1Byb3RvdHlwZS5hc011dGFibGUgPSBNYXBQcm90b3R5cGUuYXNNdXRhYmxlO1xuICBTdGFja1Byb3RvdHlwZS5hc0ltbXV0YWJsZSA9IE1hcFByb3RvdHlwZS5hc0ltbXV0YWJsZTtcbiAgU3RhY2tQcm90b3R5cGUud2FzQWx0ZXJlZCA9IE1hcFByb3RvdHlwZS53YXNBbHRlcmVkO1xuXG5cbiAgZnVuY3Rpb24gbWFrZVN0YWNrKHNpemUsIGhlYWQsIG93bmVySUQsIGhhc2gpIHtcbiAgICB2YXIgbWFwID0gT2JqZWN0LmNyZWF0ZShTdGFja1Byb3RvdHlwZSk7XG4gICAgbWFwLnNpemUgPSBzaXplO1xuICAgIG1hcC5faGVhZCA9IGhlYWQ7XG4gICAgbWFwLl9fb3duZXJJRCA9IG93bmVySUQ7XG4gICAgbWFwLl9faGFzaCA9IGhhc2g7XG4gICAgbWFwLl9fYWx0ZXJlZCA9IGZhbHNlO1xuICAgIHJldHVybiBtYXA7XG4gIH1cblxuICB2YXIgRU1QVFlfU1RBQ0s7XG4gIGZ1bmN0aW9uIGVtcHR5U3RhY2soKSB7XG4gICAgcmV0dXJuIEVNUFRZX1NUQUNLIHx8IChFTVBUWV9TVEFDSyA9IG1ha2VTdGFjaygwKSk7XG4gIH1cblxuICBjcmVhdGVDbGFzcyhzcmNfU2V0X19TZXQsIFNldENvbGxlY3Rpb24pO1xuXG4gICAgLy8gQHByYWdtYSBDb25zdHJ1Y3Rpb25cblxuICAgIGZ1bmN0aW9uIHNyY19TZXRfX1NldCh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQgPyBlbXB0eVNldCgpIDpcbiAgICAgICAgaXNTZXQodmFsdWUpID8gdmFsdWUgOlxuICAgICAgICBlbXB0eVNldCgpLndpdGhNdXRhdGlvbnMoZnVuY3Rpb24oc2V0ICkge1xuICAgICAgICAgIHZhciBpdGVyID0gU2V0SXRlcmFibGUodmFsdWUpO1xuICAgICAgICAgIGFzc2VydE5vdEluZmluaXRlKGl0ZXIuc2l6ZSk7XG4gICAgICAgICAgaXRlci5mb3JFYWNoKGZ1bmN0aW9uKHYgKSB7cmV0dXJuIHNldC5hZGQodil9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc3JjX1NldF9fU2V0Lm9mID0gZnVuY3Rpb24oLyouLi52YWx1ZXMqLykge1xuICAgICAgcmV0dXJuIHRoaXMoYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gICAgc3JjX1NldF9fU2V0LmZyb21LZXlzID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzKEtleWVkSXRlcmFibGUodmFsdWUpLmtleVNlcSgpKTtcbiAgICB9O1xuXG4gICAgc3JjX1NldF9fU2V0LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX190b1N0cmluZygnU2V0IHsnLCAnfScpO1xuICAgIH07XG5cbiAgICAvLyBAcHJhZ21hIEFjY2Vzc1xuXG4gICAgc3JjX1NldF9fU2V0LnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIHRoaXMuX21hcC5oYXModmFsdWUpO1xuICAgIH07XG5cbiAgICAvLyBAcHJhZ21hIE1vZGlmaWNhdGlvblxuXG4gICAgc3JjX1NldF9fU2V0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIHVwZGF0ZVNldCh0aGlzLCB0aGlzLl9tYXAuc2V0KHZhbHVlLCB0cnVlKSk7XG4gICAgfTtcblxuICAgIHNyY19TZXRfX1NldC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB1cGRhdGVTZXQodGhpcywgdGhpcy5fbWFwLnJlbW92ZSh2YWx1ZSkpO1xuICAgIH07XG5cbiAgICBzcmNfU2V0X19TZXQucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdXBkYXRlU2V0KHRoaXMsIHRoaXMuX21hcC5jbGVhcigpKTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBDb21wb3NpdGlvblxuXG4gICAgc3JjX1NldF9fU2V0LnByb3RvdHlwZS51bmlvbiA9IGZ1bmN0aW9uKCkge3ZhciBpdGVycyA9IFNMSUNFJDAuY2FsbChhcmd1bWVudHMsIDApO1xuICAgICAgaXRlcnMgPSBpdGVycy5maWx0ZXIoZnVuY3Rpb24oeCApIHtyZXR1cm4geC5zaXplICE9PSAwfSk7XG4gICAgICBpZiAoaXRlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuc2l6ZSA9PT0gMCAmJiAhdGhpcy5fX293bmVySUQgJiYgaXRlcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yKGl0ZXJzWzBdKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLndpdGhNdXRhdGlvbnMoZnVuY3Rpb24oc2V0ICkge1xuICAgICAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgaXRlcnMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgU2V0SXRlcmFibGUoaXRlcnNbaWldKS5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlICkge3JldHVybiBzZXQuYWRkKHZhbHVlKX0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgc3JjX1NldF9fU2V0LnByb3RvdHlwZS5pbnRlcnNlY3QgPSBmdW5jdGlvbigpIHt2YXIgaXRlcnMgPSBTTElDRSQwLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICAgIGlmIChpdGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICBpdGVycyA9IGl0ZXJzLm1hcChmdW5jdGlvbihpdGVyICkge3JldHVybiBTZXRJdGVyYWJsZShpdGVyKX0pO1xuICAgICAgdmFyIG9yaWdpbmFsU2V0ID0gdGhpcztcbiAgICAgIHJldHVybiB0aGlzLndpdGhNdXRhdGlvbnMoZnVuY3Rpb24oc2V0ICkge1xuICAgICAgICBvcmlnaW5hbFNldC5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlICkge1xuICAgICAgICAgIGlmICghaXRlcnMuZXZlcnkoZnVuY3Rpb24oaXRlciApIHtyZXR1cm4gaXRlci5pbmNsdWRlcyh2YWx1ZSl9KSkge1xuICAgICAgICAgICAgc2V0LnJlbW92ZSh2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzcmNfU2V0X19TZXQucHJvdG90eXBlLnN1YnRyYWN0ID0gZnVuY3Rpb24oKSB7dmFyIGl0ZXJzID0gU0xJQ0UkMC5jYWxsKGFyZ3VtZW50cywgMCk7XG4gICAgICBpZiAoaXRlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgaXRlcnMgPSBpdGVycy5tYXAoZnVuY3Rpb24oaXRlciApIHtyZXR1cm4gU2V0SXRlcmFibGUoaXRlcil9KTtcbiAgICAgIHZhciBvcmlnaW5hbFNldCA9IHRoaXM7XG4gICAgICByZXR1cm4gdGhpcy53aXRoTXV0YXRpb25zKGZ1bmN0aW9uKHNldCApIHtcbiAgICAgICAgb3JpZ2luYWxTZXQuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSApIHtcbiAgICAgICAgICBpZiAoaXRlcnMuc29tZShmdW5jdGlvbihpdGVyICkge3JldHVybiBpdGVyLmluY2x1ZGVzKHZhbHVlKX0pKSB7XG4gICAgICAgICAgICBzZXQucmVtb3ZlKHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHNyY19TZXRfX1NldC5wcm90b3R5cGUubWVyZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnVuaW9uLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICAgIHNyY19TZXRfX1NldC5wcm90b3R5cGUubWVyZ2VXaXRoID0gZnVuY3Rpb24obWVyZ2VyKSB7dmFyIGl0ZXJzID0gU0xJQ0UkMC5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICByZXR1cm4gdGhpcy51bmlvbi5hcHBseSh0aGlzLCBpdGVycyk7XG4gICAgfTtcblxuICAgIHNyY19TZXRfX1NldC5wcm90b3R5cGUuc29ydCA9IGZ1bmN0aW9uKGNvbXBhcmF0b3IpIHtcbiAgICAgIC8vIExhdGUgYmluZGluZ1xuICAgICAgcmV0dXJuIE9yZGVyZWRTZXQoc29ydEZhY3RvcnkodGhpcywgY29tcGFyYXRvcikpO1xuICAgIH07XG5cbiAgICBzcmNfU2V0X19TZXQucHJvdG90eXBlLnNvcnRCeSA9IGZ1bmN0aW9uKG1hcHBlciwgY29tcGFyYXRvcikge1xuICAgICAgLy8gTGF0ZSBiaW5kaW5nXG4gICAgICByZXR1cm4gT3JkZXJlZFNldChzb3J0RmFjdG9yeSh0aGlzLCBjb21wYXJhdG9yLCBtYXBwZXIpKTtcbiAgICB9O1xuXG4gICAgc3JjX1NldF9fU2V0LnByb3RvdHlwZS53YXNBbHRlcmVkID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbWFwLndhc0FsdGVyZWQoKTtcbiAgICB9O1xuXG4gICAgc3JjX1NldF9fU2V0LnByb3RvdHlwZS5fX2l0ZXJhdGUgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgcmV0dXJuIHRoaXMuX21hcC5fX2l0ZXJhdGUoZnVuY3Rpb24oXywgaykgIHtyZXR1cm4gZm4oaywgaywgdGhpcyQwKX0sIHJldmVyc2UpO1xuICAgIH07XG5cbiAgICBzcmNfU2V0X19TZXQucHJvdG90eXBlLl9faXRlcmF0b3IgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbWFwLm1hcChmdW5jdGlvbihfLCBrKSAge3JldHVybiBrfSkuX19pdGVyYXRvcih0eXBlLCByZXZlcnNlKTtcbiAgICB9O1xuXG4gICAgc3JjX1NldF9fU2V0LnByb3RvdHlwZS5fX2Vuc3VyZU93bmVyID0gZnVuY3Rpb24ob3duZXJJRCkge1xuICAgICAgaWYgKG93bmVySUQgPT09IHRoaXMuX19vd25lcklEKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgdmFyIG5ld01hcCA9IHRoaXMuX21hcC5fX2Vuc3VyZU93bmVyKG93bmVySUQpO1xuICAgICAgaWYgKCFvd25lcklEKSB7XG4gICAgICAgIHRoaXMuX19vd25lcklEID0gb3duZXJJRDtcbiAgICAgICAgdGhpcy5fbWFwID0gbmV3TWFwO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9fbWFrZShuZXdNYXAsIG93bmVySUQpO1xuICAgIH07XG5cblxuICBmdW5jdGlvbiBpc1NldChtYXliZVNldCkge1xuICAgIHJldHVybiAhIShtYXliZVNldCAmJiBtYXliZVNldFtJU19TRVRfU0VOVElORUxdKTtcbiAgfVxuXG4gIHNyY19TZXRfX1NldC5pc1NldCA9IGlzU2V0O1xuXG4gIHZhciBJU19TRVRfU0VOVElORUwgPSAnQEBfX0lNTVVUQUJMRV9TRVRfX0BAJztcblxuICB2YXIgU2V0UHJvdG90eXBlID0gc3JjX1NldF9fU2V0LnByb3RvdHlwZTtcbiAgU2V0UHJvdG90eXBlW0lTX1NFVF9TRU5USU5FTF0gPSB0cnVlO1xuICBTZXRQcm90b3R5cGVbREVMRVRFXSA9IFNldFByb3RvdHlwZS5yZW1vdmU7XG4gIFNldFByb3RvdHlwZS5tZXJnZURlZXAgPSBTZXRQcm90b3R5cGUubWVyZ2U7XG4gIFNldFByb3RvdHlwZS5tZXJnZURlZXBXaXRoID0gU2V0UHJvdG90eXBlLm1lcmdlV2l0aDtcbiAgU2V0UHJvdG90eXBlLndpdGhNdXRhdGlvbnMgPSBNYXBQcm90b3R5cGUud2l0aE11dGF0aW9ucztcbiAgU2V0UHJvdG90eXBlLmFzTXV0YWJsZSA9IE1hcFByb3RvdHlwZS5hc011dGFibGU7XG4gIFNldFByb3RvdHlwZS5hc0ltbXV0YWJsZSA9IE1hcFByb3RvdHlwZS5hc0ltbXV0YWJsZTtcblxuICBTZXRQcm90b3R5cGUuX19lbXB0eSA9IGVtcHR5U2V0O1xuICBTZXRQcm90b3R5cGUuX19tYWtlID0gbWFrZVNldDtcblxuICBmdW5jdGlvbiB1cGRhdGVTZXQoc2V0LCBuZXdNYXApIHtcbiAgICBpZiAoc2V0Ll9fb3duZXJJRCkge1xuICAgICAgc2V0LnNpemUgPSBuZXdNYXAuc2l6ZTtcbiAgICAgIHNldC5fbWFwID0gbmV3TWFwO1xuICAgICAgcmV0dXJuIHNldDtcbiAgICB9XG4gICAgcmV0dXJuIG5ld01hcCA9PT0gc2V0Ll9tYXAgPyBzZXQgOlxuICAgICAgbmV3TWFwLnNpemUgPT09IDAgPyBzZXQuX19lbXB0eSgpIDpcbiAgICAgIHNldC5fX21ha2UobmV3TWFwKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1ha2VTZXQobWFwLCBvd25lcklEKSB7XG4gICAgdmFyIHNldCA9IE9iamVjdC5jcmVhdGUoU2V0UHJvdG90eXBlKTtcbiAgICBzZXQuc2l6ZSA9IG1hcCA/IG1hcC5zaXplIDogMDtcbiAgICBzZXQuX21hcCA9IG1hcDtcbiAgICBzZXQuX19vd25lcklEID0gb3duZXJJRDtcbiAgICByZXR1cm4gc2V0O1xuICB9XG5cbiAgdmFyIEVNUFRZX1NFVDtcbiAgZnVuY3Rpb24gZW1wdHlTZXQoKSB7XG4gICAgcmV0dXJuIEVNUFRZX1NFVCB8fCAoRU1QVFlfU0VUID0gbWFrZVNldChlbXB0eU1hcCgpKSk7XG4gIH1cblxuICBjcmVhdGVDbGFzcyhPcmRlcmVkU2V0LCBzcmNfU2V0X19TZXQpO1xuXG4gICAgLy8gQHByYWdtYSBDb25zdHJ1Y3Rpb25cblxuICAgIGZ1bmN0aW9uIE9yZGVyZWRTZXQodmFsdWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkID8gZW1wdHlPcmRlcmVkU2V0KCkgOlxuICAgICAgICBpc09yZGVyZWRTZXQodmFsdWUpID8gdmFsdWUgOlxuICAgICAgICBlbXB0eU9yZGVyZWRTZXQoKS53aXRoTXV0YXRpb25zKGZ1bmN0aW9uKHNldCApIHtcbiAgICAgICAgICB2YXIgaXRlciA9IFNldEl0ZXJhYmxlKHZhbHVlKTtcbiAgICAgICAgICBhc3NlcnROb3RJbmZpbml0ZShpdGVyLnNpemUpO1xuICAgICAgICAgIGl0ZXIuZm9yRWFjaChmdW5jdGlvbih2ICkge3JldHVybiBzZXQuYWRkKHYpfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIE9yZGVyZWRTZXQub2YgPSBmdW5jdGlvbigvKi4uLnZhbHVlcyovKSB7XG4gICAgICByZXR1cm4gdGhpcyhhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBPcmRlcmVkU2V0LmZyb21LZXlzID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzKEtleWVkSXRlcmFibGUodmFsdWUpLmtleVNlcSgpKTtcbiAgICB9O1xuXG4gICAgT3JkZXJlZFNldC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9fdG9TdHJpbmcoJ09yZGVyZWRTZXQgeycsICd9Jyk7XG4gICAgfTtcblxuXG4gIGZ1bmN0aW9uIGlzT3JkZXJlZFNldChtYXliZU9yZGVyZWRTZXQpIHtcbiAgICByZXR1cm4gaXNTZXQobWF5YmVPcmRlcmVkU2V0KSAmJiBpc09yZGVyZWQobWF5YmVPcmRlcmVkU2V0KTtcbiAgfVxuXG4gIE9yZGVyZWRTZXQuaXNPcmRlcmVkU2V0ID0gaXNPcmRlcmVkU2V0O1xuXG4gIHZhciBPcmRlcmVkU2V0UHJvdG90eXBlID0gT3JkZXJlZFNldC5wcm90b3R5cGU7XG4gIE9yZGVyZWRTZXRQcm90b3R5cGVbSVNfT1JERVJFRF9TRU5USU5FTF0gPSB0cnVlO1xuXG4gIE9yZGVyZWRTZXRQcm90b3R5cGUuX19lbXB0eSA9IGVtcHR5T3JkZXJlZFNldDtcbiAgT3JkZXJlZFNldFByb3RvdHlwZS5fX21ha2UgPSBtYWtlT3JkZXJlZFNldDtcblxuICBmdW5jdGlvbiBtYWtlT3JkZXJlZFNldChtYXAsIG93bmVySUQpIHtcbiAgICB2YXIgc2V0ID0gT2JqZWN0LmNyZWF0ZShPcmRlcmVkU2V0UHJvdG90eXBlKTtcbiAgICBzZXQuc2l6ZSA9IG1hcCA/IG1hcC5zaXplIDogMDtcbiAgICBzZXQuX21hcCA9IG1hcDtcbiAgICBzZXQuX19vd25lcklEID0gb3duZXJJRDtcbiAgICByZXR1cm4gc2V0O1xuICB9XG5cbiAgdmFyIEVNUFRZX09SREVSRURfU0VUO1xuICBmdW5jdGlvbiBlbXB0eU9yZGVyZWRTZXQoKSB7XG4gICAgcmV0dXJuIEVNUFRZX09SREVSRURfU0VUIHx8IChFTVBUWV9PUkRFUkVEX1NFVCA9IG1ha2VPcmRlcmVkU2V0KGVtcHR5T3JkZXJlZE1hcCgpKSk7XG4gIH1cblxuICBjcmVhdGVDbGFzcyhSZWNvcmQsIEtleWVkQ29sbGVjdGlvbik7XG5cbiAgICBmdW5jdGlvbiBSZWNvcmQoZGVmYXVsdFZhbHVlcywgbmFtZSkge1xuICAgICAgdmFyIGhhc0luaXRpYWxpemVkO1xuXG4gICAgICB2YXIgUmVjb3JkVHlwZSA9IGZ1bmN0aW9uIFJlY29yZCh2YWx1ZXMpIHtcbiAgICAgICAgaWYgKHZhbHVlcyBpbnN0YW5jZW9mIFJlY29yZFR5cGUpIHtcbiAgICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgICAgICB9XG4gICAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBSZWNvcmRUeXBlKSkge1xuICAgICAgICAgIHJldHVybiBuZXcgUmVjb3JkVHlwZSh2YWx1ZXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaGFzSW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICBoYXNJbml0aWFsaXplZCA9IHRydWU7XG4gICAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhkZWZhdWx0VmFsdWVzKTtcbiAgICAgICAgICBzZXRQcm9wcyhSZWNvcmRUeXBlUHJvdG90eXBlLCBrZXlzKTtcbiAgICAgICAgICBSZWNvcmRUeXBlUHJvdG90eXBlLnNpemUgPSBrZXlzLmxlbmd0aDtcbiAgICAgICAgICBSZWNvcmRUeXBlUHJvdG90eXBlLl9uYW1lID0gbmFtZTtcbiAgICAgICAgICBSZWNvcmRUeXBlUHJvdG90eXBlLl9rZXlzID0ga2V5cztcbiAgICAgICAgICBSZWNvcmRUeXBlUHJvdG90eXBlLl9kZWZhdWx0VmFsdWVzID0gZGVmYXVsdFZhbHVlcztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9tYXAgPSBzcmNfTWFwX19NYXAodmFsdWVzKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBSZWNvcmRUeXBlUHJvdG90eXBlID0gUmVjb3JkVHlwZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFJlY29yZFByb3RvdHlwZSk7XG4gICAgICBSZWNvcmRUeXBlUHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUmVjb3JkVHlwZTtcblxuICAgICAgcmV0dXJuIFJlY29yZFR5cGU7XG4gICAgfVxuXG4gICAgUmVjb3JkLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX190b1N0cmluZyhyZWNvcmROYW1lKHRoaXMpICsgJyB7JywgJ30nKTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBBY2Nlc3NcblxuICAgIFJlY29yZC5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24oaykge1xuICAgICAgcmV0dXJuIHRoaXMuX2RlZmF1bHRWYWx1ZXMuaGFzT3duUHJvcGVydHkoayk7XG4gICAgfTtcblxuICAgIFJlY29yZC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oaywgbm90U2V0VmFsdWUpIHtcbiAgICAgIGlmICghdGhpcy5oYXMoaykpIHtcbiAgICAgICAgcmV0dXJuIG5vdFNldFZhbHVlO1xuICAgICAgfVxuICAgICAgdmFyIGRlZmF1bHRWYWwgPSB0aGlzLl9kZWZhdWx0VmFsdWVzW2tdO1xuICAgICAgcmV0dXJuIHRoaXMuX21hcCA/IHRoaXMuX21hcC5nZXQoaywgZGVmYXVsdFZhbCkgOiBkZWZhdWx0VmFsO1xuICAgIH07XG5cbiAgICAvLyBAcHJhZ21hIE1vZGlmaWNhdGlvblxuXG4gICAgUmVjb3JkLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuX19vd25lcklEKSB7XG4gICAgICAgIHRoaXMuX21hcCAmJiB0aGlzLl9tYXAuY2xlYXIoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICB2YXIgUmVjb3JkVHlwZSA9IHRoaXMuY29uc3RydWN0b3I7XG4gICAgICByZXR1cm4gUmVjb3JkVHlwZS5fZW1wdHkgfHwgKFJlY29yZFR5cGUuX2VtcHR5ID0gbWFrZVJlY29yZCh0aGlzLCBlbXB0eU1hcCgpKSk7XG4gICAgfTtcblxuICAgIFJlY29yZC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24oaywgdikge1xuICAgICAgaWYgKCF0aGlzLmhhcyhrKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBzZXQgdW5rbm93biBrZXkgXCInICsgayArICdcIiBvbiAnICsgcmVjb3JkTmFtZSh0aGlzKSk7XG4gICAgICB9XG4gICAgICB2YXIgbmV3TWFwID0gdGhpcy5fbWFwICYmIHRoaXMuX21hcC5zZXQoaywgdik7XG4gICAgICBpZiAodGhpcy5fX293bmVySUQgfHwgbmV3TWFwID09PSB0aGlzLl9tYXApIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gbWFrZVJlY29yZCh0aGlzLCBuZXdNYXApO1xuICAgIH07XG5cbiAgICBSZWNvcmQucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKGspIHtcbiAgICAgIGlmICghdGhpcy5oYXMoaykpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICB2YXIgbmV3TWFwID0gdGhpcy5fbWFwICYmIHRoaXMuX21hcC5yZW1vdmUoayk7XG4gICAgICBpZiAodGhpcy5fX293bmVySUQgfHwgbmV3TWFwID09PSB0aGlzLl9tYXApIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gbWFrZVJlY29yZCh0aGlzLCBuZXdNYXApO1xuICAgIH07XG5cbiAgICBSZWNvcmQucHJvdG90eXBlLndhc0FsdGVyZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9tYXAud2FzQWx0ZXJlZCgpO1xuICAgIH07XG5cbiAgICBSZWNvcmQucHJvdG90eXBlLl9faXRlcmF0b3IgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICByZXR1cm4gS2V5ZWRJdGVyYWJsZSh0aGlzLl9kZWZhdWx0VmFsdWVzKS5tYXAoZnVuY3Rpb24oXywgaykgIHtyZXR1cm4gdGhpcyQwLmdldChrKX0pLl9faXRlcmF0b3IodHlwZSwgcmV2ZXJzZSk7XG4gICAgfTtcblxuICAgIFJlY29yZC5wcm90b3R5cGUuX19pdGVyYXRlID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgIHJldHVybiBLZXllZEl0ZXJhYmxlKHRoaXMuX2RlZmF1bHRWYWx1ZXMpLm1hcChmdW5jdGlvbihfLCBrKSAge3JldHVybiB0aGlzJDAuZ2V0KGspfSkuX19pdGVyYXRlKGZuLCByZXZlcnNlKTtcbiAgICB9O1xuXG4gICAgUmVjb3JkLnByb3RvdHlwZS5fX2Vuc3VyZU93bmVyID0gZnVuY3Rpb24ob3duZXJJRCkge1xuICAgICAgaWYgKG93bmVySUQgPT09IHRoaXMuX19vd25lcklEKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgdmFyIG5ld01hcCA9IHRoaXMuX21hcCAmJiB0aGlzLl9tYXAuX19lbnN1cmVPd25lcihvd25lcklEKTtcbiAgICAgIGlmICghb3duZXJJRCkge1xuICAgICAgICB0aGlzLl9fb3duZXJJRCA9IG93bmVySUQ7XG4gICAgICAgIHRoaXMuX21hcCA9IG5ld01hcDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gbWFrZVJlY29yZCh0aGlzLCBuZXdNYXAsIG93bmVySUQpO1xuICAgIH07XG5cblxuICB2YXIgUmVjb3JkUHJvdG90eXBlID0gUmVjb3JkLnByb3RvdHlwZTtcbiAgUmVjb3JkUHJvdG90eXBlW0RFTEVURV0gPSBSZWNvcmRQcm90b3R5cGUucmVtb3ZlO1xuICBSZWNvcmRQcm90b3R5cGUuZGVsZXRlSW4gPVxuICBSZWNvcmRQcm90b3R5cGUucmVtb3ZlSW4gPSBNYXBQcm90b3R5cGUucmVtb3ZlSW47XG4gIFJlY29yZFByb3RvdHlwZS5tZXJnZSA9IE1hcFByb3RvdHlwZS5tZXJnZTtcbiAgUmVjb3JkUHJvdG90eXBlLm1lcmdlV2l0aCA9IE1hcFByb3RvdHlwZS5tZXJnZVdpdGg7XG4gIFJlY29yZFByb3RvdHlwZS5tZXJnZUluID0gTWFwUHJvdG90eXBlLm1lcmdlSW47XG4gIFJlY29yZFByb3RvdHlwZS5tZXJnZURlZXAgPSBNYXBQcm90b3R5cGUubWVyZ2VEZWVwO1xuICBSZWNvcmRQcm90b3R5cGUubWVyZ2VEZWVwV2l0aCA9IE1hcFByb3RvdHlwZS5tZXJnZURlZXBXaXRoO1xuICBSZWNvcmRQcm90b3R5cGUubWVyZ2VEZWVwSW4gPSBNYXBQcm90b3R5cGUubWVyZ2VEZWVwSW47XG4gIFJlY29yZFByb3RvdHlwZS5zZXRJbiA9IE1hcFByb3RvdHlwZS5zZXRJbjtcbiAgUmVjb3JkUHJvdG90eXBlLnVwZGF0ZSA9IE1hcFByb3RvdHlwZS51cGRhdGU7XG4gIFJlY29yZFByb3RvdHlwZS51cGRhdGVJbiA9IE1hcFByb3RvdHlwZS51cGRhdGVJbjtcbiAgUmVjb3JkUHJvdG90eXBlLndpdGhNdXRhdGlvbnMgPSBNYXBQcm90b3R5cGUud2l0aE11dGF0aW9ucztcbiAgUmVjb3JkUHJvdG90eXBlLmFzTXV0YWJsZSA9IE1hcFByb3RvdHlwZS5hc011dGFibGU7XG4gIFJlY29yZFByb3RvdHlwZS5hc0ltbXV0YWJsZSA9IE1hcFByb3RvdHlwZS5hc0ltbXV0YWJsZTtcblxuXG4gIGZ1bmN0aW9uIG1ha2VSZWNvcmQobGlrZVJlY29yZCwgbWFwLCBvd25lcklEKSB7XG4gICAgdmFyIHJlY29yZCA9IE9iamVjdC5jcmVhdGUoT2JqZWN0LmdldFByb3RvdHlwZU9mKGxpa2VSZWNvcmQpKTtcbiAgICByZWNvcmQuX21hcCA9IG1hcDtcbiAgICByZWNvcmQuX19vd25lcklEID0gb3duZXJJRDtcbiAgICByZXR1cm4gcmVjb3JkO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVjb3JkTmFtZShyZWNvcmQpIHtcbiAgICByZXR1cm4gcmVjb3JkLl9uYW1lIHx8IHJlY29yZC5jb25zdHJ1Y3Rvci5uYW1lIHx8ICdSZWNvcmQnO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0UHJvcHMocHJvdG90eXBlLCBuYW1lcykge1xuICAgIHRyeSB7XG4gICAgICBuYW1lcy5mb3JFYWNoKHNldFByb3AuYmluZCh1bmRlZmluZWQsIHByb3RvdHlwZSkpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAvLyBPYmplY3QuZGVmaW5lUHJvcGVydHkgZmFpbGVkLiBQcm9iYWJseSBJRTguXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0UHJvcChwcm90b3R5cGUsIG5hbWUpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG90eXBlLCBuYW1lLCB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXQobmFtZSk7XG4gICAgICB9LFxuICAgICAgc2V0OiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpbnZhcmlhbnQodGhpcy5fX293bmVySUQsICdDYW5ub3Qgc2V0IG9uIGFuIGltbXV0YWJsZSByZWNvcmQuJyk7XG4gICAgICAgIHRoaXMuc2V0KG5hbWUsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZXBFcXVhbChhLCBiKSB7XG4gICAgaWYgKGEgPT09IGIpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgICFpc0l0ZXJhYmxlKGIpIHx8XG4gICAgICBhLnNpemUgIT09IHVuZGVmaW5lZCAmJiBiLnNpemUgIT09IHVuZGVmaW5lZCAmJiBhLnNpemUgIT09IGIuc2l6ZSB8fFxuICAgICAgYS5fX2hhc2ggIT09IHVuZGVmaW5lZCAmJiBiLl9faGFzaCAhPT0gdW5kZWZpbmVkICYmIGEuX19oYXNoICE9PSBiLl9faGFzaCB8fFxuICAgICAgaXNLZXllZChhKSAhPT0gaXNLZXllZChiKSB8fFxuICAgICAgaXNJbmRleGVkKGEpICE9PSBpc0luZGV4ZWQoYikgfHxcbiAgICAgIGlzT3JkZXJlZChhKSAhPT0gaXNPcmRlcmVkKGIpXG4gICAgKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKGEuc2l6ZSA9PT0gMCAmJiBiLnNpemUgPT09IDApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHZhciBub3RBc3NvY2lhdGl2ZSA9ICFpc0Fzc29jaWF0aXZlKGEpO1xuXG4gICAgaWYgKGlzT3JkZXJlZChhKSkge1xuICAgICAgdmFyIGVudHJpZXMgPSBhLmVudHJpZXMoKTtcbiAgICAgIHJldHVybiBiLmV2ZXJ5KGZ1bmN0aW9uKHYsIGspICB7XG4gICAgICAgIHZhciBlbnRyeSA9IGVudHJpZXMubmV4dCgpLnZhbHVlO1xuICAgICAgICByZXR1cm4gZW50cnkgJiYgaXMoZW50cnlbMV0sIHYpICYmIChub3RBc3NvY2lhdGl2ZSB8fCBpcyhlbnRyeVswXSwgaykpO1xuICAgICAgfSkgJiYgZW50cmllcy5uZXh0KCkuZG9uZTtcbiAgICB9XG5cbiAgICB2YXIgZmxpcHBlZCA9IGZhbHNlO1xuXG4gICAgaWYgKGEuc2l6ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAoYi5zaXplID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhLmNhY2hlUmVzdWx0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgYS5jYWNoZVJlc3VsdCgpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmbGlwcGVkID0gdHJ1ZTtcbiAgICAgICAgdmFyIF8gPSBhO1xuICAgICAgICBhID0gYjtcbiAgICAgICAgYiA9IF87XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGFsbEVxdWFsID0gdHJ1ZTtcbiAgICB2YXIgYlNpemUgPSBiLl9faXRlcmF0ZShmdW5jdGlvbih2LCBrKSAge1xuICAgICAgaWYgKG5vdEFzc29jaWF0aXZlID8gIWEuaGFzKHYpIDpcbiAgICAgICAgICBmbGlwcGVkID8gIWlzKHYsIGEuZ2V0KGssIE5PVF9TRVQpKSA6ICFpcyhhLmdldChrLCBOT1RfU0VUKSwgdikpIHtcbiAgICAgICAgYWxsRXF1YWwgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGFsbEVxdWFsICYmIGEuc2l6ZSA9PT0gYlNpemU7XG4gIH1cblxuICBjcmVhdGVDbGFzcyhSYW5nZSwgSW5kZXhlZFNlcSk7XG5cbiAgICBmdW5jdGlvbiBSYW5nZShzdGFydCwgZW5kLCBzdGVwKSB7XG4gICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUmFuZ2UpKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmFuZ2Uoc3RhcnQsIGVuZCwgc3RlcCk7XG4gICAgICB9XG4gICAgICBpbnZhcmlhbnQoc3RlcCAhPT0gMCwgJ0Nhbm5vdCBzdGVwIGEgUmFuZ2UgYnkgMCcpO1xuICAgICAgc3RhcnQgPSBzdGFydCB8fCAwO1xuICAgICAgaWYgKGVuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGVuZCA9IEluZmluaXR5O1xuICAgICAgfVxuICAgICAgc3RlcCA9IHN0ZXAgPT09IHVuZGVmaW5lZCA/IDEgOiBNYXRoLmFicyhzdGVwKTtcbiAgICAgIGlmIChlbmQgPCBzdGFydCkge1xuICAgICAgICBzdGVwID0gLXN0ZXA7XG4gICAgICB9XG4gICAgICB0aGlzLl9zdGFydCA9IHN0YXJ0O1xuICAgICAgdGhpcy5fZW5kID0gZW5kO1xuICAgICAgdGhpcy5fc3RlcCA9IHN0ZXA7XG4gICAgICB0aGlzLnNpemUgPSBNYXRoLm1heCgwLCBNYXRoLmNlaWwoKGVuZCAtIHN0YXJ0KSAvIHN0ZXAgLSAxKSArIDEpO1xuICAgICAgaWYgKHRoaXMuc2l6ZSA9PT0gMCkge1xuICAgICAgICBpZiAoRU1QVFlfUkFOR0UpIHtcbiAgICAgICAgICByZXR1cm4gRU1QVFlfUkFOR0U7XG4gICAgICAgIH1cbiAgICAgICAgRU1QVFlfUkFOR0UgPSB0aGlzO1xuICAgICAgfVxuICAgIH1cblxuICAgIFJhbmdlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuc2l6ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gJ1JhbmdlIFtdJztcbiAgICAgIH1cbiAgICAgIHJldHVybiAnUmFuZ2UgWyAnICtcbiAgICAgICAgdGhpcy5fc3RhcnQgKyAnLi4uJyArIHRoaXMuX2VuZCArXG4gICAgICAgICh0aGlzLl9zdGVwID4gMSA/ICcgYnkgJyArIHRoaXMuX3N0ZXAgOiAnJykgK1xuICAgICAgJyBdJztcbiAgICB9O1xuXG4gICAgUmFuZ2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGluZGV4LCBub3RTZXRWYWx1ZSkge1xuICAgICAgcmV0dXJuIHRoaXMuaGFzKGluZGV4KSA/XG4gICAgICAgIHRoaXMuX3N0YXJ0ICsgd3JhcEluZGV4KHRoaXMsIGluZGV4KSAqIHRoaXMuX3N0ZXAgOlxuICAgICAgICBub3RTZXRWYWx1ZTtcbiAgICB9O1xuXG4gICAgUmFuZ2UucHJvdG90eXBlLmluY2x1ZGVzID0gZnVuY3Rpb24oc2VhcmNoVmFsdWUpIHtcbiAgICAgIHZhciBwb3NzaWJsZUluZGV4ID0gKHNlYXJjaFZhbHVlIC0gdGhpcy5fc3RhcnQpIC8gdGhpcy5fc3RlcDtcbiAgICAgIHJldHVybiBwb3NzaWJsZUluZGV4ID49IDAgJiZcbiAgICAgICAgcG9zc2libGVJbmRleCA8IHRoaXMuc2l6ZSAmJlxuICAgICAgICBwb3NzaWJsZUluZGV4ID09PSBNYXRoLmZsb29yKHBvc3NpYmxlSW5kZXgpO1xuICAgIH07XG5cbiAgICBSYW5nZS5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbihiZWdpbiwgZW5kKSB7XG4gICAgICBpZiAod2hvbGVTbGljZShiZWdpbiwgZW5kLCB0aGlzLnNpemUpKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgYmVnaW4gPSByZXNvbHZlQmVnaW4oYmVnaW4sIHRoaXMuc2l6ZSk7XG4gICAgICBlbmQgPSByZXNvbHZlRW5kKGVuZCwgdGhpcy5zaXplKTtcbiAgICAgIGlmIChlbmQgPD0gYmVnaW4pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSYW5nZSgwLCAwKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgUmFuZ2UodGhpcy5nZXQoYmVnaW4sIHRoaXMuX2VuZCksIHRoaXMuZ2V0KGVuZCwgdGhpcy5fZW5kKSwgdGhpcy5fc3RlcCk7XG4gICAgfTtcblxuICAgIFJhbmdlLnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24oc2VhcmNoVmFsdWUpIHtcbiAgICAgIHZhciBvZmZzZXRWYWx1ZSA9IHNlYXJjaFZhbHVlIC0gdGhpcy5fc3RhcnQ7XG4gICAgICBpZiAob2Zmc2V0VmFsdWUgJSB0aGlzLl9zdGVwID09PSAwKSB7XG4gICAgICAgIHZhciBpbmRleCA9IG9mZnNldFZhbHVlIC8gdGhpcy5fc3RlcDtcbiAgICAgICAgaWYgKGluZGV4ID49IDAgJiYgaW5kZXggPCB0aGlzLnNpemUpIHtcbiAgICAgICAgICByZXR1cm4gaW5kZXhcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIC0xO1xuICAgIH07XG5cbiAgICBSYW5nZS5wcm90b3R5cGUubGFzdEluZGV4T2YgPSBmdW5jdGlvbihzZWFyY2hWYWx1ZSkge1xuICAgICAgcmV0dXJuIHRoaXMuaW5kZXhPZihzZWFyY2hWYWx1ZSk7XG4gICAgfTtcblxuICAgIFJhbmdlLnByb3RvdHlwZS5fX2l0ZXJhdGUgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge1xuICAgICAgdmFyIG1heEluZGV4ID0gdGhpcy5zaXplIC0gMTtcbiAgICAgIHZhciBzdGVwID0gdGhpcy5fc3RlcDtcbiAgICAgIHZhciB2YWx1ZSA9IHJldmVyc2UgPyB0aGlzLl9zdGFydCArIG1heEluZGV4ICogc3RlcCA6IHRoaXMuX3N0YXJ0O1xuICAgICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8PSBtYXhJbmRleDsgaWkrKykge1xuICAgICAgICBpZiAoZm4odmFsdWUsIGlpLCB0aGlzKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICByZXR1cm4gaWkgKyAxO1xuICAgICAgICB9XG4gICAgICAgIHZhbHVlICs9IHJldmVyc2UgPyAtc3RlcCA6IHN0ZXA7XG4gICAgICB9XG4gICAgICByZXR1cm4gaWk7XG4gICAgfTtcblxuICAgIFJhbmdlLnByb3RvdHlwZS5fX2l0ZXJhdG9yID0gZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkge1xuICAgICAgdmFyIG1heEluZGV4ID0gdGhpcy5zaXplIC0gMTtcbiAgICAgIHZhciBzdGVwID0gdGhpcy5fc3RlcDtcbiAgICAgIHZhciB2YWx1ZSA9IHJldmVyc2UgPyB0aGlzLl9zdGFydCArIG1heEluZGV4ICogc3RlcCA6IHRoaXMuX3N0YXJ0O1xuICAgICAgdmFyIGlpID0gMDtcbiAgICAgIHJldHVybiBuZXcgc3JjX0l0ZXJhdG9yX19JdGVyYXRvcihmdW5jdGlvbigpICB7XG4gICAgICAgIHZhciB2ID0gdmFsdWU7XG4gICAgICAgIHZhbHVlICs9IHJldmVyc2UgPyAtc3RlcCA6IHN0ZXA7XG4gICAgICAgIHJldHVybiBpaSA+IG1heEluZGV4ID8gaXRlcmF0b3JEb25lKCkgOiBpdGVyYXRvclZhbHVlKHR5cGUsIGlpKyssIHYpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIFJhbmdlLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbihvdGhlcikge1xuICAgICAgcmV0dXJuIG90aGVyIGluc3RhbmNlb2YgUmFuZ2UgP1xuICAgICAgICB0aGlzLl9zdGFydCA9PT0gb3RoZXIuX3N0YXJ0ICYmXG4gICAgICAgIHRoaXMuX2VuZCA9PT0gb3RoZXIuX2VuZCAmJlxuICAgICAgICB0aGlzLl9zdGVwID09PSBvdGhlci5fc3RlcCA6XG4gICAgICAgIGRlZXBFcXVhbCh0aGlzLCBvdGhlcik7XG4gICAgfTtcblxuXG4gIHZhciBFTVBUWV9SQU5HRTtcblxuICBjcmVhdGVDbGFzcyhSZXBlYXQsIEluZGV4ZWRTZXEpO1xuXG4gICAgZnVuY3Rpb24gUmVwZWF0KHZhbHVlLCB0aW1lcykge1xuICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFJlcGVhdCkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBlYXQodmFsdWUsIHRpbWVzKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICB0aGlzLnNpemUgPSB0aW1lcyA9PT0gdW5kZWZpbmVkID8gSW5maW5pdHkgOiBNYXRoLm1heCgwLCB0aW1lcyk7XG4gICAgICBpZiAodGhpcy5zaXplID09PSAwKSB7XG4gICAgICAgIGlmIChFTVBUWV9SRVBFQVQpIHtcbiAgICAgICAgICByZXR1cm4gRU1QVFlfUkVQRUFUO1xuICAgICAgICB9XG4gICAgICAgIEVNUFRZX1JFUEVBVCA9IHRoaXM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgUmVwZWF0LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuc2l6ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gJ1JlcGVhdCBbXSc7XG4gICAgICB9XG4gICAgICByZXR1cm4gJ1JlcGVhdCBbICcgKyB0aGlzLl92YWx1ZSArICcgJyArIHRoaXMuc2l6ZSArICcgdGltZXMgXSc7XG4gICAgfTtcblxuICAgIFJlcGVhdC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oaW5kZXgsIG5vdFNldFZhbHVlKSB7XG4gICAgICByZXR1cm4gdGhpcy5oYXMoaW5kZXgpID8gdGhpcy5fdmFsdWUgOiBub3RTZXRWYWx1ZTtcbiAgICB9O1xuXG4gICAgUmVwZWF0LnByb3RvdHlwZS5pbmNsdWRlcyA9IGZ1bmN0aW9uKHNlYXJjaFZhbHVlKSB7XG4gICAgICByZXR1cm4gaXModGhpcy5fdmFsdWUsIHNlYXJjaFZhbHVlKTtcbiAgICB9O1xuXG4gICAgUmVwZWF0LnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uKGJlZ2luLCBlbmQpIHtcbiAgICAgIHZhciBzaXplID0gdGhpcy5zaXplO1xuICAgICAgcmV0dXJuIHdob2xlU2xpY2UoYmVnaW4sIGVuZCwgc2l6ZSkgPyB0aGlzIDpcbiAgICAgICAgbmV3IFJlcGVhdCh0aGlzLl92YWx1ZSwgcmVzb2x2ZUVuZChlbmQsIHNpemUpIC0gcmVzb2x2ZUJlZ2luKGJlZ2luLCBzaXplKSk7XG4gICAgfTtcblxuICAgIFJlcGVhdC5wcm90b3R5cGUucmV2ZXJzZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIFJlcGVhdC5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uKHNlYXJjaFZhbHVlKSB7XG4gICAgICBpZiAoaXModGhpcy5fdmFsdWUsIHNlYXJjaFZhbHVlKSkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiAtMTtcbiAgICB9O1xuXG4gICAgUmVwZWF0LnByb3RvdHlwZS5sYXN0SW5kZXhPZiA9IGZ1bmN0aW9uKHNlYXJjaFZhbHVlKSB7XG4gICAgICBpZiAoaXModGhpcy5fdmFsdWUsIHNlYXJjaFZhbHVlKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zaXplO1xuICAgICAgfVxuICAgICAgcmV0dXJuIC0xO1xuICAgIH07XG5cbiAgICBSZXBlYXQucHJvdG90eXBlLl9faXRlcmF0ZSA9IGZ1bmN0aW9uKGZuLCByZXZlcnNlKSB7XG4gICAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgdGhpcy5zaXplOyBpaSsrKSB7XG4gICAgICAgIGlmIChmbih0aGlzLl92YWx1ZSwgaWksIHRoaXMpID09PSBmYWxzZSkge1xuICAgICAgICAgIHJldHVybiBpaSArIDE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBpaTtcbiAgICB9O1xuXG4gICAgUmVwZWF0LnByb3RvdHlwZS5fX2l0ZXJhdG9yID0gZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgdmFyIGlpID0gMDtcbiAgICAgIHJldHVybiBuZXcgc3JjX0l0ZXJhdG9yX19JdGVyYXRvcihmdW5jdGlvbigpIFxuICAgICAgICB7cmV0dXJuIGlpIDwgdGhpcyQwLnNpemUgPyBpdGVyYXRvclZhbHVlKHR5cGUsIGlpKyssIHRoaXMkMC5fdmFsdWUpIDogaXRlcmF0b3JEb25lKCl9XG4gICAgICApO1xuICAgIH07XG5cbiAgICBSZXBlYXQucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uKG90aGVyKSB7XG4gICAgICByZXR1cm4gb3RoZXIgaW5zdGFuY2VvZiBSZXBlYXQgP1xuICAgICAgICBpcyh0aGlzLl92YWx1ZSwgb3RoZXIuX3ZhbHVlKSA6XG4gICAgICAgIGRlZXBFcXVhbChvdGhlcik7XG4gICAgfTtcblxuXG4gIHZhciBFTVBUWV9SRVBFQVQ7XG5cbiAgLyoqXG4gICAqIENvbnRyaWJ1dGVzIGFkZGl0aW9uYWwgbWV0aG9kcyB0byBhIGNvbnN0cnVjdG9yXG4gICAqL1xuICBmdW5jdGlvbiBtaXhpbihjdG9yLCBtZXRob2RzKSB7XG4gICAgdmFyIGtleUNvcGllciA9IGZ1bmN0aW9uKGtleSApIHsgY3Rvci5wcm90b3R5cGVba2V5XSA9IG1ldGhvZHNba2V5XTsgfTtcbiAgICBPYmplY3Qua2V5cyhtZXRob2RzKS5mb3JFYWNoKGtleUNvcGllcik7XG4gICAgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyAmJlxuICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhtZXRob2RzKS5mb3JFYWNoKGtleUNvcGllcik7XG4gICAgcmV0dXJuIGN0b3I7XG4gIH1cblxuICBJdGVyYWJsZS5JdGVyYXRvciA9IHNyY19JdGVyYXRvcl9fSXRlcmF0b3I7XG5cbiAgbWl4aW4oSXRlcmFibGUsIHtcblxuICAgIC8vICMjIyBDb252ZXJzaW9uIHRvIG90aGVyIHR5cGVzXG5cbiAgICB0b0FycmF5OiBmdW5jdGlvbigpIHtcbiAgICAgIGFzc2VydE5vdEluZmluaXRlKHRoaXMuc2l6ZSk7XG4gICAgICB2YXIgYXJyYXkgPSBuZXcgQXJyYXkodGhpcy5zaXplIHx8IDApO1xuICAgICAgdGhpcy52YWx1ZVNlcSgpLl9faXRlcmF0ZShmdW5jdGlvbih2LCBpKSAgeyBhcnJheVtpXSA9IHY7IH0pO1xuICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH0sXG5cbiAgICB0b0luZGV4ZWRTZXE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBUb0luZGV4ZWRTZXF1ZW5jZSh0aGlzKTtcbiAgICB9LFxuXG4gICAgdG9KUzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy50b1NlcSgpLm1hcChcbiAgICAgICAgZnVuY3Rpb24odmFsdWUgKSB7cmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZS50b0pTID09PSAnZnVuY3Rpb24nID8gdmFsdWUudG9KUygpIDogdmFsdWV9XG4gICAgICApLl9fdG9KUygpO1xuICAgIH0sXG5cbiAgICB0b0pTT046IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMudG9TZXEoKS5tYXAoXG4gICAgICAgIGZ1bmN0aW9uKHZhbHVlICkge3JldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUudG9KU09OID09PSAnZnVuY3Rpb24nID8gdmFsdWUudG9KU09OKCkgOiB2YWx1ZX1cbiAgICAgICkuX190b0pTKCk7XG4gICAgfSxcblxuICAgIHRvS2V5ZWRTZXE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBUb0tleWVkU2VxdWVuY2UodGhpcywgdHJ1ZSk7XG4gICAgfSxcblxuICAgIHRvTWFwOiBmdW5jdGlvbigpIHtcbiAgICAgIC8vIFVzZSBMYXRlIEJpbmRpbmcgaGVyZSB0byBzb2x2ZSB0aGUgY2lyY3VsYXIgZGVwZW5kZW5jeS5cbiAgICAgIHJldHVybiBzcmNfTWFwX19NYXAodGhpcy50b0tleWVkU2VxKCkpO1xuICAgIH0sXG5cbiAgICB0b09iamVjdDogZnVuY3Rpb24oKSB7XG4gICAgICBhc3NlcnROb3RJbmZpbml0ZSh0aGlzLnNpemUpO1xuICAgICAgdmFyIG9iamVjdCA9IHt9O1xuICAgICAgdGhpcy5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaykgIHsgb2JqZWN0W2tdID0gdjsgfSk7XG4gICAgICByZXR1cm4gb2JqZWN0O1xuICAgIH0sXG5cbiAgICB0b09yZGVyZWRNYXA6IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gVXNlIExhdGUgQmluZGluZyBoZXJlIHRvIHNvbHZlIHRoZSBjaXJjdWxhciBkZXBlbmRlbmN5LlxuICAgICAgcmV0dXJuIE9yZGVyZWRNYXAodGhpcy50b0tleWVkU2VxKCkpO1xuICAgIH0sXG5cbiAgICB0b09yZGVyZWRTZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gVXNlIExhdGUgQmluZGluZyBoZXJlIHRvIHNvbHZlIHRoZSBjaXJjdWxhciBkZXBlbmRlbmN5LlxuICAgICAgcmV0dXJuIE9yZGVyZWRTZXQoaXNLZXllZCh0aGlzKSA/IHRoaXMudmFsdWVTZXEoKSA6IHRoaXMpO1xuICAgIH0sXG5cbiAgICB0b1NldDogZnVuY3Rpb24oKSB7XG4gICAgICAvLyBVc2UgTGF0ZSBCaW5kaW5nIGhlcmUgdG8gc29sdmUgdGhlIGNpcmN1bGFyIGRlcGVuZGVuY3kuXG4gICAgICByZXR1cm4gc3JjX1NldF9fU2V0KGlzS2V5ZWQodGhpcykgPyB0aGlzLnZhbHVlU2VxKCkgOiB0aGlzKTtcbiAgICB9LFxuXG4gICAgdG9TZXRTZXE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBUb1NldFNlcXVlbmNlKHRoaXMpO1xuICAgIH0sXG5cbiAgICB0b1NlcTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gaXNJbmRleGVkKHRoaXMpID8gdGhpcy50b0luZGV4ZWRTZXEoKSA6XG4gICAgICAgIGlzS2V5ZWQodGhpcykgPyB0aGlzLnRvS2V5ZWRTZXEoKSA6XG4gICAgICAgIHRoaXMudG9TZXRTZXEoKTtcbiAgICB9LFxuXG4gICAgdG9TdGFjazogZnVuY3Rpb24oKSB7XG4gICAgICAvLyBVc2UgTGF0ZSBCaW5kaW5nIGhlcmUgdG8gc29sdmUgdGhlIGNpcmN1bGFyIGRlcGVuZGVuY3kuXG4gICAgICByZXR1cm4gU3RhY2soaXNLZXllZCh0aGlzKSA/IHRoaXMudmFsdWVTZXEoKSA6IHRoaXMpO1xuICAgIH0sXG5cbiAgICB0b0xpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gVXNlIExhdGUgQmluZGluZyBoZXJlIHRvIHNvbHZlIHRoZSBjaXJjdWxhciBkZXBlbmRlbmN5LlxuICAgICAgcmV0dXJuIExpc3QoaXNLZXllZCh0aGlzKSA/IHRoaXMudmFsdWVTZXEoKSA6IHRoaXMpO1xuICAgIH0sXG5cblxuICAgIC8vICMjIyBDb21tb24gSmF2YVNjcmlwdCBtZXRob2RzIGFuZCBwcm9wZXJ0aWVzXG5cbiAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJ1tJdGVyYWJsZV0nO1xuICAgIH0sXG5cbiAgICBfX3RvU3RyaW5nOiBmdW5jdGlvbihoZWFkLCB0YWlsKSB7XG4gICAgICBpZiAodGhpcy5zaXplID09PSAwKSB7XG4gICAgICAgIHJldHVybiBoZWFkICsgdGFpbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBoZWFkICsgJyAnICsgdGhpcy50b1NlcSgpLm1hcCh0aGlzLl9fdG9TdHJpbmdNYXBwZXIpLmpvaW4oJywgJykgKyAnICcgKyB0YWlsO1xuICAgIH0sXG5cblxuICAgIC8vICMjIyBFUzYgQ29sbGVjdGlvbiBtZXRob2RzIChFUzYgQXJyYXkgYW5kIE1hcClcblxuICAgIGNvbmNhdDogZnVuY3Rpb24oKSB7dmFyIHZhbHVlcyA9IFNMSUNFJDAuY2FsbChhcmd1bWVudHMsIDApO1xuICAgICAgcmV0dXJuIHJlaWZ5KHRoaXMsIGNvbmNhdEZhY3RvcnkodGhpcywgdmFsdWVzKSk7XG4gICAgfSxcblxuICAgIGNvbnRhaW5zOiBmdW5jdGlvbihzZWFyY2hWYWx1ZSkge1xuICAgICAgcmV0dXJuIHRoaXMuaW5jbHVkZXMoc2VhcmNoVmFsdWUpO1xuICAgIH0sXG5cbiAgICBpbmNsdWRlczogZnVuY3Rpb24oc2VhcmNoVmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLnNvbWUoZnVuY3Rpb24odmFsdWUgKSB7cmV0dXJuIGlzKHZhbHVlLCBzZWFyY2hWYWx1ZSl9KTtcbiAgICB9LFxuXG4gICAgZW50cmllczogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2l0ZXJhdG9yKElURVJBVEVfRU5UUklFUyk7XG4gICAgfSxcblxuICAgIGV2ZXJ5OiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIGFzc2VydE5vdEluZmluaXRlKHRoaXMuc2l6ZSk7XG4gICAgICB2YXIgcmV0dXJuVmFsdWUgPSB0cnVlO1xuICAgICAgdGhpcy5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaywgYykgIHtcbiAgICAgICAgaWYgKCFwcmVkaWNhdGUuY2FsbChjb250ZXh0LCB2LCBrLCBjKSkge1xuICAgICAgICAgIHJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXR1cm5WYWx1ZTtcbiAgICB9LFxuXG4gICAgZmlsdGVyOiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCBmaWx0ZXJGYWN0b3J5KHRoaXMsIHByZWRpY2F0ZSwgY29udGV4dCwgdHJ1ZSkpO1xuICAgIH0sXG5cbiAgICBmaW5kOiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQsIG5vdFNldFZhbHVlKSB7XG4gICAgICB2YXIgZW50cnkgPSB0aGlzLmZpbmRFbnRyeShwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGVudHJ5ID8gZW50cnlbMV0gOiBub3RTZXRWYWx1ZTtcbiAgICB9LFxuXG4gICAgZmluZEVudHJ5OiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIHZhciBmb3VuZDtcbiAgICAgIHRoaXMuX19pdGVyYXRlKGZ1bmN0aW9uKHYsIGssIGMpICB7XG4gICAgICAgIGlmIChwcmVkaWNhdGUuY2FsbChjb250ZXh0LCB2LCBrLCBjKSkge1xuICAgICAgICAgIGZvdW5kID0gW2ssIHZdO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gZm91bmQ7XG4gICAgfSxcblxuICAgIGZpbmRMYXN0RW50cnk6IGZ1bmN0aW9uKHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgICAgcmV0dXJuIHRoaXMudG9TZXEoKS5yZXZlcnNlKCkuZmluZEVudHJ5KHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgfSxcblxuICAgIGZvckVhY2g6IGZ1bmN0aW9uKHNpZGVFZmZlY3QsIGNvbnRleHQpIHtcbiAgICAgIGFzc2VydE5vdEluZmluaXRlKHRoaXMuc2l6ZSk7XG4gICAgICByZXR1cm4gdGhpcy5fX2l0ZXJhdGUoY29udGV4dCA/IHNpZGVFZmZlY3QuYmluZChjb250ZXh0KSA6IHNpZGVFZmZlY3QpO1xuICAgIH0sXG5cbiAgICBqb2luOiBmdW5jdGlvbihzZXBhcmF0b3IpIHtcbiAgICAgIGFzc2VydE5vdEluZmluaXRlKHRoaXMuc2l6ZSk7XG4gICAgICBzZXBhcmF0b3IgPSBzZXBhcmF0b3IgIT09IHVuZGVmaW5lZCA/ICcnICsgc2VwYXJhdG9yIDogJywnO1xuICAgICAgdmFyIGpvaW5lZCA9ICcnO1xuICAgICAgdmFyIGlzRmlyc3QgPSB0cnVlO1xuICAgICAgdGhpcy5fX2l0ZXJhdGUoZnVuY3Rpb24odiApIHtcbiAgICAgICAgaXNGaXJzdCA/IChpc0ZpcnN0ID0gZmFsc2UpIDogKGpvaW5lZCArPSBzZXBhcmF0b3IpO1xuICAgICAgICBqb2luZWQgKz0gdiAhPT0gbnVsbCAmJiB2ICE9PSB1bmRlZmluZWQgPyB2LnRvU3RyaW5nKCkgOiAnJztcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGpvaW5lZDtcbiAgICB9LFxuXG4gICAga2V5czogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2l0ZXJhdG9yKElURVJBVEVfS0VZUyk7XG4gICAgfSxcblxuICAgIG1hcDogZnVuY3Rpb24obWFwcGVyLCBjb250ZXh0KSB7XG4gICAgICByZXR1cm4gcmVpZnkodGhpcywgbWFwRmFjdG9yeSh0aGlzLCBtYXBwZXIsIGNvbnRleHQpKTtcbiAgICB9LFxuXG4gICAgcmVkdWNlOiBmdW5jdGlvbihyZWR1Y2VyLCBpbml0aWFsUmVkdWN0aW9uLCBjb250ZXh0KSB7XG4gICAgICBhc3NlcnROb3RJbmZpbml0ZSh0aGlzLnNpemUpO1xuICAgICAgdmFyIHJlZHVjdGlvbjtcbiAgICAgIHZhciB1c2VGaXJzdDtcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMikge1xuICAgICAgICB1c2VGaXJzdCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWR1Y3Rpb24gPSBpbml0aWFsUmVkdWN0aW9uO1xuICAgICAgfVxuICAgICAgdGhpcy5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaywgYykgIHtcbiAgICAgICAgaWYgKHVzZUZpcnN0KSB7XG4gICAgICAgICAgdXNlRmlyc3QgPSBmYWxzZTtcbiAgICAgICAgICByZWR1Y3Rpb24gPSB2O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlZHVjdGlvbiA9IHJlZHVjZXIuY2FsbChjb250ZXh0LCByZWR1Y3Rpb24sIHYsIGssIGMpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZWR1Y3Rpb247XG4gICAgfSxcblxuICAgIHJlZHVjZVJpZ2h0OiBmdW5jdGlvbihyZWR1Y2VyLCBpbml0aWFsUmVkdWN0aW9uLCBjb250ZXh0KSB7XG4gICAgICB2YXIgcmV2ZXJzZWQgPSB0aGlzLnRvS2V5ZWRTZXEoKS5yZXZlcnNlKCk7XG4gICAgICByZXR1cm4gcmV2ZXJzZWQucmVkdWNlLmFwcGx5KHJldmVyc2VkLCBhcmd1bWVudHMpO1xuICAgIH0sXG5cbiAgICByZXZlcnNlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCByZXZlcnNlRmFjdG9yeSh0aGlzLCB0cnVlKSk7XG4gICAgfSxcblxuICAgIHNsaWNlOiBmdW5jdGlvbihiZWdpbiwgZW5kKSB7XG4gICAgICByZXR1cm4gcmVpZnkodGhpcywgc2xpY2VGYWN0b3J5KHRoaXMsIGJlZ2luLCBlbmQsIHRydWUpKTtcbiAgICB9LFxuXG4gICAgc29tZTogZnVuY3Rpb24ocHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgICByZXR1cm4gIXRoaXMuZXZlcnkobm90KHByZWRpY2F0ZSksIGNvbnRleHQpO1xuICAgIH0sXG5cbiAgICBzb3J0OiBmdW5jdGlvbihjb21wYXJhdG9yKSB7XG4gICAgICByZXR1cm4gcmVpZnkodGhpcywgc29ydEZhY3RvcnkodGhpcywgY29tcGFyYXRvcikpO1xuICAgIH0sXG5cbiAgICB2YWx1ZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX19pdGVyYXRvcihJVEVSQVRFX1ZBTFVFUyk7XG4gICAgfSxcblxuXG4gICAgLy8gIyMjIE1vcmUgc2VxdWVudGlhbCBtZXRob2RzXG5cbiAgICBidXRMYXN0OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnNsaWNlKDAsIC0xKTtcbiAgICB9LFxuXG4gICAgaXNFbXB0eTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5zaXplICE9PSB1bmRlZmluZWQgPyB0aGlzLnNpemUgPT09IDAgOiAhdGhpcy5zb21lKGZ1bmN0aW9uKCkgIHtyZXR1cm4gdHJ1ZX0pO1xuICAgIH0sXG5cbiAgICBjb3VudDogZnVuY3Rpb24ocHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgICByZXR1cm4gZW5zdXJlU2l6ZShcbiAgICAgICAgcHJlZGljYXRlID8gdGhpcy50b1NlcSgpLmZpbHRlcihwcmVkaWNhdGUsIGNvbnRleHQpIDogdGhpc1xuICAgICAgKTtcbiAgICB9LFxuXG4gICAgY291bnRCeTogZnVuY3Rpb24oZ3JvdXBlciwgY29udGV4dCkge1xuICAgICAgcmV0dXJuIGNvdW50QnlGYWN0b3J5KHRoaXMsIGdyb3VwZXIsIGNvbnRleHQpO1xuICAgIH0sXG5cbiAgICBlcXVhbHM6IGZ1bmN0aW9uKG90aGVyKSB7XG4gICAgICByZXR1cm4gZGVlcEVxdWFsKHRoaXMsIG90aGVyKTtcbiAgICB9LFxuXG4gICAgZW50cnlTZXE6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGl0ZXJhYmxlID0gdGhpcztcbiAgICAgIGlmIChpdGVyYWJsZS5fY2FjaGUpIHtcbiAgICAgICAgLy8gV2UgY2FjaGUgYXMgYW4gZW50cmllcyBhcnJheSwgc28gd2UgY2FuIGp1c3QgcmV0dXJuIHRoZSBjYWNoZSFcbiAgICAgICAgcmV0dXJuIG5ldyBBcnJheVNlcShpdGVyYWJsZS5fY2FjaGUpO1xuICAgICAgfVxuICAgICAgdmFyIGVudHJpZXNTZXF1ZW5jZSA9IGl0ZXJhYmxlLnRvU2VxKCkubWFwKGVudHJ5TWFwcGVyKS50b0luZGV4ZWRTZXEoKTtcbiAgICAgIGVudHJpZXNTZXF1ZW5jZS5mcm9tRW50cnlTZXEgPSBmdW5jdGlvbigpICB7cmV0dXJuIGl0ZXJhYmxlLnRvU2VxKCl9O1xuICAgICAgcmV0dXJuIGVudHJpZXNTZXF1ZW5jZTtcbiAgICB9LFxuXG4gICAgZmlsdGVyTm90OiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIHJldHVybiB0aGlzLmZpbHRlcihub3QocHJlZGljYXRlKSwgY29udGV4dCk7XG4gICAgfSxcblxuICAgIGZpbmRMYXN0OiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQsIG5vdFNldFZhbHVlKSB7XG4gICAgICByZXR1cm4gdGhpcy50b0tleWVkU2VxKCkucmV2ZXJzZSgpLmZpbmQocHJlZGljYXRlLCBjb250ZXh0LCBub3RTZXRWYWx1ZSk7XG4gICAgfSxcblxuICAgIGZpcnN0OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmZpbmQocmV0dXJuVHJ1ZSk7XG4gICAgfSxcblxuICAgIGZsYXRNYXA6IGZ1bmN0aW9uKG1hcHBlciwgY29udGV4dCkge1xuICAgICAgcmV0dXJuIHJlaWZ5KHRoaXMsIGZsYXRNYXBGYWN0b3J5KHRoaXMsIG1hcHBlciwgY29udGV4dCkpO1xuICAgIH0sXG5cbiAgICBmbGF0dGVuOiBmdW5jdGlvbihkZXB0aCkge1xuICAgICAgcmV0dXJuIHJlaWZ5KHRoaXMsIGZsYXR0ZW5GYWN0b3J5KHRoaXMsIGRlcHRoLCB0cnVlKSk7XG4gICAgfSxcblxuICAgIGZyb21FbnRyeVNlcTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEZyb21FbnRyaWVzU2VxdWVuY2UodGhpcyk7XG4gICAgfSxcblxuICAgIGdldDogZnVuY3Rpb24oc2VhcmNoS2V5LCBub3RTZXRWYWx1ZSkge1xuICAgICAgcmV0dXJuIHRoaXMuZmluZChmdW5jdGlvbihfLCBrZXkpICB7cmV0dXJuIGlzKGtleSwgc2VhcmNoS2V5KX0sIHVuZGVmaW5lZCwgbm90U2V0VmFsdWUpO1xuICAgIH0sXG5cbiAgICBnZXRJbjogZnVuY3Rpb24oc2VhcmNoS2V5UGF0aCwgbm90U2V0VmFsdWUpIHtcbiAgICAgIHZhciBuZXN0ZWQgPSB0aGlzO1xuICAgICAgLy8gTm90ZTogaW4gYW4gRVM2IGVudmlyb25tZW50LCB3ZSB3b3VsZCBwcmVmZXI6XG4gICAgICAvLyBmb3IgKHZhciBrZXkgb2Ygc2VhcmNoS2V5UGF0aCkge1xuICAgICAgdmFyIGl0ZXIgPSBmb3JjZUl0ZXJhdG9yKHNlYXJjaEtleVBhdGgpO1xuICAgICAgdmFyIHN0ZXA7XG4gICAgICB3aGlsZSAoIShzdGVwID0gaXRlci5uZXh0KCkpLmRvbmUpIHtcbiAgICAgICAgdmFyIGtleSA9IHN0ZXAudmFsdWU7XG4gICAgICAgIG5lc3RlZCA9IG5lc3RlZCAmJiBuZXN0ZWQuZ2V0ID8gbmVzdGVkLmdldChrZXksIE5PVF9TRVQpIDogTk9UX1NFVDtcbiAgICAgICAgaWYgKG5lc3RlZCA9PT0gTk9UX1NFVCkge1xuICAgICAgICAgIHJldHVybiBub3RTZXRWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG5lc3RlZDtcbiAgICB9LFxuXG4gICAgZ3JvdXBCeTogZnVuY3Rpb24oZ3JvdXBlciwgY29udGV4dCkge1xuICAgICAgcmV0dXJuIGdyb3VwQnlGYWN0b3J5KHRoaXMsIGdyb3VwZXIsIGNvbnRleHQpO1xuICAgIH0sXG5cbiAgICBoYXM6IGZ1bmN0aW9uKHNlYXJjaEtleSkge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0KHNlYXJjaEtleSwgTk9UX1NFVCkgIT09IE5PVF9TRVQ7XG4gICAgfSxcblxuICAgIGhhc0luOiBmdW5jdGlvbihzZWFyY2hLZXlQYXRoKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRJbihzZWFyY2hLZXlQYXRoLCBOT1RfU0VUKSAhPT0gTk9UX1NFVDtcbiAgICB9LFxuXG4gICAgaXNTdWJzZXQ6IGZ1bmN0aW9uKGl0ZXIpIHtcbiAgICAgIGl0ZXIgPSB0eXBlb2YgaXRlci5pbmNsdWRlcyA9PT0gJ2Z1bmN0aW9uJyA/IGl0ZXIgOiBJdGVyYWJsZShpdGVyKTtcbiAgICAgIHJldHVybiB0aGlzLmV2ZXJ5KGZ1bmN0aW9uKHZhbHVlICkge3JldHVybiBpdGVyLmluY2x1ZGVzKHZhbHVlKX0pO1xuICAgIH0sXG5cbiAgICBpc1N1cGVyc2V0OiBmdW5jdGlvbihpdGVyKSB7XG4gICAgICByZXR1cm4gaXRlci5pc1N1YnNldCh0aGlzKTtcbiAgICB9LFxuXG4gICAga2V5U2VxOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnRvU2VxKCkubWFwKGtleU1hcHBlcikudG9JbmRleGVkU2VxKCk7XG4gICAgfSxcblxuICAgIGxhc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMudG9TZXEoKS5yZXZlcnNlKCkuZmlyc3QoKTtcbiAgICB9LFxuXG4gICAgbWF4OiBmdW5jdGlvbihjb21wYXJhdG9yKSB7XG4gICAgICByZXR1cm4gbWF4RmFjdG9yeSh0aGlzLCBjb21wYXJhdG9yKTtcbiAgICB9LFxuXG4gICAgbWF4Qnk6IGZ1bmN0aW9uKG1hcHBlciwgY29tcGFyYXRvcikge1xuICAgICAgcmV0dXJuIG1heEZhY3RvcnkodGhpcywgY29tcGFyYXRvciwgbWFwcGVyKTtcbiAgICB9LFxuXG4gICAgbWluOiBmdW5jdGlvbihjb21wYXJhdG9yKSB7XG4gICAgICByZXR1cm4gbWF4RmFjdG9yeSh0aGlzLCBjb21wYXJhdG9yID8gbmVnKGNvbXBhcmF0b3IpIDogZGVmYXVsdE5lZ0NvbXBhcmF0b3IpO1xuICAgIH0sXG5cbiAgICBtaW5CeTogZnVuY3Rpb24obWFwcGVyLCBjb21wYXJhdG9yKSB7XG4gICAgICByZXR1cm4gbWF4RmFjdG9yeSh0aGlzLCBjb21wYXJhdG9yID8gbmVnKGNvbXBhcmF0b3IpIDogZGVmYXVsdE5lZ0NvbXBhcmF0b3IsIG1hcHBlcik7XG4gICAgfSxcblxuICAgIHJlc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuc2xpY2UoMSk7XG4gICAgfSxcblxuICAgIHNraXA6IGZ1bmN0aW9uKGFtb3VudCkge1xuICAgICAgcmV0dXJuIHRoaXMuc2xpY2UoTWF0aC5tYXgoMCwgYW1vdW50KSk7XG4gICAgfSxcblxuICAgIHNraXBMYXN0OiBmdW5jdGlvbihhbW91bnQpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCB0aGlzLnRvU2VxKCkucmV2ZXJzZSgpLnNraXAoYW1vdW50KS5yZXZlcnNlKCkpO1xuICAgIH0sXG5cbiAgICBza2lwV2hpbGU6IGZ1bmN0aW9uKHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgICAgcmV0dXJuIHJlaWZ5KHRoaXMsIHNraXBXaGlsZUZhY3RvcnkodGhpcywgcHJlZGljYXRlLCBjb250ZXh0LCB0cnVlKSk7XG4gICAgfSxcblxuICAgIHNraXBVbnRpbDogZnVuY3Rpb24ocHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgICByZXR1cm4gdGhpcy5za2lwV2hpbGUobm90KHByZWRpY2F0ZSksIGNvbnRleHQpO1xuICAgIH0sXG5cbiAgICBzb3J0Qnk6IGZ1bmN0aW9uKG1hcHBlciwgY29tcGFyYXRvcikge1xuICAgICAgcmV0dXJuIHJlaWZ5KHRoaXMsIHNvcnRGYWN0b3J5KHRoaXMsIGNvbXBhcmF0b3IsIG1hcHBlcikpO1xuICAgIH0sXG5cbiAgICB0YWtlOiBmdW5jdGlvbihhbW91bnQpIHtcbiAgICAgIHJldHVybiB0aGlzLnNsaWNlKDAsIE1hdGgubWF4KDAsIGFtb3VudCkpO1xuICAgIH0sXG5cbiAgICB0YWtlTGFzdDogZnVuY3Rpb24oYW1vdW50KSB7XG4gICAgICByZXR1cm4gcmVpZnkodGhpcywgdGhpcy50b1NlcSgpLnJldmVyc2UoKS50YWtlKGFtb3VudCkucmV2ZXJzZSgpKTtcbiAgICB9LFxuXG4gICAgdGFrZVdoaWxlOiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCB0YWtlV2hpbGVGYWN0b3J5KHRoaXMsIHByZWRpY2F0ZSwgY29udGV4dCkpO1xuICAgIH0sXG5cbiAgICB0YWtlVW50aWw6IGZ1bmN0aW9uKHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgICAgcmV0dXJuIHRoaXMudGFrZVdoaWxlKG5vdChwcmVkaWNhdGUpLCBjb250ZXh0KTtcbiAgICB9LFxuXG4gICAgdmFsdWVTZXE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMudG9JbmRleGVkU2VxKCk7XG4gICAgfSxcblxuXG4gICAgLy8gIyMjIEhhc2hhYmxlIE9iamVjdFxuXG4gICAgaGFzaENvZGU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX19oYXNoIHx8ICh0aGlzLl9faGFzaCA9IGhhc2hJdGVyYWJsZSh0aGlzKSk7XG4gICAgfSxcblxuXG4gICAgLy8gIyMjIEludGVybmFsXG5cbiAgICAvLyBhYnN0cmFjdCBfX2l0ZXJhdGUoZm4sIHJldmVyc2UpXG5cbiAgICAvLyBhYnN0cmFjdCBfX2l0ZXJhdG9yKHR5cGUsIHJldmVyc2UpXG4gIH0pO1xuXG4gIC8vIHZhciBJU19JVEVSQUJMRV9TRU5USU5FTCA9ICdAQF9fSU1NVVRBQkxFX0lURVJBQkxFX19AQCc7XG4gIC8vIHZhciBJU19LRVlFRF9TRU5USU5FTCA9ICdAQF9fSU1NVVRBQkxFX0tFWUVEX19AQCc7XG4gIC8vIHZhciBJU19JTkRFWEVEX1NFTlRJTkVMID0gJ0BAX19JTU1VVEFCTEVfSU5ERVhFRF9fQEAnO1xuICAvLyB2YXIgSVNfT1JERVJFRF9TRU5USU5FTCA9ICdAQF9fSU1NVVRBQkxFX09SREVSRURfX0BAJztcblxuICB2YXIgSXRlcmFibGVQcm90b3R5cGUgPSBJdGVyYWJsZS5wcm90b3R5cGU7XG4gIEl0ZXJhYmxlUHJvdG90eXBlW0lTX0lURVJBQkxFX1NFTlRJTkVMXSA9IHRydWU7XG4gIEl0ZXJhYmxlUHJvdG90eXBlW0lURVJBVE9SX1NZTUJPTF0gPSBJdGVyYWJsZVByb3RvdHlwZS52YWx1ZXM7XG4gIEl0ZXJhYmxlUHJvdG90eXBlLl9fdG9KUyA9IEl0ZXJhYmxlUHJvdG90eXBlLnRvQXJyYXk7XG4gIEl0ZXJhYmxlUHJvdG90eXBlLl9fdG9TdHJpbmdNYXBwZXIgPSBxdW90ZVN0cmluZztcbiAgSXRlcmFibGVQcm90b3R5cGUuaW5zcGVjdCA9XG4gIEl0ZXJhYmxlUHJvdG90eXBlLnRvU291cmNlID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLnRvU3RyaW5nKCk7IH07XG4gIEl0ZXJhYmxlUHJvdG90eXBlLmNoYWluID0gSXRlcmFibGVQcm90b3R5cGUuZmxhdE1hcDtcblxuICAvLyBUZW1wb3Jhcnkgd2FybmluZyBhYm91dCB1c2luZyBsZW5ndGhcbiAgKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEl0ZXJhYmxlUHJvdG90eXBlLCAnbGVuZ3RoJywge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAoIUl0ZXJhYmxlLm5vTGVuZ3RoV2FybmluZykge1xuICAgICAgICAgICAgdmFyIHN0YWNrO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICBzdGFjayA9IGVycm9yLnN0YWNrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHN0YWNrLmluZGV4T2YoJ193cmFwT2JqZWN0JykgPT09IC0xKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUgJiYgY29uc29sZS53YXJuICYmIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgICAgICAnaXRlcmFibGUubGVuZ3RoIGhhcyBiZWVuIGRlcHJlY2F0ZWQsICcrXG4gICAgICAgICAgICAgICAgJ3VzZSBpdGVyYWJsZS5zaXplIG9yIGl0ZXJhYmxlLmNvdW50KCkuICcrXG4gICAgICAgICAgICAgICAgJ1RoaXMgd2FybmluZyB3aWxsIGJlY29tZSBhIHNpbGVudCBlcnJvciBpbiBhIGZ1dHVyZSB2ZXJzaW9uLiAnICtcbiAgICAgICAgICAgICAgICBzdGFja1xuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zaXplO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZSkge31cbiAgfSkoKTtcblxuXG5cbiAgbWl4aW4oS2V5ZWRJdGVyYWJsZSwge1xuXG4gICAgLy8gIyMjIE1vcmUgc2VxdWVudGlhbCBtZXRob2RzXG5cbiAgICBmbGlwOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCBmbGlwRmFjdG9yeSh0aGlzKSk7XG4gICAgfSxcblxuICAgIGZpbmRLZXk6IGZ1bmN0aW9uKHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgICAgdmFyIGVudHJ5ID0gdGhpcy5maW5kRW50cnkocHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICAgIHJldHVybiBlbnRyeSAmJiBlbnRyeVswXTtcbiAgICB9LFxuXG4gICAgZmluZExhc3RLZXk6IGZ1bmN0aW9uKHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgICAgcmV0dXJuIHRoaXMudG9TZXEoKS5yZXZlcnNlKCkuZmluZEtleShwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIH0sXG5cbiAgICBrZXlPZjogZnVuY3Rpb24oc2VhcmNoVmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmZpbmRLZXkoZnVuY3Rpb24odmFsdWUgKSB7cmV0dXJuIGlzKHZhbHVlLCBzZWFyY2hWYWx1ZSl9KTtcbiAgICB9LFxuXG4gICAgbGFzdEtleU9mOiBmdW5jdGlvbihzZWFyY2hWYWx1ZSkge1xuICAgICAgcmV0dXJuIHRoaXMuZmluZExhc3RLZXkoZnVuY3Rpb24odmFsdWUgKSB7cmV0dXJuIGlzKHZhbHVlLCBzZWFyY2hWYWx1ZSl9KTtcbiAgICB9LFxuXG4gICAgbWFwRW50cmllczogZnVuY3Rpb24obWFwcGVyLCBjb250ZXh0KSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICByZXR1cm4gcmVpZnkodGhpcyxcbiAgICAgICAgdGhpcy50b1NlcSgpLm1hcChcbiAgICAgICAgICBmdW5jdGlvbih2LCBrKSAge3JldHVybiBtYXBwZXIuY2FsbChjb250ZXh0LCBbaywgdl0sIGl0ZXJhdGlvbnMrKywgdGhpcyQwKX1cbiAgICAgICAgKS5mcm9tRW50cnlTZXEoKVxuICAgICAgKTtcbiAgICB9LFxuXG4gICAgbWFwS2V5czogZnVuY3Rpb24obWFwcGVyLCBjb250ZXh0KSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICByZXR1cm4gcmVpZnkodGhpcyxcbiAgICAgICAgdGhpcy50b1NlcSgpLmZsaXAoKS5tYXAoXG4gICAgICAgICAgZnVuY3Rpb24oaywgdikgIHtyZXR1cm4gbWFwcGVyLmNhbGwoY29udGV4dCwgaywgdiwgdGhpcyQwKX1cbiAgICAgICAgKS5mbGlwKClcbiAgICAgICk7XG4gICAgfSxcblxuICB9KTtcblxuICB2YXIgS2V5ZWRJdGVyYWJsZVByb3RvdHlwZSA9IEtleWVkSXRlcmFibGUucHJvdG90eXBlO1xuICBLZXllZEl0ZXJhYmxlUHJvdG90eXBlW0lTX0tFWUVEX1NFTlRJTkVMXSA9IHRydWU7XG4gIEtleWVkSXRlcmFibGVQcm90b3R5cGVbSVRFUkFUT1JfU1lNQk9MXSA9IEl0ZXJhYmxlUHJvdG90eXBlLmVudHJpZXM7XG4gIEtleWVkSXRlcmFibGVQcm90b3R5cGUuX190b0pTID0gSXRlcmFibGVQcm90b3R5cGUudG9PYmplY3Q7XG4gIEtleWVkSXRlcmFibGVQcm90b3R5cGUuX190b1N0cmluZ01hcHBlciA9IGZ1bmN0aW9uKHYsIGspICB7cmV0dXJuIEpTT04uc3RyaW5naWZ5KGspICsgJzogJyArIHF1b3RlU3RyaW5nKHYpfTtcblxuXG5cbiAgbWl4aW4oSW5kZXhlZEl0ZXJhYmxlLCB7XG5cbiAgICAvLyAjIyMgQ29udmVyc2lvbiB0byBvdGhlciB0eXBlc1xuXG4gICAgdG9LZXllZFNlcTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IFRvS2V5ZWRTZXF1ZW5jZSh0aGlzLCBmYWxzZSk7XG4gICAgfSxcblxuXG4gICAgLy8gIyMjIEVTNiBDb2xsZWN0aW9uIG1ldGhvZHMgKEVTNiBBcnJheSBhbmQgTWFwKVxuXG4gICAgZmlsdGVyOiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCBmaWx0ZXJGYWN0b3J5KHRoaXMsIHByZWRpY2F0ZSwgY29udGV4dCwgZmFsc2UpKTtcbiAgICB9LFxuXG4gICAgZmluZEluZGV4OiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIHZhciBlbnRyeSA9IHRoaXMuZmluZEVudHJ5KHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgICByZXR1cm4gZW50cnkgPyBlbnRyeVswXSA6IC0xO1xuICAgIH0sXG5cbiAgICBpbmRleE9mOiBmdW5jdGlvbihzZWFyY2hWYWx1ZSkge1xuICAgICAgdmFyIGtleSA9IHRoaXMudG9LZXllZFNlcSgpLmtleU9mKHNlYXJjaFZhbHVlKTtcbiAgICAgIHJldHVybiBrZXkgPT09IHVuZGVmaW5lZCA/IC0xIDoga2V5O1xuICAgIH0sXG5cbiAgICBsYXN0SW5kZXhPZjogZnVuY3Rpb24oc2VhcmNoVmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLnRvU2VxKCkucmV2ZXJzZSgpLmluZGV4T2Yoc2VhcmNoVmFsdWUpO1xuICAgIH0sXG5cbiAgICByZXZlcnNlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCByZXZlcnNlRmFjdG9yeSh0aGlzLCBmYWxzZSkpO1xuICAgIH0sXG5cbiAgICBzbGljZTogZnVuY3Rpb24oYmVnaW4sIGVuZCkge1xuICAgICAgcmV0dXJuIHJlaWZ5KHRoaXMsIHNsaWNlRmFjdG9yeSh0aGlzLCBiZWdpbiwgZW5kLCBmYWxzZSkpO1xuICAgIH0sXG5cbiAgICBzcGxpY2U6IGZ1bmN0aW9uKGluZGV4LCByZW1vdmVOdW0gLyosIC4uLnZhbHVlcyovKSB7XG4gICAgICB2YXIgbnVtQXJncyA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICByZW1vdmVOdW0gPSBNYXRoLm1heChyZW1vdmVOdW0gfCAwLCAwKTtcbiAgICAgIGlmIChudW1BcmdzID09PSAwIHx8IChudW1BcmdzID09PSAyICYmICFyZW1vdmVOdW0pKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgaW5kZXggPSByZXNvbHZlQmVnaW4oaW5kZXgsIHRoaXMuc2l6ZSk7XG4gICAgICB2YXIgc3BsaWNlZCA9IHRoaXMuc2xpY2UoMCwgaW5kZXgpO1xuICAgICAgcmV0dXJuIHJlaWZ5KFxuICAgICAgICB0aGlzLFxuICAgICAgICBudW1BcmdzID09PSAxID9cbiAgICAgICAgICBzcGxpY2VkIDpcbiAgICAgICAgICBzcGxpY2VkLmNvbmNhdChhcnJDb3B5KGFyZ3VtZW50cywgMiksIHRoaXMuc2xpY2UoaW5kZXggKyByZW1vdmVOdW0pKVxuICAgICAgKTtcbiAgICB9LFxuXG5cbiAgICAvLyAjIyMgTW9yZSBjb2xsZWN0aW9uIG1ldGhvZHNcblxuICAgIGZpbmRMYXN0SW5kZXg6IGZ1bmN0aW9uKHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgICAgdmFyIGtleSA9IHRoaXMudG9LZXllZFNlcSgpLmZpbmRMYXN0S2V5KHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgICByZXR1cm4ga2V5ID09PSB1bmRlZmluZWQgPyAtMSA6IGtleTtcbiAgICB9LFxuXG4gICAgZmlyc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0KDApO1xuICAgIH0sXG5cbiAgICBmbGF0dGVuOiBmdW5jdGlvbihkZXB0aCkge1xuICAgICAgcmV0dXJuIHJlaWZ5KHRoaXMsIGZsYXR0ZW5GYWN0b3J5KHRoaXMsIGRlcHRoLCBmYWxzZSkpO1xuICAgIH0sXG5cbiAgICBnZXQ6IGZ1bmN0aW9uKGluZGV4LCBub3RTZXRWYWx1ZSkge1xuICAgICAgaW5kZXggPSB3cmFwSW5kZXgodGhpcywgaW5kZXgpO1xuICAgICAgcmV0dXJuIChpbmRleCA8IDAgfHwgKHRoaXMuc2l6ZSA9PT0gSW5maW5pdHkgfHxcbiAgICAgICAgICAodGhpcy5zaXplICE9PSB1bmRlZmluZWQgJiYgaW5kZXggPiB0aGlzLnNpemUpKSkgP1xuICAgICAgICBub3RTZXRWYWx1ZSA6XG4gICAgICAgIHRoaXMuZmluZChmdW5jdGlvbihfLCBrZXkpICB7cmV0dXJuIGtleSA9PT0gaW5kZXh9LCB1bmRlZmluZWQsIG5vdFNldFZhbHVlKTtcbiAgICB9LFxuXG4gICAgaGFzOiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgaW5kZXggPSB3cmFwSW5kZXgodGhpcywgaW5kZXgpO1xuICAgICAgcmV0dXJuIGluZGV4ID49IDAgJiYgKHRoaXMuc2l6ZSAhPT0gdW5kZWZpbmVkID9cbiAgICAgICAgdGhpcy5zaXplID09PSBJbmZpbml0eSB8fCBpbmRleCA8IHRoaXMuc2l6ZSA6XG4gICAgICAgIHRoaXMuaW5kZXhPZihpbmRleCkgIT09IC0xXG4gICAgICApO1xuICAgIH0sXG5cbiAgICBpbnRlcnBvc2U6IGZ1bmN0aW9uKHNlcGFyYXRvcikge1xuICAgICAgcmV0dXJuIHJlaWZ5KHRoaXMsIGludGVycG9zZUZhY3RvcnkodGhpcywgc2VwYXJhdG9yKSk7XG4gICAgfSxcblxuICAgIGludGVybGVhdmU6IGZ1bmN0aW9uKC8qLi4uaXRlcmFibGVzKi8pIHtcbiAgICAgIHZhciBpdGVyYWJsZXMgPSBbdGhpc10uY29uY2F0KGFyckNvcHkoYXJndW1lbnRzKSk7XG4gICAgICB2YXIgemlwcGVkID0gemlwV2l0aEZhY3RvcnkodGhpcy50b1NlcSgpLCBJbmRleGVkU2VxLm9mLCBpdGVyYWJsZXMpO1xuICAgICAgdmFyIGludGVybGVhdmVkID0gemlwcGVkLmZsYXR0ZW4odHJ1ZSk7XG4gICAgICBpZiAoemlwcGVkLnNpemUpIHtcbiAgICAgICAgaW50ZXJsZWF2ZWQuc2l6ZSA9IHppcHBlZC5zaXplICogaXRlcmFibGVzLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCBpbnRlcmxlYXZlZCk7XG4gICAgfSxcblxuICAgIGxhc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0KC0xKTtcbiAgICB9LFxuXG4gICAgc2tpcFdoaWxlOiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCBza2lwV2hpbGVGYWN0b3J5KHRoaXMsIHByZWRpY2F0ZSwgY29udGV4dCwgZmFsc2UpKTtcbiAgICB9LFxuXG4gICAgemlwOiBmdW5jdGlvbigvKiwgLi4uaXRlcmFibGVzICovKSB7XG4gICAgICB2YXIgaXRlcmFibGVzID0gW3RoaXNdLmNvbmNhdChhcnJDb3B5KGFyZ3VtZW50cykpO1xuICAgICAgcmV0dXJuIHJlaWZ5KHRoaXMsIHppcFdpdGhGYWN0b3J5KHRoaXMsIGRlZmF1bHRaaXBwZXIsIGl0ZXJhYmxlcykpO1xuICAgIH0sXG5cbiAgICB6aXBXaXRoOiBmdW5jdGlvbih6aXBwZXIvKiwgLi4uaXRlcmFibGVzICovKSB7XG4gICAgICB2YXIgaXRlcmFibGVzID0gYXJyQ29weShhcmd1bWVudHMpO1xuICAgICAgaXRlcmFibGVzWzBdID0gdGhpcztcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCB6aXBXaXRoRmFjdG9yeSh0aGlzLCB6aXBwZXIsIGl0ZXJhYmxlcykpO1xuICAgIH0sXG5cbiAgfSk7XG5cbiAgSW5kZXhlZEl0ZXJhYmxlLnByb3RvdHlwZVtJU19JTkRFWEVEX1NFTlRJTkVMXSA9IHRydWU7XG4gIEluZGV4ZWRJdGVyYWJsZS5wcm90b3R5cGVbSVNfT1JERVJFRF9TRU5USU5FTF0gPSB0cnVlO1xuXG5cblxuICBtaXhpbihTZXRJdGVyYWJsZSwge1xuXG4gICAgLy8gIyMjIEVTNiBDb2xsZWN0aW9uIG1ldGhvZHMgKEVTNiBBcnJheSBhbmQgTWFwKVxuXG4gICAgZ2V0OiBmdW5jdGlvbih2YWx1ZSwgbm90U2V0VmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmhhcyh2YWx1ZSkgPyB2YWx1ZSA6IG5vdFNldFZhbHVlO1xuICAgIH0sXG5cbiAgICBpbmNsdWRlczogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmhhcyh2YWx1ZSk7XG4gICAgfSxcblxuXG4gICAgLy8gIyMjIE1vcmUgc2VxdWVudGlhbCBtZXRob2RzXG5cbiAgICBrZXlTZXE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMudmFsdWVTZXEoKTtcbiAgICB9LFxuXG4gIH0pO1xuXG4gIFNldEl0ZXJhYmxlLnByb3RvdHlwZS5oYXMgPSBJdGVyYWJsZVByb3RvdHlwZS5pbmNsdWRlcztcblxuXG4gIC8vIE1peGluIHN1YmNsYXNzZXNcblxuICBtaXhpbihLZXllZFNlcSwgS2V5ZWRJdGVyYWJsZS5wcm90b3R5cGUpO1xuICBtaXhpbihJbmRleGVkU2VxLCBJbmRleGVkSXRlcmFibGUucHJvdG90eXBlKTtcbiAgbWl4aW4oU2V0U2VxLCBTZXRJdGVyYWJsZS5wcm90b3R5cGUpO1xuXG4gIG1peGluKEtleWVkQ29sbGVjdGlvbiwgS2V5ZWRJdGVyYWJsZS5wcm90b3R5cGUpO1xuICBtaXhpbihJbmRleGVkQ29sbGVjdGlvbiwgSW5kZXhlZEl0ZXJhYmxlLnByb3RvdHlwZSk7XG4gIG1peGluKFNldENvbGxlY3Rpb24sIFNldEl0ZXJhYmxlLnByb3RvdHlwZSk7XG5cblxuICAvLyAjcHJhZ21hIEhlbHBlciBmdW5jdGlvbnNcblxuICBmdW5jdGlvbiBrZXlNYXBwZXIodiwgaykge1xuICAgIHJldHVybiBrO1xuICB9XG5cbiAgZnVuY3Rpb24gZW50cnlNYXBwZXIodiwgaykge1xuICAgIHJldHVybiBbaywgdl07XG4gIH1cblxuICBmdW5jdGlvbiBub3QocHJlZGljYXRlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICFwcmVkaWNhdGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBuZWcocHJlZGljYXRlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIC1wcmVkaWNhdGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBxdW90ZVN0cmluZyh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gSlNPTi5zdHJpbmdpZnkodmFsdWUpIDogdmFsdWU7XG4gIH1cblxuICBmdW5jdGlvbiBkZWZhdWx0WmlwcGVyKCkge1xuICAgIHJldHVybiBhcnJDb3B5KGFyZ3VtZW50cyk7XG4gIH1cblxuICBmdW5jdGlvbiBkZWZhdWx0TmVnQ29tcGFyYXRvcihhLCBiKSB7XG4gICAgcmV0dXJuIGEgPCBiID8gMSA6IGEgPiBiID8gLTEgOiAwO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFzaEl0ZXJhYmxlKGl0ZXJhYmxlKSB7XG4gICAgaWYgKGl0ZXJhYmxlLnNpemUgPT09IEluZmluaXR5KSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgdmFyIG9yZGVyZWQgPSBpc09yZGVyZWQoaXRlcmFibGUpO1xuICAgIHZhciBrZXllZCA9IGlzS2V5ZWQoaXRlcmFibGUpO1xuICAgIHZhciBoID0gb3JkZXJlZCA/IDEgOiAwO1xuICAgIHZhciBzaXplID0gaXRlcmFibGUuX19pdGVyYXRlKFxuICAgICAga2V5ZWQgP1xuICAgICAgICBvcmRlcmVkID9cbiAgICAgICAgICBmdW5jdGlvbih2LCBrKSAgeyBoID0gMzEgKiBoICsgaGFzaE1lcmdlKGhhc2godiksIGhhc2goaykpIHwgMDsgfSA6XG4gICAgICAgICAgZnVuY3Rpb24odiwgaykgIHsgaCA9IGggKyBoYXNoTWVyZ2UoaGFzaCh2KSwgaGFzaChrKSkgfCAwOyB9IDpcbiAgICAgICAgb3JkZXJlZCA/XG4gICAgICAgICAgZnVuY3Rpb24odiApIHsgaCA9IDMxICogaCArIGhhc2godikgfCAwOyB9IDpcbiAgICAgICAgICBmdW5jdGlvbih2ICkgeyBoID0gaCArIGhhc2godikgfCAwOyB9XG4gICAgKTtcbiAgICByZXR1cm4gbXVybXVySGFzaE9mU2l6ZShzaXplLCBoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG11cm11ckhhc2hPZlNpemUoc2l6ZSwgaCkge1xuICAgIGggPSBzcmNfTWF0aF9faW11bChoLCAweENDOUUyRDUxKTtcbiAgICBoID0gc3JjX01hdGhfX2ltdWwoaCA8PCAxNSB8IGggPj4+IC0xNSwgMHgxQjg3MzU5Myk7XG4gICAgaCA9IHNyY19NYXRoX19pbXVsKGggPDwgMTMgfCBoID4+PiAtMTMsIDUpO1xuICAgIGggPSAoaCArIDB4RTY1NDZCNjQgfCAwKSBeIHNpemU7XG4gICAgaCA9IHNyY19NYXRoX19pbXVsKGggXiBoID4+PiAxNiwgMHg4NUVCQ0E2Qik7XG4gICAgaCA9IHNyY19NYXRoX19pbXVsKGggXiBoID4+PiAxMywgMHhDMkIyQUUzNSk7XG4gICAgaCA9IHNtaShoIF4gaCA+Pj4gMTYpO1xuICAgIHJldHVybiBoO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFzaE1lcmdlKGEsIGIpIHtcbiAgICByZXR1cm4gYSBeIGIgKyAweDlFMzc3OUI5ICsgKGEgPDwgNikgKyAoYSA+PiAyKSB8IDA7IC8vIGludFxuICB9XG5cbiAgdmFyIEltbXV0YWJsZSA9IHtcblxuICAgIEl0ZXJhYmxlOiBJdGVyYWJsZSxcblxuICAgIFNlcTogU2VxLFxuICAgIENvbGxlY3Rpb246IENvbGxlY3Rpb24sXG4gICAgTWFwOiBzcmNfTWFwX19NYXAsXG4gICAgT3JkZXJlZE1hcDogT3JkZXJlZE1hcCxcbiAgICBMaXN0OiBMaXN0LFxuICAgIFN0YWNrOiBTdGFjayxcbiAgICBTZXQ6IHNyY19TZXRfX1NldCxcbiAgICBPcmRlcmVkU2V0OiBPcmRlcmVkU2V0LFxuXG4gICAgUmVjb3JkOiBSZWNvcmQsXG4gICAgUmFuZ2U6IFJhbmdlLFxuICAgIFJlcGVhdDogUmVwZWF0LFxuXG4gICAgaXM6IGlzLFxuICAgIGZyb21KUzogZnJvbUpTLFxuXG4gIH07XG5cbiAgcmV0dXJuIEltbXV0YWJsZTtcblxufSkpOyIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgYnVmZmVycyA9IHJlcXVpcmUoXCIuL2ltcGwvYnVmZmVyc1wiKTtcbnZhciBjaGFubmVscyA9IHJlcXVpcmUoXCIuL2ltcGwvY2hhbm5lbHNcIik7XG52YXIgc2VsZWN0ID0gcmVxdWlyZShcIi4vaW1wbC9zZWxlY3RcIik7XG52YXIgcHJvY2VzcyA9IHJlcXVpcmUoXCIuL2ltcGwvcHJvY2Vzc1wiKTtcbnZhciB0aW1lcnMgPSByZXF1aXJlKFwiLi9pbXBsL3RpbWVyc1wiKTtcblxuZnVuY3Rpb24gc3Bhd24oZ2VuLCBjcmVhdG9yKSB7XG4gIHZhciBjaCA9IGNoYW5uZWxzLmNoYW4oYnVmZmVycy5maXhlZCgxKSk7XG4gIChuZXcgcHJvY2Vzcy5Qcm9jZXNzKGdlbiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT09IGNoYW5uZWxzLkNMT1NFRCkge1xuICAgICAgY2guY2xvc2UoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvY2Vzcy5wdXRfdGhlbl9jYWxsYmFjayhjaCwgdmFsdWUsIGZ1bmN0aW9uKG9rKSB7XG4gICAgICAgIGNoLmNsb3NlKCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sIGNyZWF0b3IpKS5ydW4oKTtcbiAgcmV0dXJuIGNoO1xufTtcblxuZnVuY3Rpb24gZ28oZiwgYXJncykge1xuICBhcmdzID0gYXJncyB8fCBbXTtcblxuICB2YXIgZ2VuID0gZi5hcHBseShudWxsLCBhcmdzKTtcbiAgcmV0dXJuIHNwYXduKGdlbiwgZik7XG59O1xuXG5mdW5jdGlvbiBjaGFuKGJ1ZmZlck9yTnVtYmVyLCB4Zm9ybSwgZXhIYW5kbGVyKSB7XG4gIHZhciBidWY7XG4gIGlmIChidWZmZXJPck51bWJlciA9PT0gMCkge1xuICAgIGJ1ZmZlck9yTnVtYmVyID0gbnVsbDtcbiAgfVxuICBpZiAodHlwZW9mIGJ1ZmZlck9yTnVtYmVyID09PSBcIm51bWJlclwiKSB7XG4gICAgYnVmID0gYnVmZmVycy5maXhlZChidWZmZXJPck51bWJlcik7XG4gIH0gZWxzZSB7XG4gICAgYnVmID0gYnVmZmVyT3JOdW1iZXI7XG4gIH1cbiAgcmV0dXJuIGNoYW5uZWxzLmNoYW4oYnVmLCB4Zm9ybSwgZXhIYW5kbGVyKTtcbn07XG5cbmZ1bmN0aW9uIHByb21pc2VDaGFuKHhmb3JtLCBleEhhbmRsZXIpe1xuICAgIHJldHVybiBjaGFuKGJ1ZmZlcnMucHJvbWlzZSgpLCB4Zm9ybSwgZXhIYW5kbGVyKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGJ1ZmZlcnM6IHtcbiAgICBmaXhlZDogYnVmZmVycy5maXhlZCxcbiAgICBkcm9wcGluZzogYnVmZmVycy5kcm9wcGluZyxcbiAgICBzbGlkaW5nOiBidWZmZXJzLnNsaWRpbmcsXG4gICAgcHJvbWlzZTogYnVmZmVycy5wcm9taXNlXG4gIH0sXG5cbiAgc3Bhd246IHNwYXduLFxuICBnbzogZ28sXG4gIGNoYW46IGNoYW4sXG4gIHByb21pc2VDaGFuOiBwcm9taXNlQ2hhbixcbiAgREVGQVVMVDogc2VsZWN0LkRFRkFVTFQsXG4gIENMT1NFRDogY2hhbm5lbHMuQ0xPU0VELFxuXG4gIHB1dDogcHJvY2Vzcy5wdXQsXG4gIHRha2U6IHByb2Nlc3MudGFrZSxcbiAgc2xlZXA6IHByb2Nlc3Muc2xlZXAsXG4gIGFsdHM6IHByb2Nlc3MuYWx0cyxcbiAgcHV0QXN5bmM6IHByb2Nlc3MucHV0X3RoZW5fY2FsbGJhY2ssXG4gIHRha2VBc3luYzogcHJvY2Vzcy50YWtlX3RoZW5fY2FsbGJhY2ssXG5cbiAgdGltZW91dDogdGltZXJzLnRpbWVvdXRcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGNzcCA9IHJlcXVpcmUoXCIuL2NzcC5jb3JlXCIpO1xudmFyIG9wZXJhdGlvbnMgPSByZXF1aXJlKFwiLi9jc3Aub3BlcmF0aW9uc1wiKTtcbnZhciBwaXBlbGluZSA9IHJlcXVpcmUoJy4vY3NwLnBpcGVsaW5lJyk7XG5cbmNzcC5vcGVyYXRpb25zID0gb3BlcmF0aW9ucztcbmNzcC5vcGVyYXRpb25zLnBpcGVsaW5lID0gcGlwZWxpbmUucGlwZWxpbmU7XG5jc3Aub3BlcmF0aW9ucy5waXBlbGluZUFzeW5jID0gcGlwZWxpbmUucGlwZWxpbmVBc3luYztcblxubW9kdWxlLmV4cG9ydHMgPSBjc3A7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIEJveCA9IHJlcXVpcmUoXCIuL2ltcGwvY2hhbm5lbHNcIikuQm94O1xuXG52YXIgY3NwID0gcmVxdWlyZShcIi4vY3NwLmNvcmVcIiksXG4gICAgZ28gPSBjc3AuZ28sXG4gICAgdGFrZSA9IGNzcC50YWtlLFxuICAgIHB1dCA9IGNzcC5wdXQsXG4gICAgdGFrZUFzeW5jID0gY3NwLnRha2VBc3luYyxcbiAgICBwdXRBc3luYyA9IGNzcC5wdXRBc3luYyxcbiAgICBhbHRzID0gY3NwLmFsdHMsXG4gICAgY2hhbiA9IGNzcC5jaGFuLFxuICAgIENMT1NFRCA9IGNzcC5DTE9TRUQ7XG5cblxuZnVuY3Rpb24gbWFwRnJvbShmLCBjaCkge1xuICByZXR1cm4ge1xuICAgIGlzX2Nsb3NlZDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gY2guaXNfY2xvc2VkKCk7XG4gICAgfSxcbiAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICBjaC5jbG9zZSgpO1xuICAgIH0sXG4gICAgX3B1dDogZnVuY3Rpb24odmFsdWUsIGhhbmRsZXIpIHtcbiAgICAgIHJldHVybiBjaC5fcHV0KHZhbHVlLCBoYW5kbGVyKTtcbiAgICB9LFxuICAgIF90YWtlOiBmdW5jdGlvbihoYW5kbGVyKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gY2guX3Rha2Uoe1xuICAgICAgICBpc19hY3RpdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBoYW5kbGVyLmlzX2FjdGl2ZSgpO1xuICAgICAgICB9LFxuICAgICAgICBjb21taXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciB0YWtlX2NiID0gaGFuZGxlci5jb21taXQoKTtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0YWtlX2NiKHZhbHVlID09PSBDTE9TRUQgPyBDTE9TRUQgOiBmKHZhbHVlKSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IHJlc3VsdC52YWx1ZTtcbiAgICAgICAgcmV0dXJuIG5ldyBCb3godmFsdWUgPT09IENMT1NFRCA/IENMT1NFRCA6IGYodmFsdWUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gbWFwSW50byhmLCBjaCkge1xuICByZXR1cm4ge1xuICAgIGlzX2Nsb3NlZDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gY2guaXNfY2xvc2VkKCk7XG4gICAgfSxcbiAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICBjaC5jbG9zZSgpO1xuICAgIH0sXG4gICAgX3B1dDogZnVuY3Rpb24odmFsdWUsIGhhbmRsZXIpIHtcbiAgICAgIHJldHVybiBjaC5fcHV0KGYodmFsdWUpLCBoYW5kbGVyKTtcbiAgICB9LFxuICAgIF90YWtlOiBmdW5jdGlvbihoYW5kbGVyKSB7XG4gICAgICByZXR1cm4gY2guX3Rha2UoaGFuZGxlcik7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBmaWx0ZXJGcm9tKHAsIGNoLCBidWZmZXJPck4pIHtcbiAgdmFyIG91dCA9IGNoYW4oYnVmZmVyT3JOKTtcbiAgZ28oZnVuY3Rpb24qKCkge1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICB2YXIgdmFsdWUgPSB5aWVsZCB0YWtlKGNoKTtcbiAgICAgIGlmICh2YWx1ZSA9PT0gQ0xPU0VEKSB7XG4gICAgICAgIG91dC5jbG9zZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmIChwKHZhbHVlKSkge1xuICAgICAgICB5aWVsZCBwdXQob3V0LCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gZmlsdGVySW50byhwLCBjaCkge1xuICByZXR1cm4ge1xuICAgIGlzX2Nsb3NlZDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gY2guaXNfY2xvc2VkKCk7XG4gICAgfSxcbiAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICBjaC5jbG9zZSgpO1xuICAgIH0sXG4gICAgX3B1dDogZnVuY3Rpb24odmFsdWUsIGhhbmRsZXIpIHtcbiAgICAgIGlmIChwKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gY2guX3B1dCh2YWx1ZSwgaGFuZGxlcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV3IEJveCghY2guaXNfY2xvc2VkKCkpO1xuICAgICAgfVxuICAgIH0sXG4gICAgX3Rha2U6IGZ1bmN0aW9uKGhhbmRsZXIpIHtcbiAgICAgIHJldHVybiBjaC5fdGFrZShoYW5kbGVyKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUZyb20ocCwgY2gpIHtcbiAgcmV0dXJuIGZpbHRlckZyb20oZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gIXAodmFsdWUpO1xuICB9LCBjaCk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUludG8ocCwgY2gpIHtcbiAgcmV0dXJuIGZpbHRlckludG8oZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gIXAodmFsdWUpO1xuICB9LCBjaCk7XG59XG5cbmZ1bmN0aW9uKiBtYXBjYXQoZiwgc3JjLCBkc3QpIHtcbiAgd2hpbGUgKHRydWUpIHtcbiAgICB2YXIgdmFsdWUgPSB5aWVsZCB0YWtlKHNyYyk7XG4gICAgaWYgKHZhbHVlID09PSBDTE9TRUQpIHtcbiAgICAgIGRzdC5jbG9zZSgpO1xuICAgICAgYnJlYWs7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBzZXEgPSBmKHZhbHVlKTtcbiAgICAgIHZhciBsZW5ndGggPSBzZXEubGVuZ3RoO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICB5aWVsZCBwdXQoZHN0LCBzZXFbaV0pO1xuICAgICAgfVxuICAgICAgaWYgKGRzdC5pc19jbG9zZWQoKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gbWFwY2F0RnJvbShmLCBjaCwgYnVmZmVyT3JOKSB7XG4gIHZhciBvdXQgPSBjaGFuKGJ1ZmZlck9yTik7XG4gIGdvKG1hcGNhdCwgW2YsIGNoLCBvdXRdKTtcbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gbWFwY2F0SW50byhmLCBjaCwgYnVmZmVyT3JOKSB7XG4gIHZhciBzcmMgPSBjaGFuKGJ1ZmZlck9yTik7XG4gIGdvKG1hcGNhdCwgW2YsIHNyYywgY2hdKTtcbiAgcmV0dXJuIHNyYztcbn1cblxuZnVuY3Rpb24gcGlwZShzcmMsIGRzdCwga2VlcE9wZW4pIHtcbiAgZ28oZnVuY3Rpb24qKCkge1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICB2YXIgdmFsdWUgPSB5aWVsZCB0YWtlKHNyYyk7XG4gICAgICBpZiAodmFsdWUgPT09IENMT1NFRCkge1xuICAgICAgICBpZiAoIWtlZXBPcGVuKSB7XG4gICAgICAgICAgZHN0LmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAoISh5aWVsZCBwdXQoZHN0LCB2YWx1ZSkpKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIHJldHVybiBkc3Q7XG59XG5cbmZ1bmN0aW9uIHNwbGl0KHAsIGNoLCB0cnVlQnVmZmVyT3JOLCBmYWxzZUJ1ZmZlck9yTikge1xuICB2YXIgdGNoID0gY2hhbih0cnVlQnVmZmVyT3JOKTtcbiAgdmFyIGZjaCA9IGNoYW4oZmFsc2VCdWZmZXJPck4pO1xuICBnbyhmdW5jdGlvbiooKSB7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIHZhciB2YWx1ZSA9IHlpZWxkIHRha2UoY2gpO1xuICAgICAgaWYgKHZhbHVlID09PSBDTE9TRUQpIHtcbiAgICAgICAgdGNoLmNsb3NlKCk7XG4gICAgICAgIGZjaC5jbG9zZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHlpZWxkIHB1dChwKHZhbHVlKSA/IHRjaCA6IGZjaCwgdmFsdWUpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBbdGNoLCBmY2hdO1xufVxuXG5mdW5jdGlvbiByZWR1Y2UoZiwgaW5pdCwgY2gpIHtcbiAgcmV0dXJuIGdvKGZ1bmN0aW9uKigpIHtcbiAgICB2YXIgcmVzdWx0ID0gaW5pdDtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgdmFyIHZhbHVlID0geWllbGQgdGFrZShjaCk7XG4gICAgICBpZiAodmFsdWUgPT09IENMT1NFRCkge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0ID0gZihyZXN1bHQsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtdLCB0cnVlKTtcbn1cblxuZnVuY3Rpb24gb250byhjaCwgY29sbCwga2VlcE9wZW4pIHtcbiAgcmV0dXJuIGdvKGZ1bmN0aW9uKigpIHtcbiAgICB2YXIgbGVuZ3RoID0gY29sbC5sZW5ndGg7XG4gICAgLy8gRklYOiBTaG91bGQgYmUgYSBnZW5lcmljIGxvb3BpbmcgaW50ZXJmYWNlIChmb3IuLi5pbj8pXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgeWllbGQgcHV0KGNoLCBjb2xsW2ldKTtcbiAgICB9XG4gICAgaWYgKCFrZWVwT3Blbikge1xuICAgICAgY2guY2xvc2UoKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vLyBUT0RPOiBCb3VuZGVkP1xuZnVuY3Rpb24gZnJvbUNvbGwoY29sbCkge1xuICB2YXIgY2ggPSBjaGFuKGNvbGwubGVuZ3RoKTtcbiAgb250byhjaCwgY29sbCk7XG4gIHJldHVybiBjaDtcbn1cblxuZnVuY3Rpb24gbWFwKGYsIGNocywgYnVmZmVyT3JOKSB7XG4gIHZhciBvdXQgPSBjaGFuKGJ1ZmZlck9yTik7XG4gIHZhciBsZW5ndGggPSBjaHMubGVuZ3RoO1xuICAvLyBBcnJheSBob2xkaW5nIDEgcm91bmQgb2YgdmFsdWVzXG4gIHZhciB2YWx1ZXMgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgLy8gVE9ETzogTm90IHN1cmUgd2h5IHdlIG5lZWQgYSBzaXplLTEgYnVmZmVyIGhlcmVcbiAgdmFyIGRjaGFuID0gY2hhbigxKTtcbiAgLy8gSG93IG1hbnkgbW9yZSBpdGVtcyB0aGlzIHJvdW5kXG4gIHZhciBkY291bnQ7XG4gIC8vIHB1dCBjYWxsYmFja3MgZm9yIGVhY2ggY2hhbm5lbFxuICB2YXIgZGNhbGxiYWNrcyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArKykge1xuICAgIGRjYWxsYmFja3NbaV0gPSAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHZhbHVlc1tpXSA9IHZhbHVlO1xuICAgICAgICBkY291bnQgLS07XG4gICAgICAgIGlmIChkY291bnQgPT09IDApIHtcbiAgICAgICAgICBwdXRBc3luYyhkY2hhbiwgdmFsdWVzLnNsaWNlKDApKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KGkpKTtcbiAgfVxuICBnbyhmdW5jdGlvbiooKSB7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGRjb3VudCA9IGxlbmd0aDtcbiAgICAgIC8vIFdlIGNvdWxkIGp1c3QgbGF1bmNoIG4gZ29yb3V0aW5lcyBoZXJlLCBidXQgZm9yIGVmZmNpZW5jeSB3ZVxuICAgICAgLy8gZG9uJ3RcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICsrKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdGFrZUFzeW5jKGNoc1tpXSwgZGNhbGxiYWNrc1tpXSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAvLyBGSVg6IEhtbSB3aHkgY2F0Y2hpbmcgaGVyZT9cbiAgICAgICAgICBkY291bnQgLS07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhciB2YWx1ZXMgPSB5aWVsZCB0YWtlKGRjaGFuKTtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkgKyspIHtcbiAgICAgICAgaWYgKHZhbHVlc1tpXSA9PT0gQ0xPU0VEKSB7XG4gICAgICAgICAgb3V0LmNsb3NlKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB5aWVsZCBwdXQob3V0LCBmLmFwcGx5KG51bGwsIHZhbHVlcykpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIG1lcmdlKGNocywgYnVmZmVyT3JOKSB7XG4gIHZhciBvdXQgPSBjaGFuKGJ1ZmZlck9yTik7XG4gIHZhciBhY3RpdmVzID0gY2hzLnNsaWNlKDApO1xuICBnbyhmdW5jdGlvbiooKSB7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmIChhY3RpdmVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHZhciByID0geWllbGQgYWx0cyhhY3RpdmVzKTtcbiAgICAgIHZhciB2YWx1ZSA9IHIudmFsdWU7XG4gICAgICBpZiAodmFsdWUgPT09IENMT1NFRCkge1xuICAgICAgICAvLyBSZW1vdmUgY2xvc2VkIGNoYW5uZWxcbiAgICAgICAgdmFyIGkgPSBhY3RpdmVzLmluZGV4T2Yoci5jaGFubmVsKTtcbiAgICAgICAgYWN0aXZlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgeWllbGQgcHV0KG91dCwgdmFsdWUpO1xuICAgIH1cbiAgICBvdXQuY2xvc2UoKTtcbiAgfSk7XG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIGludG8oY29sbCwgY2gpIHtcbiAgdmFyIHJlc3VsdCA9IGNvbGwuc2xpY2UoMCk7XG4gIHJldHVybiByZWR1Y2UoZnVuY3Rpb24ocmVzdWx0LCBpdGVtKSB7XG4gICAgcmVzdWx0LnB1c2goaXRlbSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSwgcmVzdWx0LCBjaCk7XG59XG5cbmZ1bmN0aW9uIHRha2VOKG4sIGNoLCBidWZmZXJPck4pIHtcbiAgdmFyIG91dCA9IGNoYW4oYnVmZmVyT3JOKTtcbiAgZ28oZnVuY3Rpb24qKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSArKykge1xuICAgICAgdmFyIHZhbHVlID0geWllbGQgdGFrZShjaCk7XG4gICAgICBpZiAodmFsdWUgPT09IENMT1NFRCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHlpZWxkIHB1dChvdXQsIHZhbHVlKTtcbiAgICB9XG4gICAgb3V0LmNsb3NlKCk7XG4gIH0pO1xuICByZXR1cm4gb3V0O1xufVxuXG52YXIgTk9USElORyA9IHt9O1xuXG5mdW5jdGlvbiB1bmlxdWUoY2gsIGJ1ZmZlck9yTikge1xuICB2YXIgb3V0ID0gY2hhbihidWZmZXJPck4pO1xuICB2YXIgbGFzdCA9IE5PVEhJTkc7XG4gIGdvKGZ1bmN0aW9uKigpIHtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgdmFyIHZhbHVlID0geWllbGQgdGFrZShjaCk7XG4gICAgICBpZiAodmFsdWUgPT09IENMT1NFRCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmICh2YWx1ZSA9PT0gbGFzdCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGxhc3QgPSB2YWx1ZTtcbiAgICAgIHlpZWxkIHB1dChvdXQsIHZhbHVlKTtcbiAgICB9XG4gICAgb3V0LmNsb3NlKCk7XG4gIH0pO1xuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBwYXJ0aXRpb25CeShmLCBjaCwgYnVmZmVyT3JOKSB7XG4gIHZhciBvdXQgPSBjaGFuKGJ1ZmZlck9yTik7XG4gIHZhciBwYXJ0ID0gW107XG4gIHZhciBsYXN0ID0gTk9USElORztcbiAgZ28oZnVuY3Rpb24qKCkge1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICB2YXIgdmFsdWUgPSB5aWVsZCB0YWtlKGNoKTtcbiAgICAgIGlmICh2YWx1ZSA9PT0gQ0xPU0VEKSB7XG4gICAgICAgIGlmIChwYXJ0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB5aWVsZCBwdXQob3V0LCBwYXJ0KTtcbiAgICAgICAgfVxuICAgICAgICBvdXQuY2xvc2UoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgbmV3SXRlbSA9IGYodmFsdWUpO1xuICAgICAgICBpZiAobmV3SXRlbSA9PT0gbGFzdCB8fCBsYXN0ID09PSBOT1RISU5HKSB7XG4gICAgICAgICAgcGFydC5wdXNoKHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB5aWVsZCBwdXQob3V0LCBwYXJ0KTtcbiAgICAgICAgICBwYXJ0ID0gW3ZhbHVlXTtcbiAgICAgICAgfVxuICAgICAgICBsYXN0ID0gbmV3SXRlbTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBwYXJ0aXRpb24obiwgY2gsIGJ1ZmZlck9yTikge1xuICB2YXIgb3V0ID0gY2hhbihidWZmZXJPck4pO1xuICBnbyhmdW5jdGlvbiooKSB7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIHZhciBwYXJ0ID0gbmV3IEFycmF5KG4pO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgdmFyIHZhbHVlID0geWllbGQgdGFrZShjaCk7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gQ0xPU0VEKSB7XG4gICAgICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgICAgICB5aWVsZCBwdXQob3V0LCBwYXJ0LnNsaWNlKDAsIGkpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgb3V0LmNsb3NlKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHBhcnRbaV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIHlpZWxkIHB1dChvdXQsIHBhcnQpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXQ7XG59XG5cbi8vIEZvciBjaGFubmVsIGlkZW50aWZpY2F0aW9uXG52YXIgZ2VuSWQgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBpID0gMDtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIGkgKys7XG4gICAgcmV0dXJuIFwiXCIgKyBpO1xuICB9O1xufSkoKTtcblxudmFyIElEX0FUVFIgPSBcIl9fY3NwX2NoYW5uZWxfaWRcIjtcblxuLy8gVE9ETzogRG8gd2UgbmVlZCB0byBjaGVjayB3aXRoIGhhc093blByb3BlcnR5P1xuZnVuY3Rpb24gbGVuKG9iaikge1xuICB2YXIgY291bnQgPSAwO1xuICBmb3IgKHZhciBwIGluIG9iaikge1xuICAgIGNvdW50ICsrO1xuICB9XG4gIHJldHVybiBjb3VudDtcbn1cblxuZnVuY3Rpb24gY2hhbklkKGNoKSB7XG4gIHZhciBpZCA9IGNoW0lEX0FUVFJdO1xuICBpZiAoaWQgPT09IHVuZGVmaW5lZCkge1xuICAgIGlkID0gY2hbSURfQVRUUl0gPSBnZW5JZCgpO1xuICB9XG4gIHJldHVybiBpZDtcbn1cblxudmFyIE11bHQgPSBmdW5jdGlvbihjaCkge1xuICB0aGlzLnRhcHMgPSB7fTtcbiAgdGhpcy5jaCA9IGNoO1xufTtcblxudmFyIFRhcCA9IGZ1bmN0aW9uKGNoYW5uZWwsIGtlZXBPcGVuKSB7XG4gIHRoaXMuY2hhbm5lbCA9IGNoYW5uZWw7XG4gIHRoaXMua2VlcE9wZW4gPSBrZWVwT3Blbjtcbn07XG5cbk11bHQucHJvdG90eXBlLm11eGNoID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmNoO1xufTtcblxuTXVsdC5wcm90b3R5cGUudGFwID0gZnVuY3Rpb24oY2gsIGtlZXBPcGVuKSB7XG4gIHZhciBpZCA9IGNoYW5JZChjaCk7XG4gIHRoaXMudGFwc1tpZF0gPSBuZXcgVGFwKGNoLCBrZWVwT3Blbik7XG59O1xuXG5NdWx0LnByb3RvdHlwZS51bnRhcCA9IGZ1bmN0aW9uKGNoKSB7XG4gIGRlbGV0ZSB0aGlzLnRhcHNbY2hhbklkKGNoKV07XG59O1xuXG5NdWx0LnByb3RvdHlwZS51bnRhcEFsbCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnRhcHMgPSB7fTtcbn07XG5cbmZ1bmN0aW9uIG11bHQoY2gpIHtcbiAgdmFyIG0gPSBuZXcgTXVsdChjaCk7XG4gIHZhciBkY2hhbiA9IGNoYW4oMSk7XG4gIHZhciBkY291bnQ7XG4gIGZ1bmN0aW9uIG1ha2VEb25lQ2FsbGJhY2sodGFwKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHN0aWxsT3Blbikge1xuICAgICAgZGNvdW50IC0tO1xuICAgICAgaWYgKGRjb3VudCA9PT0gMCkge1xuICAgICAgICBwdXRBc3luYyhkY2hhbiwgdHJ1ZSk7XG4gICAgICB9XG4gICAgICBpZiAoIXN0aWxsT3Blbikge1xuICAgICAgICBtLnVudGFwKHRhcC5jaGFubmVsKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIGdvKGZ1bmN0aW9uKigpIHtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgdmFyIHZhbHVlID0geWllbGQgdGFrZShjaCk7XG4gICAgICB2YXIgaWQsIHQ7XG4gICAgICB2YXIgdGFwcyA9IG0udGFwcztcbiAgICAgIGlmICh2YWx1ZSA9PT0gQ0xPU0VEKSB7XG4gICAgICAgIGZvciAoaWQgaW4gdGFwcykge1xuICAgICAgICAgIHQgPSB0YXBzW2lkXTtcbiAgICAgICAgICBpZiAoIXQua2VlcE9wZW4pIHtcbiAgICAgICAgICAgIHQuY2hhbm5lbC5jbG9zZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBUT0RPOiBJcyB0aGlzIG5lY2Vzc2FyeT9cbiAgICAgICAgbS51bnRhcEFsbCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGRjb3VudCA9IGxlbih0YXBzKTtcbiAgICAgIC8vIFhYWDogVGhpcyBpcyBiZWNhdXNlIHB1dEFzeW5jIGNhbiBhY3R1YWxseSBjYWxsIGJhY2tcbiAgICAgIC8vIGltbWVkaWF0ZWx5LiBGaXggdGhhdFxuICAgICAgdmFyIGluaXREY291bnQgPSBkY291bnQ7XG4gICAgICAvLyBQdXQgdmFsdWUgb24gdGFwcGluZyBjaGFubmVscy4uLlxuICAgICAgZm9yIChpZCBpbiB0YXBzKSB7XG4gICAgICAgIHQgPSB0YXBzW2lkXTtcbiAgICAgICAgcHV0QXN5bmModC5jaGFubmVsLCB2YWx1ZSwgbWFrZURvbmVDYWxsYmFjayh0KSk7XG4gICAgICB9XG4gICAgICAvLyAuLi4gd2FpdGluZyBmb3IgYWxsIHB1dHMgdG8gY29tcGxldGVcbiAgICAgIGlmIChpbml0RGNvdW50ID4gMCkge1xuICAgICAgICB5aWVsZCB0YWtlKGRjaGFuKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gbTtcbn1cblxubXVsdC50YXAgPSBmdW5jdGlvbiB0YXAobSwgY2gsIGtlZXBPcGVuKSB7XG4gIG0udGFwKGNoLCBrZWVwT3Blbik7XG4gIHJldHVybiBjaDtcbn07XG5cbm11bHQudW50YXAgPSBmdW5jdGlvbiB1bnRhcChtLCBjaCkge1xuICBtLnVudGFwKGNoKTtcbn07XG5cbm11bHQudW50YXBBbGwgPSBmdW5jdGlvbiB1bnRhcEFsbChtKSB7XG4gIG0udW50YXBBbGwoKTtcbn07XG5cbnZhciBNaXggPSBmdW5jdGlvbihjaCkge1xuICB0aGlzLmNoID0gY2g7XG4gIHRoaXMuc3RhdGVNYXAgPSB7fTtcbiAgdGhpcy5jaGFuZ2UgPSBjaGFuKCk7XG4gIHRoaXMuc29sb01vZGUgPSBtaXguTVVURTtcbn07XG5cbk1peC5wcm90b3R5cGUuX2NoYW5nZWQgPSBmdW5jdGlvbigpIHtcbiAgcHV0QXN5bmModGhpcy5jaGFuZ2UsIHRydWUpO1xufTtcblxuTWl4LnByb3RvdHlwZS5fZ2V0QWxsU3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGFsbFN0YXRlID0ge307XG4gIHZhciBzdGF0ZU1hcCA9IHRoaXMuc3RhdGVNYXA7XG4gIHZhciBzb2xvcyA9IFtdO1xuICB2YXIgbXV0ZXMgPSBbXTtcbiAgdmFyIHBhdXNlcyA9IFtdO1xuICB2YXIgcmVhZHM7XG4gIGZvciAodmFyIGlkIGluIHN0YXRlTWFwKSB7XG4gICAgdmFyIGNoYW5EYXRhID0gc3RhdGVNYXBbaWRdO1xuICAgIHZhciBzdGF0ZSA9IGNoYW5EYXRhLnN0YXRlO1xuICAgIHZhciBjaGFubmVsID0gY2hhbkRhdGEuY2hhbm5lbDtcbiAgICBpZiAoc3RhdGVbbWl4LlNPTE9dKSB7XG4gICAgICBzb2xvcy5wdXNoKGNoYW5uZWwpO1xuICAgIH1cbiAgICAvLyBUT0RPXG4gICAgaWYgKHN0YXRlW21peC5NVVRFXSkge1xuICAgICAgbXV0ZXMucHVzaChjaGFubmVsKTtcbiAgICB9XG4gICAgaWYgKHN0YXRlW21peC5QQVVTRV0pIHtcbiAgICAgIHBhdXNlcy5wdXNoKGNoYW5uZWwpO1xuICAgIH1cbiAgfVxuICB2YXIgaSwgbjtcbiAgaWYgKHRoaXMuc29sb01vZGUgPT09IG1peC5QQVVTRSAmJiBzb2xvcy5sZW5ndGggPiAwKSB7XG4gICAgbiA9IHNvbG9zLmxlbmd0aDtcbiAgICByZWFkcyA9IG5ldyBBcnJheShuICsgMSk7XG4gICAgZm9yIChpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgcmVhZHNbaV0gPSBzb2xvc1tpXTtcbiAgICB9XG4gICAgcmVhZHNbbl0gPSB0aGlzLmNoYW5nZTtcbiAgfSBlbHNlIHtcbiAgICByZWFkcyA9IFtdO1xuICAgIGZvciAoaWQgaW4gc3RhdGVNYXApIHtcbiAgICAgIGNoYW5EYXRhID0gc3RhdGVNYXBbaWRdO1xuICAgICAgY2hhbm5lbCA9IGNoYW5EYXRhLmNoYW5uZWw7XG4gICAgICBpZiAocGF1c2VzLmluZGV4T2YoY2hhbm5lbCkgPCAwKSB7XG4gICAgICAgIHJlYWRzLnB1c2goY2hhbm5lbCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJlYWRzLnB1c2godGhpcy5jaGFuZ2UpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzb2xvczogc29sb3MsXG4gICAgbXV0ZXM6IG11dGVzLFxuICAgIHJlYWRzOiByZWFkc1xuICB9O1xufTtcblxuTWl4LnByb3RvdHlwZS5hZG1peCA9IGZ1bmN0aW9uKGNoKSB7XG4gIHRoaXMuc3RhdGVNYXBbY2hhbklkKGNoKV0gPSB7XG4gICAgY2hhbm5lbDogY2gsXG4gICAgc3RhdGU6IHt9XG4gIH07XG4gIHRoaXMuX2NoYW5nZWQoKTtcbn07XG5cbk1peC5wcm90b3R5cGUudW5taXggPSBmdW5jdGlvbihjaCkge1xuICBkZWxldGUgdGhpcy5zdGF0ZU1hcFtjaGFuSWQoY2gpXTtcbiAgdGhpcy5fY2hhbmdlZCgpO1xufTtcblxuTWl4LnByb3RvdHlwZS51bm1peEFsbCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnN0YXRlTWFwID0ge307XG4gIHRoaXMuX2NoYW5nZWQoKTtcbn07XG5cbk1peC5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24odXBkYXRlU3RhdGVMaXN0KSB7XG4gIC8vIFtbY2gxLCB7fV0sIFtjaDIsIHtzb2xvOiB0cnVlfV1dO1xuICB2YXIgbGVuZ3RoID0gdXBkYXRlU3RhdGVMaXN0Lmxlbmd0aDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHZhciBjaCA9IHVwZGF0ZVN0YXRlTGlzdFtpXVswXTtcbiAgICB2YXIgaWQgPSBjaGFuSWQoY2gpO1xuICAgIHZhciB1cGRhdGVTdGF0ZSA9IHVwZGF0ZVN0YXRlTGlzdFtpXVsxXTtcbiAgICB2YXIgY2hhbkRhdGEgPSB0aGlzLnN0YXRlTWFwW2lkXTtcbiAgICBpZiAoIWNoYW5EYXRhKSB7XG4gICAgICBjaGFuRGF0YSA9IHRoaXMuc3RhdGVNYXBbaWRdID0ge1xuICAgICAgICBjaGFubmVsOiBjaCxcbiAgICAgICAgc3RhdGU6IHt9XG4gICAgICB9O1xuICAgIH1cbiAgICBmb3IgKHZhciBtb2RlIGluIHVwZGF0ZVN0YXRlKSB7XG4gICAgICBjaGFuRGF0YS5zdGF0ZVttb2RlXSA9IHVwZGF0ZVN0YXRlW21vZGVdO1xuICAgIH1cbiAgfVxuICB0aGlzLl9jaGFuZ2VkKCk7XG59O1xuXG5NaXgucHJvdG90eXBlLnNldFNvbG9Nb2RlID0gZnVuY3Rpb24obW9kZSkge1xuICBpZiAoVkFMSURfU09MT19NT0RFUy5pbmRleE9mKG1vZGUpIDwgMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIk1vZGUgbXVzdCBiZSBvbmUgb2Y6IFwiLCBWQUxJRF9TT0xPX01PREVTLmpvaW4oXCIsIFwiKSk7XG4gIH1cbiAgdGhpcy5zb2xvTW9kZSA9IG1vZGU7XG4gIHRoaXMuX2NoYW5nZWQoKTtcbn07XG5cbmZ1bmN0aW9uIG1peChvdXQpIHtcbiAgdmFyIG0gPSBuZXcgTWl4KG91dCk7XG4gIGdvKGZ1bmN0aW9uKigpIHtcbiAgICB2YXIgc3RhdGUgPSBtLl9nZXRBbGxTdGF0ZSgpO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICB2YXIgcmVzdWx0ID0geWllbGQgYWx0cyhzdGF0ZS5yZWFkcyk7XG4gICAgICB2YXIgdmFsdWUgPSByZXN1bHQudmFsdWU7XG4gICAgICB2YXIgY2hhbm5lbCA9IHJlc3VsdC5jaGFubmVsO1xuICAgICAgaWYgKHZhbHVlID09PSBDTE9TRUQpIHtcbiAgICAgICAgZGVsZXRlIG0uc3RhdGVNYXBbY2hhbklkKGNoYW5uZWwpXTtcbiAgICAgICAgc3RhdGUgPSBtLl9nZXRBbGxTdGF0ZSgpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChjaGFubmVsID09PSBtLmNoYW5nZSkge1xuICAgICAgICBzdGF0ZSA9IG0uX2dldEFsbFN0YXRlKCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgdmFyIHNvbG9zID0gc3RhdGUuc29sb3M7XG4gICAgICBpZiAoc29sb3MuaW5kZXhPZihjaGFubmVsKSA+IC0xIHx8XG4gICAgICAgICAgKHNvbG9zLmxlbmd0aCA9PT0gMCAmJiAhKHN0YXRlLm11dGVzLmluZGV4T2YoY2hhbm5lbCkgPiAtMSkpKSB7XG4gICAgICAgIHZhciBzdGlsbE9wZW4gPSB5aWVsZCBwdXQob3V0LCB2YWx1ZSk7XG4gICAgICAgIGlmICghc3RpbGxPcGVuKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gbTtcbn1cblxubWl4Lk1VVEUgPSBcIm11dGVcIjtcbm1peC5QQVVTRSA9IFwicGF1c2VcIjtcbm1peC5TT0xPID0gXCJzb2xvXCI7XG52YXIgVkFMSURfU09MT19NT0RFUyA9IFttaXguTVVURSwgbWl4LlBBVVNFXTtcblxubWl4LmFkZCA9IGZ1bmN0aW9uIGFkbWl4KG0sIGNoKSB7XG4gIG0uYWRtaXgoY2gpO1xufTtcblxubWl4LnJlbW92ZSA9IGZ1bmN0aW9uIHVubWl4KG0sIGNoKSB7XG4gIG0udW5taXgoY2gpO1xufTtcblxubWl4LnJlbW92ZUFsbCA9IGZ1bmN0aW9uIHVubWl4QWxsKG0pIHtcbiAgbS51bm1peEFsbCgpO1xufTtcblxubWl4LnRvZ2dsZSA9IGZ1bmN0aW9uIHRvZ2dsZShtLCB1cGRhdGVTdGF0ZUxpc3QpIHtcbiAgbS50b2dnbGUodXBkYXRlU3RhdGVMaXN0KTtcbn07XG5cbm1peC5zZXRTb2xvTW9kZSA9IGZ1bmN0aW9uIHNldFNvbG9Nb2RlKG0sIG1vZGUpIHtcbiAgbS5zZXRTb2xvTW9kZShtb2RlKTtcbn07XG5cbmZ1bmN0aW9uIGNvbnN0YW50bHlOdWxsKCkge1xuICByZXR1cm4gbnVsbDtcbn1cblxudmFyIFB1YiA9IGZ1bmN0aW9uKGNoLCB0b3BpY0ZuLCBidWZmZXJGbikge1xuICB0aGlzLmNoID0gY2g7XG4gIHRoaXMudG9waWNGbiA9IHRvcGljRm47XG4gIHRoaXMuYnVmZmVyRm4gPSBidWZmZXJGbjtcbiAgdGhpcy5tdWx0cyA9IHt9O1xufTtcblxuUHViLnByb3RvdHlwZS5fZW5zdXJlTXVsdCA9IGZ1bmN0aW9uKHRvcGljKSB7XG4gIHZhciBtID0gdGhpcy5tdWx0c1t0b3BpY107XG4gIHZhciBidWZmZXJGbiA9IHRoaXMuYnVmZmVyRm47XG4gIGlmICghbSkge1xuICAgIG0gPSB0aGlzLm11bHRzW3RvcGljXSA9IG11bHQoY2hhbihidWZmZXJGbih0b3BpYykpKTtcbiAgfVxuICByZXR1cm4gbTtcbn07XG5cblB1Yi5wcm90b3R5cGUuc3ViID0gZnVuY3Rpb24odG9waWMsIGNoLCBrZWVwT3Blbikge1xuICB2YXIgbSA9IHRoaXMuX2Vuc3VyZU11bHQodG9waWMpO1xuICByZXR1cm4gbXVsdC50YXAobSwgY2gsIGtlZXBPcGVuKTtcbn07XG5cblB1Yi5wcm90b3R5cGUudW5zdWIgPSBmdW5jdGlvbih0b3BpYywgY2gpIHtcbiAgdmFyIG0gPSB0aGlzLm11bHRzW3RvcGljXTtcbiAgaWYgKG0pIHtcbiAgICBtdWx0LnVudGFwKG0sIGNoKTtcbiAgfVxufTtcblxuUHViLnByb3RvdHlwZS51bnN1YkFsbCA9IGZ1bmN0aW9uKHRvcGljKSB7XG4gIGlmICh0b3BpYyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5tdWx0cyA9IHt9O1xuICB9IGVsc2Uge1xuICAgIGRlbGV0ZSB0aGlzLm11bHRzW3RvcGljXTtcbiAgfVxufTtcblxuZnVuY3Rpb24gcHViKGNoLCB0b3BpY0ZuLCBidWZmZXJGbikge1xuICBidWZmZXJGbiA9IGJ1ZmZlckZuIHx8IGNvbnN0YW50bHlOdWxsO1xuICB2YXIgcCA9IG5ldyBQdWIoY2gsIHRvcGljRm4sIGJ1ZmZlckZuKTtcbiAgZ28oZnVuY3Rpb24qKCkge1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICB2YXIgdmFsdWUgPSB5aWVsZCB0YWtlKGNoKTtcbiAgICAgIHZhciBtdWx0cyA9IHAubXVsdHM7XG4gICAgICB2YXIgdG9waWM7XG4gICAgICBpZiAodmFsdWUgPT09IENMT1NFRCkge1xuICAgICAgICBmb3IgKHRvcGljIGluIG11bHRzKSB7XG4gICAgICAgICAgbXVsdHNbdG9waWNdLm11eGNoKCkuY2xvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIC8vIFRPRE86IFNvbWVob3cgZW5zdXJlL2RvY3VtZW50IHRoYXQgdGhpcyBtdXN0IHJldHVybiBhIHN0cmluZ1xuICAgICAgLy8gKG90aGVyd2lzZSB1c2UgcHJvcGVyIChoYXNoKW1hcHMpXG4gICAgICB0b3BpYyA9IHRvcGljRm4odmFsdWUpO1xuICAgICAgdmFyIG0gPSBtdWx0c1t0b3BpY107XG4gICAgICBpZiAobSkge1xuICAgICAgICB2YXIgc3RpbGxPcGVuID0geWllbGQgcHV0KG0ubXV4Y2goKSwgdmFsdWUpO1xuICAgICAgICBpZiAoIXN0aWxsT3Blbikge1xuICAgICAgICAgIGRlbGV0ZSBtdWx0c1t0b3BpY107XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gcDtcbn1cblxucHViLnN1YiA9IGZ1bmN0aW9uIHN1YihwLCB0b3BpYywgY2gsIGtlZXBPcGVuKSB7XG4gIHJldHVybiBwLnN1Yih0b3BpYywgY2gsIGtlZXBPcGVuKTtcbn07XG5cbnB1Yi51bnN1YiA9IGZ1bmN0aW9uIHVuc3ViKHAsIHRvcGljLCBjaCkge1xuICBwLnVuc3ViKHRvcGljLCBjaCk7XG59O1xuXG5wdWIudW5zdWJBbGwgPSBmdW5jdGlvbiB1bnN1YkFsbChwLCB0b3BpYykge1xuICBwLnVuc3ViQWxsKHRvcGljKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtYXBGcm9tOiBtYXBGcm9tLFxuICBtYXBJbnRvOiBtYXBJbnRvLFxuICBmaWx0ZXJGcm9tOiBmaWx0ZXJGcm9tLFxuICBmaWx0ZXJJbnRvOiBmaWx0ZXJJbnRvLFxuICByZW1vdmVGcm9tOiByZW1vdmVGcm9tLFxuICByZW1vdmVJbnRvOiByZW1vdmVJbnRvLFxuICBtYXBjYXRGcm9tOiBtYXBjYXRGcm9tLFxuICBtYXBjYXRJbnRvOiBtYXBjYXRJbnRvLFxuXG4gIHBpcGU6IHBpcGUsXG4gIHNwbGl0OiBzcGxpdCxcbiAgcmVkdWNlOiByZWR1Y2UsXG4gIG9udG86IG9udG8sXG4gIGZyb21Db2xsOiBmcm9tQ29sbCxcblxuICBtYXA6IG1hcCxcbiAgbWVyZ2U6IG1lcmdlLFxuICBpbnRvOiBpbnRvLFxuICB0YWtlOiB0YWtlTixcbiAgdW5pcXVlOiB1bmlxdWUsXG4gIHBhcnRpdGlvbjogcGFydGl0aW9uLFxuICBwYXJ0aXRpb25CeTogcGFydGl0aW9uQnksXG5cbiAgbXVsdDogbXVsdCxcbiAgbWl4OiBtaXgsXG4gIHB1YjogcHViXG59O1xuXG5cbi8vIFBvc3NpYmxlIFwiZmx1aWRcIiBpbnRlcmZhY2VzOlxuXG4vLyB0aHJlYWQoXG4vLyAgIFtmcm9tQ29sbCwgWzEsIDIsIDMsIDRdXSxcbi8vICAgW21hcEZyb20sIGluY10sXG4vLyAgIFtpbnRvLCBbXV1cbi8vIClcblxuLy8gdGhyZWFkKFxuLy8gICBbZnJvbUNvbGwsIFsxLCAyLCAzLCA0XV0sXG4vLyAgIFttYXBGcm9tLCBpbmMsIF9dLFxuLy8gICBbaW50bywgW10sIF9dXG4vLyApXG5cbi8vIHdyYXAoKVxuLy8gICAuZnJvbUNvbGwoWzEsIDIsIDMsIDRdKVxuLy8gICAubWFwRnJvbShpbmMpXG4vLyAgIC5pbnRvKFtdKVxuLy8gICAudW53cmFwKCk7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGNzcCA9IHJlcXVpcmUoJy4vY3NwLmNvcmUnKTtcblxuZnVuY3Rpb24gcGlwZWxpbmVJbnRlcm5hbChuLCB0bywgZnJvbSwgY2xvc2UsIHRhc2tGbikge1xuICBpZiAobiA8PSAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCduIG11c3QgYmUgcG9zaXRpdmUnKTtcbiAgfVxuXG4gIHZhciBqb2JzID0gY3NwLmNoYW4obik7XG4gIHZhciByZXN1bHRzID0gY3NwLmNoYW4obik7XG5cbiAgZm9yKHZhciBfID0gMDsgXyA8IG47IF8rKykge1xuICAgIGNzcC5nbyhmdW5jdGlvbiogKHRhc2tGbiwgam9icywgcmVzdWx0cykge1xuICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgdmFyIGpvYiA9IHlpZWxkIGNzcC50YWtlKGpvYnMpO1xuXG4gICAgICAgIGlmICghdGFza0ZuKGpvYikpIHtcbiAgICAgICAgICByZXN1bHRzLmNsb3NlKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCBbdGFza0ZuLCBqb2JzLCByZXN1bHRzXSk7XG4gIH1cblxuICBjc3AuZ28oZnVuY3Rpb24qIChqb2JzLCBmcm9tLCByZXN1bHRzKSB7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIHZhciB2ID0geWllbGQgY3NwLnRha2UoZnJvbSk7XG4gICAgICBpZiAodiA9PT0gY3NwLkNMT1NFRCkge1xuICAgICAgICBqb2JzLmNsb3NlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHAgPSBjc3AuY2hhbigxKTtcblxuICAgICAgICB5aWVsZCBjc3AucHV0KGpvYnMsIFt2LCBwXSk7XG4gICAgICAgIHlpZWxkIGNzcC5wdXQocmVzdWx0cywgcCk7XG4gICAgICB9XG4gICAgfVxuICB9LCBbam9icywgZnJvbSwgcmVzdWx0c10pO1xuXG4gIGNzcC5nbyhmdW5jdGlvbiogKHJlc3VsdHMsIGNsb3NlLCB0bykge1xuICAgIHdoaWxlKHRydWUpIHtcbiAgICAgIHZhciBwID0geWllbGQgY3NwLnRha2UocmVzdWx0cyk7XG4gICAgICBpZiAocCA9PT0gY3NwLkNMT1NFRCkge1xuICAgICAgICBpZiAoY2xvc2UpIHtcbiAgICAgICAgICB0by5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHJlcyA9IHlpZWxkIGNzcC50YWtlKHApO1xuICAgICAgICB3aGlsZSh0cnVlKSB7XG4gICAgICAgICAgdmFyIHYgPSB5aWVsZCBjc3AudGFrZShyZXMpO1xuICAgICAgICAgIGlmICh2ICE9PSBjc3AuQ0xPU0VEKSB7XG4gICAgICAgICAgICB5aWVsZCBjc3AucHV0KHRvLCB2KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LCBbcmVzdWx0cywgY2xvc2UsIHRvXSk7XG5cbiAgcmV0dXJuIHRvO1xufVxuXG5mdW5jdGlvbiBwaXBlbGluZSh0bywgeGYsIGZyb20sIGtlZXBPcGVuLCBleEhhbmRsZXIpIHtcblxuICBmdW5jdGlvbiB0YXNrRm4oam9iKSB7XG4gICAgaWYgKGpvYiA9PT0gY3NwLkNMT1NFRCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB2ID0gam9iWzBdO1xuICAgICAgdmFyIHAgPSBqb2JbMV07XG4gICAgICB2YXIgcmVzID0gY3NwLmNoYW4oMSwgeGYsIGV4SGFuZGxlcik7XG5cbiAgICAgIGNzcC5nbyhmdW5jdGlvbiogKHJlcywgdikge1xuICAgICAgICB5aWVsZCBjc3AucHV0KHJlcywgdik7XG4gICAgICAgIHJlcy5jbG9zZSgpO1xuICAgICAgfSwgW3Jlcywgdl0pO1xuXG4gICAgICBjc3AucHV0QXN5bmMocCwgcmVzKTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBpcGVsaW5lSW50ZXJuYWwoMSwgdG8sIGZyb20sICFrZWVwT3BlbiwgdGFza0ZuKTtcbn1cblxuZnVuY3Rpb24gcGlwZWxpbmVBc3luYyhuLCB0bywgYWYsIGZyb20sIGtlZXBPcGVuKSB7XG5cbiAgZnVuY3Rpb24gdGFza0ZuKGpvYikge1xuICAgIGlmIChqb2IgPT09IGNzcC5DTE9TRUQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgdiA9IGpvYlswXTtcbiAgICAgIHZhciBwID0gam9iWzFdO1xuICAgICAgdmFyIHJlcyA9IGNzcC5jaGFuKDEpO1xuICAgICAgYWYodiwgcmVzKTtcbiAgICAgIGNzcC5wdXRBc3luYyhwLCByZXMpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBpcGVsaW5lSW50ZXJuYWwobiwgdG8sIGZyb20sICFrZWVwT3BlbiwgdGFza0ZuKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHBpcGVsaW5lOiBwaXBlbGluZSxcbiAgcGlwZWxpbmVBc3luYzogcGlwZWxpbmVBc3luY1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG4vLyBUT0RPOiBDb25zaWRlciBFbXB0eUVycm9yICYgRnVsbEVycm9yIHRvIGF2b2lkIHJlZHVuZGFudCBib3VuZFxuLy8gY2hlY2tzLCB0byBpbXByb3ZlIHBlcmZvcm1hbmNlIChtYXkgbmVlZCBiZW5jaG1hcmtzKVxuXG5mdW5jdGlvbiBhY29weShzcmMsIHNyY19zdGFydCwgZHN0LCBkc3Rfc3RhcnQsIGxlbmd0aCkge1xuICB2YXIgY291bnQgPSAwO1xuICB3aGlsZSAodHJ1ZSkge1xuICAgIGlmIChjb3VudCA+PSBsZW5ndGgpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBkc3RbZHN0X3N0YXJ0ICsgY291bnRdID0gc3JjW3NyY19zdGFydCArIGNvdW50XTtcbiAgICBjb3VudCArKztcbiAgfVxufVxuXG5mdW5jdGlvbiBub29wKCkge307XG5cbnZhciBFTVBUWSA9IHtcbiAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBcIltvYmplY3QgRU1QVFldXCI7XG4gIH1cbn07XG5cbnZhciBSaW5nQnVmZmVyID0gZnVuY3Rpb24oaGVhZCwgdGFpbCwgbGVuZ3RoLCBhcnJheSkge1xuICB0aGlzLmxlbmd0aCA9IGxlbmd0aDtcbiAgdGhpcy5hcnJheSA9IGFycmF5O1xuICB0aGlzLmhlYWQgPSBoZWFkO1xuICB0aGlzLnRhaWwgPSB0YWlsO1xufTtcblxuLy8gSW50ZXJuYWwgbWV0aG9kLCBjYWxsZXJzIG11c3QgZG8gYm91bmQgY2hlY2tcblJpbmdCdWZmZXIucHJvdG90eXBlLl91bnNoaWZ0ID0gZnVuY3Rpb24oaXRlbSkge1xuICB2YXIgYXJyYXkgPSB0aGlzLmFycmF5O1xuICB2YXIgaGVhZCA9IHRoaXMuaGVhZDtcbiAgYXJyYXlbaGVhZF0gPSBpdGVtO1xuICB0aGlzLmhlYWQgPSAoaGVhZCArIDEpICUgYXJyYXkubGVuZ3RoO1xuICB0aGlzLmxlbmd0aCArKztcbn07XG5cblJpbmdCdWZmZXIucHJvdG90eXBlLl9yZXNpemUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGFycmF5ID0gdGhpcy5hcnJheTtcbiAgdmFyIG5ld19sZW5ndGggPSAyICogYXJyYXkubGVuZ3RoO1xuICB2YXIgbmV3X2FycmF5ID0gbmV3IEFycmF5KG5ld19sZW5ndGgpO1xuICB2YXIgaGVhZCA9IHRoaXMuaGVhZDtcbiAgdmFyIHRhaWwgPSB0aGlzLnRhaWw7XG4gIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aDtcbiAgaWYgKHRhaWwgPCBoZWFkKSB7XG4gICAgYWNvcHkoYXJyYXksIHRhaWwsIG5ld19hcnJheSwgMCwgbGVuZ3RoKTtcbiAgICB0aGlzLnRhaWwgPSAwO1xuICAgIHRoaXMuaGVhZCA9IGxlbmd0aDtcbiAgICB0aGlzLmFycmF5ID0gbmV3X2FycmF5O1xuICB9IGVsc2UgaWYgKHRhaWwgPiBoZWFkKSB7XG4gICAgYWNvcHkoYXJyYXksIHRhaWwsIG5ld19hcnJheSwgMCwgYXJyYXkubGVuZ3RoIC0gdGFpbCk7XG4gICAgYWNvcHkoYXJyYXksIDAsIG5ld19hcnJheSwgYXJyYXkubGVuZ3RoIC0gdGFpbCwgaGVhZCk7XG4gICAgdGhpcy50YWlsID0gMDtcbiAgICB0aGlzLmhlYWQgPSBsZW5ndGg7XG4gICAgdGhpcy5hcnJheSA9IG5ld19hcnJheTtcbiAgfSBlbHNlIGlmICh0YWlsID09PSBoZWFkKSB7XG4gICAgdGhpcy50YWlsID0gMDtcbiAgICB0aGlzLmhlYWQgPSAwO1xuICAgIHRoaXMuYXJyYXkgPSBuZXdfYXJyYXk7XG4gIH1cbn07XG5cblJpbmdCdWZmZXIucHJvdG90eXBlLnVuYm91bmRlZF91bnNoaWZ0ID0gZnVuY3Rpb24oaXRlbSkge1xuICBpZiAodGhpcy5sZW5ndGggKyAxID09PSB0aGlzLmFycmF5Lmxlbmd0aCkge1xuICAgIHRoaXMuX3Jlc2l6ZSgpO1xuICB9XG4gIHRoaXMuX3Vuc2hpZnQoaXRlbSk7XG59O1xuXG5SaW5nQnVmZmVyLnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIEVNUFRZO1xuICB9XG4gIHZhciBhcnJheSA9IHRoaXMuYXJyYXk7XG4gIHZhciB0YWlsID0gdGhpcy50YWlsO1xuICB2YXIgaXRlbSA9IGFycmF5W3RhaWxdO1xuICBhcnJheVt0YWlsXSA9IG51bGw7XG4gIHRoaXMudGFpbCA9ICh0YWlsICsgMSkgJSBhcnJheS5sZW5ndGg7XG4gIHRoaXMubGVuZ3RoIC0tO1xuICByZXR1cm4gaXRlbTtcbn07XG5cblJpbmdCdWZmZXIucHJvdG90eXBlLmNsZWFudXAgPSBmdW5jdGlvbihwcmVkaWNhdGUpIHtcbiAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSB0aGlzLnBvcCgpO1xuICAgIGlmIChwcmVkaWNhdGUoaXRlbSkpIHtcbiAgICAgIHRoaXMuX3Vuc2hpZnQoaXRlbSk7XG4gICAgfVxuICB9XG59O1xuXG52YXIgRml4ZWRCdWZmZXIgPSBmdW5jdGlvbihidWYsICBuKSB7XG4gIHRoaXMuYnVmID0gYnVmO1xuICB0aGlzLm4gPSBuO1xufTtcblxuRml4ZWRCdWZmZXIucHJvdG90eXBlLmlzX2Z1bGwgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuYnVmLmxlbmd0aCA+PSB0aGlzLm47XG59O1xuXG5GaXhlZEJ1ZmZlci5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmJ1Zi5wb3AoKTtcbn07XG5cbkZpeGVkQnVmZmVyLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihpdGVtKSB7XG4gIC8vIE5vdGUgdGhhdCBldmVuIHRob3VnaCB0aGUgdW5kZXJseWluZyBidWZmZXIgbWF5IGdyb3csIFwiblwiIGlzXG4gIC8vIGZpeGVkIHNvIGFmdGVyIG92ZXJmbG93aW5nIHRoZSBidWZmZXIgaXMgc3RpbGwgY29uc2lkZXJlZCBmdWxsLlxuICB0aGlzLmJ1Zi51bmJvdW5kZWRfdW5zaGlmdChpdGVtKTtcbn07XG5cbkZpeGVkQnVmZmVyLnByb3RvdHlwZS5jb3VudCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5idWYubGVuZ3RoO1xufTtcblxuRml4ZWRCdWZmZXIucHJvdG90eXBlLmNsb3NlID0gbm9vcDtcblxudmFyIERyb3BwaW5nQnVmZmVyID0gZnVuY3Rpb24oYnVmLCBuKSB7XG4gIHRoaXMuYnVmID0gYnVmO1xuICB0aGlzLm4gPSBuO1xufTtcblxuRHJvcHBpbmdCdWZmZXIucHJvdG90eXBlLmlzX2Z1bGwgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuRHJvcHBpbmdCdWZmZXIucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5idWYucG9wKCk7XG59O1xuXG5Ecm9wcGluZ0J1ZmZlci5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oaXRlbSkge1xuICBpZiAodGhpcy5idWYubGVuZ3RoIDwgdGhpcy5uKSB7XG4gICAgdGhpcy5idWYuX3Vuc2hpZnQoaXRlbSk7XG4gIH1cbn07XG5cbkRyb3BwaW5nQnVmZmVyLnByb3RvdHlwZS5jb3VudCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5idWYubGVuZ3RoO1xufTtcblxuRHJvcHBpbmdCdWZmZXIucHJvdG90eXBlLmNsb3NlID0gbm9vcDtcblxudmFyIFNsaWRpbmdCdWZmZXIgPSBmdW5jdGlvbihidWYsIG4pIHtcbiAgdGhpcy5idWYgPSBidWY7XG4gIHRoaXMubiA9IG47XG59O1xuXG5TbGlkaW5nQnVmZmVyLnByb3RvdHlwZS5pc19mdWxsID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBmYWxzZTtcbn07XG5cblNsaWRpbmdCdWZmZXIucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5idWYucG9wKCk7XG59O1xuXG5TbGlkaW5nQnVmZmVyLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihpdGVtKSB7XG4gIGlmICh0aGlzLmJ1Zi5sZW5ndGggPT09IHRoaXMubikge1xuICAgIHRoaXMuYnVmLnBvcCgpO1xuICB9XG4gIHRoaXMuYnVmLl91bnNoaWZ0KGl0ZW0pO1xufTtcblxuU2xpZGluZ0J1ZmZlci5wcm90b3R5cGUuY291bnQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuYnVmLmxlbmd0aDtcbn07XG5cblNsaWRpbmdCdWZmZXIucHJvdG90eXBlLmNsb3NlID0gbm9vcDtcblxudmFyIFByb21pc2VCdWZmZXIgPSBmdW5jdGlvbiBQcm9taXNlQnVmZmVyKCkge1xuICB0aGlzLnZhbCA9IEVNUFRZO1xufTtcblxuUHJvbWlzZUJ1ZmZlci5wcm90b3R5cGUuY291bnQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICh0aGlzLnZhbCA9PT0gRU1QVFkpID8gMCA6IDE7XG59O1xuXG5Qcm9taXNlQnVmZmVyLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihpdGVtKSB7XG4gIGlmICh0aGlzLnZhbCA9PT0gRU1QVFkpIHtcbiAgICB0aGlzLnZhbCA9IGl0ZW07XG4gIH1cbn07XG5cblByb21pc2VCdWZmZXIucHJvdG90eXBlLmlzX2Z1bGwgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuUHJvbWlzZUJ1ZmZlci5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnZhbDtcbn07XG5cblByb21pc2VCdWZmZXIucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMudmFsID0gRU1QVFk7XG59O1xuXG52YXIgcmluZyA9IGV4cG9ydHMucmluZyA9IGZ1bmN0aW9uIHJpbmdfYnVmZmVyKG4pIHtcbiAgcmV0dXJuIG5ldyBSaW5nQnVmZmVyKDAsIDAsIDAsIG5ldyBBcnJheShuKSk7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBidWZmZXIgdGhhdCBpcyBjb25zaWRlcmVkIFwiZnVsbFwiIHdoZW4gaXQgcmVhY2hlcyBzaXplIG4sXG4gKiBidXQgc3RpbGwgYWNjZXB0cyBhZGRpdGlvbmFsIGl0ZW1zLCBlZmZlY3RpdmVseSBhbGxvdyBvdmVyZmxvd2luZy5cbiAqIFRoZSBvdmVyZmxvd2luZyBiZWhhdmlvciBpcyB1c2VmdWwgZm9yIHN1cHBvcnRpbmcgXCJleHBhbmRpbmdcIlxuICogdHJhbnNkdWNlcnMsIHdoZXJlIHdlIHdhbnQgdG8gY2hlY2sgaWYgYSBidWZmZXIgaXMgZnVsbCBiZWZvcmVcbiAqIHJ1bm5pbmcgdGhlIHRyYW5zZHVjZWQgc3RlcCBmdW5jdGlvbiwgd2hpbGUgc3RpbGwgYWxsb3dpbmcgYVxuICogdHJhbnNkdWNlZCBzdGVwIHRvIGV4cGFuZCBpbnRvIG11bHRpcGxlIFwiZXNzZW5jZVwiIHN0ZXBzLlxuICovXG5leHBvcnRzLmZpeGVkID0gZnVuY3Rpb24gZml4ZWRfYnVmZmVyKG4pIHtcbiAgcmV0dXJuIG5ldyBGaXhlZEJ1ZmZlcihyaW5nKG4pLCBuKTtcbn07XG5cbmV4cG9ydHMuZHJvcHBpbmcgPSBmdW5jdGlvbiBkcm9wcGluZ19idWZmZXIobikge1xuICByZXR1cm4gbmV3IERyb3BwaW5nQnVmZmVyKHJpbmcobiksIG4pO1xufTtcblxuZXhwb3J0cy5zbGlkaW5nID0gZnVuY3Rpb24gc2xpZGluZ19idWZmZXIobikge1xuICByZXR1cm4gbmV3IFNsaWRpbmdCdWZmZXIocmluZyhuKSwgbik7XG59O1xuXG5leHBvcnRzLnByb21pc2UgPSBmdW5jdGlvbiBwcm9taXNlX2J1ZmZlcigpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlQnVmZmVyKCk7XG59O1xuXG5leHBvcnRzLkVNUFRZID0gRU1QVFk7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGJ1ZmZlcnMgPSByZXF1aXJlKFwiLi9idWZmZXJzXCIpO1xudmFyIGRpc3BhdGNoID0gcmVxdWlyZShcIi4vZGlzcGF0Y2hcIik7XG5cbnZhciBNQVhfRElSVFkgPSA2NDtcbnZhciBNQVhfUVVFVUVfU0laRSA9IDEwMjQ7XG5cbnZhciBDTE9TRUQgPSBudWxsO1xuXG52YXIgQm94ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgdGhpcy52YWx1ZSA9IHZhbHVlO1xufTtcblxudmFyIFB1dEJveCA9IGZ1bmN0aW9uKGhhbmRsZXIsIHZhbHVlKSB7XG4gIHRoaXMuaGFuZGxlciA9IGhhbmRsZXI7XG4gIHRoaXMudmFsdWUgPSB2YWx1ZTtcbn07XG5cbnZhciBDaGFubmVsID0gZnVuY3Rpb24odGFrZXMsIHB1dHMsIGJ1ZiwgeGZvcm0pIHtcbiAgdGhpcy5idWYgPSBidWY7XG4gIHRoaXMueGZvcm0gPSB4Zm9ybTtcbiAgdGhpcy50YWtlcyA9IHRha2VzO1xuICB0aGlzLnB1dHMgPSBwdXRzO1xuXG4gIHRoaXMuZGlydHlfdGFrZXMgPSAwO1xuICB0aGlzLmRpcnR5X3B1dHMgPSAwO1xuICB0aGlzLmNsb3NlZCA9IGZhbHNlO1xufTtcblxuZnVuY3Rpb24gaXNSZWR1Y2VkKHYpIHtcbiAgcmV0dXJuIHYgJiYgdltcIkBAdHJhbnNkdWNlci9yZWR1Y2VkXCJdO1xufVxuXG5mdW5jdGlvbiBzY2hlZHVsZShmLCB2KSB7XG4gIGRpc3BhdGNoLnJ1bihmdW5jdGlvbigpIHtcbiAgICBmKHYpO1xuICB9KTtcbn1cblxuQ2hhbm5lbC5wcm90b3R5cGUuX3B1dCA9IGZ1bmN0aW9uKHZhbHVlLCBoYW5kbGVyKSB7XG4gIGlmICh2YWx1ZSA9PT0gQ0xPU0VEKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHB1dCBDTE9TRUQgb24gYSBjaGFubmVsLlwiKTtcbiAgfVxuXG4gIC8vIFRPRE86IEknbSBub3Qgc3VyZSBob3cgdGhpcyBjYW4gaGFwcGVuLCBiZWNhdXNlIHRoZSBvcGVyYXRpb25zXG4gIC8vIGFyZSByZWdpc3RlcmVkIGluIDEgdGljaywgYW5kIHRoZSBvbmx5IHdheSBmb3IgdGhpcyB0byBiZSBpbmFjdGl2ZVxuICAvLyBpcyBmb3IgYSBwcmV2aW91cyBvcGVyYXRpb24gaW4gdGhlIHNhbWUgYWx0IHRvIGhhdmUgcmV0dXJuZWRcbiAgLy8gaW1tZWRpYXRlbHksIHdoaWNoIHdvdWxkIGhhdmUgc2hvcnQtY2lyY3VpdGVkIHRvIHByZXZlbnQgdGhpcyB0b1xuICAvLyBiZSBldmVyIHJlZ2lzdGVyIGFueXdheS4gVGhlIHNhbWUgdGhpbmcgZ29lcyBmb3IgdGhlIGFjdGl2ZSBjaGVja1xuICAvLyBpbiBcIl90YWtlXCIuXG4gIGlmICghaGFuZGxlci5pc19hY3RpdmUoKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaWYgKHRoaXMuY2xvc2VkKSB7XG4gICAgaGFuZGxlci5jb21taXQoKTtcbiAgICByZXR1cm4gbmV3IEJveChmYWxzZSk7XG4gIH1cblxuICB2YXIgdGFrZXIsIGNhbGxiYWNrO1xuXG4gIC8vIFNvYWsgdGhlIHZhbHVlIHRocm91Z2ggdGhlIGJ1ZmZlciBmaXJzdCwgZXZlbiBpZiB0aGVyZSBpcyBhXG4gIC8vIHBlbmRpbmcgdGFrZXIuIFRoaXMgd2F5IHRoZSBzdGVwIGZ1bmN0aW9uIGhhcyBhIGNoYW5jZSB0byBhY3Qgb24gdGhlXG4gIC8vIHZhbHVlLlxuICBpZiAodGhpcy5idWYgJiYgIXRoaXMuYnVmLmlzX2Z1bGwoKSkge1xuICAgIGhhbmRsZXIuY29tbWl0KCk7XG4gICAgdmFyIGRvbmUgPSBpc1JlZHVjZWQodGhpcy54Zm9ybVtcIkBAdHJhbnNkdWNlci9zdGVwXCJdKHRoaXMuYnVmLCB2YWx1ZSkpO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAodGhpcy5idWYuY291bnQoKSA9PT0gMCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHRha2VyID0gdGhpcy50YWtlcy5wb3AoKTtcbiAgICAgIGlmICh0YWtlciA9PT0gYnVmZmVycy5FTVBUWSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmICh0YWtlci5pc19hY3RpdmUoKSkge1xuICAgICAgICB2YWx1ZSA9IHRoaXMuYnVmLnJlbW92ZSgpO1xuICAgICAgICBjYWxsYmFjayA9IHRha2VyLmNvbW1pdCgpO1xuICAgICAgICBzY2hlZHVsZShjYWxsYmFjaywgdmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoZG9uZSkge1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEJveCh0cnVlKTtcbiAgfVxuXG4gIC8vIEVpdGhlciB0aGUgYnVmZmVyIGlzIGZ1bGwsIGluIHdoaWNoIGNhc2UgdGhlcmUgd29uJ3QgYmUgYW55XG4gIC8vIHBlbmRpbmcgdGFrZXMsIG9yIHdlIGRvbid0IGhhdmUgYSBidWZmZXIsIGluIHdoaWNoIGNhc2UgdGhpcyBsb29wXG4gIC8vIGZ1bGZpbGxzIHRoZSBmaXJzdCBvZiB0aGVtIHRoYXQgaXMgYWN0aXZlIChub3RlIHRoYXQgd2UgZG9uJ3RcbiAgLy8gaGF2ZSB0byB3b3JyeSBhYm91dCB0cmFuc2R1Y2VycyBoZXJlIHNpbmNlIHdlIHJlcXVpcmUgYSBidWZmZXJcbiAgLy8gZm9yIHRoYXQpLlxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHRha2VyID0gdGhpcy50YWtlcy5wb3AoKTtcbiAgICBpZiAodGFrZXIgPT09IGJ1ZmZlcnMuRU1QVFkpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAodGFrZXIuaXNfYWN0aXZlKCkpIHtcbiAgICAgIGhhbmRsZXIuY29tbWl0KCk7XG4gICAgICBjYWxsYmFjayA9IHRha2VyLmNvbW1pdCgpO1xuICAgICAgc2NoZWR1bGUoY2FsbGJhY2ssIHZhbHVlKTtcbiAgICAgIHJldHVybiBuZXcgQm94KHRydWUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIE5vIGJ1ZmZlciwgZnVsbCBidWZmZXIsIG5vIHBlbmRpbmcgdGFrZXMuIFF1ZXVlIHRoaXMgcHV0IG5vdy5cbiAgaWYgKHRoaXMuZGlydHlfcHV0cyA+IE1BWF9ESVJUWSkge1xuICAgIHRoaXMucHV0cy5jbGVhbnVwKGZ1bmN0aW9uKHB1dHRlcikge1xuICAgICAgcmV0dXJuIHB1dHRlci5oYW5kbGVyLmlzX2FjdGl2ZSgpO1xuICAgIH0pO1xuICAgIHRoaXMuZGlydHlfcHV0cyA9IDA7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5kaXJ0eV9wdXRzICsrO1xuICB9XG4gIGlmICh0aGlzLnB1dHMubGVuZ3RoID49IE1BWF9RVUVVRV9TSVpFKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gbW9yZSB0aGFuIFwiICsgTUFYX1FVRVVFX1NJWkUgKyBcIiBwZW5kaW5nIHB1dHMgYXJlIGFsbG93ZWQgb24gYSBzaW5nbGUgY2hhbm5lbC5cIik7XG4gIH1cbiAgdGhpcy5wdXRzLnVuYm91bmRlZF91bnNoaWZ0KG5ldyBQdXRCb3goaGFuZGxlciwgdmFsdWUpKTtcbiAgcmV0dXJuIG51bGw7XG59O1xuXG5DaGFubmVsLnByb3RvdHlwZS5fdGFrZSA9IGZ1bmN0aW9uKGhhbmRsZXIpIHtcbiAgaWYgKCFoYW5kbGVyLmlzX2FjdGl2ZSgpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICB2YXIgcHV0dGVyLCBwdXRfaGFuZGxlciwgY2FsbGJhY2ssIHZhbHVlO1xuXG4gIGlmICh0aGlzLmJ1ZiAmJiB0aGlzLmJ1Zi5jb3VudCgpID4gMCkge1xuICAgIGhhbmRsZXIuY29tbWl0KCk7XG4gICAgdmFsdWUgPSB0aGlzLmJ1Zi5yZW1vdmUoKTtcbiAgICAvLyBXZSBuZWVkIHRvIGNoZWNrIHBlbmRpbmcgcHV0cyBoZXJlLCBvdGhlciB3aXNlIHRoZXkgd29uJ3RcbiAgICAvLyBiZSBhYmxlIHRvIHByb2NlZWQgdW50aWwgdGhlaXIgbnVtYmVyIHJlYWNoZXMgTUFYX0RJUlRZXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmICh0aGlzLmJ1Zi5pc19mdWxsKCkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBwdXR0ZXIgPSB0aGlzLnB1dHMucG9wKCk7XG4gICAgICBpZiAocHV0dGVyID09PSBidWZmZXJzLkVNUFRZKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgcHV0X2hhbmRsZXIgPSBwdXR0ZXIuaGFuZGxlcjtcbiAgICAgIGlmIChwdXRfaGFuZGxlci5pc19hY3RpdmUoKSkge1xuICAgICAgICBjYWxsYmFjayA9IHB1dF9oYW5kbGVyLmNvbW1pdCgpO1xuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICBzY2hlZHVsZShjYWxsYmFjaywgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzUmVkdWNlZCh0aGlzLnhmb3JtW1wiQEB0cmFuc2R1Y2VyL3N0ZXBcIl0odGhpcy5idWYsIHB1dHRlci52YWx1ZSkpKSB7XG4gICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBuZXcgQm94KHZhbHVlKTtcbiAgfVxuXG4gIC8vIEVpdGhlciB0aGUgYnVmZmVyIGlzIGVtcHR5LCBpbiB3aGljaCBjYXNlIHRoZXJlIHdvbid0IGJlIGFueVxuICAvLyBwZW5kaW5nIHB1dHMsIG9yIHdlIGRvbid0IGhhdmUgYSBidWZmZXIsIGluIHdoaWNoIGNhc2UgdGhpcyBsb29wXG4gIC8vIGZ1bGZpbGxzIHRoZSBmaXJzdCBvZiB0aGVtIHRoYXQgaXMgYWN0aXZlIChub3RlIHRoYXQgd2UgZG9uJ3RcbiAgLy8gaGF2ZSB0byB3b3JyeSBhYm91dCB0cmFuc2R1Y2VycyBoZXJlIHNpbmNlIHdlIHJlcXVpcmUgYSBidWZmZXJcbiAgLy8gZm9yIHRoYXQpLlxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHB1dHRlciA9IHRoaXMucHV0cy5wb3AoKTtcbiAgICB2YWx1ZSA9IHB1dHRlci52YWx1ZTtcbiAgICBpZiAocHV0dGVyID09PSBidWZmZXJzLkVNUFRZKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgcHV0X2hhbmRsZXIgPSBwdXR0ZXIuaGFuZGxlcjtcbiAgICBpZiAocHV0X2hhbmRsZXIuaXNfYWN0aXZlKCkpIHtcbiAgICAgIGhhbmRsZXIuY29tbWl0KCk7XG4gICAgICBjYWxsYmFjayA9IHB1dF9oYW5kbGVyLmNvbW1pdCgpO1xuICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIHNjaGVkdWxlKGNhbGxiYWNrLCB0cnVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgQm94KHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBpZiAodGhpcy5jbG9zZWQpIHtcbiAgICBoYW5kbGVyLmNvbW1pdCgpO1xuICAgIHJldHVybiBuZXcgQm94KENMT1NFRCk7XG4gIH1cblxuICAvLyBObyBidWZmZXIsIGVtcHR5IGJ1ZmZlciwgbm8gcGVuZGluZyBwdXRzLiBRdWV1ZSB0aGlzIHRha2Ugbm93LlxuICBpZiAodGhpcy5kaXJ0eV90YWtlcyA+IE1BWF9ESVJUWSkge1xuICAgIHRoaXMudGFrZXMuY2xlYW51cChmdW5jdGlvbihoYW5kbGVyKSB7XG4gICAgICByZXR1cm4gaGFuZGxlci5pc19hY3RpdmUoKTtcbiAgICB9KTtcbiAgICB0aGlzLmRpcnR5X3Rha2VzID0gMDtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmRpcnR5X3Rha2VzICsrO1xuICB9XG4gIGlmICh0aGlzLnRha2VzLmxlbmd0aCA+PSBNQVhfUVVFVUVfU0laRSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIk5vIG1vcmUgdGhhbiBcIiArIE1BWF9RVUVVRV9TSVpFICsgXCIgcGVuZGluZyB0YWtlcyBhcmUgYWxsb3dlZCBvbiBhIHNpbmdsZSBjaGFubmVsLlwiKTtcbiAgfVxuICB0aGlzLnRha2VzLnVuYm91bmRlZF91bnNoaWZ0KGhhbmRsZXIpO1xuICByZXR1cm4gbnVsbDtcbn07XG5cbkNoYW5uZWwucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmNsb3NlZCkge1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLmNsb3NlZCA9IHRydWU7XG5cbiAgLy8gVE9ETzogRHVwbGljYXRlIGNvZGUuIE1ha2UgYSBcIl9mbHVzaFwiIGZ1bmN0aW9uIG9yIHNvbWV0aGluZ1xuICBpZiAodGhpcy5idWYpIHtcbiAgICB0aGlzLmJ1Zi5jbG9zZSgpO1xuICAgIHRoaXMueGZvcm1bXCJAQHRyYW5zZHVjZXIvcmVzdWx0XCJdKHRoaXMuYnVmKTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWYgKHRoaXMuYnVmLmNvdW50KCkgPT09IDApIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICB0YWtlciA9IHRoaXMudGFrZXMucG9wKCk7XG4gICAgICBpZiAodGFrZXIgPT09IGJ1ZmZlcnMuRU1QVFkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAodGFrZXIuaXNfYWN0aXZlKCkpIHtcbiAgICAgICAgY2FsbGJhY2sgPSB0YWtlci5jb21taXQoKTtcbiAgICAgICAgdmFyIHZhbHVlID0gdGhpcy5idWYucmVtb3ZlKCk7XG4gICAgICAgIHNjaGVkdWxlKGNhbGxiYWNrLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICB2YXIgdGFrZXIgPSB0aGlzLnRha2VzLnBvcCgpO1xuICAgIGlmICh0YWtlciA9PT0gYnVmZmVycy5FTVBUWSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmICh0YWtlci5pc19hY3RpdmUoKSkge1xuICAgICAgdmFyIGNhbGxiYWNrID0gdGFrZXIuY29tbWl0KCk7XG4gICAgICBzY2hlZHVsZShjYWxsYmFjaywgQ0xPU0VEKTtcbiAgICB9XG4gIH1cblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHZhciBwdXR0ZXIgPSB0aGlzLnB1dHMucG9wKCk7XG4gICAgaWYgKHB1dHRlciA9PT0gYnVmZmVycy5FTVBUWSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmIChwdXR0ZXIuaGFuZGxlci5pc19hY3RpdmUoKSkge1xuICAgICAgdmFyIHB1dF9jYWxsYmFjayA9IHB1dHRlci5oYW5kbGVyLmNvbW1pdCgpO1xuICAgICAgaWYgKHB1dF9jYWxsYmFjaykge1xuICAgICAgICBzY2hlZHVsZShwdXRfY2FsbGJhY2ssIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cblxuQ2hhbm5lbC5wcm90b3R5cGUuaXNfY2xvc2VkID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmNsb3NlZDtcbn07XG5cbmZ1bmN0aW9uIGRlZmF1bHRIYW5kbGVyKGUpIHtcbiAgY29uc29sZS5sb2coJ2Vycm9yIGluIGNoYW5uZWwgdHJhbnNmb3JtZXInLCBlLnN0YWNrKTtcbiAgcmV0dXJuIENMT1NFRDtcbn1cblxuZnVuY3Rpb24gaGFuZGxlRXgoYnVmLCBleEhhbmRsZXIsIGUpIHtcbiAgdmFyIGRlZiA9IChleEhhbmRsZXIgfHwgZGVmYXVsdEhhbmRsZXIpKGUpO1xuICBpZiAoZGVmICE9PSBDTE9TRUQpIHtcbiAgICBidWYuYWRkKGRlZik7XG4gIH1cbiAgcmV0dXJuIGJ1Zjtcbn1cblxuLy8gVGhlIGJhc2UgdHJhbnNmb3JtZXIgb2JqZWN0IHRvIHVzZSB3aXRoIHRyYW5zZHVjZXJzXG5mdW5jdGlvbiBBZGRUcmFuc2Zvcm1lcigpIHtcbn1cblxuQWRkVHJhbnNmb3JtZXIucHJvdG90eXBlW1wiQEB0cmFuc2R1Y2VyL2luaXRcIl0gPSBmdW5jdGlvbigpIHtcbiAgdGhyb3cgbmV3IEVycm9yKCdpbml0IG5vdCBhdmFpbGFibGUnKTtcbn07XG5cbkFkZFRyYW5zZm9ybWVyLnByb3RvdHlwZVtcIkBAdHJhbnNkdWNlci9yZXN1bHRcIl0gPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiB2O1xufTtcblxuQWRkVHJhbnNmb3JtZXIucHJvdG90eXBlW1wiQEB0cmFuc2R1Y2VyL3N0ZXBcIl0gPSBmdW5jdGlvbihidWZmZXIsIGlucHV0KSB7XG4gIGJ1ZmZlci5hZGQoaW5wdXQpO1xuICByZXR1cm4gYnVmZmVyO1xufTtcblxuXG5mdW5jdGlvbiBoYW5kbGVFeGNlcHRpb24oZXhIYW5kbGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbih4Zm9ybSkge1xuICAgIHJldHVybiB7XG4gICAgICBcIkBAdHJhbnNkdWNlci9zdGVwXCI6IGZ1bmN0aW9uKGJ1ZmZlciwgaW5wdXQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4geGZvcm1bXCJAQHRyYW5zZHVjZXIvc3RlcFwiXShidWZmZXIsIGlucHV0KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHJldHVybiBoYW5kbGVFeChidWZmZXIsIGV4SGFuZGxlciwgZSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcIkBAdHJhbnNkdWNlci9yZXN1bHRcIjogZnVuY3Rpb24oYnVmZmVyKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIHhmb3JtW1wiQEB0cmFuc2R1Y2VyL3Jlc3VsdFwiXShidWZmZXIpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgcmV0dXJuIGhhbmRsZUV4KGJ1ZmZlciwgZXhIYW5kbGVyLCBlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH07XG59XG5cbi8vIFhYWDogVGhpcyBpcyBpbmNvbnNpc3RlbnQuIFdlIHNob3VsZCBlaXRoZXIgY2FsbCB0aGUgcmVkdWNpbmdcbi8vIGZ1bmN0aW9uIHhmb3JtLCBvciBjYWxsIHRoZSB0cmFuc2R1Y2VyIHhmb3JtLCBub3QgYm90aFxuZXhwb3J0cy5jaGFuID0gZnVuY3Rpb24oYnVmLCB4Zm9ybSwgZXhIYW5kbGVyKSB7XG4gIGlmICh4Zm9ybSkge1xuICAgIGlmICghYnVmKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPbmx5IGJ1ZmZlcmVkIGNoYW5uZWxzIGNhbiB1c2UgdHJhbnNkdWNlcnNcIik7XG4gICAgfVxuXG4gICAgeGZvcm0gPSB4Zm9ybShuZXcgQWRkVHJhbnNmb3JtZXIoKSk7XG4gIH0gZWxzZSB7XG4gICAgeGZvcm0gPSBuZXcgQWRkVHJhbnNmb3JtZXIoKTtcbiAgfVxuICB4Zm9ybSA9IGhhbmRsZUV4Y2VwdGlvbihleEhhbmRsZXIpKHhmb3JtKTtcblxuICByZXR1cm4gbmV3IENoYW5uZWwoYnVmZmVycy5yaW5nKDMyKSwgYnVmZmVycy5yaW5nKDMyKSwgYnVmLCB4Zm9ybSk7XG59O1xuXG5leHBvcnRzLkJveCA9IEJveDtcbmV4cG9ydHMuQ2hhbm5lbCA9IENoYW5uZWw7XG5leHBvcnRzLkNMT1NFRCA9IENMT1NFRDtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG4vLyBUT0RPOiBVc2UgcHJvY2Vzcy5uZXh0VGljayBpZiBpdCdzIGF2YWlsYWJsZSBzaW5jZSBpdCdzIG1vcmVcbi8vIGVmZmljaWVudFxuLy8gaHR0cDovL2hvd3Rvbm9kZS5vcmcvdW5kZXJzdGFuZGluZy1wcm9jZXNzLW5leHQtdGlja1xuLy8gTWF5YmUgd2UgZG9uJ3QgZXZlbiBuZWVkIHRvIHF1ZXVlIG91cnNlbHZlcyBpbiB0aGF0IGNhc2U/XG5cbi8vIFhYWDogQnV0IGh0dHA6Ly9ibG9nLm5vZGVqcy5vcmcvMjAxMy8wMy8xMS9ub2RlLXYwLTEwLTAtc3RhYmxlL1xuLy8gTG9va3MgbGlrZSBpdCB3aWxsIGJsb3cgdXAgdGhlIHN0YWNrIChvciBpcyB0aGF0IGp1c3QgYWJvdXRcbi8vIHByZS1lbXB0aW5nIElPIChidXQgdGhhdCdzIGFscmVhZHkgYmFkIGVub3VnaCBJTU8pPylcblxuLy8gTG9va3MgbGlrZVxuLy8gaHR0cDovL25vZGVqcy5vcmcvYXBpL3Byb2Nlc3MuaHRtbCNwcm9jZXNzX3Byb2Nlc3NfbmV4dHRpY2tfY2FsbGJhY2tcbi8vIGlzIHRoZSBlcXVpdmFsZW50IG9mIG91ciBUQVNLX0JBVENIX1NJWkVcblxudmFyIGJ1ZmZlcnMgPSByZXF1aXJlKFwiLi9idWZmZXJzXCIpO1xuXG52YXIgVEFTS19CQVRDSF9TSVpFID0gMTAyNDtcblxudmFyIHRhc2tzID0gYnVmZmVycy5yaW5nKDMyKTtcbnZhciBydW5uaW5nID0gZmFsc2U7XG52YXIgcXVldWVkID0gZmFsc2U7XG5cbnZhciBxdWV1ZV9kaXNwYXRjaGVyO1xuXG5mdW5jdGlvbiBwcm9jZXNzX21lc3NhZ2VzKCkge1xuICBydW5uaW5nID0gdHJ1ZTtcbiAgcXVldWVkID0gZmFsc2U7XG4gIHZhciBjb3VudCA9IDA7XG4gIHdoaWxlICh0cnVlKSB7XG4gICAgdmFyIHRhc2sgPSB0YXNrcy5wb3AoKTtcbiAgICBpZiAodGFzayA9PT0gYnVmZmVycy5FTVBUWSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIC8vIFRPRE86IERvbid0IHdlIG5lZWQgYSB0cnkvZmluYWxseSBoZXJlP1xuICAgIHRhc2soKTtcbiAgICBpZiAoY291bnQgPj0gVEFTS19CQVRDSF9TSVpFKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY291bnQgKys7XG4gIH1cbiAgcnVubmluZyA9IGZhbHNlO1xuICBpZiAodGFza3MubGVuZ3RoID4gMCkge1xuICAgIHF1ZXVlX2Rpc3BhdGNoZXIoKTtcbiAgfVxufVxuXG5pZiAodHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gIHZhciBtZXNzYWdlX2NoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcbiAgbWVzc2FnZV9jaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKF8pIHtcbiAgICBwcm9jZXNzX21lc3NhZ2VzKCk7XG4gIH07XG4gIHF1ZXVlX2Rpc3BhdGNoZXIgPSBmdW5jdGlvbigpICB7XG4gICAgaWYgKCEocXVldWVkICYmIHJ1bm5pbmcpKSB7XG4gICAgICBxdWV1ZWQgPSB0cnVlO1xuICAgICAgbWVzc2FnZV9jaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuICAgIH1cbiAgfTtcbn0gZWxzZSBpZiAodHlwZW9mIHNldEltbWVkaWF0ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICBxdWV1ZV9kaXNwYXRjaGVyID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCEocXVldWVkICYmIHJ1bm5pbmcpKSB7XG4gICAgICBxdWV1ZWQgPSB0cnVlO1xuICAgICAgc2V0SW1tZWRpYXRlKHByb2Nlc3NfbWVzc2FnZXMpO1xuICAgIH1cbiAgfTtcbn0gZWxzZSB7XG4gIHF1ZXVlX2Rpc3BhdGNoZXIgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIShxdWV1ZWQgJiYgcnVubmluZykpIHtcbiAgICAgIHF1ZXVlZCA9IHRydWU7XG4gICAgICBzZXRUaW1lb3V0KHByb2Nlc3NfbWVzc2FnZXMsIDApO1xuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0cy5ydW4gPSBmdW5jdGlvbiAoZikge1xuICB0YXNrcy51bmJvdW5kZWRfdW5zaGlmdChmKTtcbiAgcXVldWVfZGlzcGF0Y2hlcigpO1xufTtcblxuZXhwb3J0cy5xdWV1ZV9kZWxheSA9IGZ1bmN0aW9uKGYsIGRlbGF5KSB7XG4gIHNldFRpbWVvdXQoZiwgZGVsYXkpO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgZGlzcGF0Y2ggPSByZXF1aXJlKFwiLi9kaXNwYXRjaFwiKTtcbnZhciBzZWxlY3QgPSByZXF1aXJlKFwiLi9zZWxlY3RcIik7XG52YXIgQ2hhbm5lbCA9IHJlcXVpcmUoXCIuL2NoYW5uZWxzXCIpLkNoYW5uZWw7XG5cbnZhciBGbkhhbmRsZXIgPSBmdW5jdGlvbihmKSB7XG4gIHRoaXMuZiA9IGY7XG59O1xuXG5GbkhhbmRsZXIucHJvdG90eXBlLmlzX2FjdGl2ZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkZuSGFuZGxlci5wcm90b3R5cGUuY29tbWl0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmY7XG59O1xuXG5mdW5jdGlvbiBwdXRfdGhlbl9jYWxsYmFjayhjaGFubmVsLCB2YWx1ZSwgY2FsbGJhY2spIHtcbiAgdmFyIHJlc3VsdCA9IGNoYW5uZWwuX3B1dCh2YWx1ZSwgbmV3IEZuSGFuZGxlcihjYWxsYmFjaykpO1xuICBpZiAocmVzdWx0ICYmIGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2socmVzdWx0LnZhbHVlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0YWtlX3RoZW5fY2FsbGJhY2soY2hhbm5lbCwgY2FsbGJhY2spIHtcbiAgdmFyIHJlc3VsdCA9IGNoYW5uZWwuX3Rha2UobmV3IEZuSGFuZGxlcihjYWxsYmFjaykpO1xuICBpZiAocmVzdWx0KSB7XG4gICAgY2FsbGJhY2socmVzdWx0LnZhbHVlKTtcbiAgfVxufVxuXG52YXIgUHJvY2VzcyA9IGZ1bmN0aW9uKGdlbiwgb25GaW5pc2gsIGNyZWF0b3IpIHtcbiAgdGhpcy5nZW4gPSBnZW47XG4gIHRoaXMuY3JlYXRvckZ1bmMgPSBjcmVhdG9yO1xuICB0aGlzLmZpbmlzaGVkID0gZmFsc2U7XG4gIHRoaXMub25GaW5pc2ggPSBvbkZpbmlzaDtcbn07XG5cbnZhciBJbnN0cnVjdGlvbiA9IGZ1bmN0aW9uKG9wLCBkYXRhKSB7XG4gIHRoaXMub3AgPSBvcDtcbiAgdGhpcy5kYXRhID0gZGF0YTtcbn07XG5cbnZhciBUQUtFID0gXCJ0YWtlXCI7XG52YXIgUFVUID0gXCJwdXRcIjtcbnZhciBTTEVFUCA9IFwic2xlZXBcIjtcbnZhciBBTFRTID0gXCJhbHRzXCI7XG5cbi8vIFRPRE8gRklYIFhYWDogVGhpcyBpcyBhIChwcm9iYWJseSkgdGVtcG9yYXJ5IGhhY2sgdG8gYXZvaWQgYmxvd2luZ1xuLy8gdXAgdGhlIHN0YWNrLCBidXQgaXQgbWVhbnMgZG91YmxlIHF1ZXVlaW5nIHdoZW4gdGhlIHZhbHVlIGlzIG5vdFxuLy8gaW1tZWRpYXRlbHkgYXZhaWxhYmxlXG5Qcm9jZXNzLnByb3RvdHlwZS5fY29udGludWUgPSBmdW5jdGlvbihyZXNwb25zZSkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIGRpc3BhdGNoLnJ1bihmdW5jdGlvbigpIHtcbiAgICBzZWxmLnJ1bihyZXNwb25zZSk7XG4gIH0pO1xufTtcblxuUHJvY2Vzcy5wcm90b3R5cGUuX2RvbmUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICBpZiAoIXRoaXMuZmluaXNoZWQpIHtcbiAgICB0aGlzLmZpbmlzaGVkID0gdHJ1ZTtcbiAgICB2YXIgb25GaW5pc2ggPSB0aGlzLm9uRmluaXNoO1xuICAgIGlmICh0eXBlb2Ygb25GaW5pc2ggPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgZGlzcGF0Y2gucnVuKGZ1bmN0aW9uKCkge1xuICAgICAgICBvbkZpbmlzaCh2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn07XG5cblByb2Nlc3MucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gIGlmICh0aGlzLmZpbmlzaGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gVE9ETzogU2hvdWxkbid0IHdlIChvcHRpb25hbGx5KSBzdG9wIGVycm9yIHByb3BhZ2F0aW9uIGhlcmUgKGFuZFxuICAvLyBzaWduYWwgdGhlIGVycm9yIHRocm91Z2ggYSBjaGFubmVsIG9yIHNvbWV0aGluZyk/IE90aGVyd2lzZSB0aGVcbiAgLy8gdW5jYXVnaHQgZXhjZXB0aW9uIHdpbGwgY3Jhc2ggc29tZSBydW50aW1lcyAoZS5nLiBOb2RlKVxuICB2YXIgaXRlciA9IHRoaXMuZ2VuLm5leHQocmVzcG9uc2UpO1xuICBpZiAoaXRlci5kb25lKSB7XG4gICAgdGhpcy5fZG9uZShpdGVyLnZhbHVlKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgaW5zID0gaXRlci52YWx1ZTtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIGlmIChpbnMgaW5zdGFuY2VvZiBJbnN0cnVjdGlvbikge1xuICAgIHN3aXRjaCAoaW5zLm9wKSB7XG4gICAgY2FzZSBQVVQ6XG4gICAgICB2YXIgZGF0YSA9IGlucy5kYXRhO1xuICAgICAgcHV0X3RoZW5fY2FsbGJhY2soZGF0YS5jaGFubmVsLCBkYXRhLnZhbHVlLCBmdW5jdGlvbihvaykge1xuICAgICAgICBzZWxmLl9jb250aW51ZShvayk7XG4gICAgICB9KTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBUQUtFOlxuICAgICAgdmFyIGNoYW5uZWwgPSBpbnMuZGF0YTtcbiAgICAgIHRha2VfdGhlbl9jYWxsYmFjayhjaGFubmVsLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBzZWxmLl9jb250aW51ZSh2YWx1ZSk7XG4gICAgICB9KTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBTTEVFUDpcbiAgICAgIHZhciBtc2VjcyA9IGlucy5kYXRhO1xuICAgICAgZGlzcGF0Y2gucXVldWVfZGVsYXkoZnVuY3Rpb24oKSB7XG4gICAgICAgIHNlbGYucnVuKG51bGwpO1xuICAgICAgfSwgbXNlY3MpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIEFMVFM6XG4gICAgICBzZWxlY3QuZG9fYWx0cyhpbnMuZGF0YS5vcGVyYXRpb25zLCBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgc2VsZi5fY29udGludWUocmVzdWx0KTtcbiAgICAgIH0sIGlucy5kYXRhLm9wdGlvbnMpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIGVsc2UgaWYoaW5zIGluc3RhbmNlb2YgQ2hhbm5lbCkge1xuICAgIHZhciBjaGFubmVsID0gaW5zO1xuICAgIHRha2VfdGhlbl9jYWxsYmFjayhjaGFubmVsLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgc2VsZi5fY29udGludWUodmFsdWUpO1xuICAgIH0pO1xuICB9XG4gIGVsc2Uge1xuICAgIHRoaXMuX2NvbnRpbnVlKGlucyk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHRha2UoY2hhbm5lbCkge1xuICByZXR1cm4gbmV3IEluc3RydWN0aW9uKFRBS0UsIGNoYW5uZWwpO1xufVxuXG5mdW5jdGlvbiBwdXQoY2hhbm5lbCwgdmFsdWUpIHtcbiAgcmV0dXJuIG5ldyBJbnN0cnVjdGlvbihQVVQsIHtcbiAgICBjaGFubmVsOiBjaGFubmVsLFxuICAgIHZhbHVlOiB2YWx1ZVxuICB9KTtcbn1cblxuZnVuY3Rpb24gc2xlZXAobXNlY3MpIHtcbiAgcmV0dXJuIG5ldyBJbnN0cnVjdGlvbihTTEVFUCwgbXNlY3MpO1xufVxuXG5mdW5jdGlvbiBhbHRzKG9wZXJhdGlvbnMsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIG5ldyBJbnN0cnVjdGlvbihBTFRTLCB7XG4gICAgb3BlcmF0aW9uczogb3BlcmF0aW9ucyxcbiAgICBvcHRpb25zOiBvcHRpb25zXG4gIH0pO1xufVxuXG5leHBvcnRzLnB1dF90aGVuX2NhbGxiYWNrID0gcHV0X3RoZW5fY2FsbGJhY2s7XG5leHBvcnRzLnRha2VfdGhlbl9jYWxsYmFjayA9IHRha2VfdGhlbl9jYWxsYmFjaztcbmV4cG9ydHMucHV0ID0gcHV0O1xuZXhwb3J0cy50YWtlID0gdGFrZTtcbmV4cG9ydHMuc2xlZXAgPSBzbGVlcDtcbmV4cG9ydHMuYWx0cyA9IGFsdHM7XG5leHBvcnRzLkluc3RydWN0aW9uID0gSW5zdHJ1Y3Rpb247XG5leHBvcnRzLlByb2Nlc3MgPSBQcm9jZXNzO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBCb3ggPSByZXF1aXJlKFwiLi9jaGFubmVsc1wiKS5Cb3g7XG5cbnZhciBBbHRIYW5kbGVyID0gZnVuY3Rpb24oZmxhZywgZikge1xuICB0aGlzLmYgPSBmO1xuICB0aGlzLmZsYWcgPSBmbGFnO1xufTtcblxuQWx0SGFuZGxlci5wcm90b3R5cGUuaXNfYWN0aXZlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmZsYWcudmFsdWU7XG59O1xuXG5BbHRIYW5kbGVyLnByb3RvdHlwZS5jb21taXQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5mbGFnLnZhbHVlID0gZmFsc2U7XG4gIHJldHVybiB0aGlzLmY7XG59O1xuXG52YXIgQWx0UmVzdWx0ID0gZnVuY3Rpb24odmFsdWUsIGNoYW5uZWwpIHtcbiAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICB0aGlzLmNoYW5uZWwgPSBjaGFubmVsO1xufTtcblxuZnVuY3Rpb24gcmFuZF9pbnQobikge1xuICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG4gKyAxKSk7XG59XG5cbmZ1bmN0aW9uIHJhbmRvbV9hcnJheShuKSB7XG4gIHZhciBhID0gbmV3IEFycmF5KG4pO1xuICB2YXIgaTtcbiAgZm9yIChpID0gMDsgaSA8IG47IGkrKykge1xuICAgIGFbaV0gPSAwO1xuICB9XG4gIGZvciAoaSA9IDE7IGkgPCBuOyBpKyspIHtcbiAgICB2YXIgaiA9IHJhbmRfaW50KGkpO1xuICAgIGFbaV0gPSBhW2pdO1xuICAgIGFbal0gPSBpO1xuICB9XG4gIHJldHVybiBhO1xufVxuXG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG52YXIgREVGQVVMVCA9IHtcbiAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBcIltvYmplY3QgREVGQVVMVF1cIjtcbiAgfVxufTtcblxuLy8gVE9ETzogQWNjZXB0IGEgcHJpb3JpdHkgZnVuY3Rpb24gb3Igc29tZXRoaW5nXG5leHBvcnRzLmRvX2FsdHMgPSBmdW5jdGlvbihvcGVyYXRpb25zLCBjYWxsYmFjaywgb3B0aW9ucykge1xuICB2YXIgbGVuZ3RoID0gb3BlcmF0aW9ucy5sZW5ndGg7XG4gIC8vIFhYWCBIbW1cbiAgaWYgKGxlbmd0aCA9PT0gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkVtcHR5IGFsdCBsaXN0XCIpO1xuICB9XG5cbiAgdmFyIHByaW9yaXR5ID0gKG9wdGlvbnMgJiYgb3B0aW9ucy5wcmlvcml0eSkgPyB0cnVlIDogZmFsc2U7XG4gIGlmICghcHJpb3JpdHkpIHtcbiAgICB2YXIgaW5kZXhlcyA9IHJhbmRvbV9hcnJheShsZW5ndGgpO1xuICB9XG5cbiAgdmFyIGZsYWcgPSBuZXcgQm94KHRydWUpO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgb3BlcmF0aW9uID0gb3BlcmF0aW9uc1twcmlvcml0eSA/IGkgOiBpbmRleGVzW2ldXTtcbiAgICB2YXIgcG9ydCwgcmVzdWx0O1xuICAgIC8vIFhYWCBIbW1cbiAgICBpZiAob3BlcmF0aW9uIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgIHZhciB2YWx1ZSA9IG9wZXJhdGlvblsxXTtcbiAgICAgIHBvcnQgPSBvcGVyYXRpb25bMF07XG4gICAgICAvLyBXZSB3cmFwIHRoaXMgaW4gYSBmdW5jdGlvbiB0byBjYXB0dXJlIHRoZSB2YWx1ZSBvZiBcInBvcnRcIixcbiAgICAgIC8vIGJlY2F1c2UganMnIGNsb3N1cmUgY2FwdHVyZXMgdmFycyBieSBcInJlZmVyZW5jZXNcIiwgbm90XG4gICAgICAvLyB2YWx1ZXMuIFwibGV0IHBvcnRcIiB3b3VsZCBoYXZlIHdvcmtlZCwgYnV0IEkgZG9uJ3Qgd2FudCB0b1xuICAgICAgLy8gcmFpc2UgdGhlIHJ1bnRpbWUgcmVxdWlyZW1lbnQgeWV0LiBUT0RPOiBTbyBjaGFuZ2UgdGhpcyB3aGVuXG4gICAgICAvLyBtb3N0IHJ1bnRpbWVzIGFyZSBtb2Rlcm4gZW5vdWdoLlxuICAgICAgcmVzdWx0ID0gcG9ydC5fcHV0KHZhbHVlLCAoZnVuY3Rpb24ocG9ydCkge1xuICAgICAgICByZXR1cm4gbmV3IEFsdEhhbmRsZXIoZmxhZywgZnVuY3Rpb24ob2spIHtcbiAgICAgICAgICBjYWxsYmFjayhuZXcgQWx0UmVzdWx0KG9rLCBwb3J0KSk7XG4gICAgICAgIH0pO1xuICAgICAgfSkocG9ydCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwb3J0ID0gb3BlcmF0aW9uO1xuICAgICAgcmVzdWx0ID0gcG9ydC5fdGFrZSgoZnVuY3Rpb24ocG9ydCkge1xuICAgICAgICByZXR1cm4gbmV3IEFsdEhhbmRsZXIoZmxhZywgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICBjYWxsYmFjayhuZXcgQWx0UmVzdWx0KHZhbHVlLCBwb3J0KSk7XG4gICAgICAgIH0pO1xuICAgICAgfSkocG9ydCkpO1xuICAgIH1cbiAgICAvLyBYWFggSG1tXG4gICAgaWYgKHJlc3VsdCBpbnN0YW5jZW9mIEJveCkge1xuICAgICAgY2FsbGJhY2sobmV3IEFsdFJlc3VsdChyZXN1bHQudmFsdWUsIHBvcnQpKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGlmICghKHJlc3VsdCBpbnN0YW5jZW9mIEJveClcbiAgICAgICYmIG9wdGlvbnNcbiAgICAgICYmIGhhc093blByb3BlcnR5LmNhbGwob3B0aW9ucywgXCJkZWZhdWx0XCIpKSB7XG4gICAgaWYgKGZsYWcudmFsdWUpIHtcbiAgICAgIGZsYWcudmFsdWUgPSBmYWxzZTtcbiAgICAgIGNhbGxiYWNrKG5ldyBBbHRSZXN1bHQob3B0aW9uc1tcImRlZmF1bHRcIl0sIERFRkFVTFQpKTtcbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydHMuREVGQVVMVCA9IERFRkFVTFQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGRpc3BhdGNoID0gcmVxdWlyZShcIi4vZGlzcGF0Y2hcIik7XG52YXIgY2hhbm5lbHMgPSByZXF1aXJlKFwiLi9jaGFubmVsc1wiKTtcblxuZXhwb3J0cy50aW1lb3V0ID0gZnVuY3Rpb24gdGltZW91dF9jaGFubmVsKG1zZWNzKSB7XG4gIHZhciBjaGFuID0gY2hhbm5lbHMuY2hhbigpO1xuICBkaXNwYXRjaC5xdWV1ZV9kZWxheShmdW5jdGlvbigpIHtcbiAgICBjaGFuLmNsb3NlKCk7XG4gIH0sIG1zZWNzKTtcbiAgcmV0dXJuIGNoYW47XG59O1xuIiwiXG4vLyBiYXNpYyBwcm90b2NvbCBoZWxwZXJzXG5cbnZhciBzeW1ib2xFeGlzdHMgPSB0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJztcblxudmFyIHByb3RvY29scyA9IHtcbiAgaXRlcmF0b3I6IHN5bWJvbEV4aXN0cyA/IFN5bWJvbC5pdGVyYXRvciA6ICdAQGl0ZXJhdG9yJ1xufTtcblxuZnVuY3Rpb24gdGhyb3dQcm90b2NvbEVycm9yKG5hbWUsIGNvbGwpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwiZG9uJ3Qga25vdyBob3cgdG8gXCIgKyBuYW1lICsgXCIgY29sbGVjdGlvbjogXCIgK1xuICAgICAgICAgICAgICAgICAgY29sbCk7XG59XG5cbmZ1bmN0aW9uIGZ1bGZpbGxzUHJvdG9jb2wob2JqLCBuYW1lKSB7XG4gIGlmKG5hbWUgPT09ICdpdGVyYXRvcicpIHtcbiAgICAvLyBBY2NlcHQgaWxsLWZvcm1lZCBpdGVyYXRvcnMgdGhhdCBkb24ndCBjb25mb3JtIHRvIHRoZVxuICAgIC8vIHByb3RvY29sIGJ5IGFjY2VwdGluZyBqdXN0IG5leHQoKVxuICAgIHJldHVybiBvYmpbcHJvdG9jb2xzLml0ZXJhdG9yXSB8fCBvYmoubmV4dDtcbiAgfVxuXG4gIHJldHVybiBvYmpbcHJvdG9jb2xzW25hbWVdXTtcbn1cblxuZnVuY3Rpb24gZ2V0UHJvdG9jb2xQcm9wZXJ0eShvYmosIG5hbWUpIHtcbiAgcmV0dXJuIG9ialtwcm90b2NvbHNbbmFtZV1dO1xufVxuXG5mdW5jdGlvbiBpdGVyYXRvcihjb2xsKSB7XG4gIHZhciBpdGVyID0gZ2V0UHJvdG9jb2xQcm9wZXJ0eShjb2xsLCAnaXRlcmF0b3InKTtcbiAgaWYoaXRlcikge1xuICAgIHJldHVybiBpdGVyLmNhbGwoY29sbCk7XG4gIH1cbiAgZWxzZSBpZihjb2xsLm5leHQpIHtcbiAgICAvLyBCYXNpYyBkdWNrIHR5cGluZyB0byBhY2NlcHQgYW4gaWxsLWZvcm1lZCBpdGVyYXRvciB0aGF0IGRvZXNuJ3RcbiAgICAvLyBjb25mb3JtIHRvIHRoZSBpdGVyYXRvciBwcm90b2NvbCAoYWxsIGl0ZXJhdG9ycyBzaG91bGQgaGF2ZSB0aGVcbiAgICAvLyBAQGl0ZXJhdG9yIG1ldGhvZCBhbmQgcmV0dXJuIHRoZW1zZWx2ZXMsIGJ1dCBzb21lIGVuZ2luZXMgZG9uJ3RcbiAgICAvLyBoYXZlIHRoYXQgb24gZ2VuZXJhdG9ycyBsaWtlIG9sZGVyIHY4KVxuICAgIHJldHVybiBjb2xsO1xuICB9XG4gIGVsc2UgaWYoaXNBcnJheShjb2xsKSkge1xuICAgIHJldHVybiBuZXcgQXJyYXlJdGVyYXRvcihjb2xsKTtcbiAgfVxuICBlbHNlIGlmKGlzT2JqZWN0KGNvbGwpKSB7XG4gICAgcmV0dXJuIG5ldyBPYmplY3RJdGVyYXRvcihjb2xsKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBBcnJheUl0ZXJhdG9yKGFycikge1xuICB0aGlzLmFyciA9IGFycjtcbiAgdGhpcy5pbmRleCA9IDA7XG59XG5cbkFycmF5SXRlcmF0b3IucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbigpIHtcbiAgaWYodGhpcy5pbmRleCA8IHRoaXMuYXJyLmxlbmd0aCkge1xuICAgIHJldHVybiB7XG4gICAgICB2YWx1ZTogdGhpcy5hcnJbdGhpcy5pbmRleCsrXSxcbiAgICAgIGRvbmU6IGZhbHNlXG4gICAgfTtcbiAgfVxuICByZXR1cm4ge1xuICAgIGRvbmU6IHRydWVcbiAgfVxufTtcblxuZnVuY3Rpb24gT2JqZWN0SXRlcmF0b3Iob2JqKSB7XG4gIHRoaXMub2JqID0gb2JqO1xuICB0aGlzLmtleXMgPSBPYmplY3Qua2V5cyhvYmopO1xuICB0aGlzLmluZGV4ID0gMDtcbn1cblxuT2JqZWN0SXRlcmF0b3IucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbigpIHtcbiAgaWYodGhpcy5pbmRleCA8IHRoaXMua2V5cy5sZW5ndGgpIHtcbiAgICB2YXIgayA9IHRoaXMua2V5c1t0aGlzLmluZGV4KytdO1xuICAgIHJldHVybiB7XG4gICAgICB2YWx1ZTogW2ssIHRoaXMub2JqW2tdXSxcbiAgICAgIGRvbmU6IGZhbHNlXG4gICAgfTtcbiAgfVxuICByZXR1cm4ge1xuICAgIGRvbmU6IHRydWVcbiAgfVxufTtcblxuLy8gaGVscGVyc1xuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xudmFyIGlzQXJyYXkgPSB0eXBlb2YgQXJyYXkuaXNBcnJheSA9PT0gJ2Z1bmN0aW9uJyA/IEFycmF5LmlzQXJyYXkgOiBmdW5jdGlvbihvYmopIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBBcnJheV0nO1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbih4KSB7XG4gIHJldHVybiB0eXBlb2YgeCA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoeCkge1xuICByZXR1cm4geCBpbnN0YW5jZW9mIE9iamVjdCAmJlxuICAgIE9iamVjdC5nZXRQcm90b3R5cGVPZih4KSA9PT0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHt9KTtcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoeCkge1xuICByZXR1cm4gdHlwZW9mIHggPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBSZWR1Y2VkKHZhbHVlKSB7XG4gIHRoaXNbJ0BAdHJhbnNkdWNlci9yZWR1Y2VkJ10gPSB0cnVlO1xuICB0aGlzWydAQHRyYW5zZHVjZXIvdmFsdWUnXSA9IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBpc1JlZHVjZWQoeCkge1xuICByZXR1cm4gKHggaW5zdGFuY2VvZiBSZWR1Y2VkKSB8fCAoeCAmJiB4WydAQHRyYW5zZHVjZXIvcmVkdWNlZCddKTtcbn1cblxuZnVuY3Rpb24gZGVyZWYoeCkge1xuICByZXR1cm4geFsnQEB0cmFuc2R1Y2VyL3ZhbHVlJ107XG59XG5cbi8qKlxuICogVGhpcyBpcyBmb3IgdHJhbnNmb3JtcyB0aGF0IG1heSBjYWxsIHRoZWlyIG5lc3RlZCB0cmFuc2Zvcm1zIGJlZm9yZVxuICogUmVkdWNlZC13cmFwcGluZyB0aGUgcmVzdWx0IChlLmcuIFwidGFrZVwiKSwgdG8gYXZvaWQgbmVzdGVkIFJlZHVjZWQuXG4gKi9cbmZ1bmN0aW9uIGVuc3VyZVJlZHVjZWQodmFsKSB7XG4gIGlmKGlzUmVkdWNlZCh2YWwpKSB7XG4gICAgcmV0dXJuIHZhbDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbmV3IFJlZHVjZWQodmFsKTtcbiAgfVxufVxuXG4vKipcbiAqIFRoaXMgaXMgZm9yIHRyYW5mb3JtcyB0aGF0IGNhbGwgdGhlaXIgbmVzdGVkIHRyYW5zZm9ybXMgd2hlblxuICogcGVyZm9ybWluZyBjb21wbGV0aW9uIChsaWtlIFwicGFydGl0aW9uXCIpLCB0byBhdm9pZCBzaWduYWxpbmdcbiAqIHRlcm1pbmF0aW9uIGFmdGVyIGFscmVhZHkgY29tcGxldGluZy5cbiAqL1xuZnVuY3Rpb24gZW5zdXJlVW5yZWR1Y2VkKHYpIHtcbiAgaWYoaXNSZWR1Y2VkKHYpKSB7XG4gICAgcmV0dXJuIGRlcmVmKHYpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB2O1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlZHVjZShjb2xsLCB4Zm9ybSwgaW5pdCkge1xuICBpZihpc0FycmF5KGNvbGwpKSB7XG4gICAgdmFyIHJlc3VsdCA9IGluaXQ7XG4gICAgdmFyIGluZGV4ID0gLTE7XG4gICAgdmFyIGxlbiA9IGNvbGwubGVuZ3RoO1xuICAgIHdoaWxlKCsraW5kZXggPCBsZW4pIHtcbiAgICAgIHJlc3VsdCA9IHhmb3JtWydAQHRyYW5zZHVjZXIvc3RlcCddKHJlc3VsdCwgY29sbFtpbmRleF0pO1xuICAgICAgaWYoaXNSZWR1Y2VkKHJlc3VsdCkpIHtcbiAgICAgICAgcmVzdWx0ID0gZGVyZWYocmVzdWx0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB4Zm9ybVsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddKHJlc3VsdCk7XG4gIH1cbiAgZWxzZSBpZihpc09iamVjdChjb2xsKSB8fCBmdWxmaWxsc1Byb3RvY29sKGNvbGwsICdpdGVyYXRvcicpKSB7XG4gICAgdmFyIHJlc3VsdCA9IGluaXQ7XG4gICAgdmFyIGl0ZXIgPSBpdGVyYXRvcihjb2xsKTtcbiAgICB2YXIgdmFsID0gaXRlci5uZXh0KCk7XG4gICAgd2hpbGUoIXZhbC5kb25lKSB7XG4gICAgICByZXN1bHQgPSB4Zm9ybVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIHZhbC52YWx1ZSk7XG4gICAgICBpZihpc1JlZHVjZWQocmVzdWx0KSkge1xuICAgICAgICByZXN1bHQgPSBkZXJlZihyZXN1bHQpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHZhbCA9IGl0ZXIubmV4dCgpO1xuICAgIH1cbiAgICByZXR1cm4geGZvcm1bJ0BAdHJhbnNkdWNlci9yZXN1bHQnXShyZXN1bHQpO1xuICB9XG4gIHRocm93UHJvdG9jb2xFcnJvcignaXRlcmF0ZScsIGNvbGwpO1xufVxuXG5mdW5jdGlvbiB0cmFuc2R1Y2UoY29sbCwgeGZvcm0sIHJlZHVjZXIsIGluaXQpIHtcbiAgeGZvcm0gPSB4Zm9ybShyZWR1Y2VyKTtcbiAgaWYoaW5pdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgaW5pdCA9IHhmb3JtWydAQHRyYW5zZHVjZXIvaW5pdCddKCk7XG4gIH1cbiAgcmV0dXJuIHJlZHVjZShjb2xsLCB4Zm9ybSwgaW5pdCk7XG59XG5cbmZ1bmN0aW9uIGNvbXBvc2UoKSB7XG4gIHZhciBmdW5jcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gIHJldHVybiBmdW5jdGlvbihyKSB7XG4gICAgdmFyIHZhbHVlID0gcjtcbiAgICBmb3IodmFyIGk9ZnVuY3MubGVuZ3RoLTE7IGk+PTA7IGktLSkge1xuICAgICAgdmFsdWUgPSBmdW5jc1tpXSh2YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxufVxuXG4vLyB0cmFuc2Zvcm1hdGlvbnNcblxuZnVuY3Rpb24gdHJhbnNmb3JtZXIoZikge1xuICB2YXIgdCA9IHt9O1xuICB0WydAQHRyYW5zZHVjZXIvaW5pdCddID0gZnVuY3Rpb24oKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdpbml0IHZhbHVlIHVuYXZhaWxhYmxlJyk7XG4gIH07XG4gIHRbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSA9IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gdjtcbiAgfTtcbiAgdFsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IGY7XG4gIHJldHVybiB0O1xufVxuXG5mdW5jdGlvbiBib3VuZChmLCBjdHgsIGNvdW50KSB7XG4gIGNvdW50ID0gY291bnQgIT0gbnVsbCA/IGNvdW50IDogMTtcblxuICBpZighY3R4KSB7XG4gICAgcmV0dXJuIGY7XG4gIH1cbiAgZWxzZSB7XG4gICAgc3dpdGNoKGNvdW50KSB7XG4gICAgY2FzZSAxOlxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgcmV0dXJuIGYuY2FsbChjdHgsIHgpO1xuICAgICAgfVxuICAgIGNhc2UgMjpcbiAgICAgIHJldHVybiBmdW5jdGlvbih4LCB5KSB7XG4gICAgICAgIHJldHVybiBmLmNhbGwoY3R4LCB4LCB5KTtcbiAgICAgIH1cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGYuYmluZChjdHgpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBhcnJheU1hcChhcnIsIGYsIGN0eCkge1xuICB2YXIgaW5kZXggPSAtMTtcbiAgdmFyIGxlbmd0aCA9IGFyci5sZW5ndGg7XG4gIHZhciByZXN1bHQgPSBBcnJheShsZW5ndGgpO1xuICBmID0gYm91bmQoZiwgY3R4LCAyKTtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHJlc3VsdFtpbmRleF0gPSBmKGFycltpbmRleF0sIGluZGV4KTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBhcnJheUZpbHRlcihhcnIsIGYsIGN0eCkge1xuICB2YXIgbGVuID0gYXJyLmxlbmd0aDtcbiAgdmFyIHJlc3VsdCA9IFtdO1xuICBmID0gYm91bmQoZiwgY3R4LCAyKTtcblxuICBmb3IodmFyIGk9MDsgaTxsZW47IGkrKykge1xuICAgIGlmKGYoYXJyW2ldLCBpKSkge1xuICAgICAgcmVzdWx0LnB1c2goYXJyW2ldKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gTWFwKGYsIHhmb3JtKSB7XG4gIHRoaXMueGZvcm0gPSB4Zm9ybTtcbiAgdGhpcy5mID0gZjtcbn1cblxuTWFwLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL2luaXQnXSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy54Zm9ybVsnQEB0cmFuc2R1Y2VyL2luaXQnXSgpO1xufTtcblxuTWFwLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddID0gZnVuY3Rpb24odikge1xuICByZXR1cm4gdGhpcy54Zm9ybVsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddKHYpO1xufTtcblxuTWFwLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IGZ1bmN0aW9uKHJlcywgaW5wdXQpIHtcbiAgcmV0dXJuIHRoaXMueGZvcm1bJ0BAdHJhbnNkdWNlci9zdGVwJ10ocmVzLCB0aGlzLmYoaW5wdXQpKTtcbn07XG5cbmZ1bmN0aW9uIG1hcChjb2xsLCBmLCBjdHgpIHtcbiAgaWYoaXNGdW5jdGlvbihjb2xsKSkgeyBjdHggPSBmOyBmID0gY29sbDsgY29sbCA9IG51bGw7IH1cbiAgZiA9IGJvdW5kKGYsIGN0eCk7XG5cbiAgaWYoY29sbCkge1xuICAgIGlmKGlzQXJyYXkoY29sbCkpIHtcbiAgICAgIHJldHVybiBhcnJheU1hcChjb2xsLCBmLCBjdHgpO1xuICAgIH1cbiAgICByZXR1cm4gc2VxKGNvbGwsIG1hcChmKSk7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24oeGZvcm0pIHtcbiAgICByZXR1cm4gbmV3IE1hcChmLCB4Zm9ybSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gRmlsdGVyKGYsIHhmb3JtKSB7XG4gIHRoaXMueGZvcm0gPSB4Zm9ybTtcbiAgdGhpcy5mID0gZjtcbn1cblxuRmlsdGVyLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL2luaXQnXSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy54Zm9ybVsnQEB0cmFuc2R1Y2VyL2luaXQnXSgpO1xufTtcblxuRmlsdGVyLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddID0gZnVuY3Rpb24odikge1xuICByZXR1cm4gdGhpcy54Zm9ybVsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddKHYpO1xufTtcblxuRmlsdGVyLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IGZ1bmN0aW9uKHJlcywgaW5wdXQpIHtcbiAgaWYodGhpcy5mKGlucHV0KSkge1xuICAgIHJldHVybiB0aGlzLnhmb3JtWydAQHRyYW5zZHVjZXIvc3RlcCddKHJlcywgaW5wdXQpO1xuICB9XG4gIHJldHVybiByZXM7XG59O1xuXG5mdW5jdGlvbiBmaWx0ZXIoY29sbCwgZiwgY3R4KSB7XG4gIGlmKGlzRnVuY3Rpb24oY29sbCkpIHsgY3R4ID0gZjsgZiA9IGNvbGw7IGNvbGwgPSBudWxsOyB9XG4gIGYgPSBib3VuZChmLCBjdHgpO1xuXG4gIGlmKGNvbGwpIHtcbiAgICBpZihpc0FycmF5KGNvbGwpKSB7XG4gICAgICByZXR1cm4gYXJyYXlGaWx0ZXIoY29sbCwgZiwgY3R4KTtcbiAgICB9XG4gICAgcmV0dXJuIHNlcShjb2xsLCBmaWx0ZXIoZikpO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKHhmb3JtKSB7XG4gICAgcmV0dXJuIG5ldyBGaWx0ZXIoZiwgeGZvcm0pO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZW1vdmUoY29sbCwgZiwgY3R4KSB7XG4gIGlmKGlzRnVuY3Rpb24oY29sbCkpIHsgY3R4ID0gZjsgZiA9IGNvbGw7IGNvbGwgPSBudWxsOyB9XG4gIGYgPSBib3VuZChmLCBjdHgpO1xuICByZXR1cm4gZmlsdGVyKGNvbGwsIGZ1bmN0aW9uKHgpIHsgcmV0dXJuICFmKHgpOyB9KTtcbn1cblxuZnVuY3Rpb24ga2VlcChjb2xsKSB7XG4gIHJldHVybiBmaWx0ZXIoY29sbCwgZnVuY3Rpb24oeCkgeyByZXR1cm4geCAhPSBudWxsIH0pO1xufVxuXG5mdW5jdGlvbiBEZWR1cGUoeGZvcm0pIHtcbiAgdGhpcy54Zm9ybSA9IHhmb3JtO1xuICB0aGlzLmxhc3QgPSB1bmRlZmluZWQ7XG59XG5cbkRlZHVwZS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9pbml0J10gPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMueGZvcm1bJ0BAdHJhbnNkdWNlci9pbml0J10oKTtcbn07XG5cbkRlZHVwZS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSA9IGZ1bmN0aW9uKHYpIHtcbiAgcmV0dXJuIHRoaXMueGZvcm1bJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSh2KTtcbn07XG5cbkRlZHVwZS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPSBmdW5jdGlvbihyZXN1bHQsIGlucHV0KSB7XG4gIGlmKGlucHV0ICE9PSB0aGlzLmxhc3QpIHtcbiAgICB0aGlzLmxhc3QgPSBpbnB1dDtcbiAgICByZXR1cm4gdGhpcy54Zm9ybVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIGlucHV0KTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuZnVuY3Rpb24gZGVkdXBlKGNvbGwpIHtcbiAgaWYoY29sbCkge1xuICAgIHJldHVybiBzZXEoY29sbCwgZGVkdXBlKCkpO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKHhmb3JtKSB7XG4gICAgcmV0dXJuIG5ldyBEZWR1cGUoeGZvcm0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIFRha2VXaGlsZShmLCB4Zm9ybSkge1xuICB0aGlzLnhmb3JtID0geGZvcm07XG4gIHRoaXMuZiA9IGY7XG59XG5cblRha2VXaGlsZS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9pbml0J10gPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMueGZvcm1bJ0BAdHJhbnNkdWNlci9pbml0J10oKTtcbn07XG5cblRha2VXaGlsZS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSA9IGZ1bmN0aW9uKHYpIHtcbiAgcmV0dXJuIHRoaXMueGZvcm1bJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSh2KTtcbn07XG5cblRha2VXaGlsZS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPSBmdW5jdGlvbihyZXN1bHQsIGlucHV0KSB7XG4gIGlmKHRoaXMuZihpbnB1dCkpIHtcbiAgICByZXR1cm4gdGhpcy54Zm9ybVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIGlucHV0KTtcbiAgfVxuICByZXR1cm4gbmV3IFJlZHVjZWQocmVzdWx0KTtcbn07XG5cbmZ1bmN0aW9uIHRha2VXaGlsZShjb2xsLCBmLCBjdHgpIHtcbiAgaWYoaXNGdW5jdGlvbihjb2xsKSkgeyBjdHggPSBmOyBmID0gY29sbDsgY29sbCA9IG51bGw7IH1cbiAgZiA9IGJvdW5kKGYsIGN0eCk7XG5cbiAgaWYoY29sbCkge1xuICAgIHJldHVybiBzZXEoY29sbCwgdGFrZVdoaWxlKGYpKTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbih4Zm9ybSkge1xuICAgIHJldHVybiBuZXcgVGFrZVdoaWxlKGYsIHhmb3JtKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBUYWtlKG4sIHhmb3JtKSB7XG4gIHRoaXMubiA9IG47XG4gIHRoaXMuaSA9IDA7XG4gIHRoaXMueGZvcm0gPSB4Zm9ybTtcbn1cblxuVGFrZS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9pbml0J10gPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMueGZvcm1bJ0BAdHJhbnNkdWNlci9pbml0J10oKTtcbn07XG5cblRha2UucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvcmVzdWx0J10gPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiB0aGlzLnhmb3JtWydAQHRyYW5zZHVjZXIvcmVzdWx0J10odik7XG59O1xuXG5UYWtlLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IGZ1bmN0aW9uKHJlc3VsdCwgaW5wdXQpIHtcbiAgaWYgKHRoaXMuaSA8IHRoaXMubikge1xuICAgIHJlc3VsdCA9IHRoaXMueGZvcm1bJ0BAdHJhbnNkdWNlci9zdGVwJ10ocmVzdWx0LCBpbnB1dCk7XG4gICAgaWYodGhpcy5pICsgMSA+PSB0aGlzLm4pIHtcbiAgICAgIC8vIEZpbmlzaCByZWR1Y2luZyBvbiB0aGUgc2FtZSBzdGVwIGFzIHRoZSBmaW5hbCB2YWx1ZS4gVE9ETzpcbiAgICAgIC8vIGRvdWJsZS1jaGVjayB0aGF0IHRoaXMgZG9lc24ndCBicmVhayBhbnkgc2VtYW50aWNzXG4gICAgICByZXN1bHQgPSBlbnN1cmVSZWR1Y2VkKHJlc3VsdCk7XG4gICAgfVxuICB9XG4gIHRoaXMuaSsrO1xuICByZXR1cm4gcmVzdWx0O1xufTtcblxuZnVuY3Rpb24gdGFrZShjb2xsLCBuKSB7XG4gIGlmKGlzTnVtYmVyKGNvbGwpKSB7IG4gPSBjb2xsOyBjb2xsID0gbnVsbCB9XG5cbiAgaWYoY29sbCkge1xuICAgIHJldHVybiBzZXEoY29sbCwgdGFrZShuKSk7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24oeGZvcm0pIHtcbiAgICByZXR1cm4gbmV3IFRha2UobiwgeGZvcm0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIERyb3AobiwgeGZvcm0pIHtcbiAgdGhpcy5uID0gbjtcbiAgdGhpcy5pID0gMDtcbiAgdGhpcy54Zm9ybSA9IHhmb3JtO1xufVxuXG5Ecm9wLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL2luaXQnXSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy54Zm9ybVsnQEB0cmFuc2R1Y2VyL2luaXQnXSgpO1xufTtcblxuRHJvcC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSA9IGZ1bmN0aW9uKHYpIHtcbiAgcmV0dXJuIHRoaXMueGZvcm1bJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSh2KTtcbn07XG5cbkRyb3AucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvc3RlcCddID0gZnVuY3Rpb24ocmVzdWx0LCBpbnB1dCkge1xuICBpZih0aGlzLmkrKyA8IHRoaXMubikge1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgcmV0dXJuIHRoaXMueGZvcm1bJ0BAdHJhbnNkdWNlci9zdGVwJ10ocmVzdWx0LCBpbnB1dCk7XG59O1xuXG5mdW5jdGlvbiBkcm9wKGNvbGwsIG4pIHtcbiAgaWYoaXNOdW1iZXIoY29sbCkpIHsgbiA9IGNvbGw7IGNvbGwgPSBudWxsIH1cblxuICBpZihjb2xsKSB7XG4gICAgcmV0dXJuIHNlcShjb2xsLCBkcm9wKG4pKTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbih4Zm9ybSkge1xuICAgIHJldHVybiBuZXcgRHJvcChuLCB4Zm9ybSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gRHJvcFdoaWxlKGYsIHhmb3JtKSB7XG4gIHRoaXMueGZvcm0gPSB4Zm9ybTtcbiAgdGhpcy5mID0gZjtcbiAgdGhpcy5kcm9wcGluZyA9IHRydWU7XG59XG5cbkRyb3BXaGlsZS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9pbml0J10gPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMueGZvcm1bJ0BAdHJhbnNkdWNlci9pbml0J10oKTtcbn07XG5cbkRyb3BXaGlsZS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSA9IGZ1bmN0aW9uKHYpIHtcbiAgcmV0dXJuIHRoaXMueGZvcm1bJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSh2KTtcbn07XG5cbkRyb3BXaGlsZS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPSBmdW5jdGlvbihyZXN1bHQsIGlucHV0KSB7XG4gIGlmKHRoaXMuZHJvcHBpbmcpIHtcbiAgICBpZih0aGlzLmYoaW5wdXQpKSB7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuZHJvcHBpbmcgPSBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXMueGZvcm1bJ0BAdHJhbnNkdWNlci9zdGVwJ10ocmVzdWx0LCBpbnB1dCk7XG59O1xuXG5mdW5jdGlvbiBkcm9wV2hpbGUoY29sbCwgZiwgY3R4KSB7XG4gIGlmKGlzRnVuY3Rpb24oY29sbCkpIHsgY3R4ID0gZjsgZiA9IGNvbGw7IGNvbGwgPSBudWxsOyB9XG4gIGYgPSBib3VuZChmLCBjdHgpO1xuXG4gIGlmKGNvbGwpIHtcbiAgICByZXR1cm4gc2VxKGNvbGwsIGRyb3BXaGlsZShmKSk7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24oeGZvcm0pIHtcbiAgICByZXR1cm4gbmV3IERyb3BXaGlsZShmLCB4Zm9ybSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gUGFydGl0aW9uKG4sIHhmb3JtKSB7XG4gIHRoaXMubiA9IG47XG4gIHRoaXMuaSA9IDA7XG4gIHRoaXMueGZvcm0gPSB4Zm9ybTtcbiAgdGhpcy5wYXJ0ID0gbmV3IEFycmF5KG4pO1xufVxuXG5QYXJ0aXRpb24ucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvaW5pdCddID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnhmb3JtWydAQHRyYW5zZHVjZXIvaW5pdCddKCk7XG59O1xuXG5QYXJ0aXRpb24ucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvcmVzdWx0J10gPSBmdW5jdGlvbih2KSB7XG4gIGlmICh0aGlzLmkgPiAwKSB7XG4gICAgcmV0dXJuIGVuc3VyZVVucmVkdWNlZCh0aGlzLnhmb3JtWydAQHRyYW5zZHVjZXIvc3RlcCddKHYsIHRoaXMucGFydC5zbGljZSgwLCB0aGlzLmkpKSk7XG4gIH1cbiAgcmV0dXJuIHRoaXMueGZvcm1bJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSh2KTtcbn07XG5cblBhcnRpdGlvbi5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPSBmdW5jdGlvbihyZXN1bHQsIGlucHV0KSB7XG4gIHRoaXMucGFydFt0aGlzLmldID0gaW5wdXQ7XG4gIHRoaXMuaSArPSAxO1xuICBpZiAodGhpcy5pID09PSB0aGlzLm4pIHtcbiAgICB2YXIgb3V0ID0gdGhpcy5wYXJ0LnNsaWNlKDAsIHRoaXMubik7XG4gICAgdGhpcy5wYXJ0ID0gbmV3IEFycmF5KHRoaXMubik7XG4gICAgdGhpcy5pID0gMDtcbiAgICByZXR1cm4gdGhpcy54Zm9ybVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIG91dCk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbmZ1bmN0aW9uIHBhcnRpdGlvbihjb2xsLCBuKSB7XG4gIGlmIChpc051bWJlcihjb2xsKSkge1xuICAgIG4gPSBjb2xsOyBjb2xsID0gbnVsbDtcbiAgfVxuXG4gIGlmIChjb2xsKSB7XG4gICAgcmV0dXJuIHNlcShjb2xsLCBwYXJ0aXRpb24obikpO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKHhmb3JtKSB7XG4gICAgcmV0dXJuIG5ldyBQYXJ0aXRpb24obiwgeGZvcm0pO1xuICB9O1xufVxuXG52YXIgTk9USElORyA9IHt9O1xuXG5mdW5jdGlvbiBQYXJ0aXRpb25CeShmLCB4Zm9ybSkge1xuICAvLyBUT0RPOiB0YWtlIGFuIFwib3B0c1wiIG9iamVjdCB0aGF0IGFsbG93cyB0aGUgdXNlciB0byBzcGVjaWZ5XG4gIC8vIGVxdWFsaXR5XG4gIHRoaXMuZiA9IGY7XG4gIHRoaXMueGZvcm0gPSB4Zm9ybTtcbiAgdGhpcy5wYXJ0ID0gW107XG4gIHRoaXMubGFzdCA9IE5PVEhJTkc7XG59XG5cblBhcnRpdGlvbkJ5LnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL2luaXQnXSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy54Zm9ybVsnQEB0cmFuc2R1Y2VyL2luaXQnXSgpO1xufTtcblxuUGFydGl0aW9uQnkucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvcmVzdWx0J10gPSBmdW5jdGlvbih2KSB7XG4gIHZhciBsID0gdGhpcy5wYXJ0Lmxlbmd0aDtcbiAgaWYgKGwgPiAwKSB7XG4gICAgcmV0dXJuIGVuc3VyZVVucmVkdWNlZCh0aGlzLnhmb3JtWydAQHRyYW5zZHVjZXIvc3RlcCddKHYsIHRoaXMucGFydC5zbGljZSgwLCBsKSkpO1xuICB9XG4gIHJldHVybiB0aGlzLnhmb3JtWydAQHRyYW5zZHVjZXIvcmVzdWx0J10odik7XG59O1xuXG5QYXJ0aXRpb25CeS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPSBmdW5jdGlvbihyZXN1bHQsIGlucHV0KSB7XG4gIHZhciBjdXJyZW50ID0gdGhpcy5mKGlucHV0KTtcbiAgaWYgKGN1cnJlbnQgPT09IHRoaXMubGFzdCB8fCB0aGlzLmxhc3QgPT09IE5PVEhJTkcpIHtcbiAgICB0aGlzLnBhcnQucHVzaChpbnB1dCk7XG4gIH0gZWxzZSB7XG4gICAgcmVzdWx0ID0gdGhpcy54Zm9ybVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIHRoaXMucGFydCk7XG4gICAgdGhpcy5wYXJ0ID0gW2lucHV0XTtcbiAgfVxuICB0aGlzLmxhc3QgPSBjdXJyZW50O1xuICByZXR1cm4gcmVzdWx0O1xufTtcblxuZnVuY3Rpb24gcGFydGl0aW9uQnkoY29sbCwgZiwgY3R4KSB7XG4gIGlmIChpc0Z1bmN0aW9uKGNvbGwpKSB7IGN0eCA9IGY7IGYgPSBjb2xsOyBjb2xsID0gbnVsbDsgfVxuICBmID0gYm91bmQoZiwgY3R4KTtcblxuICBpZiAoY29sbCkge1xuICAgIHJldHVybiBzZXEoY29sbCwgcGFydGl0aW9uQnkoZikpO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKHhmb3JtKSB7XG4gICAgcmV0dXJuIG5ldyBQYXJ0aXRpb25CeShmLCB4Zm9ybSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIEludGVycG9zZShzZXAsIHhmb3JtKSB7XG4gIHRoaXMuc2VwID0gc2VwO1xuICB0aGlzLnhmb3JtID0geGZvcm07XG4gIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xufVxuXG5JbnRlcnBvc2UucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvaW5pdCddID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnhmb3JtWydAQHRyYW5zZHVjZXIvaW5pdCddKCk7XG59O1xuXG5JbnRlcnBvc2UucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvcmVzdWx0J10gPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiB0aGlzLnhmb3JtWydAQHRyYW5zZHVjZXIvcmVzdWx0J10odik7XG59O1xuXG5JbnRlcnBvc2UucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvc3RlcCddID0gZnVuY3Rpb24ocmVzdWx0LCBpbnB1dCkge1xuICBpZiAodGhpcy5zdGFydGVkKSB7XG4gICAgdmFyIHdpdGhTZXAgPSB0aGlzLnhmb3JtWydAQHRyYW5zZHVjZXIvc3RlcCddKHJlc3VsdCwgdGhpcy5zZXApO1xuICAgIGlmIChpc1JlZHVjZWQod2l0aFNlcCkpIHtcbiAgICAgIHJldHVybiB3aXRoU2VwO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy54Zm9ybVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSh3aXRoU2VwLCBpbnB1dCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXMueGZvcm1bJ0BAdHJhbnNkdWNlci9zdGVwJ10ocmVzdWx0LCBpbnB1dCk7XG4gIH1cbn07XG5cbi8qKlxuICogUmV0dXJucyBhIG5ldyBjb2xsZWN0aW9uIGNvbnRhaW5pbmcgZWxlbWVudHMgb2YgdGhlIGdpdmVuXG4gKiBjb2xsZWN0aW9uLCBzZXBhcmF0ZWQgYnkgdGhlIHNwZWNpZmllZCBzZXBhcmF0b3IuIFJldHVybnMgYVxuICogdHJhbnNkdWNlciBpZiBhIGNvbGxlY3Rpb24gaXMgbm90IHByb3ZpZGVkLlxuICovXG5mdW5jdGlvbiBpbnRlcnBvc2UoY29sbCwgc2VwYXJhdG9yKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgc2VwYXJhdG9yID0gY29sbDtcbiAgICByZXR1cm4gZnVuY3Rpb24oeGZvcm0pIHtcbiAgICAgIHJldHVybiBuZXcgSW50ZXJwb3NlKHNlcGFyYXRvciwgeGZvcm0pO1xuICAgIH07XG4gIH1cbiAgcmV0dXJuIHNlcShjb2xsLCBpbnRlcnBvc2Uoc2VwYXJhdG9yKSk7XG59XG5cbmZ1bmN0aW9uIFJlcGVhdChuLCB4Zm9ybSkge1xuICB0aGlzLnhmb3JtID0geGZvcm07XG4gIHRoaXMubiA9IG47XG59XG5cblJlcGVhdC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9pbml0J10gPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMueGZvcm1bJ0BAdHJhbnNkdWNlci9pbml0J10oKTtcbn07XG5cblJlcGVhdC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSA9IGZ1bmN0aW9uKHYpIHtcbiAgcmV0dXJuIHRoaXMueGZvcm1bJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSh2KTtcbn07XG5cblJlcGVhdC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPSBmdW5jdGlvbihyZXN1bHQsIGlucHV0KSB7XG4gIHZhciBuID0gdGhpcy5uO1xuICB2YXIgciA9IHJlc3VsdDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICByID0gdGhpcy54Zm9ybVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyLCBpbnB1dCk7XG4gICAgaWYgKGlzUmVkdWNlZChyKSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiByO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgbmV3IGNvbGxlY3Rpb24gY29udGFpbmluZyBlbGVtZW50cyBvZiB0aGUgZ2l2ZW5cbiAqIGNvbGxlY3Rpb24sIGVhY2ggcmVwZWF0ZWQgbiB0aW1lcy4gUmV0dXJucyBhIHRyYW5zZHVjZXIgaWYgYVxuICogY29sbGVjdGlvbiBpcyBub3QgcHJvdmlkZWQuXG4gKi9cbmZ1bmN0aW9uIHJlcGVhdChjb2xsLCBuKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgbiA9IGNvbGw7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHhmb3JtKSB7XG4gICAgICByZXR1cm4gbmV3IFJlcGVhdChuLCB4Zm9ybSk7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gc2VxKGNvbGwsIHJlcGVhdChuKSk7XG59XG5cbmZ1bmN0aW9uIFRha2VOdGgobiwgeGZvcm0pIHtcbiAgdGhpcy54Zm9ybSA9IHhmb3JtO1xuICB0aGlzLm4gPSBuO1xuICB0aGlzLmkgPSAtMTtcbn1cblxuVGFrZU50aC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9pbml0J10gPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMueGZvcm1bJ0BAdHJhbnNkdWNlci9pbml0J10oKTtcbn07XG5cblRha2VOdGgucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvcmVzdWx0J10gPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiB0aGlzLnhmb3JtWydAQHRyYW5zZHVjZXIvcmVzdWx0J10odik7XG59O1xuXG5UYWtlTnRoLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IGZ1bmN0aW9uKHJlc3VsdCwgaW5wdXQpIHtcbiAgdGhpcy5pICs9IDE7XG4gIGlmICh0aGlzLmkgJSB0aGlzLm4gPT09IDApIHtcbiAgICByZXR1cm4gdGhpcy54Zm9ybVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIGlucHV0KTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgbmV3IGNvbGxlY3Rpb24gb2YgZXZlcnkgbnRoIGVsZW1lbnQgb2YgdGhlIGdpdmVuXG4gKiBjb2xsZWN0aW9uLiBSZXR1cm5zIGEgdHJhbnNkdWNlciBpZiBhIGNvbGxlY3Rpb24gaXMgbm90IHByb3ZpZGVkLlxuICovXG5mdW5jdGlvbiB0YWtlTnRoKGNvbGwsIG50aCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIG50aCA9IGNvbGw7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHhmb3JtKSB7XG4gICAgICByZXR1cm4gbmV3IFRha2VOdGgobnRoLCB4Zm9ybSk7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gc2VxKGNvbGwsIHRha2VOdGgobnRoKSk7XG59XG5cbi8vIHB1cmUgdHJhbnNkdWNlcnMgKGNhbm5vdCB0YWtlIGNvbGxlY3Rpb25zKVxuXG5mdW5jdGlvbiBDYXQoeGZvcm0pIHtcbiAgdGhpcy54Zm9ybSA9IHhmb3JtO1xufVxuXG5DYXQucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvaW5pdCddID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnhmb3JtWydAQHRyYW5zZHVjZXIvaW5pdCddKCk7XG59O1xuXG5DYXQucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvcmVzdWx0J10gPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiB0aGlzLnhmb3JtWydAQHRyYW5zZHVjZXIvcmVzdWx0J10odik7XG59O1xuXG5DYXQucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvc3RlcCddID0gZnVuY3Rpb24ocmVzdWx0LCBpbnB1dCkge1xuICB2YXIgeGZvcm0gPSB0aGlzLnhmb3JtO1xuICB2YXIgbmV3eGZvcm0gPSB7fTtcbiAgbmV3eGZvcm1bJ0BAdHJhbnNkdWNlci9pbml0J10gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4geGZvcm1bJ0BAdHJhbnNkdWNlci9pbml0J10oKTtcbiAgfTtcbiAgbmV3eGZvcm1bJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSA9IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gdjtcbiAgfTtcbiAgbmV3eGZvcm1bJ0BAdHJhbnNkdWNlci9zdGVwJ10gPSBmdW5jdGlvbihyZXN1bHQsIGlucHV0KSB7XG4gICAgdmFyIHZhbCA9IHhmb3JtWydAQHRyYW5zZHVjZXIvc3RlcCddKHJlc3VsdCwgaW5wdXQpO1xuICAgIHJldHVybiBpc1JlZHVjZWQodmFsKSA/IGRlcmVmKHZhbCkgOiB2YWw7XG4gIH07XG5cbiAgcmV0dXJuIHJlZHVjZShpbnB1dCwgbmV3eGZvcm0sIHJlc3VsdCk7XG59O1xuXG5mdW5jdGlvbiBjYXQoeGZvcm0pIHtcbiAgcmV0dXJuIG5ldyBDYXQoeGZvcm0pO1xufVxuXG5mdW5jdGlvbiBtYXBjYXQoZiwgY3R4KSB7XG4gIGYgPSBib3VuZChmLCBjdHgpO1xuICByZXR1cm4gY29tcG9zZShtYXAoZiksIGNhdCk7XG59XG5cbi8vIGNvbGxlY3Rpb24gaGVscGVyc1xuXG5mdW5jdGlvbiBwdXNoKGFyciwgeCkge1xuICBhcnIucHVzaCh4KTtcbiAgcmV0dXJuIGFycjtcbn1cblxuZnVuY3Rpb24gbWVyZ2Uob2JqLCB4KSB7XG4gIGlmKGlzQXJyYXkoeCkgJiYgeC5sZW5ndGggPT09IDIpIHtcbiAgICBvYmpbeFswXV0gPSB4WzFdO1xuICB9XG4gIGVsc2Uge1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoeCk7XG4gICAgdmFyIGxlbiA9IGtleXMubGVuZ3RoO1xuICAgIGZvcih2YXIgaT0wOyBpPGxlbjsgaSsrKSB7XG4gICAgICBvYmpba2V5c1tpXV0gPSB4W2tleXNbaV1dO1xuICAgIH1cbiAgfVxuICByZXR1cm4gb2JqO1xufVxuXG52YXIgYXJyYXlSZWR1Y2VyID0ge307XG5hcnJheVJlZHVjZXJbJ0BAdHJhbnNkdWNlci9pbml0J10gPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIFtdO1xufTtcbmFycmF5UmVkdWNlclsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddID0gZnVuY3Rpb24odikge1xuICByZXR1cm4gdjtcbn07XG5hcnJheVJlZHVjZXJbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPSBwdXNoO1xuXG52YXIgb2JqUmVkdWNlciA9IHt9O1xub2JqUmVkdWNlclsnQEB0cmFuc2R1Y2VyL2luaXQnXSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge307XG59O1xub2JqUmVkdWNlclsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddID0gZnVuY3Rpb24odikge1xuICByZXR1cm4gdjtcbn07XG5vYmpSZWR1Y2VyWydAQHRyYW5zZHVjZXIvc3RlcCddID0gbWVyZ2U7XG5cbi8vIGJ1aWxkaW5nIG5ldyBjb2xsZWN0aW9uc1xuXG5mdW5jdGlvbiB0b0FycmF5KGNvbGwsIHhmb3JtKSB7XG4gIGlmKCF4Zm9ybSkge1xuICAgIHJldHVybiByZWR1Y2UoY29sbCwgYXJyYXlSZWR1Y2VyLCBbXSk7XG4gIH1cbiAgcmV0dXJuIHRyYW5zZHVjZShjb2xsLCB4Zm9ybSwgYXJyYXlSZWR1Y2VyLCBbXSk7XG59XG5cbmZ1bmN0aW9uIHRvT2JqKGNvbGwsIHhmb3JtKSB7XG4gIGlmKCF4Zm9ybSkge1xuICAgIHJldHVybiByZWR1Y2UoY29sbCwgb2JqUmVkdWNlciwge30pO1xuICB9XG4gIHJldHVybiB0cmFuc2R1Y2UoY29sbCwgeGZvcm0sIG9ialJlZHVjZXIsIHt9KTtcbn1cblxuZnVuY3Rpb24gdG9JdGVyKGNvbGwsIHhmb3JtKSB7XG4gIGlmKCF4Zm9ybSkge1xuICAgIHJldHVybiBpdGVyYXRvcihjb2xsKTtcbiAgfVxuICByZXR1cm4gbmV3IExhenlUcmFuc2Zvcm1lcih4Zm9ybSwgY29sbCk7XG59XG5cbmZ1bmN0aW9uIHNlcShjb2xsLCB4Zm9ybSkge1xuICBpZihpc0FycmF5KGNvbGwpKSB7XG4gICAgcmV0dXJuIHRyYW5zZHVjZShjb2xsLCB4Zm9ybSwgYXJyYXlSZWR1Y2VyLCBbXSk7XG4gIH1cbiAgZWxzZSBpZihpc09iamVjdChjb2xsKSkge1xuICAgIHJldHVybiB0cmFuc2R1Y2UoY29sbCwgeGZvcm0sIG9ialJlZHVjZXIsIHt9KTtcbiAgfVxuICBlbHNlIGlmKGNvbGxbJ0BAdHJhbnNkdWNlci9zdGVwJ10pIHtcbiAgICB2YXIgaW5pdDtcbiAgICBpZihjb2xsWydAQHRyYW5zZHVjZXIvaW5pdCddKSB7XG4gICAgICBpbml0ID0gY29sbFsnQEB0cmFuc2R1Y2VyL2luaXQnXSgpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGluaXQgPSBuZXcgY29sbC5jb25zdHJ1Y3RvcigpO1xuICAgIH1cblxuICAgIHJldHVybiB0cmFuc2R1Y2UoY29sbCwgeGZvcm0sIGNvbGwsIGluaXQpO1xuICB9XG4gIGVsc2UgaWYoZnVsZmlsbHNQcm90b2NvbChjb2xsLCAnaXRlcmF0b3InKSkge1xuICAgIHJldHVybiBuZXcgTGF6eVRyYW5zZm9ybWVyKHhmb3JtLCBjb2xsKTtcbiAgfVxuICB0aHJvd1Byb3RvY29sRXJyb3IoJ3NlcXVlbmNlJywgY29sbCk7XG59XG5cbmZ1bmN0aW9uIGludG8odG8sIHhmb3JtLCBmcm9tKSB7XG4gIGlmKGlzQXJyYXkodG8pKSB7XG4gICAgcmV0dXJuIHRyYW5zZHVjZShmcm9tLCB4Zm9ybSwgYXJyYXlSZWR1Y2VyLCB0byk7XG4gIH1cbiAgZWxzZSBpZihpc09iamVjdCh0bykpIHtcbiAgICByZXR1cm4gdHJhbnNkdWNlKGZyb20sIHhmb3JtLCBvYmpSZWR1Y2VyLCB0byk7XG4gIH1cbiAgZWxzZSBpZih0b1snQEB0cmFuc2R1Y2VyL3N0ZXAnXSkge1xuICAgIHJldHVybiB0cmFuc2R1Y2UoZnJvbSxcbiAgICAgICAgICAgICAgICAgICAgIHhmb3JtLFxuICAgICAgICAgICAgICAgICAgICAgdG8sXG4gICAgICAgICAgICAgICAgICAgICB0byk7XG4gIH1cbiAgdGhyb3dQcm90b2NvbEVycm9yKCdpbnRvJywgdG8pO1xufVxuXG4vLyBsYXppbmVzc1xuXG52YXIgc3RlcHBlciA9IHt9O1xuc3RlcHBlclsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddID0gZnVuY3Rpb24odikge1xuICByZXR1cm4gaXNSZWR1Y2VkKHYpID8gZGVyZWYodikgOiB2O1xufTtcbnN0ZXBwZXJbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPSBmdW5jdGlvbihsdCwgeCkge1xuICBsdC5pdGVtcy5wdXNoKHgpO1xuICByZXR1cm4gbHQucmVzdDtcbn07XG5cbmZ1bmN0aW9uIFN0ZXBwZXIoeGZvcm0sIGl0ZXIpIHtcbiAgdGhpcy54Zm9ybSA9IHhmb3JtKHN0ZXBwZXIpO1xuICB0aGlzLml0ZXIgPSBpdGVyO1xufVxuXG5TdGVwcGVyLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IGZ1bmN0aW9uKGx0KSB7XG4gIHZhciBsZW4gPSBsdC5pdGVtcy5sZW5ndGg7XG4gIHdoaWxlKGx0Lml0ZW1zLmxlbmd0aCA9PT0gbGVuKSB7XG4gICAgdmFyIG4gPSB0aGlzLml0ZXIubmV4dCgpO1xuICAgIGlmKG4uZG9uZSB8fCBpc1JlZHVjZWQobi52YWx1ZSkpIHtcbiAgICAgIC8vIGZpbmFsaXplXG4gICAgICB0aGlzLnhmb3JtWydAQHRyYW5zZHVjZXIvcmVzdWx0J10odGhpcyk7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICAvLyBzdGVwXG4gICAgdGhpcy54Zm9ybVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShsdCwgbi52YWx1ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gTGF6eVRyYW5zZm9ybWVyKHhmb3JtLCBjb2xsKSB7XG4gIHRoaXMuaXRlciA9IGl0ZXJhdG9yKGNvbGwpO1xuICB0aGlzLml0ZW1zID0gW107XG4gIHRoaXMuc3RlcHBlciA9IG5ldyBTdGVwcGVyKHhmb3JtLCBpdGVyYXRvcihjb2xsKSk7XG59XG5cbkxhenlUcmFuc2Zvcm1lci5wcm90b3R5cGVbcHJvdG9jb2xzLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcztcbn1cblxuTGF6eVRyYW5zZm9ybWVyLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXNbJ0BAdHJhbnNkdWNlci9zdGVwJ10oKTtcblxuICBpZih0aGlzLml0ZW1zLmxlbmd0aCkge1xuICAgIHJldHVybiB7XG4gICAgICB2YWx1ZTogdGhpcy5pdGVtcy5wb3AoKSxcbiAgICAgIGRvbmU6IGZhbHNlXG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIHJldHVybiB7IGRvbmU6IHRydWUgfTtcbiAgfVxufTtcblxuTGF6eVRyYW5zZm9ybWVyLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IGZ1bmN0aW9uKCkge1xuICBpZighdGhpcy5pdGVtcy5sZW5ndGgpIHtcbiAgICB0aGlzLnN0ZXBwZXJbJ0BAdHJhbnNkdWNlci9zdGVwJ10odGhpcyk7XG4gIH1cbn1cblxuLy8gdXRpbFxuXG5mdW5jdGlvbiByYW5nZShuKSB7XG4gIHZhciBhcnIgPSBuZXcgQXJyYXkobik7XG4gIGZvcih2YXIgaT0wOyBpPGFyci5sZW5ndGg7IGkrKykge1xuICAgIGFycltpXSA9IGk7XG4gIH1cbiAgcmV0dXJuIGFycjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHJlZHVjZTogcmVkdWNlLFxuICB0cmFuc2Zvcm1lcjogdHJhbnNmb3JtZXIsXG4gIFJlZHVjZWQ6IFJlZHVjZWQsXG4gIGlzUmVkdWNlZDogaXNSZWR1Y2VkLFxuICBpdGVyYXRvcjogaXRlcmF0b3IsXG4gIHB1c2g6IHB1c2gsXG4gIG1lcmdlOiBtZXJnZSxcbiAgdHJhbnNkdWNlOiB0cmFuc2R1Y2UsXG4gIHNlcTogc2VxLFxuICB0b0FycmF5OiB0b0FycmF5LFxuICB0b09iajogdG9PYmosXG4gIHRvSXRlcjogdG9JdGVyLFxuICBpbnRvOiBpbnRvLFxuICBjb21wb3NlOiBjb21wb3NlLFxuICBtYXA6IG1hcCxcbiAgZmlsdGVyOiBmaWx0ZXIsXG4gIHJlbW92ZTogcmVtb3ZlLFxuICBjYXQ6IGNhdCxcbiAgbWFwY2F0OiBtYXBjYXQsXG4gIGtlZXA6IGtlZXAsXG4gIGRlZHVwZTogZGVkdXBlLFxuICB0YWtlOiB0YWtlLFxuICB0YWtlV2hpbGU6IHRha2VXaGlsZSxcbiAgdGFrZU50aDogdGFrZU50aCxcbiAgZHJvcDogZHJvcCxcbiAgZHJvcFdoaWxlOiBkcm9wV2hpbGUsXG4gIHBhcnRpdGlvbjogcGFydGl0aW9uLFxuICBwYXJ0aXRpb25CeTogcGFydGl0aW9uQnksXG4gIGludGVycG9zZTogaW50ZXJwb3NlLFxuICByZXBlYXQ6IHJlcGVhdCxcbiAgcmFuZ2U6IHJhbmdlLFxuXG4gIExhenlUcmFuc2Zvcm1lcjogTGF6eVRyYW5zZm9ybWVyXG59O1xuIiwiaW1wb3J0IHtjaGFuLCBnbywgb3BlcmF0aW9ucywgYnVmZmVycywgdGFrZSwgcHV0LCB0YWtlQXN5bmMsIHB1dEFzeW5jLCBDTE9TRUR9IGZyb20gJ2pzLWNzcCdcblxuZXhwb3J0IGZ1bmN0aW9uIGRlZmluZURpc3BhdGNoZXIoe3RyYW5zZm9ybWVyc30pe1xuICByZXR1cm4gY2xhc3Mge1xuXG4gICAgY29uc3RydWN0b3IoKXtcbiAgICAgIHRoaXMub3V0Q2ggPSBjaGFuKGJ1ZmZlcnMuZml4ZWQoMTApKVxuICAgICAgdGhpcy5vdXRNdWx0ID0gb3BlcmF0aW9ucy5tdWx0KHRoaXMub3V0Q2gpXG4gICAgfVxuXG4gICAgbGlzdGVuKHNvdXJjZSl7XG5cbiAgICAgIGlmKHNvdXJjZS5vdXRNdWx0ICYmIHNvdXJjZS50aHJvdWdoTXVsdCl7XG4gICAgICAgIHNvdXJjZSA9IHNvdXJjZS50aHJvdWdoTXVsdFxuICAgICAgfSBlbHNlIGlmKHNvdXJjZS5vdXRNdWx0KXtcbiAgICAgICAgc291cmNlID0gc291cmNlLm91dE11bHRcbiAgICAgIH1cblxuICAgICAgY29uc3QgY2ggPSBjaGFuKClcbiAgICAgIGNvbnN0IHRoYXQgPSB0aGlzXG4gICAgICBvcGVyYXRpb25zLm11bHQudGFwKHNvdXJjZSwgY2gpXG5cbiAgICAgIGdvKGZ1bmN0aW9uKigpe1xuICAgICAgICB2YXIgdmFsdWUgPSB5aWVsZCB0YWtlKGNoKVxuICAgICAgICB3aGlsZSAodmFsdWUgIT09IENMT1NFRCkge1xuICAgICAgICAgIHRoYXQudHJpZ2dlcih2YWx1ZSlcbiAgICAgICAgICB2YWx1ZSA9IHlpZWxkIHRha2UoY2gpXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgZW1pdCguLi5hcmdzKXtcbiAgICAgIHRoaXMudHJpZ2dlciguLi5hcmdzKVxuICAgIH1cblxuICAgIHRyaWdnZXIobmFtZSwgcGF5bG9hZCwgcHJvbWlzZSl7XG4gICAgICBpZih0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycpe1xuICAgICAgICBsZXQgb2JqID1cbiAgICAgICAgICB0cmFuc2Zvcm1lcnNbbmFtZV0gPyB0cmFuc2Zvcm1lcnNbbmFtZV0oe25hbWUsIHBheWxvYWQsIHByb21pc2V9KVxuICAgICAgICAgIDoge25hbWUsIHBheWxvYWQsIHByb21pc2V9XG4gICAgICAgIHB1dEFzeW5jKHRoaXMub3V0Q2gsIG9iailcbiAgICAgIH0gZWxzZSBpZih0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG5hbWUubmFtZSA9PT0gJ29iamVjdCcpe1xuICAgICAgICBsZXQgb2JqID1cbiAgICAgICAgICB0cmFuc2Zvcm1lcnNbbmFtZV0gPyB0cmFuc2Zvcm1lcnNbbmFtZV0obmFtZSlcbiAgICAgICAgICA6IG5hbWVcbiAgICAgICAgcHV0QXN5bmModGhpcy5vdXRDaCwgb2JqKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdkaXNwYXRjaGVkIGV2ZW50IHdpdGhvdXQgYSBuYW1lJywgbmFtZSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbn0iLCJpbXBvcnQgSSBmcm9tICdpbW11dGFibGUnXG5pbXBvcnQge2NoYW4sIGdvLCBvcGVyYXRpb25zLCBidWZmZXJzLCB0YWtlLCBwdXQsIHRha2VBc3luYywgcHV0QXN5bmMsIENMT1NFRH0gZnJvbSAnanMtY3NwJ1xuaW1wb3J0IHtjb21wb3NlLCBtYXAsIGZpbHRlciwgZGVkdXBlfSBmcm9tICd0cmFuc2R1Y2Vycy5qcydcblxuZXhwb3J0IGZ1bmN0aW9uIGRlZmluZVN0b3JlKHtwcmltYXJ5S2V5ID0gJ2lkJywgY29uc3VtZXJzLCB0cmFuc2Zvcm1lcnMsIC4uLmN0eH0pe1xuICByZXR1cm4gY2xhc3Mge1xuICAgIGNvbnN0cnVjdG9yKGluaXRpYWxEYXRhKXtcbiAgICAgIHRoaXMuZGF0YSA9XG4gICAgICAgICFpbml0aWFsRGF0YSA/XG4gICAgICAgICAgSS5NYXAoKVxuICAgICAgICA6IEFycmF5LmlzQXJyYXkoaW5pdGlhbERhdGEpICYmIHByaW1hcnlLZXkgP1xuICAgICAgICAgIEkuTWFwKCBpbml0aWFsRGF0YS5yZWR1Y2UoKGNvbGxlY3Rpb24sIG9iaikgPT4gT2JqZWN0LmFzc2lnbihjb2xsZWN0aW9uLCB7W29ialtwcmltYXJ5S2V5XV06IG9ian0pLCB7fSkgKVxuICAgICAgICA6IHR5cGVvZiBpbml0aWFsRGF0YSA9PT0gJ29iamVjdCcgP1xuICAgICAgICAgIEkuTWFwKCBpbml0aWFsRGF0YSApXG4gICAgICAgIDogSS5NYXAoKVxuXG4gICAgICB0aGlzLnJlZHVjZXJzID0gSS5PcmRlcmVkTWFwKClcblxuICAgICAgdGhpcy5pbkNoID0gY2hhbigpXG4gICAgICB0aGlzLm91dENoID0gY2hhbiggYnVmZmVycy5maXhlZCgxMDApLCBjb21wb3NlKGRlZHVwZSgpKSApXG4gICAgICB0aGlzLm91dE11bHQgPSBvcGVyYXRpb25zLm11bHQodGhpcy5vdXRDaClcbiAgICAgIHRoaXMuc291cmNlcyA9IEkuU2V0KClcbiAgICAgIHRoaXMudGhyb3VnaENoID0gY2hhbihidWZmZXJzLmZpeGVkKDEwMCkpXG4gICAgICB0aGlzLnRocm91Z2hNdWx0ID0gb3BlcmF0aW9ucy5tdWx0KHRoaXMudGhyb3VnaENoKVxuICAgIH1cblxuICAgIHRvSlNPTigpe1xuICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMuZGF0YSlcbiAgICB9XG5cbiAgICBsaXN0ZW4oc291cmNlKXtcblxuICAgICAgaWYoc291cmNlLm91dE11bHQgJiYgc291cmNlLnRocm91Z2hNdWx0KXtcbiAgICAgICAgc291cmNlID0gc291cmNlLnRocm91Z2hNdWx0XG4gICAgICB9IGVsc2UgaWYoc291cmNlLm91dE11bHQpe1xuICAgICAgICBzb3VyY2UgPSBzb3VyY2Uub3V0TXVsdFxuICAgICAgfVxuXG4gICAgICBjb25zdCBjaCA9IGNoYW4oKVxuICAgICAgY29uc3QgdGhhdCA9IHRoaXNcbiAgICAgIG9wZXJhdGlvbnMubXVsdC50YXAoc291cmNlLCBjaClcblxuICAgICAgZ28oZnVuY3Rpb24qKCl7XG4gICAgICAgIHZhciB2YWx1ZSA9IHlpZWxkIHRha2UoY2gpXG4gICAgICAgIHdoaWxlICh2YWx1ZSAhPT0gQ0xPU0VEKSB7XG4gICAgICAgICAgdGhhdC5oYW5kbGVBY3Rpb24odmFsdWUpXG4gICAgICAgICAgdmFsdWUgPSB5aWVsZCB0YWtlKGNoKVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIHRyaWdnZXIoKXtcbiAgICAgIC8vIGNvbnN0IG9sZERhdGEgPSB0aGlzLmRhdGFcbiAgICAgIGNvbnN0IGZuc1RvQXBwbHkgPSB0aGlzLnJlZHVjZXJzLnRha2VXaGlsZSh2ID0+IHYgPiAwKVxuICAgICAgdGhpcy5yZWR1Y2VycyA9IHRoaXMucmVkdWNlcnMuc2tpcFdoaWxlKHYgPT4gdiA+IDApLmZpbHRlcih2ID0+IHYgPj0gMClcbiAgICAgIHRoaXMuZGF0YSA9IGZuc1RvQXBwbHkucmVkdWNlKCh2YWx1ZSwgdmFsLCBmbikgPT4gZm4odmFsdWUpLCB0aGlzLmRhdGEpXG5cbiAgICAgIGNvbnN0IGRhdGFUb1NlbmQgPSB0aGlzLnJlZHVjZXJzLnJlZHVjZSgodmFsdWUsIHZhbCwgZm4pID0+IGZuKHZhbHVlKSwgdGhpcy5kYXRhKVxuXG4gICAgICBwdXRBc3luYyh0aGlzLm91dENoLCBkYXRhVG9TZW5kKVxuICAgIH1cblxuICAgIGdldE9ic2VydmFibGUodHJhbnNmb3JtZXIpe1xuXG4gICAgICB0cmFuc2Zvcm1lciA9IHRyYW5zZm9ybWVyIHx8IGZ1bmN0aW9uKGEpe3JldHVybiBhfVxuICAgICAgY29uc3QgdGhhdCA9IHRoaXNcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3Vic2NyaWJlKG9uTmV4dCwgb25FcnJvciwgb25Db21wbGV0ZWQpe1xuXG4gICAgICAgICAgb25OZXh0KHRyYW5zZm9ybWVyKHRoYXQucmVkdWNlcnMuZmlsdGVyKHYgPT4gdiA+PSAwKS5yZWR1Y2UoKHZhbHVlLCB2YWwsIGZuKSA9PiBmbih2YWx1ZSksIHRoYXQuZGF0YSkpKVxuXG4gICAgICAgICAgY29uc3QgdGVtcENoID0gY2hhbigpXG4gICAgICAgICAgb3BlcmF0aW9ucy5tdWx0LnRhcCh0aGF0Lm91dE11bHQsIHRlbXBDaClcbiAgICAgICAgICBsZXQgY29tcGxldGVkID0gZmFsc2VcblxuICAgICAgICAgIGdvKGZ1bmN0aW9uKiAoKXtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGxldCB2YWx1ZSA9IHlpZWxkIHRha2UodGVtcENoKVxuICAgICAgICAgICAgICB3aGlsZSh2YWx1ZSAhPT0gQ0xPU0VEKXtcbiAgICAgICAgICAgICAgICBvbk5leHQodHJhbnNmb3JtZXIodmFsdWUpKVxuICAgICAgICAgICAgICAgIHZhbHVlID0geWllbGQgdGFrZSh0ZW1wQ2gpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYoY29tcGxldGVkKXtcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlZCgpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgICBvbkVycm9yKGUpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkaXNwb3NlKCl7XG4gICAgICAgICAgICAgIG9wZXJhdGlvbnMubXVsdC51bnRhcCh0aGF0Lm91dE11bHQsIHRlbXBDaClcbiAgICAgICAgICAgICAgdGVtcENoLmNsb3NlKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBzdWJzY3JpYmUob25OZXh0LCBvbkVycm9yLCBvbkNvbXBsZXRlZCl7XG5cbiAgICAgIGNvbnN0IHRlbXBDaCA9IGNoYW4oKVxuICAgICAgb3BlcmF0aW9ucy5tdWx0LnRhcCh0aGlzLm91dE11bHQsIHRlbXBDaClcbiAgICAgIGxldCBjb21wbGV0ZWQgPSBmYWxzZVxuXG4gICAgICBnbyhmdW5jdGlvbiogKCl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgbGV0IHZhbHVlID0geWllbGQgdGFrZSh0ZW1wQ2gpXG4gICAgICAgICAgd2hpbGUodmFsdWUgIT09IENMT1NFRCl7XG4gICAgICAgICAgICBvbk5leHQodmFsdWUpXG4gICAgICAgICAgICB2YWx1ZSA9IHlpZWxkIHRha2UodGVtcENoKVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZihjb21wbGV0ZWQpe1xuICAgICAgICAgICAgb25Db21wbGV0ZWQoKVxuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgb25FcnJvcihlKVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBkaXNwb3NlKCl7XG4gICAgICAgICAgb3BlcmF0aW9ucy5tdWx0LnVudGFwKHRoaXMub3V0TXVsdCwgdGVtcENoKVxuICAgICAgICAgIHRlbXBDaC5jbG9zZSgpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0YXAoY2hhbm5lbCl7XG4gICAgICBvcGVyYXRpb25zLm11bHQudGFwKHRoaXMub3V0TXVsdCwgY2hhbm5lbClcbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgdW50YXAoY2hhbm5lbCl7XG4gICAgICBvcGVyYXRpb25zLm11bHQudW50YXAodGhpcy5vdXRNdWx0LCBjaGFubmVsKVxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICBoYW5kbGVBY3Rpb24oYWN0aW9uKXtcbiAgICAgIGNvbnN0IHRoYXQgPSB0aGlzXG4gICAgICBjb25zdCB7bmFtZSwgcGF5bG9hZCwgcHJvbWlzZX0gPSBhY3Rpb25cblxuICAgICAgLy8gaW4gY2FzZSBvZiBmdWxsIGNvbnN1bWVyLiBXZSBwcm92aWRlLCAoY29udHJvbHMsIGFjdGlvbilcbiAgICAgIC8vIGNvbnRyb2xzIGlzIGFuIG9iamVjdCBvZiB0aHJlZSBmdW5jdGlvbnMg4oCUIGFwcGx5LCBjb21taXQsIGFuZCByZWplY3RcbiAgICAgIC8vIGluIGNhc2Ugb2Ygc3luYyBvcGVyYXRpb25zLCB0aGUgY29uc3VtZXIgaXMgZXhwZWN0ZWQgdG8gY2FsbCBhcHBseSB3aXRoIGEgcmVkdWNlciBmdW5jdGlvbiBhbmQgdGhlbiBpbW1lZGlhdGVseSBjYWxsIGNvbW1pdFxuICAgICAgLy8gaW4gY2FzZSBvZiBhc3luYyBvcHMsIHRoZSBjb25zdW1lciBzaG91bGQgY2FsbCBhcHBseSB3aXRoIGEgcmVkdWNlciBmdW5jdGlvbi4gVGhlbiBpZiB0aGUgYXN5bmMgb3AgaXMgc3VjY2Vzc2Z1bCBjYWxsIGNvbW1pdCxcbiAgICAgIC8vIGlmIHRoZSBhc3luYyBvcGVyYXRpb24gZmFpbHMsIHJlamVjdCBzaG91bGQgYmUgY2FsbGVkLiBUaGlzIHdpbGwgcm9sbCBiYWNrIHRoZSBjaGFuZ2UuXG4gICAgICBpZihjb25zdW1lcnNbbmFtZV0pe1xuICAgICAgICBsZXQgY2FjaGVkID0gbnVsbFxuICAgICAgICBjb25zdW1lcnNbbmFtZV1cbiAgICAgICAgICAgLmNhbGwoIGN0eFxuICAgICAgICAgICAgICAgICwgeyBhcHBseShmbil7XG4gICAgICAgICAgICAgICAgICAgICAgaWYoY2FjaGVkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQucmVkdWNlcnMgPSB0aGF0LnJlZHVjZXJzLnNldChjYWNoZWQsIC0xKVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBjYWNoZWQgPSBmblxuICAgICAgICAgICAgICAgICAgICAgIHRoYXQucmVkdWNlcnMgPSB0aGF0LnJlZHVjZXJzLnNldChmbiwgMClcbiAgICAgICAgICAgICAgICAgICAgICB0aGF0LnRyaWdnZXIoKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAsIGNvbW1pdCgpe1xuICAgICAgICAgICAgICAgICAgICAgIGlmKCFjYWNoZWQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIHRoYXQucmVkdWNlcnMgPSB0aGF0LnJlZHVjZXJzLnNldChjYWNoZWQsIDEpXG4gICAgICAgICAgICAgICAgICAgICAgdGhhdC50cmlnZ2VyKClcbiAgICAgICAgICAgICAgICAgICAgICBjYWNoZWQgPSBudWxsXG4gICAgICAgICAgICAgICAgICAgICAgcHV0QXN5bmModGhhdC50aHJvdWdoQ2gsIGFjdGlvbilcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAsIHJlamVjdCgpe1xuICAgICAgICAgICAgICAgICAgICAgIGlmKCFjYWNoZWQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIHRoYXQucmVkdWNlcnMgPSB0aGF0LnJlZHVjZXJzLnNldChjYWNoZWQsIC0xKVxuICAgICAgICAgICAgICAgICAgICAgIHRoYXQudHJpZ2dlcigpXG4gICAgICAgICAgICAgICAgICAgICAgY2FjaGVkID0gbnVsbFxuICAgICAgICAgICAgICAgICAgICAgIHB1dEFzeW5jKHRoYXQudGhyb3VnaENoLCBhY3Rpb24pXG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICwgeyBwYXlsb2FkLCBwcm9taXNlfVxuICAgICAgICAgICAgICAgIClcbiAgICAgIH0gZWxzZSBpZih0cmFuc2Zvcm1lcnNbbmFtZV0pe1xuICAgICAgICBsZXQgY2FjaGVkID0gKGRhdGEpID0+IHRyYW5zZm9ybWVyc1tuYW1lXS5jYWxsKGN0eCwgZGF0YSwgcGF5bG9hZClcbiAgICAgICAgdGhhdC5yZWR1Y2VycyA9IHRoYXQucmVkdWNlcnMuc2V0KGNhY2hlZCwgMClcbiAgICAgICAgaWYocHJvbWlzZSl7XG4gICAgICAgICAgdGhhdC50cmlnZ2VyKClcbiAgICAgICAgICBwcm9taXNlXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIHRoYXQucmVkdWNlcnMgPSB0aGF0LnJlZHVjZXJzLnNldChjYWNoZWQsIDEpXG4gICAgICAgICAgICAgIHRoYXQudHJpZ2dlcigpXG4gICAgICAgICAgICAgIHB1dEFzeW5jKHRoYXQudGhyb3VnaENoLCBhY3Rpb24pXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgdGhhdC5yZWR1Y2VycyA9IHRoYXQucmVkdWNlcnMuc2V0KGNhY2hlZCwgLTEpXG4gICAgICAgICAgICAgIHRoYXQudHJpZ2dlcigpXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgICAgICAgICBwdXRBc3luYyh0aGF0LnRocm91Z2hDaCwgYWN0aW9uKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGF0LnJlZHVjZXJzID0gdGhhdC5yZWR1Y2Vycy5zZXQoY2FjaGVkLCAxKVxuICAgICAgICAgIHRoYXQudHJpZ2dlcigpXG4gICAgICAgICAgcHV0QXN5bmModGhhdC50aHJvdWdoQ2gsIGFjdGlvbilcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHV0QXN5bmModGhhdC50aHJvdWdoQ2gsIGFjdGlvbilcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuIiwiaW1wb3J0IHtkZWZpbmVTdG9yZX0gZnJvbSAnLi9zdG9yZSdcbmltcG9ydCB7ZGVmaW5lRGlzcGF0Y2hlcn0gZnJvbSAnLi9kaXNwYXRjaGVyJ1xuXG5leHBvcnQgeyBkZWZpbmVTdG9yZSwgZGVmaW5lRGlzcGF0Y2hlciB9Il19
