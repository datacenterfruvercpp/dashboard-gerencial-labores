// start-server.js - Entry point for LiteSpeed/cPanel Node.js Selector
// Polyfills Web API globals (Request, Response, Headers, fetch) if the
// system Node.js build doesn't expose them, then starts the standalone server.

if (typeof globalThis.Request === 'undefined') {
  try {
    // Node.js 18+ exposes undici via 'node:undici'
    const u = require('node:undici');
    ['Request', 'Response', 'Headers', 'fetch', 'FormData'].forEach(function(k) {
      if (u[k]) globalThis[k] = u[k];
    });
  } catch (e) {
    // Minimal polyfill for environments without undici
    var _H = function Headers(h) {
      this._m = {};
      if (h && typeof h === 'object') {
        var entries = h instanceof _H ? Object.entries(h._m) : Object.entries(h);
        entries.forEach(function(e) { this._m[e[0].toLowerCase()] = String(e[1]); }.bind(this));
      }
    };
    _H.prototype = {
      get: function(k) { return this._m[k.toLowerCase()] !== undefined ? this._m[k.toLowerCase()] : null; },
      set: function(k, v) { this._m[k.toLowerCase()] = String(v); },
      has: function(k) { return k.toLowerCase() in this._m; },
      append: function(k, v) { var lk = k.toLowerCase(); this._m[lk] = this._m[lk] ? this._m[lk] + ',' + v : String(v); },
      delete: function(k) { delete this._m[k.toLowerCase()]; },
      forEach: function(fn) { Object.entries(this._m).forEach(function(e) { fn(e[1], e[0], this); }.bind(this)); }
    };

    var _R = function Request(input, init) {
      this.url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
      this.method = (init && init.method) || 'GET';
      this.headers = new _H((init && init.headers) || {});
      this.body = (init && init.body) || null;
      this.mode = (init && init.mode) || 'cors';
      this.credentials = (init && init.credentials) || 'same-origin';
      this.cache = (init && init.cache) || 'default';
      this.redirect = (init && init.redirect) || 'follow';
      this.signal = (init && init.signal) || null;
      this.referrer = (init && init.referrer) || '';
      this.integrity = (init && init.integrity) || '';
    };
    _R.prototype = {
      clone: function() { return Object.assign(Object.create(_R.prototype), this); },
      text: function() { return Promise.resolve(this.body ? String(this.body) : ''); },
      json: function() { return this.text().then(JSON.parse); },
      arrayBuffer: function() { return Promise.resolve(new ArrayBuffer(0)); }
    };

    var _Res = function Response(body, init) {
      this.body = body;
      this.status = (init && init.status) || 200;
      this.statusText = (init && init.statusText) || '';
      this.headers = new _H((init && init.headers) || {});
      this.ok = this.status >= 200 && this.status < 300;
      this.type = 'default';
      this.url = '';
    };
    _Res.prototype = {
      clone: function() { return Object.assign(Object.create(_Res.prototype), this); },
      text: function() { return Promise.resolve(this.body ? String(this.body) : ''); },
      json: function() { return this.text().then(JSON.parse); }
    };
    _Res.json = function(data, init) {
      return new _Res(JSON.stringify(data), Object.assign({}, init, { headers: Object.assign({ 'content-type': 'application/json' }, (init && init.headers) || {}) }));
    };

    globalThis.Request = _R;
    globalThis.Response = _Res;
    globalThis.Headers = _H;
    globalThis.fetch = function() { return Promise.reject(new TypeError('fetch() not available')); };
  }
}

require('./.next/standalone/server.js');
