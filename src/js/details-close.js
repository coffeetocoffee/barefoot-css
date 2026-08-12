/* Barefoot — opt-in: Esc closes <details> menus.
   Fixes the browser-dependent Esc behavior of <details> (Chrome closes
   only when focus is inside the panel; other engines differ). When
   Esc is pressed anywhere inside an open details[data-menu], this
   closes it and returns focus to the summary. Zero dependencies, <1KB.

   import "barefoot/js/details-close.js"
*/

export function initDetailsClose(root = document) {
  root.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;

    const details = e.target.closest?.("details[data-menu]");
    if (!details) return;

    details.open = false;
    details.querySelector("summary")?.focus();
  });
}

function autoInit() {
  const whenReady = () => initDetailsClose();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", whenReady);
  } else {
    whenReady();
  }
}

export default autoInit;
autoInit();
