/* Barefoot — opt-in: anchored popovers with an off-screen anchor.
   When an anchored [popover] opens while its anchor is fully outside
   the viewport — a script called showPopover() while the trigger was
   scrolled away — it is closed immediately. The anchor is resolved the
   way the platform resolves it: an explicit position-anchor name first,
   then the implicit anchor (the invoker — a popovertarget or
   interestfor button pointing at the popover). Unanchored popovers are
   never touched. This matches the spec intent of
   `position-visibility: anchors-visible`, which no engine implements
   yet: Firefox 153+ clamps such a popover to the viewport edge (visible
   at the wrong place); Chromium/WebKit pin it to the off-screen anchor.
   Both are wrong — you can't open a popover whose trigger isn't there.
   Nothing is touched for the normal case: a trigger in view opens its
   popover exactly as before. Zero dependencies, <1KB.

   import "barefoot/js/popover-anchor.js"
*/

import { onDomReady, bindOnce } from "./lifecycle.js";

export function initPopoverAnchors(root = document) {
  if (!bindOnce(root, "popover-anchor")) return;
  root.addEventListener(
    "toggle",
    (e) => {
      const pop = e.target;
      if (
        !(pop instanceof HTMLElement) ||
        !pop.matches("[popover]") ||
        e.newState !== "open"
      ) {
        return;
      }

      // Resolve the anchor in platform-precedence order:
      // 1. An explicit position-anchor name → match it against inline
      //    anchor-name styles (the documented non-invoker pattern).
      // 2. Otherwise the implicit anchor — the invoker. Engines expose
      //    no anchorElement reflection yet, so find whoever declares
      //    this popover as its target (popovertarget / interestfor).
      let anchor = null;
      const anchorName = getComputedStyle(pop).positionAnchor;

      if (typeof anchorName === "string" && anchorName.startsWith("--")) {
        const target = anchorName.replace(/^--/, "").trim();
        for (const el of root.querySelectorAll('[style*="anchor-name"]')) {
          const names = getComputedStyle(el).anchorName.split(/\s+/);
          if (names.includes("--" + target)) {
            anchor = el;
            break;
          }
        }
      }

      if (!anchor && pop.id) {
        for (const el of root.querySelectorAll("[popovertarget],[interestfor]")) {
          if (
            el.getAttribute("popovertarget") === pop.id ||
            el.getAttribute("interestfor") === pop.id
          ) {
            anchor = el;
            break;
          }
        }
      }

      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const visible =
        rect.top < vh && rect.bottom > 0 && rect.left < vw && rect.right > 0;

      if (!visible && pop.matches(":popover-open")) {
        pop.hidePopover();
      }
    },
    true
  );
}

onDomReady(() => initPopoverAnchors());

