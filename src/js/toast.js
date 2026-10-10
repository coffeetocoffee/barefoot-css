/* Barefoot — opt-in: toast auto-dismiss.
   Adds timed auto-dismiss to [popover][data-kind="toast"] elements.
   Configurable duration, pause-on-hover, visible progress indicator.
   Respects prefers-reduced-motion.

   <div popover="manual" id="toast" data-kind="toast" data-duration="3000" role="status">
     <p>Saved successfully.</p>
     <div data-toast-progress></div>
     <button type="button" popovertarget="toast">Close</button>
   </div>

   The bar is that empty div: this module writes --bf-toast-progress on
   it (time left as a share of the ORIGINAL duration, so a resumed toast
   continues its countdown instead of restarting it) and popover.css
   paints the hairline. No div, no bar — the timer is unaffected.

   No-JS first: without this module toasts stay open until manually closed.

   import "barefoot/js/toast.js"     // auto-init on DOM ready
   initToasts()                      // re-init for dynamic markup
*/

import { onDomReady, bindOnce, arm, emit } from "./lifecycle.js";

arm("toast");

/* Progress repaint cadence. ~10fps is smooth for a hairline. In JS rather
   than a CSS animation because the bar must freeze with the timer on
   hover and resume from where it stopped. */
const TICK = 100;

export function initToasts(root = document) {
  const toasts = root.querySelectorAll('[popover][data-kind="toast"][data-duration]');
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  for (const toast of toasts) {
    /* Under reduced motion the toast stays open until manually closed.
       Drop the attribute that would time it out AND bind nothing: the
       listeners below start the timer, so binding first and bailing
       after would still auto-dismiss it. */
    if (reduced.matches) {
      toast.removeAttribute("data-duration");
      continue;
    }

    if (!bindOnce(toast, "toast-dismiss")) continue;

    const duration = parseInt(toast.dataset.duration, 10) || 3000;
    const bar = toast.querySelector("[data-toast-progress]");
    let timerId = null;
    let progressId = null;
    let startTime = null;
    let remaining = duration;

    /* Pause REASONS, not a flag: a toast can be hovered and focused at
       once, and whichever gesture ends first must not resume a timer the
       other is still holding. */
    const held = new Set();

    /* Stop both clocks and bank the time already spent, so a later
       startTimer() finishes the original duration rather than restarting
       it. Safe to call when nothing is running. */
    const stopTimer = () => {
      clearTimeout(timerId);
      clearInterval(progressId);
      timerId = progressId = null;
      if (startTime !== null) {
        remaining = Math.max(0, remaining - (Date.now() - startTime));
        startTime = null;
      }
    };

    const paint = () => {
      if (!bar) return;
      /* Share of the original duration — not of `remaining`, which
         would snap a paused toast's bar back to full on resume. */
      const left = held.size ? remaining : remaining - (Date.now() - startTime);
      const pct = Math.max(0, Math.min(100, (left / duration) * 100));
      bar.style.setProperty("--bf-toast-progress", `${pct}%`);
    };

    const dismiss = () => {
      stopTimer();
      // Report the auto-dismiss before hiding (v7.0 event contract):
      // a listener learns which toast timed out while it is still open.
      emit(toast, "bf:toastdismiss", { toast });
      toast.hidePopover();
    };

    const startTimer = () => {
      startTime = Date.now();
      timerId = setTimeout(dismiss, remaining);
      paint();
      progressId = setInterval(paint, TICK);
    };

    const pause = (reason) => {
      if (held.has(reason)) return;
      held.add(reason);
      stopTimer();
      // Repaint on the exact value so the bar freezes on a real tick.
      paint();
    };

    const resume = (reason) => {
      if (!held.delete(reason) || held.size) return;
      startTimer();
    };

    toast.addEventListener("mouseenter", () => pause("hover"));
    toast.addEventListener("mouseleave", () => resume("hover"));
    toast.addEventListener("focusin", () => pause("focus"));
    /* focusout bubbles on every focus move INSIDE the toast (the Close
       button to another control and back), so only a move that leaves
       the toast ends the pause. */
    toast.addEventListener("focusout", (e) => {
      if (!toast.contains(e.relatedTarget)) resume("focus");
    });

    toast.addEventListener("toggle", (e) => {
      stopTimer();
      if (e.newState === "open") {
        remaining = duration;
        startTimer();
      }
    });

    /* Already-open markup (dynamic content, or a toast shown before this
       module loaded) never fires `toggle`, so its countdown would never
       start. Begin it here. */
    if (toast.matches(":popover-open")) startTimer();
  }
}

onDomReady(() => initToasts());
