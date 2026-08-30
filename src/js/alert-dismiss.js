/* Barefoot — opt-in: dismissible alerts.
   Removes the closest [data-alert] when its [data-alert-dismiss]
   button is clicked. Zero dependencies, <1KB.

   <div data-alert="danger" role="alert">
     <p>Deploy failed.</p>
     <button data-alert-dismiss aria-label="Dismiss">×</button>
   </div>

   import "barefoot/js/alert-dismiss.js"
*/

import { onDomReady } from "./lifecycle.js";
import { removeOnClick } from "./remove-on-click.js";

export function initAlertDismiss(root = document) {
  removeOnClick(root, "alert-dismiss", "[data-alert]", "[data-alert-dismiss]");
}

onDomReady(() => initAlertDismiss());
