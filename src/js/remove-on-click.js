/* Barefoot — internal: one remove-on-click behavior, two consumers.
   Not a behavior module: nothing to init on its own, not listed in
   barefoot.js. chips.js and alert-dismiss.js are thin adapters over
   removeOnClick(): clicking a trigger removes its closest target.
   Delegated at root, so markup injected later is covered; bindOnce
   makes re-init safe (see lifecycle.js).

   The optional event pair ({ type, key }) reports the removal as a
   bubbling bf:* event dispatched on the target *before* it leaves the
   tree, so a document-level listener still sees it in place — the
   payload is { [key]: target } (docs/javascript.md, Events).

   Ships as-is like its siblings; behavior modules import it relatively,
   so dist/js/ travels as one directory. Zero dependencies.
 */

import { bindOnce, emit } from "./lifecycle.js";

export function removeOnClick(
  root,
  guardName,
  targetSelector,
  triggerSelector,
  { type, key } = {}
) {
  if (!bindOnce(root, guardName)) return;
  root.addEventListener("click", (e) => {
    const button = e.target.closest?.(triggerSelector);
    if (!button) return;
    const target = button.closest(targetSelector);
    if (!target) return;
    if (type) emit(target, type, { [key]: target });
    target.remove();
  });
}
