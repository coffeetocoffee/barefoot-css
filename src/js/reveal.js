/* Barefoot — reveal (stagger).
   Sets --bf-reveal-index on each [data-reveal] child inside a
   [data-reveal-group] so CSS animation-delay can stagger them.

   Markup:
     <div data-reveal-group>
       <article data-reveal>…</article>
       <article data-reveal>…</article>
     </div>

   import "barefoot/js/reveal.js"    → auto-init on load
   import { initReveal } from "…"    → manual init for dynamic content
*/

import { onDomReady, bindOnce } from "./lifecycle.js";

export function initReveal(root = document) {
  const groups = root.querySelectorAll("[data-reveal-group]");
  for (const group of groups) {
    if (!bindOnce(group, "reveal")) continue;
    const children = group.querySelectorAll("[data-reveal]");
    for (let i = 0; i < children.length; i++) {
      children[i].style.setProperty("--bf-reveal-index", i);
    }
  }
}

onDomReady(() => initReveal());
