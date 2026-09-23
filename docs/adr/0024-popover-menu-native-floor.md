# ADR-0024: the popover menu's no-JS keyboard floor — the platform moved

**Status:** Accepted (2026-09-23)

## Context

ADR-0021 pinned the honest line: "a popover menu without its module is
pointer-only — no native primitive moves focus into it on open or answers
the arrow keys." That was true when written: no engine honored focus-in on
show, and none returned focus on close.

Probed 2026-09-23 across Chromium, Firefox, and WebKit — all three now
agree, with zero framework JS:

1. **`autofocus` inside a shown popover is honored.** An item carrying
   the attribute receives focus when the popover opens, whatever opened
   it (keyboard, click, script).
2. **Tab walks the items** in DOM order — the menu is a non-modal
   surface, so traversal continues into the page after the last item.
3. **Esc closes with focus returned to the invoker.**

The honest line had become a stale one. A framework whose docs lag the
platform lies by omission — the same failure mode as waving at
"accessible by default" — and the `roving-focus` rule was still warning
consumers about a gap the platform had closed.

## Decision

1. **The demos carry the floor.** Every menu popover in `demo/` puts
   `autofocus` on its first item: the no-JS floor is keyboard-real and
   shown, not merely documented. (A command-palette menu — an
   `autofocus`ed filter input inside the menu — is the same primitive
   pointed at a non-item target.)
2. **The module builds on the primitive, never duplicates it.** On open
   it focuses the first item only when the platform didn't already move
   focus in; an `autofocus`ed target the author chose wins over the
   first-item default. Its remaining jobs are the ones with no native
   primitive: the arrow-key roving (APG) and close-on-Tab.
3. **`roving-focus` warns on the one state that answers no keyboard at
   all** — a menu with neither the module nor `autofocus`. A menu
   carrying `autofocus` without the module is a valid no-JS keyboard
   floor and the rule stays silent, the same precedent as the no-JS
   tablist (every tab reachable, click to switch). The module-only
   remainder — arrows, Home/End, close-on-Tab — is guidance in the map,
   not an audited violation.
4. **Docs restate today's truth.** The keyboard map's native column
   names the floor; the per-pattern section states the one residual
   gap honestly (a Tab-out leaves the menu open behind you without the
   module); accessibility.md, verify.md, and javascript.md follow. The
   registry's quote gate pins the new sentence to the map.

## Consequences

- Demo markup gains one attribute per menu popover; resting visual
  baselines are untouched (the attribute acts on show only).
- The rule's broken case (no module, no autofocus) still trips, and a
  new test pins the silence case; the no-JS floor itself is pinned as a
  keyboard contract on all three engines.
- No budget moves: the rule's new branch lives inside
  `verify-contracts.js`'s existing headroom, and the module's change is
  a guard, not a feature.
- The module's open-focus no longer fights an author's autofocus pick —
  the command-palette pattern works with the module armed.

## Rejected

- **Keeping the v7.8 line.** The warning would name a gap the platform
  closed; every consumer's console would carry a false positive.
- **Deleting the module.** Arrow keys have no native primitive, and
  close-on-Tab is the APG menu contract; the floor is not the pattern.
- **Making a missing `autofocus` a deprecation.** Nothing is being
  removed — it is a choice between two keyboard stories, and contracts
  are the register for "this must hold."
- **Polyfilling focus-return.** All engines return focus on Esc natively
  now; the module's refocus stays as a fallback for stranded-focus edge
  cases, not a platform imitation (the ADR-0021 stance, unchanged).
