'use strict';
/*----------------------------------------------------------------
Promises Workshop: build the pledge.js ES6-style promise library
----------------------------------------------------------------*/
// YOUR CODE HERE:

function $Promise ( executor ) {
  this._state = 'pending';
  this._handlerGroups = [];
  executor(
    this._internalResolve.bind( this ),
    this._internalReject.bind( this )
  )
}

$Promise.all = function ( arr ) {
  if ( !Array.isArray( arr ) ) throw TypeError( '$Promise.all only accepts array arguments.' );

  return new $Promise(( resolve, reject ) => {
    arr.forEach(( el, idx, arr ) => {
      if ( el instanceof $Promise ) {
        el.then(
          result => arr[ idx ] = result,
          reason => reject( reason ) // if any promise in arr fails,
        )                          // fail promise returned by .all
      }
    } )
    let timer = 0; // there's probably a better way to do this:
    const intervalID = setInterval(() => {
      timer++ // check for promises every ms, resolve when none left
      if ( !arr.find(( el ) => el instanceof $Promise ) ) {
        resolve( arr );
        clearTimeout( intervalID );
      } else if ( timer > 10000 ) { // else kill the promise after 10s
        reject( arr );
        clearTimeout( intervalID );
      }
    }, 1 )
  } )
}

$Promise.resolve = function ( value ) {
  if ( value instanceof $Promise ) return value
  return new $Promise( function ( resolve ) {
    resolve( value )
  } )
}

$Promise.prototype._settle = function ( state, value ) {
  if ( this._isSettled() ) return;
  this._state = state;
  this._value = value;
  this._callHandlers();
}

$Promise.prototype._internalResolve = function ( value ) {
  this._settle( 'fulfilled', value );
}

$Promise.prototype._internalReject = function ( reason ) {
  this._settle( 'rejected', reason );
}

$Promise.prototype.then = function ( onSuccess, onReject ) {
  if ( !isFn( onSuccess ) ) onSuccess = null;
  if ( !isFn( onReject ) ) onReject = null;
  const newPromise = new $Promise( noop )
  const newHandlerGroup = {
    successCb: onSuccess,
    errorCb: onReject,
    downstreamPromise: newPromise
  };
  this._handlerGroups.push( newHandlerGroup );
  if ( this._isSettled() ) this._callHandlers();
  return newPromise;
}

$Promise.prototype._callHandlers = function () {
  if ( this._isPending() ) return; // no need to run if Promise has no val
  this._handlerGroups.forEach( group => {

    const handler = this._getCorrectHandler( group ); // fulfill/reject handler
    const nextPromise = group.downstreamPromise;
    if ( !handler ) return this._propogateTo( nextPromise );
    let whatWasReturned;
    try { whatWasReturned = handler( this._value ); }
    catch ( err ) { nextPromise._internalReject( err ); }
    if ( whatWasReturned instanceof $Promise ) {
      nextPromise._assimilate( whatWasReturned );
    } else {
      nextPromise._internalResolve( whatWasReturned );
    }
  } );
  this._clearHandlerQueue();
}

// this is equivalent to commented-out version below, but better
$Promise.prototype._assimilate = function ( aPromise ) {
  aPromise.then(
    this._internalResolve.bind( this ),
    this._internalReject.bind( this )
  );
};

// MY ORIGINAL ATTEMPT:
// $Promise.prototype._assimilate = function ( promise2 ) {
//   const promise1 = this;
//   promise2.then(
//     function ( result ) { promise1._internalResolve( result ) },
//     function ( reason ) { promise1._internalReject( reason ) }
//   );
// }

$Promise.prototype._clearHandlerQueue = function () {
  this._handlerGroups = [];
}

$Promise.prototype.catch = function ( onReject ) {
  return this.then( null, onReject );
}
// this.catch = this.then.bind(this,null)

$Promise.prototype._getCorrectHandler = function ( handlers ) {
  return this._isFulfilled()
    ? handlers.successCb
    : handlers.errorCb;
}

$Promise.prototype._propogateTo = function ( nextPromise ) {
  return this._isFulfilled()
    ? nextPromise._internalResolve( this._value )
    : nextPromise._internalReject( this._value );
}

$Promise.prototype._isPending = function () {
  return this._state === 'pending';
}

$Promise.prototype._isSettled = function () {
  return this._state !== 'pending';
}

$Promise.prototype._isFulfilled = function () {
  return this._state === 'fulfilled';
}

$Promise.prototype._isRejected = function () {
  return this._state === 'rejected';
}

function noop () { };
function isFn ( val ) { return typeof val === 'function' };



const promisedValue =
  new Promise( function ( resolve, reject ) {
    someAsynOperation( 'some argument', function ( err, result ) {
      if ( err ) reject( err );
      else resolve( result );
    } )
  } )


/*-------------------------------------------------------
The spec was designed to work with Test'Em, so we don't
actually use module.exports. But here it is for reference:

module.exports = $Promise;

So in a Node-based project we could write things like this:

var Promise = require('pledge');
…
var promise = new Promise(function (resolve, reject) { … });
--------------------------------------------------------*/

