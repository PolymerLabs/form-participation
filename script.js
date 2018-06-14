/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
import {Checkbox} from 'https://unpkg.com/@material/mwc-checkbox/mwc-checkbox.js?module';
import {Radio} from 'https://unpkg.com/@material/mwc-radio/mwc-radio.js?module';

function connectToForm(node, listener) {
  node.getRootNode().addEventListener('formdata', (e) => {
    if (e.target.contains(node)) {
      listener(e);
    }
  });
}

const el = document.querySelector('mwc-checkbox');
connectToForm(el, (e) => {
  if (el.checked) {
    e.formData.append(el.getAttribute('name'), 'on');
  }
});

for (const r of document.querySelectorAll('mwc-radio')) {
  connectToForm(r, (e) => {
    if (r.checked) {
      e.formData.set(r.name, r.value);
    }
  });
}

class CEInput extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.input = document.createElement('input');
    this.input.name = 'zizz';
    this.shadowRoot.appendChild(this.input);
  }
  connectedCallback() {
    this.parentNode.addEventListener('formdata', (e) => {
      e.formData.append(this.input.name, this.input.value);
    });
  }
}
customElements.define('ce-input', CEInput);

form.onformdata = (e) => {
  e.formData.append('baz', 'quux');
  e.formData.append('abc', '123');
  e.formData.delete('foo');
  e.formData.set('radio', '4');
  for (const [name, value] of e.formData) {
    console.log(name, value);
  }
  console.log(e.formData instanceof FormData);
};
