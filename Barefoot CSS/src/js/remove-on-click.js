/* Barefoot — internal: one remove-on-click behavior, two consumers.
   Not a behavior module: nothing to init on its own, not listed in
   barefoot.js. chips.js and alert-dismiss.js are thin adapters over
   removeOnClick(): clicking a trigger removes its closest target.
   Delegated at root, so markup injected later is covered; bindOnce
   makes re-init safe (see lifecycle.js).

   Ships as-is like its siblings; behavior modules import it relatively,
   so dist/js/ travels as one directory. Zero dependencies.
*/

import { bindOnce } from "./lifecycle.js";

export function removeOnClick(root, guardName, targetSelector, triggerSelector) {
  if (!bindOnce(root, guardName)) return;
  root.addEventListener("click", (e) => {
    const button = e.target.closest?.(triggerSelector);
    if (!button) return;
    button.closest(targetSelector)?.remove();
  });
}
