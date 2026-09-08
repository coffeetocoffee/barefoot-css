/* Barefoot demo — the live Verify badge (Phase 3, ADR-0015).
   The flagship demo moment: break the markup on stage, watch the
   framework tell you.

   Self-contained demo widget — one script tag, no markup. It imports
   the dev-only checker (js/verify.js), paints its own badge node, and
   re-scans (debounced) whenever the page's markup changes.

   The guardrail is intact: the CHECKER never mutates the DOM — this
   demo code consumes runVerify()/verify() results and writes only to
   the badge it created. Volume law: verify() warns once per rule per
   page in the console; the badge carries the persistent state.
*/

import { runVerify, verify } from "../dist/js/verify.js";

/* Never inside the Studio preview iframe — the iframe renders the real
   demo page, which carries its own badge; a second one inside the
   frame would read as a rendering bug. */
if (window.self === window.top) {
  const style = document.createElement("style");
  style.textContent = `
    .bf-verify-badge {
      position: fixed;
      inset-block-end: var(--bf-space-4);
      inset-inline-end: var(--bf-space-4);
      z-index: var(--bf-z-sticky);
      max-inline-size: 22rem;
      padding: var(--bf-space-2) var(--bf-space-3);
      background: var(--bf-surface);
      color: var(--bf-text);
      border: var(--bf-border-width) solid var(--bf-border);
      border-radius: var(--bf-radius);
      box-shadow: var(--bf-shadow-sm);
      font-size: 0.8125rem;
    }
    .bf-verify-badge[data-state="ok"] { border-inline-start: 3px solid var(--bf-success); }
    .bf-verify-badge[data-state="broken"] { border-inline-start: 3px solid var(--bf-danger); }
  `;
  document.head.append(style);

  const badge = document.createElement("div");
  badge.className = "bf-verify-badge";
  badge.setAttribute("role", "status");
  document.body.append(badge);

  let lastPaint = "";
  function paint(violations) {
    const n = violations.length;
    const state = n === 0 ? "ok" : "broken";
    const ids = [...new Set(violations.map((v) => v.id))];
    const next = JSON.stringify({ state, n, ids });
    if (next === lastPaint) return; // no write → no mutation → no rescan loop
    lastPaint = next;
    badge.dataset.state = state;
    badge.innerHTML =
      n === 0
        ? `<span aria-hidden="true">✓ </span>Barefoot contracts verified`
        : `<span aria-hidden="true">✗ </span>${n} contract violation${
            n === 1 ? "" : "s"
          } — details in the console`;
    badge.title =
      n === 0
        ? "js/verify.js — every contract in the registry passes"
        : ids.join(", ");
  }

  function scan() {
    let violations;
    try {
      // The warning path: each new rule violation warns once, with the
      // fix. Under strict mode it throws — paint the truth anyway.
      violations = verify();
    } catch {
      violations = runVerify();
    }
    paint(violations);
  }

  let timer = null;
  const recheck = () => {
    clearTimeout(timer);
    timer = setTimeout(scan, 250); // debounce markup churn (sliders, injections)
  };
  new MutationObserver(recheck).observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
  });

  scan();
}
