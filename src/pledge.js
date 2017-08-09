'use strict';
/*----------------------------------------------------------------
Promises Workshop: build the pledge.js ES6-style promise library
----------------------------------------------------------------*/
// YOUR CODE HERE:

function $Promise(executor) {
  if (typeof executor !== 'function') throw new TypeError('Type error: Promise constructor invoked with no executor function.');

  this._state = 'pending';
  this._value = null;
  this._internalResolve = (value) => {
    if (this._state === 'pending') {
      this._state = 'fulfilled';
      this._value = value;
    }
  }
  this._internalReject = (reason) => {
    if (this._state === 'pending') {
      this._state = 'rejected';
      this._value = reason;
    }
  }

  executor(this._internalResolve, this._internalReject)

}




/*-------------------------------------------------------
The spec was designed to work with Test'Em, so we don't
actually use module.exports. But here it is for reference:

module.exports = $Promise;

So in a Node-based project we could write things like this:

var Promise = require('pledge');
…
var promise = new Promise(function (resolve, reject) { … });
--------------------------------------------------------*/
