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

import { onDomReady, arm } from "./lifecycle.js";
import { removeOnClick } from "./remove-on-click.js";

arm("chips");

export function initChips(root = document) {
  removeOnClick(root, "chips", "[data-chip]", "[data-chip-remove]");
}

onDomReady(() => initChips());
