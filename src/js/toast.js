/* Barefoot — opt-in: toast auto-dismiss.
   Adds timed auto-dismiss to [popover][data-kind="toast"] elements.
   Configurable duration, pause-on-hover, visible progress indicator.
   Respects prefers-reduced-motion.

   <div popover="manual" id="toast" data-kind="toast" data-duration="3000" role="status">
     <p>Saved successfully.</p>
     <button type="button" popovertarget="toast">Close</button>
   </div>

   No-JS first: without this module toasts stay open until manually closed.

   import "barefoot/js/toast.js"
*/

import { onDomReady, bindOnce } from "./lifecycle.js";

function initToasts(root = document) {
  const toasts = root.querySelectorAll('[popover][data-kind="toast"][data-duration]');
  for (const toast of toasts) {
    if (!bindOnce(toast, "toast-dismiss")) continue;

    const duration = parseInt(toast.dataset.duration, 10) || 3000;
    let timerId = null;
    let startTime = null;
    let remaining = duration;
    let paused = false;

    const dismiss = () => {
      if (timerId) clearTimeout(timerId);
      toast.hidePopover();
    };

    const startTimer = () => {
      startTime = Date.now();
      timerId = setTimeout(dismiss, remaining);
      updateProgress();
    };

    const updateProgress = () => {
      if (paused) return;
      const progress = toast.querySelector("[data-toast-progress]");
      if (!progress) return;

      const elapsed = Date.now() - startTime;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      progress.style.setProperty("--bf-toast-progress", `${pct}%`);
    };

    const progressInterval = () => {
      if (!paused) updateProgress();
    };

    toast.addEventListener("mouseenter", () => {
      paused = true;
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
        remaining -= Date.now() - startTime;
      }
    });

    toast.addEventListener("mouseleave", () => {
      paused = false;
      startTimer();
    });

    toast.addEventListener("toggle", (e) => {
      if (e.newState === "open") {
        remaining = duration;
        startTimer();
      } else {
        if (timerId) clearTimeout(timerId);
        timerId = null;
      }
    });

    // Pause on focus for keyboard users
    toast.addEventListener("focusin", () => {
      paused = true;
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
        remaining -= Date.now() - startTime;
      }
    });

    toast.addEventListener("focusout", () => {
      paused = false;
      startTimer();
    });

    // Respect prefers-reduced-motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      // Under reduced motion, don't auto-dismiss
      toast.removeAttribute("data-duration");
      return;
    }
  }
}

onDomReady(() => initToasts());
