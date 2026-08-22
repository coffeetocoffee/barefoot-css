/* Barefoot — opt-in: Esc closes <details> menus.
   Fixes the browser-dependent Esc behavior of <details> (Chrome closes
   only when focus is inside the panel; other engines differ). When
   Esc is pressed anywhere inside an open details[data-menu], this
   closes it and returns focus to the summary. Zero dependencies, <1KB.

   import "barefoot/js/details-close.js"
*/

import { onDomReady, bindOnce } from "./lifecycle.js";
import { refocusOpener } from "./return-focus.js";

export function initDetailsClose(root = document) {
  if (!bindOnce(root, "details-close")) return;
  root.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;

    // Delegated at root so details added after init are covered too.
    const details = e.target.closest?.("details[data-menu]");
    if (!details || !details.open) return;

    details.open = false;
    refocusOpener(details, () => details.querySelector("summary"));
  });
}

onDomReady(() => initDetailsClose());
