/* Barefoot — opt-in: include open <details> panels in the tab order.
   WebKit/Safari skips the contents of an open <details> in the
   sequential tab order (long-standing WebKit quirk). Items stay
   clickable and programmatically focusable, but Tab never reaches them.
   This shim walks the panel of every open <details> and gives its
   focusable descendants an explicit tabindex="0" (skipping deliberate
   tabindex="-1"). Zero dependencies, <1KB.

   REMOVAL CANDIDATE for 4.0 (baseline-gated): exists only while engines
   have this gap; deleted once they fix it (gate-checked at 3.5). Pages
   with <details> markup get one console notice.

   Uses a MutationObserver on the `open` attribute: a <details> can flip
   via click, keyboard, or script, and Chromium doesn't fire the "toggle"
   event on a summary click, so the attribute is the reliable signal.

    import "barefoot/js/details-tabindex.js"
*/

import { onDomReady, bindOnce, warnOnce } from "./lifecycle.js";

const FOCUSABLE =
  "a[href], button:not([disabled]), input:not([disabled]):not([type='hidden']), select:not([disabled]), textarea:not([disabled]), [tabindex]";

function makeTabbable(details) {
  for (const el of details.querySelectorAll(FOCUSABLE)) {
    if (el.getAttribute("tabindex") === "-1") continue; // deliberate
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
  }
}

export function initDetailsTabIndex(root = document) {
  if (root.querySelector?.("details")) {
    warnOnce(
      "details-tabindex",
      "js/details-tabindex.js: Removal candidate (v4.0) — this shim exists " +
        "only while engines skip open <details> panels in the tab order " +
        "(WebKit today). It ships until that gap closes upstream and is " +
        "deleted at the next major; drop the import once your browser " +
        "baseline includes the native fix. See docs/api.md."
    );
  }

  // Scan on every call: cheap, idempotent, and covers markup that
  // arrived after a previous init (late-injected content).
  for (const details of root.querySelectorAll("details[open]")) {
    makeTabbable(details);
  }

  // The observer is process-wide wiring: bind it exactly once per root.
  if (!bindOnce(root, "details-tabindex")) return;
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.target.tagName === "DETAILS" && m.target.open) {
        makeTabbable(m.target);
      }
    }
  });
  observer.observe(root, {
    subtree: true,
    attributes: true,
    attributeFilter: ["open"],
  });

  return observer;
}

onDomReady(() => initDetailsTabIndex());

