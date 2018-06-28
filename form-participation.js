/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
if (!window.FormData || !window.FormData.prototype.set) {
  class FormData {
    /**
     * @param {Element=} form
     */
    constructor(form) {
      /** @type {!Map<string, !Array<string>>} */
      this.map = new Map();
      if (form) {
        for (const el of form.elements) {
          if (el.hasAttribute('name')) {
            this.append(el.name, el.value);
          }
        }
      }
    }
    /**
     * @param {string} name
     * @param {string} value
     * @return {undefined}
     */
    append(name, value) {
      if (!this.has(name)) {
        this.map.set(name, []);
      }
      this.map.get(name).push(value);
    }
    /**
     * @param {string} name
     * @param {string} value
     * @return {undefined}
     */
    set(name, value) {
      this.delete(name);
      this.append(name, value);
    }
    /**
     * @param {string} name
     * @return {undefined}
     */
    delete(name) {
      this.map.delete(name);
    }
    /**
     * @param {string} name
     * @return {string|null}
     */
    get(name) {
      const values = this.getAll(name);
      return values.length ? values[0] : null;
    }
    /**
     * @param {string} name
     * @return {!Array<string>}
     */
    getAll(name) {
      return this.map.get(name) || [];
    }
    /**
     * @param {string} name
     * @return {boolean}
     */
    has(name) {
      return this.map.has(name);
    }
    /**
     * @return {!Iterator<!Array<string>>}
     */
    *entries() {
      for (const [name, values] of this.map) {
        for (const value of values) {
          yield [name, value];
        }
      }
    }
    /**
     * @return {!Iterator<string>}
     */
    *keys() {
      for (const [name, values] of this.map) {
        for (let i = 0; i < values.length; i++) {
          yield name;
        }
      }
    }
    /**
     * @return {!Iterator<string>}
     */
    *values() {
      for (const values of this.map.values()) {
        yield* values.values();
      }
    }
    /**
     * @return {!Iterator<!Array<string>>}
     */
    [Symbol.iterator]() {
      return this.entries();
    }
  }
  window.FormData = FormData;
}

if (!HTMLFormElement.prototype.onformdata || !window.FormDataEvent) {
  const appended = Symbol('form observer appended');
  const disabled = Symbol('form observer disabled');
  class ObservingFormData extends FormData {
    /**
     * @param {!Element} form
     */
    constructor(form) {
      super(form);
      /** @type {!Element} */
      this.form = form;
      /** @type {!Set<!Element>} */
      this[appended] = new Set();
      /** @type {!Set<!Element>} */
      this[disabled] = new Set();
    }
    /**
     * @override
     * @param {string} name
     * @param {string} value
     * @return {undefined}
     */
    append(name, value) {
      super.append(name, value);
      const el = document.createElement('input');
      el.type = 'hidden';
      el.name = name;
      el.value = value;
      this.form.appendChild(el);
      this[appended].add(el);
    }
    /**
     * @override
     * @param {string} name
     * @param {string} value
     * @return {undefined}
     */
    set(name, value) {
      this.delete(name);
      this.append(name, value);
    }
    /**
     * @override
     * @param {string} name
     * @return {undefined}
     */
    delete(name) {
      super.delete(name);
      const oldEls = this.form.querySelectorAll(`[name=${name}]`);
      for (const el of oldEls) {
        el.setAttribute('disabled', '');
        this[disabled].add(el);
      }
    }
  }

  const canSendCustomizedEvents = (() => {
    class Special extends Event {}
    let can = false;
    function listener(e) {
      can = e instanceof Special;
    };
    document.addEventListener('x', listener);
    document.dispatchEvent(new Special('x'));
    document.removeEventListener('x', listener);
    return can;
  })();

  const formData = Symbol('formdata');
  class FormDataEvent extends Event {
    /**
     *
     * @param {string} name
     * @param {Object=} options
     */
    constructor(name, options) {
      super(name, options);
      this[formData] = /** @type {FormData} */(options && options.formData || null);
    }
    /**
     * @return {FormData}
     */
    get formData() {
      return this[formData];
    }
  }

  window.FormDataEvent = canSendCustomizedEvents ? FormDataEvent : function(name, options) {
    const ev = new Event(name, options);
    ev.formData = options && options.formData || null;
    return ev;
  };

  const formDataListener = Symbol('formdata listener');
  Object.defineProperty(HTMLFormElement.prototype, 'onformdata', {
    /**
     * @this {HTMLFormElement}
     */
    get() {
      return this[formDataListener];
    },
    /**
     * @this {HTMLFormElement}
     * @param {function(Event)} fn
     */
    set(fn) {
      if (this[formDataListener]) {
        this.removeEventListener('formdata', this[formDataListener]);
      }
      this.addEventListener('formdata', fn);
      this[formDataListener] = fn;
    },
    configurable: true
  });

  /**
   * @param {!FormData} formData
   * @return {undefined}
   */
  function resetFormData(formData) {
    for (const el of formData[disabled]) {
      el.removeAttribute('disabled');
    }
    for (const el of formData[appended]) {
      el.parentNode.removeChild(el);
    }
  }

  /** @type {!Function} */
  const oldSubmit = HTMLFormElement.prototype.submit;

  /**
   * @param {!Element} form
   * @return {undefined}
   */
  function fireFormDataEventAndSubmit(form) {
    /** @type {ObservingFormData} */
    const formData = new ObservingFormData(form);
    /** @type {!Event} */
    const ev = new window.FormDataEvent('formdata', {bubbles: true, formData});
    form.dispatchEvent(ev);
    oldSubmit.call(form);
    resetFormData(formData);
  }

  addEventListener('submit', (e) => {
    /** @type {!Element} */
    const target = e.target;
    if (!(target instanceof HTMLFormElement)) {
      return;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
    fireFormDataEventAndSubmit(target);
  }, {capture: true});


  /**
   * @this {HTMLFormElement}
   */
  HTMLFormElement.prototype.submit = function() {
    fireFormDataEventAndSubmit(this);
  };
}