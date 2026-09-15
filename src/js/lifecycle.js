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
    - arm(name) / isArmed(name): the arming registry Verify reads. A
      behavior module records itself at import ("imported = armed"), so
      js/verify.js can tell a dead-looking control whose module never
      loaded from one whose module did. Module-instance state, not DOM
      attributes — it needs no page surface and survives fixture
      document swaps. Only modules a registry rule audits arm today
      (chips, alert-dismiss, toast); others join if rules need them.
    - emit(target, type, detail): the bf:* event contract (v7.0). Every
      behavior module dispatches a namespaced CustomEvent when it acts,
      with a documented payload, so a page can extend a module instead
      of forking it. Bubbling and non-cancelling: the event reports what
      happened, it never changes what happens — listeners observe, they
      don't vote.

    Ships as-is like its siblings; behavior modules import it relatively,
    so dist/js/ travels as one directory — which it always is, being a
    single npm package. Zero dependencies.
*/

const bindings = new WeakMap();
const warned = new Set();
const armedModules = new Set();

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

export function arm(name) {
  armedModules.add(name);
}

export function isArmed(name) {
  return armedModules.has(name);
}

/* Dispatch a bf:* event (v7.0). Bubbles, so a listener on document
   hears every module's report; detail carries the documented payload.
   Never cancelable — modules act, events report; a listener that could
   veto would make module behavior depend on page wiring. */
export function emit(target, type, detail) {
  target.dispatchEvent(new CustomEvent(type, { bubbles: true, detail }));
}
