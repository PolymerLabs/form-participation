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

  interface HTMLFormElement {
    onformdata: ((this: HTMLFormElement, ev: FormDataEvent) => any) | null;
    [formDataListener]: ((this: HTMLFormElement, ev: FormDataEvent) => any) | null;
  }

  interface FormDataEvent extends Event {
    readonly formData: FormData | null;
  }

  var FormDataEvent: {
    prototype: FormDataEvent;
    new(typeArg: string, eventInitDict?: FormDataEventInit): FormDataEvent;
  }

  interface Window {
    FormData: typeof FormData;
    FormDataEvent: typeof FormDataEvent;
  }
}

if (!HTMLFormElement.prototype.onformdata || !window.FormDataEvent) {

  const useNativeFormData = Boolean(window.FormData && window.FormData.prototype.set);

  const map = Symbol('formdata map');

  class FormDataPolyfill implements FormData {
    private [map]: Map<string, FormDataEntryValue[]>;

    constructor(form?: HTMLFormElement) {
      this[map] = new Map();
      if (form !== undefined) {
        for (const el of form.elements as HTMLCollectionOf<HTMLInputElement>) {
          if (el.hasAttribute('name')) {
            this.append(el.name, el.value);
          }
        }
      }
    }
    append(name: string, value: string) {
      if (!this.has(name)) {
        this[map].set(name, [] as FormDataEntryValue[]);
      }
      this[map].get(name)!.push(value);
    }
    set(name: string, value: string) {
      this.delete(name);
      this.append(name, value);
    }
    delete(name: string) {
      this[map].delete(name);
    }
    get(name: string): FormDataEntryValue | null {
      return this.getAll(name)[0] || null;
    }
    getAll(name: string): FormDataEntryValue[] {
      return this[map].get(name) || [];
    }
    has(name: string): boolean {
      return this[map].has(name);
    }
    *entries(): IterableIterator<[string, FormDataEntryValue]> {
      for (const [name, values] of this[map].entries()) {
        for (const value of values) {
          yield [name, value];
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
    forEach(callbackfn: (value: FormDataEntryValue, key: string, parent: FormData) => void, thisArg?: any) {
      for (const [key, value] of this.entries()) {
        callbackfn.call(thisArg, value, key, this);
      }
    }
  }

  const appended = Symbol('form observer appended');
  const disabled = Symbol('form observer disabled');

  const FormDataBase = useNativeFormData ? window.FormData : FormDataPolyfill;

  class ObservingFormData extends FormDataBase {
    private form: HTMLFormElement;
    private [appended]: Set<Element>;
    private [disabled]: Set<Element>;

    constructor(form: HTMLFormElement) {
      super(form);
      this.form = form;
      this[appended] = new Set();
      this[disabled] = new Set();
    }
    append(name: string, value: string) {
      super.append(name, value);
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
      super.delete(name);
      const oldEls = this.form.querySelectorAll(`[name=${name}]`);
      for (const el of oldEls) {
        el.setAttribute('disabled', '');
        this[disabled].add(el);
      }
    }
  }

  class FormDataEvent extends Event {
    formData: FormData | null;

    constructor(name: string, options?: FormDataEventInit) {
      super(name, options);
      this.formData = options && options.formData || null;
    }
  }

  window.FormDataEvent = FormDataEvent;

  Object.defineProperty(HTMLFormElement.prototype, 'onformdata', {
    get(this: HTMLFormElement): ((ev: FormDataEvent) => any) | null {
      return this[formDataListener] || null;
    },
    set(this: HTMLFormElement, fn: (ev: FormDataEvent) => any) {
      if (this[formDataListener]) {
        this.removeEventListener('formdata', this[formDataListener]! as EventListener);
      }
      this.addEventListener('formdata', fn as EventListener);
      this[formDataListener] = fn;
    },
    configurable: true
  });

  function resetFormData(formData: ObservingFormData) {
    for (const el of formData[disabled]) {
      el.removeAttribute('disabled');
    }
    for (const el of formData[appended]) {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }
  }

  const oldSubmit = HTMLFormElement.prototype.submit;

  function fireFormDataEventAndSubmit(form: HTMLFormElement) {
    const formData = new ObservingFormData(form);
    const ev = new window.FormDataEvent('formdata', {bubbles: true, formData: formData as FormData});
    form.dispatchEvent(ev);
    oldSubmit.call(form);
    resetFormData(formData);
  }

  addEventListener('submit', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLFormElement)) {
      return;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
    fireFormDataEventAndSubmit(target);
  }, {capture: true});

  HTMLFormElement.prototype.submit = function() {
    fireFormDataEventAndSubmit((this as HTMLFormElement));
  };
}

export {}