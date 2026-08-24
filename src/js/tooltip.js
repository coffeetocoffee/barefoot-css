/* Barefoot — opt-in: hover tooltip fallback.
   Adds pointerenter/pointerleave hover-to-show for popover="hint" in
   engines without interest invokers (Firefox, Safari). Chromium 139+
   uses native interestinvoker and skips the JS path.

   <button data-tooltip interestfor="tip" popovertarget="tip" popovertargetaction="show">?</button>
   <div popover="hint" id="tip" data-kind="tooltip">Help text</div>

   No-JS first: without this module tooltips show only on click
   (via popovertarget) in engines without interest invokers.

   import "barefoot/js/tooltip.js"
*/

import { onDomReady, bindOnce } from "./lifecycle.js";

// Check if the engine supports interest invokers
const hasInterestInvoker = "interestFor" in HTMLElement.prototype;

function initTooltips(root = document) {
  if (hasInterestInvoker) return;

  const triggers = root.querySelectorAll("[data-tooltip]");
  for (const trigger of triggers) {
    if (!bindOnce(trigger, "tooltip-hover")) continue;

    const popoverId = trigger.getAttribute("popovertarget");
    if (!popoverId) continue;

    const popover = document.getElementById(popoverId);
    if (!popover) continue;

    let timeoutId = null;

    const show = () => {
      if (timeoutId) clearTimeout(timeoutId);
      popover.showPopover();
    };

    const hide = () => {
      timeoutId = setTimeout(() => {
        popover.hidePopover();
      }, 100);
    };

    // Show on hover
    trigger.addEventListener("pointerenter", show);
    trigger.addEventListener("pointerleave", hide);

    // Keep visible when hovering the popover itself
    popover.addEventListener("pointerenter", () => {
      if (timeoutId) clearTimeout(timeoutId);
    });

    popover.addEventListener("pointerleave", hide);

    // Show on focus (keyboard)
    trigger.addEventListener("focus", show);
    trigger.addEventListener("blur", hide);
  }
}

onDomReady(() => initTooltips());
