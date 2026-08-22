# ADR-0004: One removal factory behind two public adapters

**Status:** Accepted (2026-08-22)

## Context

`chips.js` (removable chips) and `alert-dismiss.js` (dismissible
alerts) were line-for-line carbon copies: a delegated root click
listener that finds `[data-*-dismiss]`/`[data-chip-remove]` and removes
its closest `[data-alert]`/`[data-chip]`. They differed only in the two
attribute selectors, the `bindOnce` guard name, and their headers —
about 25 duplicated lines across the pair, with drift already the
failure mode this repo's scan flags elsewhere.

## Decision

One internal module, `src/js/remove-on-click.js`, owns the behavior:
`removeOnClick(root, guardName, targetSelector, triggerSelector)` binds
the delegated listener under a per-root `bindOnce` guard. The two
public files become thin adapters that keep their exact surface — same
file names, same named `initChips` / `initAlertDismiss(root = document)`
exports, same self-init on load.

Consequences:

- **Import stability.** Consumers keep importing `barefoot/js/chips.js`
  or `barefoot/js/alert-dismiss.js`; nothing moves, nothing renames.
- **You only pay for what you import.** The rejected alternative — one
  public module parameterized by attribute, or either adapter importing
  the other — would auto-init both behaviors from one import and break
  the opt-in contract. Internal plumbing (like `lifecycle.js`) carries
  no side effects.
- **The barrel test learns the convention.** "Internal plumbing is not
  a behavior module" is now encoded in `tests/js.spec.js`: both
  `lifecycle.js` and `remove-on-click.js` are exempt from barrel
  completeness.
- **Drift is pinned shut.** A source-parse test asserts both adapters
  import the factory and contain no `addEventListener` of their own —
  the copies cannot quietly grow back.
- **docs/javascript.md gains its missing section.** Alert-dismiss had a
  table row but no section; the merged "Removal behaviors" section
  documents both together.

## Rejected

- **Merging into one public entry point** (`js/remove.js` with data
  attributes): breaks every existing import for a 25-line saving.
- **Adapter cross-import** (`alert-dismiss.js` importing from
  `chips.js`): asymmetric coupling; importing either would run the
  other's `onDomReady` side effect.
- **Hosting the factory in `lifecycle.js`**: different concern —
  lifecycle is init plumbing, this is a behavior. Separate file keeps
  both single-purpose.
