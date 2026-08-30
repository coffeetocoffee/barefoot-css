/* Barefoot — opt-in: carousel autoplay + controls.
   The base [data-carousel] is a pure scroll-snap scroller (CSS only).
   This module adds optional autoplay and prev/next buttons. Zero
   dependencies.

   Markup (controls are siblings of the scroller, never children —
   children become slides):

     <div data-carousel id="c" tabindex="0" data-autoplay="3000">
       <div>slide</div> …
     </div>
     <button type="button" data-carousel-prev="#c">←</button>
     <button type="button" data-carousel-next="#c">→</button>

   - data-autoplay="ms" turns on auto-advance (3000 default). It pauses
     on hover, keyboard focus, and when the tab is hidden, and never
     starts under prefers-reduced-motion: reduce.
   - data-carousel-prev / data-carousel-next point at the scroller by
     selector. Controls also work without autoplay.
   - Without this module nothing changes: the scroller is still
     keyboard-scrollable and keyboard users never lose the slides.

    import "barefoot/js/carousel.js"
*/

import { onDomReady, bindOnce } from "./lifecycle.js";

const timers = new WeakMap();

function step(el, delta, behavior) {
  const slides = [...el.children];
  if (slides.length === 0) return;

  // Snap positions aren't linear when slides are narrower than the
  // scroller (60cqi slides are centered), so step between *snap points*,
  // computed from each slide's offsetLeft, not by raw scrollLeft math —
  // the centering offset cancels and prev/next always land one slide away.
  const pad = parseFloat(getComputedStyle(el).scrollPaddingInline) || 0;
  const pos = (i) =>
    Math.max(
      slides[i].offsetLeft - (el.clientWidth - slides[i].offsetWidth) / 2 + pad,
      0
    );
  const max = el.scrollWidth - el.clientWidth;

  let best = 0;
  for (let i = 1; i < slides.length; i++) {
    if (Math.abs(pos(i) - el.scrollLeft) < Math.abs(pos(best) - el.scrollLeft)) {
      best = i;
    }
  }

  let target = best + delta;
  if (target < 0) target = slides.length - 1; // wrap backward
  if (target >= slides.length) target = 0; // wrap forward

  el.scrollTo({ left: Math.min(pos(target), max), behavior });
}

function reducedMotion() {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function behavior() {
  return reducedMotion() ? "instant" : "smooth";
}

function pause(el) {
  const t = timers.get(el);
  if (t !== undefined) {
    clearInterval(t);
    timers.delete(el);
  }
}

function resume(el, ms) {
  if (timers.has(el) || reducedMotion()) return;
  timers.set(
    el,
    setInterval(() => step(el, 1, behavior()), ms)
  );
}

function initCarousel(el) {
  if (!bindOnce(el, "carousel")) return;

  const auto = el.dataset.autoplay;
  if (auto !== undefined) {
    const ms = Math.max(parseFloat(auto) || 3000, 1000);

    // A carousel that moves on its own is quiet by default; the prev/next
    // controls (and the scroller's own keyboard use) are the way in.
    if (!el.hasAttribute("aria-live")) el.setAttribute("aria-live", "off");

    const onPause = () => pause(el);
    const onResume = () => resume(el, ms);
    el.addEventListener("pointerenter", onPause);
    el.addEventListener("pointerleave", onResume);
    el.addEventListener("focusin", onPause);
    el.addEventListener("focusout", onResume);
    document.addEventListener("visibilitychange", () =>
      document.hidden ? pause(el) : resume(el, ms)
    );

    resume(el, ms);
  }

  // Group semantics (role="group" + roledescription) only where the
  // author hasn't already marked it — never invent a name.
  if (!el.hasAttribute("role")) el.setAttribute("role", "group");
  if (!el.hasAttribute("aria-roledescription")) {
    el.setAttribute("aria-roledescription", "carousel");
  }
}

function initControls() {
  const wire = (attr, delta) => {
    for (const btn of document.querySelectorAll(`[${attr}]`)) {
      const sel = btn.getAttribute(attr);
      if (!sel) continue;
      const carousel = document.querySelector(sel);
      if (!carousel) continue;
      // Contract first, guard last — a control pointing nowhere can be
      // re-inited once its target exists.
      if (!bindOnce(btn, attr)) continue;
      btn.addEventListener("click", () => step(carousel, delta, behavior()));
    }
  };
  wire("data-carousel-prev", -1);
  wire("data-carousel-next", 1);
}

export function initCarousels(root = document) {
  // querySelectorAll never matches the root itself — init it explicitly
  // so callers can pass either a subtree or a single carousel element.
  if (root instanceof Element && root.matches("[data-carousel]")) {
    initCarousel(root);
  }
  for (const el of root.querySelectorAll("[data-carousel]")) {
    initCarousel(el);
  }
  initControls();
}

onDomReady(() => initCarousels());

