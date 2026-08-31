# Barefoot — Migrating from 4.x to 5.0

v5.0 is the "component is the breakpoint" release. It raises the browser floor,
adds **container-adaptive components** and a **generative theming** system, and
documents declarative `command`/`commandfor` wiring — all without deleting a
single JS module.

Unlike v4.0 (which actually removed surfaces), the upgrade is a floor bump plus
opt-in additions. If your app already targets 2026 evergreen browsers, the only
required change is the higher baseline; everything else is additive.

## Fastest path

1. Bump the dependency: `npm i barefoot-css@5`.
2. Confirm your browser baseline meets the v5.0 floor (below). If not, stay on
   4.x — v5.0 uses features your users' browsers won't have.
3. (Optional) adopt the new pieces — adaptive components, generative theming,
   `command`/`commandfor` — at your own pace; none are required.

There is **no codemod**: v5.0 introduces no breaking markup or API removals.

## Browser baseline (v5.0, ADR-0010)

| Browser | Minimum version |
|---|---|
| Chrome | 135+ |
| Firefox | 151+ |
| Safari | 26.2+ |
| Edge | 135+ |

This guarantees, without shims:

- Container queries, container *units* (`cqi`), and container *style* queries
  (the adaptive component engine).
- Anchor positioning (popover menus position via native anchors).
- `command` / `commandfor` (Invoker Commands API) for declarative dialogs.
- Scroll-driven animations (reveal/progress) and `oklch()` relative color
  (the generative theming ramp).

## What changed

### JS modules — none removed (Phase 3 tribunal, ADR-0011)

Every opt-in JS module was tried against the new floor; a module is deleted only
when its entire contract is subsumed. **Zero modules were deleted.**

- `tooltip.js` **survives** — interest invokers are still Chromium-only
  (Firefox and Safari don't ship them as of the v5.0 release), so the
  hover/focus fallback is still required for roughly two-thirds of the floor.
- `popover-menu.js` **survives** — anchor positioning now covers *positioning*,
  but roving focus / APG menu keyboard semantics can't be expressed in CSS
  (ADR-0006); the module keeps roving focus.
- `theme.js` **survives** — persistence (localStorage + crossfade) has no native
  primitive.
- `tabs.js`, `table-sort.js`, `nav.js`, `carousel.js`, `chips.js`,
  `alert-dismiss.js`, `toast.js`, `reveal.js` and the plumbing all **survive** —
  none subsumed.

### Adaptive components — new, opt-in (ADR-0009)

Four new files, each imported only where used (they are **not** in `full.css`,
which stays frozen per ADR-0008):

- `components/table-adaptive.css` — `table[data-table="adaptive"]` card-stacks.
- `components/segmented-adaptive.css` — density compression.
- `components/form-adaptive.css` — row→column reflow + zero-JS error summary.
- `components/card-adaptive.css` — horizontal↔vertical morph.

Table and card variants need a `.bf-contain` wrapper (they morph their own box
and can't query themselves). See `docs/adaptive.md`.

### Generative theming — new (v5.0 Phase 4)

`--bf-tone-1…12` is a 12-step OKLCH ramp generated from `--bf-seed-h` /
`--bf-seed-c`. Set the two dials and the whole ramp follows — no hand-authored
palette. Neutral hex fallbacks keep engines without relative color working.
`docs/theming.md` has the table; `demo/studio.html` is the live editor.

### Declarative `command` / `commandfor` — documented (not new API)

The Invoker Commands API is green across the floor, so dialog/popover wiring
needs no module. `docs/javascript.md §13` shows the markup. This is the one
place a script *used* to be implied — now it's pure markup.

### `base <select>` — graduated in 5.1

Customizable `<select>` (`appearance: base-select`) ships in the default bundle
as a progressive enhancement: where the engine supports it (Chromium 135+,
Safari 27+) the picker is a themed panel, and everywhere else (Firefox, still
behind a flag as of Aug 2026) it falls back cleanly to the themed chevron skin.
No migration action — the upgrade is automatic, no markup change.

## No breaking changes to your markup

- Tokens are additive (`--bf-adaptive-*`, `--bf-density`, `--bf-type-cqi-*`,
  `--bf-seed-*`, `--bf-tone-*`). Existing tokens are unchanged.
- `full.css` keeps its byte budget and import list (ADR-0008).
- `data-bf-theme` theming, density, and all v4 components behave exactly as
  before.

## If something looks off after upgrading

- A component isn't adapting: it's in a container ≥ the breakpoint, or (for
  table/card) missing the `.bf-contain` wrapper. See `docs/adaptive.md`.
- Colors look flat: your engine lacks `oklch()` relative color — you'll get the
  neutral hex fallbacks. That's degrade-by-omission, not a bug.
- Tooltips need hover on Firefox/Safari: expected — `tooltip.js` is still the
  fallback there (interest invokers aren't shipped).
