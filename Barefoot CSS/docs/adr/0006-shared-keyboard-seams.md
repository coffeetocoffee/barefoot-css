# ADR-0006: Shared keyboard seams (roving index, close-and-refocus)

**Status:** Accepted (2026-08-22)

## Context

The architecture scan flagged four modules hand-rolling the same two
keyboard interactions with visible drift:

- **Arrow/Home/End list navigation** in `tabs.js` and
  `popover-menu.js` had already diverged: tabs clamped at the ends,
  menus wrapped modulo, and each had its own answer for keys pressed
  before focus enters the list. Every new list-like widget would have
  rolled the math again.
- **"A disclosure closed — give focus back to its opener"** appeared
  three times (`nav.js`, `details-close.js`, `popover-menu.js`) in
  three shapes, only one of which guarded against stealing focus from
  wherever the user had gone next (popover's outside-click dismiss).

## Decision

Two internal modules, neither exported from `barefoot.js`:

- `src/js/roving-index.js` — `createRover(getItems, { axis, wrap,
  activate })` returns a keydown handler owning all Arrow/Home/End
  math: axis picks the arrow pair, `wrap` chooses modulo vs clamp,
  `activate` is what moving means (default `focus()`). Position
  resolves from `e.currentTarget` when it is in the list — preserving
  tabs' exactness when Safari never moved focus onto the clicked
  button — else from `document.activeElement` for delegated listeners.
  Keys pressed from outside enter at the nearest end.
- `src/js/return-focus.js` — `refocusOpener(container, opener)` owns
  the containment guard semantics: focus moves to the opener only if
  it still lives inside what closed. Esc *detection* stays local to
  each module on purpose — their close triggers genuinely differ
  (direct keydown ×2, native popover toggle event ×1) and forcing one
  shape would trade two honest lines for abstraction friction.

Public surfaces are untouched: same file names, same `init*(root)`
exports, same self-init. No pre-existing test needed changes in this
arc.

Consequences:

- **Drift is pinned shut.** Source-parse tests assert the rover and
  refocus primitives are imported where behavior lives, and that arrow
  key names appear in exactly one file — every module in `src/js/` is
  scanned except `roving-index.js` itself, so a future widget cannot
  quietly grow its own math either.
- **One declared semantic change.** Popover menus now close on Tab
  even when their roster is empty (e.g. only a filter input inside).
  The old inline math skipped that case as a side effect of its
  empty-list guard; close-on-Tab is the module's stated contract, so
  the seam makes it unconditional — pinned by its own test.
- **Semantics are now uniform by construction.** Nav and details-close
  gain popover's containment guard (equivalent in practice — a keydown
  targeted inside a container implies focus there); popover keeps its
  exact behavior. details-close also skips already-closed menus
  instead of redundantly re-focusing their summary.
- **New widgets inherit correct defaults.** A future menu-style widget
  gets wrap + nearest-end entry; a tablist gets clamp + activate hook.
- **Barrel exemption grows.** `roving-index.js` and `return-focus.js`
  join `lifecycle.js` / `remove-on-click.js` as internal plumbing in
  the barrel-completeness test.

## Rejected

- **One keyboard module exporting everything**: roving math and focus
  management are different concerns consumed by overlapping sets;
  separate files keep each single-purpose (same reasoning as
  ADR-0004).
- **Forcing an `escCloses(container, …)` helper over nav and
  details-close**: details-close must stay root-delegated so details
  added after init stay covered — the helper fits nav alone, which is
  indirection without dedup.
- **Unifying wrap semantics across tabs and menus**: the difference is
  pattern-correct (menus wrap per WAI-ARIA; tablists commonly clamp),
  not accidental. The seam parameterizes it instead of picking sides.
