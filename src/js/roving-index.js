/* Barefoot — internal: roving index for Arrow/Home/End lists.
   One definition of list-navigation math so consumers can't drift apart
   (they had already: tabs clamped at the ends, menus wrapped modulo,
   and each had its own answer for keys pressed before focus enters the
   list).

   createRover(getItems, options) returns a keydown handler:
     - getItems: () => Element[]  — re-read on every keypress (menus are
       dynamic; tabs may be static but pay nothing)
     - axis: "horizontal" | "vertical" — which arrow pair responds
     - wrap: true wraps past the ends (menus); false clamps (tabs)
     - activate(el) — what moving means; default el.focus()

   Position resolves from e.currentTarget when it is one of the items
   (a per-item listener stays exact even if the browser never moved
   focus — Safari doesn't focus buttons on click), else from
   document.activeElement (container-delegated listeners). Keys pressed
   from outside the list enter at the nearest end.

    import { createRover } from "./roving-index.js"
*/

const AXES = {
  horizontal: ["ArrowLeft", "ArrowRight"],
  vertical: ["ArrowUp", "ArrowDown"],
};

export function createRover(
  getItems,
  { axis = "horizontal", wrap = false, activate } = {}
) {
  const pair = AXES[axis];
  if (!pair) throw new Error(`[barefoot] roving-index: unknown axis "${axis}"`);
  const [backKey, fwdKey] = pair;
  const fire = activate ?? ((el) => el.focus());
  return (e) => {
    if (e.key !== "Home" && e.key !== "End" && !pair.includes(e.key)) return;
    const items = getItems();
    if (items.length === 0) return;

    const current = items.includes(e.currentTarget)
      ? e.currentTarget
      : document.activeElement;
    const i = items.indexOf(current);

    let j;
    if (e.key === "Home") j = 0;
    else if (e.key === "End") j = items.length - 1;
    else if (i < 0) j = e.key === backKey ? items.length - 1 : 0;
    else {
      j = i + (e.key === fwdKey ? 1 : -1);
      j = wrap
        ? (j + items.length) % items.length
        : Math.max(0, Math.min(items.length - 1, j));
    }
    e.preventDefault();
    fire(items[j]);
  };
}
