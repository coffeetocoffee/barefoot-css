/* Barefoot — internal lifecycle plumbing for the opt-in JS modules.
   Not a behavior module: nothing to init, not listed in barefoot.js.

   - onDomReady(fn): run fn once the document has parsed — immediately
     when it already has. The one domReady dance every module needs.
   - bindOnce(el, name): idempotency guard. Returns true the first time
     an element/name pair is seen, false every time after, so a manual
     initX() call after auto-load (or any double import) never binds
     the same listeners twice. WeakMap-backed: no DOM attributes, gone
     on reload.
   - warnOnce(key, message): once-per-page deprecation notice. A module
     calls it when it arms against markup that uses a deprecated
     surface; pages that never touch it stay silent. Set-backed per
     module instance — one page load = at most one warning per key.

    Ships as-is like its siblings; behavior modules import it relatively,
    so dist/js/ travels as one directory — which it always is, being a
    single npm package. Zero dependencies.
*/

const bindings = new WeakMap();
const warned = new Set();

export function onDomReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}

export function bindOnce(el, name) {
  let names = bindings.get(el);
  if (!names) bindings.set(el, (names = new Set()));
  if (names.has(name)) return false;
  names.add(name);
  return true;
}

export function warnOnce(key, message) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[barefoot-css] ${message}`);
}
