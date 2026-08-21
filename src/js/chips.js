/* Barefoot — opt-in: removable chips.
   Removes the closest [data-chip] when its [data-chip-remove] button
   is clicked. Zero dependencies, <1KB.

   <span data-chip>
     css
     <button type="button" data-chip-remove aria-label="Remove css">×</button>
   </span>

   No-JS first: without this module nothing hides — the chip simply
   stays, like every Barefoot behavior.

   import "barefoot/js/chips.js"
*/

export function initChips(root = document) {
  root.addEventListener("click", (e) => {
    const button = e.target.closest?.("[data-chip-remove]");
    if (!button) return;
    button.closest("[data-chip]")?.remove();
  });
}

function autoInit() {
  const whenReady = () => initChips();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", whenReady);
  } else {
    whenReady();
  }
}

export default autoInit;
autoInit();
