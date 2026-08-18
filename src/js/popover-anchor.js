/* Barefoot — opt-in: anchored popovers with an off-screen trigger.
   When a [popover] is anchored (position-anchor) and its trigger is
   fully outside the viewport when it opens — a script called
   showPopover() while the trigger was scrolled away — the popover is
   closed immediately. This matches the spec intent of
   `position-visibility: anchors-visible`, which no engine implements
   yet: Firefox 153+ clamps such a popover to the viewport edge (visible
   at the wrong place); Chromium/WebKit pin it to the off-screen trigger.
   Both are wrong — you can't open a popover whose trigger isn't there.
   Nothing is touched for the normal case: a trigger in view opens its
   popover exactly as before. Zero dependencies, <1KB.

   import "barefoot/js/popover-anchor.js"
*/

export function initPopoverAnchors(root = document) {
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

      const anchorName = getComputedStyle(pop).positionAnchor;
      if (!anchorName || anchorName === "none") return;

      const target = anchorName.replace(/^--/, "").trim();
      let anchor = pop.anchorElement || null;

      if (!anchor) {
        // Documented pattern: inline anchor-name: --x on the trigger.
        for (const el of root.querySelectorAll('[style*="anchor-name"]')) {
          const names = getComputedStyle(el).anchorName.split(/\s+/);
          if (names.includes("--" + target)) {
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

function autoInit() {
  const whenReady = () => initPopoverAnchors();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", whenReady);
  } else {
    whenReady();
  }
}

export default autoInit;
autoInit();