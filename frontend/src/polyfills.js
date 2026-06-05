/* Polyfills for older WebViews (e.g. Sunmi K2 — Android 9, Chrome ~66-72).
   Build target (vite.config) transpiles modern *syntax* (?. ?? class fields);
   these cover missing *runtime APIs* that React 19 / the app may call. All are
   feature-detected, so they no-op on modern engines. Imported first in main.jsx. */

// globalThis (Chrome 71)
if (typeof globalThis === 'undefined') {
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(Object.prototype, '__magic__', {
    get() { return this; }, configurable: true,
  });
  // eslint-disable-next-line no-undef
  __magic__.globalThis = __magic__;
  delete Object.prototype.__magic__;
}

// queueMicrotask (Chrome 71) — used by React's scheduler
if (typeof window.queueMicrotask !== 'function') {
  window.queueMicrotask = function (cb) { Promise.resolve().then(cb).catch(e => setTimeout(() => { throw e; })); };
}

// Promise.allSettled (Chrome 76) / Promise.any (Chrome 85)
if (typeof Promise.allSettled !== 'function') {
  Promise.allSettled = function (ps) {
    return Promise.all(Array.from(ps).map(p => Promise.resolve(p).then(
      v => ({ status: 'fulfilled', value: v }),
      r => ({ status: 'rejected', reason: r }),
    )));
  };
}

// Array.prototype.flat / flatMap (Chrome 69)
if (!Array.prototype.flat) {
  // eslint-disable-next-line no-extend-native
  Array.prototype.flat = function (depth) {
    const d = depth === undefined ? 1 : Number(depth);
    return d < 1 ? this.slice() : this.reduce((a, v) => a.concat(Array.isArray(v) ? v.flat(d - 1) : v), []);
  };
}
if (!Array.prototype.flatMap) {
  // eslint-disable-next-line no-extend-native
  Array.prototype.flatMap = function (fn, ctx) { return this.map(fn, ctx).flat(); };
}

// Array.prototype.at / String.prototype.at (Chrome 92)
if (!Array.prototype.at) {
  // eslint-disable-next-line no-extend-native
  Array.prototype.at = function (n) { n = Math.trunc(n) || 0; if (n < 0) n += this.length; return (n < 0 || n >= this.length) ? undefined : this[n]; };
}

// Object.fromEntries (Chrome 73)
if (typeof Object.fromEntries !== 'function') {
  Object.fromEntries = function (entries) { const o = {}; for (const [k, v] of entries) o[k] = v; return o; };
}

// Object.hasOwn (Chrome 93)
if (typeof Object.hasOwn !== 'function') {
  Object.hasOwn = function (obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); };
}

// String.prototype.replaceAll (Chrome 85)
if (!String.prototype.replaceAll) {
  // eslint-disable-next-line no-extend-native
  String.prototype.replaceAll = function (find, replace) {
    if (find instanceof RegExp) return this.replace(find, replace);
    return this.split(find).join(replace);
  };
}
