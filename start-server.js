// start-server.js - Entry point for LiteSpeed/cPanel Node.js Selector
// Polyfills Web API globals (Request, Response, Headers) if the system
// Node.js build doesn't expose them, then starts the Next.js standalone server.

if (typeof globalThis.Request === 'undefined') {
  try {
    // Node.js 18+ exposes undici via 'node:undici'
    const u = require('node:undici');
    ['Request', 'Response', 'Headers', 'fetch', 'FormData'].forEach(function(k) {
      if (u[k]) globalThis[k] = u[k];
    });
  } catch (e) {
    // Minimal ES6 class polyfill for environments without Web API globals
    class _Headers {
      constructor(init) {
        this._m = {};
        if (init) {
          const src = init instanceof _Headers ? init._m : init;
          Object.entries(src).forEach(([k, v]) => { this._m[k.toLowerCase()] = String(v); });
        }
      }
      get(k) { return Object.prototype.hasOwnProperty.call(this._m, k.toLowerCase()) ? this._m[k.toLowerCase()] : null; }
      set(k, v) { this._m[k.toLowerCase()] = String(v); }
      has(k) { return Object.prototype.hasOwnProperty.call(this._m, k.toLowerCase()); }
      append(k, v) { const lk = k.toLowerCase(); this._m[lk] = this._m[lk] ? this._m[lk] + ',' + v : String(v); }
      delete(k) { delete this._m[k.toLowerCase()]; }
      forEach(fn) { Object.entries(this._m).forEach(([k, v]) => fn(v, k, this)); }
      entries() { return Object.entries(this._m)[Symbol.iterator](); }
      keys() { return Object.keys(this._m)[Symbol.iterator](); }
      values() { return Object.values(this._m)[Symbol.iterator](); }
    }

    class _Request {
      constructor(input, init) {
        this.url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
        init = init || {};
        this.method = init.method || 'GET';
        this.headers = new _Headers(init.headers || {});
        this.body = init.body || null;
        this.mode = init.mode || 'cors';
        this.credentials = init.credentials || 'same-origin';
        this.cache = init.cache || 'default';
        this.redirect = init.redirect || 'follow';
        this.signal = init.signal || null;
        this.referrer = init.referrer || '';
        this.referrerPolicy = init.referrerPolicy || '';
        this.integrity = init.integrity || '';
        this.keepalive = init.keepalive || false;
      }
      clone() { return Object.assign(Object.create(Object.getPrototypeOf(this)), this); }
      text() { return Promise.resolve(this.body ? String(this.body) : ''); }
      json() { return this.text().then(JSON.parse); }
      arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)); }
      formData() { return Promise.resolve(new FormData()); }
    }

    class _Response {
      constructor(body, init) {
        init = init || {};
        this.body = body;
        this.status = init.status !== undefined ? init.status : 200;
        this.statusText = init.statusText || '';
        this.headers = new _Headers(init.headers || {});
        this.ok = this.status >= 200 && this.status < 300;
        this.type = 'default';
        this.url = '';
        this.redirected = false;
      }
      static json(data, init) {
        const headers = Object.assign({ 'content-type': 'application/json' }, (init && init.headers) || {});
        return new _Response(JSON.stringify(data), Object.assign({}, init, { headers }));
      }
      clone() { return Object.assign(Object.create(Object.getPrototypeOf(this)), this); }
      text() { return Promise.resolve(this.body ? String(this.body) : ''); }
      json() { return this.text().then(JSON.parse); }
      arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)); }
    }

    globalThis.Headers = _Headers;
    globalThis.Request = _Request;
    globalThis.Response = _Response;
    globalThis.fetch = function() { return Promise.reject(new TypeError('fetch() not available in this environment')); };
    if (typeof globalThis.FormData === 'undefined') {
      globalThis.FormData = class FormData {
        constructor() { this._d = []; }
        append(k, v) { this._d.push([k, v]); }
        get(k) { const e = this._d.find(([n]) => n === k); return e ? e[1] : null; }
      };
    }
  }
}

require('./.next/standalone/server.js');
