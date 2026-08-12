/* Barefoot — opt-in: keyboard support for popover menus.
   Arrow keys (and Home/End) move focus among menu items; focus moves
   into the menu when it opens; Esc or Tab closes it and focus returns
   to the trigger. Works on any [popover][data-kind="menu"]. This is
   roving focus, not a modal trap — popovers stay non-modal by design.
   Zero dependencies, <1KB.

   import "barefoot/js/popover-menu.js"
*/

export function initPopoverMenus(root = document) {
  const menus = root.querySelectorAll('[popover][data-kind="menu"]');

  for (const menu of menus) {
    const items = () =>
      [...menu.querySelectorAll('[role="menuitem"], a, button')].filter(
        (el) => !el.disabled
      );

    const trigger = document.querySelector(`[popovertarget="${menu.id}"]`);

    menu.addEventListener("toggle", (e) => {
      if (e.newState === "open") {
        items()[0]?.focus();
      } else if (menu.contains(document.activeElement) && trigger) {
        // Esc/item-activation close → hand focus back to the opener.
        trigger.focus();
      }
    });

    menu.addEventListener("keydown", (e) => {
      const list = items();
      if (list.length === 0) return;

      const idx = list.indexOf(document.activeElement);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        list[(idx + 1) % list.length]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        list[(idx - 1 + list.length) % list.length]?.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        list[0]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        list[list.length - 1]?.focus();
      } else if (e.key === "Tab") {
        e.preventDefault();
        menu.hidePopover();
      }
    });
  }
}

function autoInit() {
  const whenReady = () => initPopoverMenus();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", whenReady);
  } else {
    whenReady();
  }
}

export default autoInit;
autoInit();
