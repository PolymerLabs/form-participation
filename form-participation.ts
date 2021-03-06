/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
const formDataListener = Symbol('formdata listener');

declare global {
  interface FormDataEventInit extends EventInit {
    formData?: FormData;
  }

  interface FormDataEvent extends Event {
    readonly formData: FormData | null;
  }

  var FormDataEvent: {
    prototype: FormDataEvent;
    new(typeArg: string, eventInitDict?: FormDataEventInit): FormDataEvent;
  }

  interface HTMLFormElement {
    onformdata: EventListenerOrEventListenerObject | null;
    [formDataListener]: EventListenerOrEventListenerObject | null;
  }

  interface Window {
    FormData: typeof FormData;
    FormDataEvent: typeof FormDataEvent;
  }
}

if (!HTMLFormElement.prototype.onformdata || !window.FormDataEvent) {

  const map = Symbol('formdata map');

  const appended = Symbol('form observer appended');
  const disabled = Symbol('form observer disabled');

  class ObservingFormData implements FormData {
    private form: HTMLFormElement;

    private [map]: Map<string, FormDataEntryValue[]>;
    private [appended]: Set<Element>;
    private [disabled]: Set<Element>;

    constructor(form: HTMLFormElement) {
      this.form = form;
      this[appended] = new Set();
      this[disabled] = new Set();
      this[map] = new Map();
      for (const el of form.elements as HTMLCollectionOf<HTMLInputElement>) {
        if (el.hasAttribute('name')) {
          this.append(el.name, el.value);
        }
      }
    }
    append(name: string, value: string) {
      if (!this.has(name)) {
        this[map].set(name, [] as FormDataEntryValue[]);
      }
      this[map].get(name)!.push(value);
      const el = document.createElement('input');
      el.type = 'hidden';
      el.name = name;
      el.value = value;
      this.form.appendChild(el);
      this[appended].add(el);
    }
    set(name: string, value: string) {
      this.delete(name);
      this.append(name, value);
    }
    delete(name: string) {
      const oldEls = this.form.querySelectorAll(`[name=${name}]`);
      for (const el of oldEls) {
        el.setAttribute('disabled', '');
        this[disabled].add(el);
      }
      this[map].delete(name);
    }
    get(name: string) {
      return this.getAll(name)[0] || null;
    }
    getAll(name: string) {
      return this[map].get(name) || [];
    }
    has(name: string) {
      return this[map].has(name);
    }
    *entries() {
      for (const [name, values] of this[map].entries()) {
        for (const value of values) {
          yield [name, value] as [string, FormDataEntryValue];
        }
      }
    }
    *keys() {
      for (const [name, values] of this[map].entries()) {
        for (let i = 0; i < values.length; i++) {
          yield name;
        }
      }
    }
    *values() {
      for (const values of this[map].values()) {
        yield* values.values();
      }
    }
    [Symbol.iterator]() {
      return this.entries();
    }
    forEach(callbackFn: (value: FormDataEntryValue, key: string, parent: FormData) => void, thisArg?: any) {
      for (const [key, value] of this.entries()) {
        callbackFn.call(thisArg, value, key, this);
      }
    }
  }

  class FormDataEvent extends Event {
    formData: FormData | null;

    /**
     * @param {string} name
     * @param {FormDataEventInit=} options
     */
    constructor(name: string, options?: FormDataEventInit) {
      super(name, options);
      this.formData = options && options.formData || null;
    }
  }

  window.FormDataEvent = FormDataEvent;

  Object.defineProperty(HTMLFormElement.prototype, 'onformdata', {
    get(this: HTMLFormElement) {
      return this[formDataListener] || null;
    },
    set(this: HTMLFormElement, listener: EventListenerOrEventListenerObject | null) {
      if (this[formDataListener]) {
        this.removeEventListener('formdata', this[formDataListener]!);
      }
      if (listener) {
        this.addEventListener('formdata', listener);
        this[formDataListener] = listener;
      }
    },
    configurable: true
  });

  function resetFormData(formData: ObservingFormData) {
    formData[disabled].forEach((el) => {
      el.removeAttribute('disabled');
    })
    formData[appended].forEach((el) => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  }

  const oldSubmit = HTMLFormElement.prototype.submit;

  function fireFormDataEventAndSubmit(form: HTMLFormElement) {
    const formData = new ObservingFormData(form);
    const options: FormDataEventInit = {bubbles: true, formData};
    const ev = new window.FormDataEvent('formdata', /** @type {!FormDataEventInit} */(options));
    form.dispatchEvent(ev);
    oldSubmit.call(form);
    resetFormData(formData);
  }

  window.addEventListener('submit', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLFormElement)) {
      return;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
    fireFormDataEventAndSubmit(target);
  }, {capture: true});

  HTMLFormElement.prototype.submit = function() {
    fireFormDataEventAndSubmit(this);
  };
}

export {}