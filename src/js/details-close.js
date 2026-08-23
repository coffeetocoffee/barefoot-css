/* Barefoot — opt-in: Esc closes <details> menus.
   Fixes the browser-dependent Esc behavior of <details> (Chrome closes
   only when focus is inside the panel; other engines differ). When
   Esc is pressed anywhere inside an open details[data-menu], this
   closes it and returns focus to the summary. Zero dependencies, <1KB.

   DEPRECATED since 3.2, removed in 4.0 together with the details-menu
   pattern it exists for — use a Popover-API menu instead. Pages that
   arm this module against details-menu markup get one console notice.

    import "barefoot/js/details-close.js"
*/

import { onDomReady, bindOnce, warnOnce } from "./lifecycle.js";
import { refocusOpener } from "./return-focus.js";

export function initDetailsClose(root = document) {
  if (!bindOnce(root, "details-close")) return;
  if (root.querySelector?.("details[data-menu]")) {
    warnOnce(
      "details-menu",
      "js/details-close.js: Deprecated (removed in v4.0) — <details data-menu> " +
        "is replaced by Popover-API menus: <button popovertarget=…> + " +
        '<div popover data-kind="menu"> (same look, reliable Esc and ' +
        "light-dismiss; js/popover-menu.js adds arrow keys). This module " +
        "is retired with them. See docs/api.md."
    );
  }
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
