/* Barefoot — opt-in: responsive header nav (hamburger).
   Collapses a [data-nav="header"] link list behind a toggle while the
   nav is narrower than 40rem (a container query in components/nav.css
   — no viewport media queries). Zero dependencies.

   <nav data-nav="header" aria-label="Primary">
     <a class="fz-brand" href="/">Acme</a>
     <button type="button" class="fz-nav-toggle"
             aria-expanded="false" aria-controls="site-menu">Menu</button>
     <ul id="site-menu">
       <li><a href="/" aria-current="page">Home</a></li>
       …
     </ul>
   </nav>

   - The toggle is author markup: a real <button> with aria-expanded
     and aria-controls. This module only flips states — it never
     invents controls or ARIA.
   - On init each header nav is marked data-nav-js, which arms the CSS
     collapse. No-JS first: without this module nothing ever hides —
     the list wraps exactly like the plain topbar.
   - Open state is [data-open] on the nav, kept in sync with
     aria-expanded on the toggle.
   - Esc (focus anywhere inside an open menu) closes it and returns
     focus to the toggle; activating a link closes it too, so a
     same-page anchor never lands under an open menu.

    import "barefoot/js/nav.js"
*/

import { onDomReady, bindOnce } from "./lifecycle.js";
import { refocusOpener } from "./return-focus.js";

function initNav(nav) {
  const toggle = nav.querySelector(".fz-nav-toggle");
  const list = nav.querySelector(":scope > ul");
  // Only navs with the full contract get marked: [data-nav-js] arms the
  // CSS collapse, so a plain header nav (no toggle) must never carry it
  // — its list would hide with nothing to reopen it. The contract check
  // comes first so an incomplete nav can be re-inited later; bindOnce
  // only stops double-wiring a complete one.
  if (!toggle || !list) return;
  if (!bindOnce(nav, "nav")) return;
  nav.setAttribute("data-nav-js", "");

  const setOpen = (open) => {
    nav.toggleAttribute("data-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", () =>
    setOpen(!nav.hasAttribute("data-open"))
  );

  nav.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !nav.hasAttribute("data-open")) return;
    setOpen(false);
    refocusOpener(nav, toggle);
  });

  list.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });
}

export function initNavs(root = document) {
  // querySelectorAll never matches the root itself — init it explicitly
  // so callers can pass either a subtree or a single nav element.
  if (root instanceof Element && root.matches('[data-nav="header"]')) {
    initNav(root);
  }
  for (const nav of root.querySelectorAll('[data-nav="header"]')) {
    initNav(nav);
  }
}

onDomReady(() => initNavs());
