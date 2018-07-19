/**
 * @fileoverview Externs for Form Participation
 * @externs
 *
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

/**
 * @record
 * @extends {EventInit}
 */
function FormDataEventInit(){}
/** @type {FormData | undefined} */
FormDataEventInit.prototype.formData;

/**
 * @constructor
 * @extends {Event}
 * @param {string} type
 * @param {FormDataEventInit=} opt_formDataEventInit
 */
function FormDataEvent(type, opt_formDataEventInit){}
/** @type {FormData} */
FormDataEvent.prototype.formData;

/** @type {?function(FormDataEvent)} */
HTMLFormElement.prototype.onformdata;

// NOTE(dfreedm): move to Closure Compiler at some point
/**
 * @param {string} name
 * @param {string | !Blob} value
 * @param {string=} opt_filename
 */
FormData.prototype.set = function(name, value, opt_filename){};

/**
 * @param {string} name
 */
FormData.prototype.delete = function(name){};

/**
 * @param {string} name
 * @return {string | File}
 */
FormData.prototype.get = function(name){};

/**
 * @param {string} name
 * @return {!Array<(string | !File)>}
 */
FormData.prototype.getAll = function(name){};

/**
 *
 * @param {string} name
 * @return {boolean}
 */
FormData.prototype.has = function(name){};

/**
 * @return {!IteratorIterable<!Array<(string | !File)>>}
 */
FormData.prototype.entries = function(){};

/**
 * @return {!IteratorIterable<string>}
 */
FormData.prototype.keys = function(){};

/**
 * @return {!IteratorIterable<(string | !File)>}
 */
FormData.prototype.values = function(){};

/**
 * @return {!Iterator<(string | !File)>}
 */
FormData.prototype[Symbol.iterator] = function(){};