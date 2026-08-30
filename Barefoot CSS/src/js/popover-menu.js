/* Barefoot — opt-in: keyboard support for popover menus.
   Arrow keys (and Home/End) move focus among menu items; focus moves
   into the menu when it opens; Esc or Tab closes it and focus returns
   to the trigger. Works on any [popover][data-kind="menu"]. This is
   roving focus, not a modal trap — popovers stay non-modal by design.
   Zero dependencies, <1KB.

    import "barefoot/js/popover-menu.js"
*/

import { onDomReady, bindOnce } from "./lifecycle.js";
import { createRover } from "./roving-index.js";
import { refocusOpener } from "./return-focus.js";

export function initPopoverMenus(root = document) {
  const menus = root.querySelectorAll('[popover][data-kind="menu"]');

  for (const menu of menus) {
    const items = () =>
      [...menu.querySelectorAll('[role="menuitem"], a, button')].filter(
        (el) => !el.disabled
      );

    const trigger = menu.id
      ? document.querySelector(`[popovertarget="${menu.id}"]`)
      : null;
    if (!trigger) {
      // Focus-return on close is dead without an opener to return to —
      // say so instead of failing silently.
      console.warn(
        `[barefoot] popover-menu: no [popovertarget] trigger for #${menu.id || "(un-id'd menu)"}`
      );
    }

    // Guard last: a menu initialized before its [popovertarget] exists
    // can be re-inited once the trigger arrives.
    if (!bindOnce(menu, "popover-menu")) continue;

    const rove = createRover(items, { axis: "vertical", wrap: true });

    menu.addEventListener("toggle", (e) => {
      if (e.newState === "open") {
        items()[0]?.focus();
      } else {
        // Esc/item-activation/light-dismiss close → hand focus back to
        // the opener (only if focus never left the menu).
        refocusOpener(menu, trigger);
      }
    });

    menu.addEventListener("keydown", (e) => {
      // Close-on-Tab is unconditional — even when the roster is empty
      // (e.g. a search input inside the menu): Tab always means "done
      // with this menu". Declared deliberately in ADR-0006; the old
      // inline math skipped it as a guard-placement side effect.
      if (e.key === "Tab") {
        e.preventDefault();
        menu.hidePopover();
        return;
      }
      rove(e);
    });
  }
}

onDomReady(() => initPopoverMenus());
