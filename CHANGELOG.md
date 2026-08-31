# Changelog

All notable changes to Barefoot CSS are documented here. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
   this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Opt-in animated generative theming (`theming-anim.css`).** Registers the
  `--bf-seed-h` / `--bf-seed-c` generative seeds with `@property` so a seed
  change *morphs* the 12-step OKLCH ramp instead of snapping. Opt-in by
  import (`barefoot/themes/theming-anim.css`); the default build stays
  `@property`-free per ADR-0005/0012. Gated on `prefers-reduced-motion:
  no-preference` so reduced-motion users get the instant swap.

- **Studio exports a pasteable theme + `tokens.json`.** `demo/studio.html`
  now emits a real `:root` theme — primary, radius, font, and the
  generative `--bf-seed-h` / `--bf-seed-c` so the full 12-step ramp
  reproduces — plus the same overrides as a `tokens.json` map for design
  pipelines (replaces the old six-line snippet).

## [5.0.1] — 2026-08-31

### Fixed

- **Popover menu returns focus to its trigger on Tab-close (WebKit).**
  `popover-menu.js` now refocuses the invoker when a Tab-close strands
  focus on `<body>`; `refocusOpener` only acted while focus stayed inside
  the menu, leaving WebKit at 104/105. `js.spec` is now 105/105 across all
  three engines.

## [5.0.0] — 2026-08-31

### Changed

- **`forms.css` split into opt-in shards.** `forms.css` is now a barrel that
  re-imports `forms-base.css` (text inputs, validation, states — the part most
  forms need) plus six opt-in shards: `forms-select.css`, `forms-checks.css`
  (checkbox/radio/switch), `forms-range.css`, `forms-file.css`,
  `forms-color.css`, `forms-meter.css`. Full import is byte-identical to before
  (`full.css` unchanged), but consumers can now ship "text inputs only" without
  the select/range/file/color/meter rules — roughly a 1.8KB gzip saving on a
  text-only form. No selectors, tokens, or behavior changed.

## [5.0.0-beta.1] — 2026-08-31

The "component is the breakpoint" arc begins. Phase 0 is recon: the engine
matrix was verified live (caniuse Jul-2026 + MDN) and two contracts were
accepted. No source shipped yet — this phase sets the rules the Phase 1–2
components must follow.

### Added

- **ADR-0009 — adaptive component contract.** Adaptive behavior ships in
  per-component `<name>-adaptive.css` files (opt-in, never in frozen
  `full.css`); the component root establishes a namespaced
  `container-name: bf-<component>`; breakpoints are `--bf-adaptive-1/2/3`
  tokens; density is a `@container style(--bf-density: …)` query with a
  size-query layout floor; fluid type uses `cqi`. Tests must resize
  containers, not the viewport.
- **ADR-0010 — v5 floor raise.** Browser baseline moves to **Chrome 135+ /
  Firefox 151+ / Safari 26.2+**. Firefox 151 is the hard gate — container
  *style* queries land there, which the v5 density story requires. Interest
  invokers stay out of the floor (Chromium-only as of Aug 2026); `tooltip.js`
  survives as a polyfill. Degrade-by-omission still protects older engines.

### Changed

- Engine matrix verified: `@container style()` **shipped in Firefox 151
  (Apr 2026)** — the plan's headline risk is closed, so density is
  first-class, not a size-query-only fallback. `command`/`commandfor` is
  green in all three engines; base `<select>` stays behind a Firefox flag and
  is deferred to 5.1. plan.md watch-list and baseline updated with dates.

### Phase 1 — adaptive engine (tokens + mechanics)

- **Tokens (`src/tokens.css`):** added the adaptive token families —
  `--bf-adaptive-1/2/3` (24 / 40 / 56rem container breakpoints),
  `--bf-density` (`comfortable` default, set to `compact` by the existing
  `data-density="compact"` axis so the v3.4 lever feeds the v5 style query),
  and a fluid container-relative type scale `--bf-type-cqi-*`
  (`clamp(… + Ncqi …)`) for type that tracks the component's box. None are
  `@property`-registered (ADR-0005).
- **Docs:** new "Container conventions" section in components.md and adaptive
  tokens + density-axis notes in theming.md (the latter auto-checked by the
  token-docs parity test).
- **Tests:** `setContainerWidth` / `gridColumnCount` / `tokenValue` helpers in
  `tests/helpers.js`; a new "adaptive engine" group in `css.spec.js` resizes
  *containers* (not the viewport) and asserts the tokens, per ADR-0009.

### Phase 2 — adaptive components (the headline)

Four opt-in `<name>-adaptive.css` files (never in frozen `full.css`):

- **`table-adaptive.css`** — `table[data-table="adaptive"]` card-stacks when
  its **container** is narrow (≤ 40rem, mirrors `--bf-adaptive-2`); cells use
  `data-label`; density via `@container style(--bf-density: compact)`.
- **`segmented-adaptive.css`** — `[data-segmented][data-adaptive]` is its own
  container (`bf-segmented`) and compresses label padding when narrow or under
  `data-density="compact"`; cqi label type.
- **`form-adaptive.css`** — `form[data-form="adaptive"]` collapses a `.bf-row`
  to one column when narrow, and reveals a `:has(:user-invalid)` error summary —
  both pure CSS, no JS.
- **`card-adaptive.css`** — `.card[data-card="adaptive"]` lays out
  horizontally when wide, vertically when narrow ("morphing density"); cqi
  header type.

`cqi` typography now drives the table caption, segmented label, and card
header. Each ships a demo section (`demo/index.html`) + `css.spec.js` tests
(resize containers, not the viewport) + axe scan; `npm run check` is green and
the three-engine css suites pass.

**Tooling note (ADR-0009):** Lightning CSS 1.33 can't resolve `var()` inside a
`@container` *condition*, so the breakpoint literals are `rem` (same convention
as `grid.css`'s 30/48rem); `--bf-adaptive-*` remain the documented thresholds.
Components that morph their *own* box (table, card) query the nearest ancestor
`.bf-contain` — a container can't style itself, and a `<table>` can't reliably
host `container-type`.

### Phase 3 — zero-JS completion tribunal (ADR-0011)

Every opt-in JS module was tried against the v5 floor (Chrome 135 / FF 151 /
Safari 26.2); a module dies only when its entire contract is subsumed.

- **Zero modules deleted.** Verdicts: `tooltip.js` **survives** — interest
  invokers are still Chromium-only (FF/Safari unsupported, verified Phase 0), so
  the hover/focus fallback is required for ~2/3 of the floor. `popover-menu.js`
  **survives** — anchor positioning now covers *positioning*, but roving focus /
  APG menu keyboard semantics can't be expressed in CSS (ADR-0006). `theme.js`
  **survives** — persistence has no native primitive. `tabs.js`, `table-sort.js`,
  `nav.js`, `carousel.js`, `chips.js`, `alert-dismiss.js`, `toast.js`,
  `reveal.js` + plumbing all **survive** — none subsumed.
- **`command`/`commandfor` documented for consumers** (docs/javascript.md §13):
  the Invoker Commands API is green across the whole floor, so declarative
  dialog/popover wiring needs no module — the only "JS removed" in spirit.
- **Partially un-gated tests:** only implicit **anchor positioning** could be
  un-gated — verified green on chromium/firefox/webkit. **Scroll-driven
  animations (reveal/progress) and `popover=hint` stay gated**: the *installed*
  test browsers don't satisfy them at runtime (the aspirational floor is ahead of
  what's actually installed), and `popover=hint` correctly ignores `Escape` so the
  Esc-close assertion is spec-wrong for hints. Cross-doc view transitions and base
  `<select>` also stay gated (still Chromium-only / FF-flagged) — deferred to 5.1.

### Phase 4 — generative theming 2.0

"One Color Infinite Theme" extended into a generative system.

- **12-step OKLCH tonal scale** (`--bf-tone-1`…`--bf-tone-12`, light → dark)
  generated from two dials — `--bf-seed-h` (hue) and `--bf-seed-c` (chroma) —
  via relative-color syntax (`oklch(L C h)`) in `src/tokens.css`. Neutral hex
  fallbacks for engines without relative color; chroma tapers at the light/dark
  ends so the ramp stays perceptually even. Semantic roles compose onto steps
  via `var()` (docs/theming.md).
- **Studio** (`demo/studio.html`) is the editor: hue + chroma sliders regenerate
  the live ramp (12 swatches update in place), the color picker drives the same
  knobs, and a **resizable box** shows `table[data-table="adaptive"]` reflowing by
  *container* (not viewport). Export stays six lines.
- **ADR-0012 — typed `@property` rejected for v5.0** (revisits ADR-0005). The
  ramp needs no registration; theme transitions stay the `startViewTransition`
  crossfade. Revisit in 5.1 only if interpolation becomes a stated requirement.
- **Contrast gate tested, not asserted:** `css.spec.js` "generative theming"
  group asserts all 12 tones are distinct + monotonic and each clears a 3:1
  graphical-object floor (WCAG 1.4.11); the seed-dial + adaptive-reflow behavior
  is asserted too. Passes on chromium/firefox/webkit.

### Phase 5 — hardening & release

- **Docs:** new **`docs/adaptive.md`** (the "adaptive page" — contract,
  `.bf-contain` wrapper, the four components, cqi type, a11y, floor). New
  **`docs/migration-5.md`** — floor raise (Chrome 135 / FF 151 / Safari 26.2),
  **zero JS modules removed** (ADR-0011), base-select deferred to 5.1,
  command/commandfor + adaptive + generative theming as additive, no breaking
  markup. `docs/theming.md` + `docs/javascript.md` carry v5.0 callouts.
- **Conformance demo:** WCAG table gains AA rows for the v5.0 adaptive
  components + generative theme; the adaptive section carries an AA note. The
  conformance table is now a focusable `overflow-x:auto` region so it no longer
  overflows the 375px viewport (and stays axe-clean — scrollable-region-focusable).
- **Suite hardening:** full three-engine runs. `css.spec` 369 passed / 21
  engine-gated skips; `a11y.spec` 19/19; `js.spec` 104/105 (one WebKit-only
  popover Tab-close focus-return quirk, pre-existing, not v5-caused). Visual
  baselines regenerated deliberately. Hardening fixes: removed a stray
  `@property` substring from a `tokens.css` comment (ADR-0005 guard), typed
  `--bf-density` in the DTCG export, documented the v5.0 adaptive `data-*`
  attributes in `api.md`.

## [4.9.0] — 2026-08-30

The theme persistence release. The one script every demo page was
hand-rolling becomes first-party: buttons wire, the choice remembers,
and the OS stays in charge — all behind the framework's smallest opt-in
module.

### Added

- **Theme toggle + persistence** (`src/js/theme.js`, opt-in) — the
  first-party script every demo page was hand-rolling: buttons carrying
  `data-bf-theme-btn="<theme>"` set `data-bf-theme` on `<html>`, the
  choice persists under the `barefoot-theme` localStorage key and is
  re-applied at init, clicks crossfade through `startViewTransition`
  (skipped under `prefers-reduced-motion`), and `auto` hands control
  back to the OS — `light-dark()` follows system changes with zero JS,
  before and after an explicit choice. Names are validated like every
  variant value (lowercase kebab-case): invalid names warn and are
  ignored, corrupted stored values never reach the document. Exports
  `initTheme(root)` / `setTheme(theme)` for dynamic content; wired into
  `barefoot.js`, and the conformance demo now uses the module instead
  of its inline script. `data-bf-theme-btn` graduates from the API
  audit's demo-only allowlist to a real implementation (api.md row now
  stamped `4.9`).
- v4.9 scan note: the proposed layout primitives (`.bf-container`,
  `.bf-stack`, a responsive CSS Grid system) were checked against the
  codebase and found already shipped — `src/utilities.css`,
  `components/grid.css` (container-driven `[data-grid]`), and
  `components/layout.css` (app shell). No new surface needed.

## [4.8.0] — 2026-08-30

The zero-JS validation release. The last true zero-JS gap gets its
finish (state icons, not just borders), Windows High Contrast stops
being a blind spot, the gzip numbers become measured instead of
hand-copied, and the tokens learn to leave the browser.

### Added

- **Validation icons** (`src/components/forms.css`) — once a textual
  field (`text`/`email`/`tel`/`url`/`password`) is touched, it draws a
  shape cue at its inline end: a check under `:user-valid`, a cross
  under `:user-invalid`, with the inline-end padding reserved so text
  never slides under the glyph. The SVG strokes with `currentColor` —
  no palette baked into the data URI — so the state hue stays on the
  border and theming/forced-colors keep working. Fields whose inline
  end carries native chrome (select chevron, date/list/search pickers,
  number spinner) are excluded so the two never collide; textareas are
  excluded because their content scrolls under a fixed glyph.
- **Forced-colors hardening** (`forms.css`, `pagination.css`,
  `segmented.css`, `command.css`, `buttons.css`, `skeleton.css`) —
  under `@media (forced-colors: active)` (Windows High Contrast &
  friends) author colors map to the system palette and box-shadows are
  removed, so every affordance that was hue- or shadow-only gains a
  structural one: input focus regains a real outline (the halo is a
  shadow), invalid fields switch to a *dashed* border (shape instead of
  hue), the pagination current page, segmented selection, command
  palette selection and skeleton placeholders gain a ring, and ghost
  buttons state their boundary with `ButtonBorder`. Zero opt-ins — it
  ships with the components.
- **W3C DTCG design-token export** (`build/tokens-dtcg.mjs` →
  `dist/tokens.json`, `npm run build`) — every `--bf-*` token exported
  in the [W3C Design Tokens Format](https://tr.designtokens.org/) for
  Figma/iOS/Android sync. Top-level `light`/`dark` groups hold the
  color tokens resolved per scheme (light-dark pairs split, `var()`
  aliases resolved, `color-mix()` fallbacks mixed out to real hex via
  OKLab math — the same math the browser runs); `core` holds the
  scheme-independent tokens with proper `$type`s (`duration`,
  `fontWeight`, `shadow` objects, dimensions). Each token carries its
  source comment as `$description` and its custom-property name under
  `$extensions`. New export `"barefoot-css/tokens.json"`. Pinned by
  source-parse tests in `tests/css.spec.js` (every token must export;
  resolved values frozen as contracts).

### Fixed

- **gzip/brotli sizes are measured again** (`build/build.mjs`) —
  `sizes()` had been stubbed to `gzip: 0` after a zlib failure on
  Node 26/Windows, leaving the README table with `—` columns and
  `npm run check` enforcing only the raw fallback. Compression now
  runs in-process with a fresh-child-process fallback (same engine,
  clean zlib state), so the table shows real level-9 gzip/brotli and
  the 10KB gzip budget is enforced on gzip itself again. First
  measured numbers: `index.css` 2.54KB gzip (was "~2.3KB" hand-copied
  from an older toolchain — the numbers were honest, the method
  wasn't reproducible).
- **Token docs parse** (`build/token-docs.mjs`) — multi-line
  `/* ---- Title ----` section headers never matched the section
  regex, so the alpha-ramp, Chroma, font-weight, letter-spacing and
  type-scale tokens all folded into the previous section's table, and
  the `@supports` oklch re-declarations shipped as duplicate rows.
  Headers may now span lines and first declaration wins; `theming.md`
  regenerated (21 sections, 101 tokens, no duplicates). Shared fix in
  the DTCG generator.

### Docs

- `docs/theming.md` gains the DTCG export section; `docs/components.md`
  documents the validation icons + forced-colors behavior;
  `docs/accessibility.md` adds the forced-colors guarantee;
  `docs/api.md` adds the `tokens.json` export row and clarifies the
  bundle-freeze wording ("frozen since v4.6", not "frozen at 4.6KB" —
  the ambiguity this release's README table retires); `docs/index.html`
  stat cards now carry the measured gzip numbers; README feature list
  mentions validation icons and forced-colors.

## [4.7.1] — 2026-08-28

Patch — `4.7.0` was already published to npm, so the post-4.7.0 audit/visual fixes ship under `4.7.1` (npm 403 forbids republishing the same version). No new tokens or components.

### Fixed

- **API audit** (`docs/api.md` ↔ `src/`) — `data-command-hint` was implemented in `src/components/command.css:94` but missing from the `data-*` reference table, so `tests/css.spec.js:1860` (`everything implemented is documented`) failed. Added the `data-command-hint` row.
- **Chip demo strict-locator** (`demo/index.html:653`) — Chroma demo duplicated the `css` chip (`aria-label="Remove css"`) from `tests/helpers.js:DEMOS.demoChips`, so `tests/js.spec.js:236` (`locator('[data-chip-remove][aria-label="Remove css"]')`) resolved to 2 elements and threw a strict-mode violation. Renamed the Chroma chip to `chroma` / `Remove chroma` — the global locator now matches exactly one.
- **Visual baselines** (`tests/visual.spec.js-snapshots/*-win32.png`) — the v4.7 demo sections (Chroma/Icons/Command/Data-grid) grew the page, so the committed `light`/`dark` screenshots for `chromium`/`firefox`/`webkit` exceeded `maxDiffPixelRatio:0.02`. Regenerated all six win32 baselines deliberately via `npx playwright test --project=<browser> tests/visual.spec.js --update-snapshots`.

## [4.7.0] — 2026-08-28

Barefoot Chroma — One Color, Infinite Theme. The theming promise made
literal: set one variable and ship an entire accessible design system.
Plus the missing marketing demo (Studio) and three CSS-only primitives.
Frozen-bundle discipline from 4.6 holds — all additive, no breaking
changes, `full.css` stays frozen (ADR-0008).

### Added

- **Barefoot Chroma — Tokens 2.0 OKLCH Relative Color Engine**
  (`src/tokens.css`) — every brand-derived token now has an
  `oklch(from var(--bf-primary) …)` lineage behind a
  `@supports (color: oklch(from red l c h))` gate. Set
  `--bf-primary: #2563eb` (or any `oklch()` value) and
  `--bf-primary-hover` (`calc(l - 0.08)`), `--bf-primary-subtle`
  (`0.95 0.02 h`), `--bf-primary-contrast`
  (`calc((0.7 - l) * 100) 0 0`), `--bf-primary-border`,
  `--bf-primary-muted`, `--bf-surface-2/3` and friends auto-generate.
  Engines without relative-color keep the `color-mix()` hex fallbacks —
  degrade by omission, no JS, no `@property` (ADR-0005 stays). New
  fallback tokens `--bf-primary-hover`, `--bf-primary-contrast`,
  `--bf-primary-border`, `--bf-icon-size`, `--bf-icon-stroke` are now
  part of the documented token set.
- **Contrast guard** (`build/contrast.mjs` + `build/size.mjs` +
  `build/token-docs.mjs`) — on every `npm run check` the AA pairs
  (`--bf-primary-fg`/`--bf-primary`, `--bf-text`/`--bf-surface`,
  `--bf-muted`/`--bf-surface`, status pairs, etc.) are measured in
  both light and dark schemes via relative luminance. `size.mjs` hard
  fails (<4.5:1 → exit 1) with a suggested `l` fix
  (`oklch(from var(--bf-primary) calc((0.7 - l) * 100) 0 0)`); the
  token-docs path warns with the same suggestion. This is the headline
  guarantee: one variable, infinite theme, AA pinned.
- **Barefoot Studio** (`demo/studio.html`) — the missing marketing demo:
  a single HTML file (no React, no build step) with range/colour/font
  controls for `--bf-primary`, `--bf-radius`, `--bf-font`, density, and
  a live `<iframe>` preview of `demo/index.html`. Every control calls
  `iframe.contentDocument.documentElement.style.setProperty()` for
  instant feedback; the export panel copies six lines
  (`:root { --bf-primary: … }`) via `navigator.clipboard`. This is the
  demo the README and gallery link to — Pico's playground gets 60% of
  its stars from this.
- **CSS-only icons** (`src/components/icons.css`) — `[data-icon]`
  via `mask: var(--bf-icon-url) + currentColor`, sized by
  `--bf-icon-size` (1.25rem; `data-size="sm|lg"`). 0KB JS, twelve
  glyphs (`search`, `close`/`x`, `menu`, `check`, `chevron-down/right`,
  `plus`, `trash`, `star`, `heart`, `settings`/`gear`, `user`), each a
  `data:image/svg+xml` mask that inherits `color` — theme and hover
  just work. No font, no sprite.
- **Command palette** (`src/components/command.css`) — `<dialog
  data-command>` + `<input type="search" list>` + `[popover]` fallback,
  zero JS. `command`/`commandfor` opens declaratively; `list`/`datalist`
  suggests; `[data-command-item][data-selected]` paints
  `--bf-primary-subtle`. Modal focus trap and `Esc` come from
  `<dialog>`; the `[popover][data-command]` twin is also styled for
  light-dismiss use.
- **Data grid** (`src/components/data-grid.css`) — extends
  `src/components/table.css` sticky-header contract: `table[data-grid]`
  gives each `<th>` `resize: horizontal` (drag the inline-end edge) +
  a container-query stack at `≤40rem`. Composes with
  `data-table="sticky-head"` — header stays pinned while columns resize.
  Pure CSS, container queries, no wrapper div.

### Changed

- `docs/api.md` — v4.7 header, new `data-icon`, `data-command`,
  `data-command-list`, `data-command-item`, `data-selected` rows, and
  the table `data-grid` variant; `data-size` now lists `[data-icon]`.
- `docs/components.md` — new Icons, Command palette, Data grid sections;
  header notes the opt-in nature (frozen `full.css` still holds).
- `docs/theming.md` — Chroma section: one variable, infinite theme;
  token tables will regenerate with the five new tokens.
- `src/tokens.css` — Chroma engine block plus fallback tokens.

### Build

- `npm run check` now runs the contrast guard before signing off.
  Existing palettes (default, editorial, dashboard, etc.) all clear
  AA in both schemes — gallery's axe sweep still green.

## [4.6.0] — 2026-08-25

The Navigation Release — cross-document view transitions as a first-
class, zero-JS MPA capability, plus the structural decision the size
budget forced: `full.css` freezes and per-component becomes the
headline (ADR-0008). All additive, no breaking changes.

### Added

- **Cross-document navigation transitions**
  (`components/view-transition.css`) — importing the file now opts
  every same-origin MPA navigation into a root crossfade
  (`@view-transition { navigation: auto }`): SPA-feel page transitions
  with two lines of HTML and zero JS. Both pages must import the file;
  engines without support ignore the unknown at-rule entirely —
  degrade by omission, no polyfill.
- **Shared-element morphs** — give an element the same author-authored
  `view-transition-name` on both pages and it flies between layouts
  while everything else crossfades. Naming stays in consumers' hands
  (CSS cannot mint unique names); every named group's geometry is
  timed by the new motion tokens.
- **Motion tokens** (`tokens.css`, `--bf-vt-*` family):
  - `--bf-vt-duration: 250ms` (named-group morph length)
  - `--bf-vt-easing: ease` (named-group timing)
  The root snapshot keeps its existing pace (`--bf-transition-slow`
  fade).
- **Reduced-motion guard for both tiers** — same-document snapshots
  render statically (existing behavior), and cross-document
  navigations opt back out entirely (`@view-transition { navigation:
  none }`). The guards live in view-transition.css because top-layer
  pseudos are out of reach of base.css's duration clamp; the kill
  switch covers `::view-transition-group(*)` morphs too.
- **Demo pair page** (`demo/vt.html`) — the second document of the
  transition pair: the conformance demo's named card flies to its twin,
  everything else crossfades. Demo gains a "Navigation transitions"
  section and conformance-matrix row linking to it.

### Changed

- **`full.css` frozen (ADR-0008)** — the bundle stops gaining imports;
  its `@import` list is pinned verbatim by a source-parse test. Existing
  component files keep evolving under the same budget check (this
  release itself nudges it +0.06KB gzip via view-transition.css).
  Headline numbers pivot to `index.css` + per-component imports across
  README, docs/performance.md, docs/api.md, and the docs site stat
  cards.
- **`docs/components.md`** — View transitions section rewritten around
  the two tiers (same-document hooks, cross-document navigation),
  morph convention, token timing, and the load-bearing reduced-motion
  guards.
- **`docs/api.md`** — version header v4.6; export-map table marks
  `full.css` as frozen with a pointer to ADR-0008.
- **`.stylelintrc.json`** — `view-transition` at-rule and its
  `navigation` descriptor whitelisted.

### Tests

- New "v4.6 navigation transitions" describe (8 specs): source-parse
  pins for the opt-in rule, the nested reduced-motion opt-out (and that
  it covers group morphs), `--bf-vt-*` token definition/consumption
  parity, the verbatim full.css import freeze (ADR-0008), and index.css
  staying core-clean; a live pair-page smoke asserting both sides carry
  `view-transition-name: bf-demo-hero`; and live wiring through
  `pagereveal` — navigating demo → pair page creates a real transition
  (`event.viewTransition` non-null) across up to three observed
  navigations, while emulated reduced motion navigates plainly. The
  live pair skips cleanly in three cases: no `pageswap`/`pagereveal`,
  or events present without transition activation (Firefox ships the
  events but navigates plainly — degrade by omission holds, so that
  outcome is a named skip, not a failure); a lost `pagereveal` event
  still fails loudly.
- Visual baselines regenerated deliberately for all three engines (the
  demo gained a section).
- Chromium: 19 a11y / 29 JS / 109 CSS (2 engine-gated skips) / 3
  visual — green. Firefox 132 passed, 7 skipped · WebKit 137 passed,
  4 skipped (cross-doc VT lives gated on `pageswap`/`pagereveal`
  presence *and* actual activation).
- Sizes (gzip level 9, hand-measured): `index.css` 2.31 → 2.32KB ·
  `full.css` 9.55 → 9.61KB, frozen.

## [4.5.0] — 2026-08-25

Customizable select and sticky table variants. All `@supports`-gated
or attribute opt-in; degrade by omission. All additive, no breaking
changes.

### Added

- **Customizable select skin** (`components/forms.css`) — inside
  `@supports (appearance: base-select)` (Chromium 135+, WebKit):
  single selects upgrade from the chevron skin to a fully themed
  control. The open picker becomes a stylable panel
  (`::picker(select)`: surface, hairline, radius, lifted shadow),
  options get token hover/`:checked` states with a primary
  `option::checkmark`, `optgroup` labels read muted, the closed field
  swaps the SVG chevron for the themed `::picker-icon`, and picker
  entry animates via `@starting-style` + `allow-discrete` (with its
  own reduced-motion guard — the top-layer pseudo is unreachable by
  base.css's kill switch). Engines without support keep exactly the
  chevron skin: degrade by omission, no polyfill.
- **Sticky table variants** (`components/table.css`) —
  `data-table="sticky-head"` pins the header row,
  `data-table="sticky-col"` pins the leading column (logical
  inline-start; RTL mirrors). Values compose
  (`"sticky-head sticky-col"`). Sticky cells carry an opaque
  `--bf-surface` background and `z-index: var(--bf-z-sticky)`. Wrap
  in a scroll container and give it `tabindex="0"` + a name — tables
  hold no focusable content, and keyboard users must be able to
  scroll it (WCAG 2.1.1).

### Changed

- **`docs/components.md`** — Select section documents the
  base-select upgrade and fallback; Table section documents the
  sticky variants and wrapper requirements.
- **`docs/api.md`** — `data-table` values gain `sticky-head`,
  `sticky-col`; note that picker styles apply only under `@supports`.
- **`demo/index.html`** — select demo gains optgroups + checkmarks;
  table demo gains a composed sticky-head/sticky-col example over a
  focusable scroll wrapper.

## [4.4.0] — 2026-08-25

Scroll-driven motion system — directional reveal variants, staggered
reveal groups, generic scroll-progress bar, parallax, and motion tokens.
All `@supports`-gated, falls back to static. All additive, no breaking
changes.

### Added

- **Direction variants** (`components/reveal.css`) — extend
  `[data-reveal]` with five entry motions: `[data-reveal="left"]`,
  `[data-reveal="right"]`, `[data-reveal="up"]` (default),
  `[data-reveal="down"]`, `[data-reveal="fade"]`. Each maps to a
  distinct `@keyframes` using `translate` on one axis or `opacity`
  only. All gated behind `@supports (animation-timeline: view())` +
  `@media (prefers-reduced-motion: no-preference)`.
- **Staggered reveals** — `[data-reveal-group]` on a container. Each
  child with `[data-reveal]` receives a sequential `animation-delay`
  via the CSS custom property `--bf-reveal-index`. A self-invoking
  `js/reveal.js` sets this property on each child at load
  (`--bf-reveal-index: 0, 1, 2, ...`). Without JS, all children
  animate simultaneously — the stagger degrades gracefully.
- **Generic scroll-progress bar** — `[data-progress]` on any scroll
  container. Draws a `::after` pseudo-element as a thin bar pinned to
  the top or bottom (`data-progress="top|bottom"`, default `bottom`).
  Uses the ANONYMOUS scroll timeline pattern from the carousel:
  `animation-timeline: scroll(nearest block)` on the container's own
  `::after`. `@supports (animation-timeline: scroll())` gated.
- **Parallax** — `[data-parallax]` on an image or decorative element.
  Uses `animation-timeline: scroll()` with `animation-range` tuned for
  a subtle 20–30% offset (element scrolls at ~70–80% of the surrounding
  content speed). The `translate` is applied via `@keyframes` — no JS,
  no IntersectionObserver. `@supports` gated; falls back to static
  position.
- **Motion tokens** (`tokens.css`):
  - `--bf-reveal-distance: var(--bf-space-4)` (translate offset)
  - `--bf-reveal-duration: 600ms` (animation length)
  - `--bf-reveal-stagger: 100ms` (inter-child delay)
  - `--bf-progress-height: 3px` (scroll-progress bar thickness)
  - `--bf-progress-color: var(--bf-primary)` (progress bar color)
- **`js/reveal.js`** — stagger module that sets `--bf-reveal-index` on
  each `[data-reveal]` child in a `[data-reveal-group]`. Zero deps,
  self-invokes at load.

### Changed

- **`docs/components.md`** — "Reveal" section expanded: direction
  variants, stagger group, generic progress bar, parallax.
- **`demo/index.html`** — reveal demos (all five directions), stagger
  group demo (cards in a grid), scroll-progress demo, parallax demo.
- **`js/barefoot.js`** — new import for `reveal.js`.

### Tests

- All existing suites green; no visual baselines changed.
- `index.css` and `full.css` size budget unchanged.

## [4.3.0] — 2026-08-25

Layout primitives — CSS Grid app shell, sidebar collapse, nested scroll
regions, and layout tokens. All additive, no breaking changes.

### Added

- **App shell layout** (`components/layout.css`) — CSS Grid-based
  layout primitive. Ships as `[data-layout="sidebar"]` on a wrapper
  element with named grid areas (`"header header" / "nav main" /
  "footer footer"`). Direct-child semantic elements (`<header>`,
  `<nav>`, `<main>`, `<aside>`, `<footer>`) auto-map to their
  corresponding areas without `[data-area]` attributes. Explicit
  `[data-area="header|nav|main|aside|footer"]` overrides the
  auto-mapping for non-semantic markup.
- **Sidebar collapse** — `[data-layout="sidebar"][data-collapse]`
  enables a wide↔narrow toggle. The sidebar defaults to
  `--bf-layout-sidebar-width` (16rem); when `[data-collapsed]` is
  present on the wrapper, it shrinks to
  `--bf-layout-sidebar-collapsed` (4rem) and child labels hide via
  `:has([data-collapsed]) nav > * > span`. Collapse is triggered by
  `js/nav.js` (hamburger toggle) or a CSS-only checkbox hack. A
  `@container` query on the layout wrapper auto-collapses at narrow
  container widths (independent of viewport).
- **Nested scroll regions** — sidebar gets `overflow-y: auto` +
  `position: sticky; top: 0` by default; main content scrolls
  independently via `overflow-y: auto` on the `<main>` area. This
  isolates scroll positions: scrolling the sidebar does not move the
  header or main content. Override with
  `--bf-layout-sidebar-scroll: visible` to disable independent
  scrolling.
- **Layout tokens** (`tokens.css`):
  - `--bf-layout-sidebar-width: 16rem` (wide sidebar)
  - `--bf-layout-sidebar-collapsed: 4rem` (narrow sidebar)
  - `--bf-layout-header-height: 3.5rem` (header bar)
  - `--bf-layout-gap: var(--bf-space-4)` (gap between grid areas)

### Changed

- **`docs/components.md`** — new "Layout" section: app shell anatomy,
  sidebar collapse, named grid areas, nav integration.
- **`docs/api.md`** — `data-layout` row (`sidebar` value), `data-area`
  row, `data-collapsed` row, layout token table.
- **`demo/index.html`** — dashboard demo: sidebar with nav items,
  header with search, main with card grid, footer.
- **`full.css`** — `@import "./components/layout.css"` added.
- **`index.css`** — unchanged (layout is opt-in).

### Tests

- All existing suites green; no visual baselines changed.
- New CSS test: `grid-template-areas` computed on
  `[data-layout="sidebar"]`.
- New CSS test: sidebar width toggles between `--bf-layout-sidebar-width`
  and `--bf-layout-sidebar-collapsed` when `data-collapsed` is present.
- New JS test: scrolling `<main>` does not change sidebar `scrollTop`.
- New CSS test: `@container` query triggers collapse at narrow widths.
- New a11y test: axe finds `nav`, `main`, `banner`, `contentinfo`
  landmarks in the layout.

## [4.2.0] — 2026-08-24

JS gaps, docs rot, token fixes — toast auto-dismiss, hover tooltip
fallback, skeleton shape variants, and contrast-mode token corrections.
All additive, no breaking changes.

### Added

- **Toast auto-dismiss** (`js/toast.js`) — timed auto-dismiss with
  configurable duration (`data-duration="ms"`, default 3000ms),
  pause-on-hover, and visible progress indicator. Respects
  `prefers-reduced-motion` — under reduced motion the toast stays open
  until manually closed. Follows the existing pattern: one `data-*`
  attribute, zero dependencies, self-invokes at load. Adds `toast`
  row to `docs/javascript.md` table.
- **Hover tooltip fallback** (`js/tooltip.js`) — `pointerenter` /
  `pointerleave` hover-to-show for `popover="hint"` in engines without
  interest invokers (Firefox, Safari). Chromium 139+ uses native
  `interestinvoker` and skips the JS path. Same pattern: `data-tooltip`
  already in use, the module adds the missing hover gesture. Adds
  `tooltip` row to `docs/javascript.md` table.
- **Skeleton shape variants** — `[data-shape="circle|text|card"]` on
  `.skeleton` in `components/skeleton.css`. Circle for avatars, text for
  multi-line placeholders (varied widths), card for composite loading
  states. All pure CSS, no new JS.

### Changed

- **`docs/javascript.md`** — removed dead entries for deleted modules
  (details-close, details-tabindex, popover-anchor); fixed module count
  (ten → nine); added `toast.js` and `tooltip.js` rows.
- **`docs/components.md`** — collapsed "Dropdown (details/summary)"
  section (removed in 4.0); documented skeleton shape variants; updated
  toast section with auto-dismiss docs.
- **`docs/accessibility.md`** — removed references to deleted shims in
  "Honest exceptions" section; removed Dropdown row from conformance
  table.
- **`demo/index.html`** — toast auto-dismiss demo added to conformance
  page; Dropdown row removed from conformance table.
- **`barefoot.js`** — new imports for `toast.js` and `tooltip.js`.

### Fixed

- **Contrast mode `--bf-muted` collapse** — in `tokens.css`, the
  `prefers-contrast: more` block and `[data-bf-theme="contrast"]` now
  give `--bf-muted` a distinct value (`#404040` / `#c0c0c0`) instead of
  forcing it to the same B/W as `--bf-primary`, preserving the visual
  hierarchy in high-contrast mode.
- **Missing status tokens** — added `--bf-success-darken`,
  `--bf-info-darken`, `--bf-warning-darken` and `--bf-success-subtle`,
  `--bf-info-subtle`, `--bf-warning-subtle` to `tokens.css` for hover
  states and tinted backgrounds on status elements.

### Docs

- Dead docs cleanup across `javascript.md`, `components.md`,
  `accessibility.md` (see Changed section above).

### Tests

- All existing suites green; no visual baselines changed.
- `index.css` and `full.css` size budget unchanged.

## [4.1.0] — 2026-08-24

Post-major growth — new `@supports`-gated primitives, a seventh starter
theme, and grid-lanes masonry where engines ship it. All additive, no
renames or removals.

### Added

- **Masonry grid** (`components/grid.css`) — `[data-grid="masonry"]`
  uses `display: grid-lanes` where supported (`@supports (display:
  grid-lanes)`) so items of unequal height pack tightly into rows
  (waterfall / Pinterest layout). Falls back to a standard `auto-fill`
  grid in engines without Grid Lanes. Same `data-gap` and `--bf-grid-min`
  controls apply. Not Baseline yet — Firefox 155+ (flag → default),
  Safari TP 163+, Chrome 140+ (flag → default).
- **Coastal starter theme** (`themes/coastal.css`) — ocean blues, sandy
  warmth, relaxed rhythm. Seventh starter; gallery card + axe sweep
  included.

### Changed

- **`api.md`** — v4.1 header; `data-grid` row gains `masonry`;
  `data-bf-theme` row gains `coastal`.
- **`components.md`** — Grid section documents the masonry variant.
- **`theming.md`** — starter-theme list grows to seven (Coastal added).

### Docs

- `migration-4.md` unchanged — no breaking changes in 4.1.
- Demo conformance page and theme gallery wired for coastal theme.

### Tests

- All existing suites green; no visual baselines changed (the demo did
  not change visually — coastal is additive, masonry is @supports-gated
  and absent in Chromium's default build).
- `index.css` and `full.css` size budget unchanged.

## [4.0.0] — 2026-08-24

The platform catch-up — the first Barefoot major that actually deletes.
Raises the browser baseline to 2026 evergreen, removes the three
3.2-deprecated surfaces, adopts `@scope` for prose scoping, and
tightens the size budget.

### Removed

- **`<details data-menu>` pattern** — the entire details-menu dropdown
  is removed: `dropdown.css`, the `data-menu` attribute selectors in
  `menu-items.css`, and all related CSS hooks. Use Popover-API menus
  instead: `<button popovertarget="id">` +
  `<div popover data-kind="menu" id="id">`. See `docs/migration-4.md`.
- **`js/details-close.js`** — existed only to make Esc close
  `details[data-menu]` reliably. With the details-menu pattern gone,
  the module has no purpose. Popover menus close natively.
- **`js/details-tabindex.js`** — WebKit's `<details>` tab-order quirk
  was fixed in Safari 17.4. The shim is dead code on all 2026 evergreen
  browsers.
- **`js/popover-anchor.js`** — `position-visibility: anchors-visible`
  is now Baseline 2026 (Chrome 125+, Firefox 147+, Safari 26.2+).
  The off-screen anchor guard is dead code on modern browsers.
- **`dropdown.css`** — the details-based menu component file is removed
  entirely. `full.css` no longer imports it.

### Changed

- **Browser baseline raised** — v4.0 requires 2026 evergreen:
  Chrome 125+, Firefox 128+, Safari 26.2+. See `docs/migration-4.md`.
- **`menu-items.css`** — removed `details[data-menu]` selectors; now
  only styles popover-API menu items (`[popover][data-kind="menu"]`).
- **`barefoot.js`** — removed imports of deleted modules
  (`details-close.js`, `details-tabindex.js`, `popover-anchor.js`).
- **`full.css`** — removed `dropdown.css` import.
- **`api.md`** — deprecation table updated: all four surfaces marked
  as removed; `data-menu` removed from the attribute reference.

### Docs

- `migration-4.md` finalized as the current migration guide.
- `api.md` updated to v4.0 (stability tiers, deprecation table,
  attribute reference).

## [3.5.0] — 2026-08-24

v4 rehearsal — freeze the browser-baseline contract, gate-check the
shims, finish the codemod, and draft the migration guide. All additive
in src/; no runtime changes.

### Added

- **Browser-baseline contract** — v4.0 requires 2026 evergreen:
  Chrome 125+, Firefox 128+, Safari 26.2+. Documented in
  `docs/migration-4.md`.
- **`docs/migration-4.md`** — full v3.x → v4.0 migration guide:
  what's removed (details-menu pattern, three JS shims), what changes
  (`@scope` for prose/code, tighter size budget), codemod usage, and
  a manual checklist.
- **`codemod-4.mjs --write` mode** — the `--write` flag now removes
  deprecated import lines automatically (`js/details-close.js`,
  `js/details-tabindex.js`, `js/popover-anchor.js`). HTML/CSS patterns
  (`<details data-menu>`, `details[data-menu]`) are flagged for manual
  migration with guidance.

### Changed

- **`api.md` deprecation table** — gate-check verdicts added:
  `js/details-tabindex.js` (WebKit tab-order fixed in Safari 17.4+)
  and `js/popover-anchor.js` (`position-visibility: anchors-visible`
  is Baseline 2026) are both confirmed for removal in 4.0.

### Docs

- `migration-4.md` created with the full v3→v4 migration guide.
- `api.md` deprecation table updated with gate-check results.

## [3.4.0] — 2026-08-23

Theming depth & global correctness — density tokens for a second
theming axis, a logical-property audit so RTL mirrors correctly, and
an i18n test page. All additive, no renames.

### Added

- **Density tokens** (`tokens.css`) — `data-density="compact"` on
  `<html>` (or any subtree) remaps the spacing scale
  (`--bf-space-1…8`), radii (`--bf-radius`, `-sm`, `-lg`), and
  `--bf-control-height` to tighter values. Themes gain a second axis
  (compact vs. normal) without new palettes; the attribute is
  documented in `api.md`.
- **i18n / RTL test page** (`demo/i18n.html`) — a full conformance
  page rendered under `dir="rtl"` with Arabic placeholder text:
  blockquotes, lists, breadcrumbs, pagination, stepper (horizontal +
  vertical), forms, input groups, accordion, navigation, buttons,
  cards, alerts. Validates that every logical property flips correctly.

### Changed

- **Logical-property audit** — the following physical properties are
  converted to logical equivalents so RTL mirrors correctly without
  `[dir]` overrides:
  - `src/components/stepper.css`: `left` → `inset-inline-start` on
    horizontal and vertical connector pseudo-elements;
    `text-align: left` → `text-align: start` on vertical step content.
  - `src/components/forms.css`: select chevron `background-position:
    right` → `inline-end`; switch thumb positions (`0.3em` /
    `calc(100% - 0.3em)`) → `inline-end` / `inline-start`;
    `[data-input-group]` border-radius shorthand → logical
    (`border-start-start-radius`, etc.) so affix/input corners flip.
  - `src/components/accordion.css`: panel `padding` shorthand →
    logical (`padding-block-start`, `padding-inline`,
    `padding-block-end`).
  - `src/components/divider.css`: hairline `border-top` →
    `border-block-start`.
  - `src/base.css`: `<hr>` `border-top` → `border-block-start`.
  - `src/components/carousel.css`: progress bar `background-position:
    left` → `inline-start`; removed the `[dir="rtl"]` override
    (redundant with the logical property).

### Docs

- api.md: `data-density` row added to the attribute table.
- theming.md: density section added explaining the compact axis.
- components.md: note that all components use logical properties and
  mirror correctly in RTL.

### Tests

- i18n test page (`demo/i18n.html`) validates RTL rendering of all
  affected components. No visual baselines changed (the default demo
  stays LTR). All existing suites green; the logical-property
  conversions are source-parse pinned.
- No new tokens beyond density (tokens 113 → 113 + density preset).
  `index.css` and `full.css` size budget unchanged.

## [3.3.0] — 2026-08-23

The growth batch — proof the thesis still scales. Six new surfaces,
one new opt-in module, one new theme, and the demo dialog goes fully
declarative. Nothing deprecated changes.

### Added

- **Segmented control** (`components/segmented.css`) — `data-segmented`
  on a `<fieldset>` of radio buttons renders a button group. Radios
  become invisible overlays filling their labels (semantics, focus
  ring, arrow-key roving stay native); `label:has(input:checked)`
  paints the raised segment; the legend names the group for screen
  readers and is clipped from sight automatically.
- **`<datalist>` affordance** (forms.css) — `input[list]` reserves
  inline-end space for the engine's picker arrow, themed like the
  select chevron. The popup itself stays engine-drawn everywhere;
  documented honestly.
- **`<kbd>` keycaps ship with the core** — promoted from code.css to
  the base layer, so `index.css` importers get keycap styling too.
  `code.css` now owns only `code`, `samp`, `pre`.
- **Timeline** (`components/timeline.css`) — `ol[data-timeline]`
  draws entries on a spine: a dot per entry, connecting line on all
  but the last; native list semantics untouched.
- **Empty state** (`components/empty-state.css`) — `.empty-state`, a
  centered dashed panel for "nothing here yet" with a decorative
  first-child glyph slot.
- **Toast stacking** (popover.css) — open toasts that share a parent
  stack upward via enumerated `:has(~ …)` chains (five deep): each
  lifts above open siblings after it in DOM order, animating on the
  `translate` property so it composes with the shared entrance.
  Non-siblings degrade to today's overlap behavior.
- **Sortable tables** (`js/table-sort.js`) — `data-bf-sort` +
  real `<button>` triggers in header cells; click for ascending,
  again for descending. Numeric-aware compare (whole column must
  parse; whitespace/thousands commas tolerated), case-insensitive
  `localeCompare` otherwise. Maintains `aria-sort`; moves rows by
  re-appending nodes. No-JS first: without it nothing sorts. Tenth
  module in the barrel.
- **Sunset starter theme** (`themes/sunset.css`) — warm coral daylight,
  amber dusk, rounder corners. Sixth starter; gallery card + axe sweep
  included.
- **Demo dialog is declarative** — buttons carry `command` /
  `commandfor` (Invoker Commands API); the demo script binds its
  `showModal()` fallback only where that's unsupported.

### Docs

- components.md: Forms gains segmented control + datalist bullets,
  Dialog documents the invoker-commands path, Toast documents manual
  lifetime + stacking, Table documents sortable headers, Code notes
  kbd's base-layer home; new Timeline and Empty state sections.
- javascript.md: table-sort section (#9), module count ten.
- api.md: `data-segmented`, `data-timeline`, `data-bf-sort` rows;
  `sunset` joins the theme attribute values.
- theming.md: Sunset joins the starter-theme list (six).

## [3.2.0] — 2026-08-23

The first real run of the deprecation policy. Three surfaces are
announced for removal at 4.0 — the `<details data-menu>` pattern
(replaced by Popover-API menus) and both engine-gap shims
(`js/details-tabindex.js`, `js/popover-anchor.js`), which are deleted
only if upstream fixed their gaps. Nothing breaks or changes behavior
in 3.x: every announced surface works exactly as before and emits a
once-per-page console notice where its markup is present.

### Deprecated

- **`<details data-menu>` dropdowns** → replaced by **Popover-API
  menus** (`<button popovertarget>` + `<div popover data-kind="menu">`):
  same look (the item recipe is shared verbatim), but Esc-close,
  light-dismiss, and focus return come from the platform instead of
  engine-dependent `<details>` behavior. Removed in 4.0 together with
  `js/details-close.js`, which exists solely for this pattern.
- **`js/details-tabindex.js`** — baseline-gated removal candidate:
  ships only while engines skip open `<details>` panels in the tab
  order (WebKit today); deleted in 4.0 if the gap closed upstream
  (gate-checked at 3.5), otherwise returns to the watch-list.
- **`js/popover-anchor.js`** — same tier, gated on engines implementing
  `position-visibility: anchors-visible`.

### Added

- **Once-per-page deprecation notices.** `warnOnce` joins
  `js/lifecycle.js`; the three affected modules emit one
  `[barefoot-css]`-prefixed `console.warn` when they arm against
  matching markup — pages that never use a deprecated pattern stay
  completely silent, and double-inits never repeat a notice.
- **Detection codemod** — `build/codemod-4.mjs` (`npm run migrate:v4`)
  scans consumer code for all announced surfaces (markup, CSS
  selectors, imports), reporting file and line with replacement
  guidance. Detection-only: exit code 1 while findings remain (CI can
  gate on it); `--write` lands at 3.5 alongside docs/migration-4.md.

### Docs

- **api.md gains the Deprecations table** — surface, announced-in,
  removal version, concrete replacement — plus the baseline-gated
  semantics (a shim whose gap persists is load-bearing, not broken) and
  a pointer from the `data-menu` row in the frozen attribute table.
- components.md's dropdown section carries the deprecation banner and
  the popover section flags the anchor shim; javascript.md marks the
  three modules and documents the notice contract; accessibility.md
  steers menu Esc needs to the platform path.

### Tests

- New "deprecation notices (3.2 wave)" describe: exactly one warning
  per module against matching markup, zero without it, once-per-page
  holds across cache-busted re-imports (relative `./lifecycle.js`
  resolves query-free, so the Set is shared), messages name the removal
  version and the replacement, and `warnOnce` usage stays scoped to the
  three announced modules. The lifecycle re-init spec now treats the
  three notices as the only allowed warnings — anything else means
  double-binding noise.
- No visual change: baselines untouched. Suites green on Chromium
  (146 tests: 20 a11y / 37 JS / 86 CSS / 3 visual), Firefox (122 run,
  4 engine-gated skips), WebKit (123 run, 3 skips).

## [3.1.0] — 2026-08-23

The first "platform catch-up" release: new primitives land behind
`@supports` gates, opt-in, and degrading to nothing where engines lack
them (the accordion's `interpolate-size` path is the precedent). No
public surface renamed or removed; `js/carousel.js` is byte-identical
to 3.0.0. The one behavioral change to existing markup is an upgrade:
anchored popovers no longer need inline anchoring styles.

### Added

- **Carousel scroll-progress bar** — add `data-progress` to a
  `[data-carousel]` and a hairline bar along its bottom edge fills as
  the carousel scrolls: pure CSS via an anonymous `animation-timeline:
  scroll(nearest inline)`, zero JS, no wrapper element, still live
  under reduced motion (position feedback, not animation). Engines
  without scroll-driven animations render nothing — every rule is
  gated behind `@supports (animation-timeline: scroll())`.
- **Scroll-entry reveal** — `components/reveal.css` (new opt-in file):
  `[data-reveal]` fades and rises into place as it enters the viewport,
  driven by `animation-timeline: view()` with no IntersectionObserver
  anywhere. Gated twice on purpose: `@supports` keeps unsupported
  engines static-visible, and `prefers-reduced-motion:
  no-preference` does what base.css's duration clamp cannot — a scroll
  timeline ignores durations, so the media query is the real guard.
- **Hover/focus tooltips** — `popover="hint"` + interest invokers on
  top of the existing click invoker: one markup, three tiers of
  platform support (interest invokers show on hover/focus; every
  Popover-API engine keeps click-to-show; hintless engines treat it as
  auto), zero JS. The click-popover fallback is byte-for-byte 3.0's.

### Changed

- **Anchored popovers need no anchoring markup anymore.** The invoker
  is the platform's implicit anchor, so the stylesheet's
  `position-area` rules pin menus below and tooltips above their own
  triggers with no inline styles; the demo dropped its
  `anchor-name`/`position-anchor` attributes accordingly. Explicit
  named anchors remain documented for non-invoker targets, and the
  position rules now sit inside `@supports (anchor-name: …)` so the
  intent is greppable. `position-area` behavior is unchanged wherever
  anchor positioning ships.

### Fixed

- **`js/popover-anchor.js` now guards implicit-anchor popovers.** The
  off-screen guard resolved its anchor only from `position-anchor`
  names, so after the demo dropped inline anchoring styles a
  script-opened popover with an off-screen trigger stayed open (pinned
  to the viewport edge). Resolution now follows platform precedence: an
  explicit name first, otherwise the invoker (`popovertarget` /
  `interestfor`).

### Tests

- New engine-gated describe ("platform primitives"): progress-bar
  wiring plus live scrubbing 0%→100% (and an assertion that the bar's
  pseudo-element slot adds no scrollable length), reveal wiring plus
  the required reduced-motion removal test, hint tooltip click/Esc and
  hover/focus tiers, and the zero-markup implicit-anchor pin. Every
  gate is a live capability probe (parse *and* runtime timeline
  resolution) so each engine runs what it ships and skips the rest.
- Two hardening lessons are encoded in specs and comments: minifiers
  fold `animation-timeline` into the `animation` shorthand, which
  Chromium drops whole (the timeline lives in a deliberately separate
  rule); and Playwright's auto-scrolling clicks race smooth-scroll
  pages (open-and-measure tests scroll instantly first, then click).
- Visual baselines regenerated for all three engines — the demo gained
  a Reveal section and the carousel grew its progress bar.

### Docs

- components.md: popover section rewritten around implicit anchors +
  the hint-tooltip tier model; carousel section gained the progress
  bar; new Reveal section. performance.md gained "Platform primitives
  are @supports-gated" (the bytes-vs-runtime cost model). api.md table
  grew `data-progress` and `data-reveal`.
- No new tokens (113 unchanged). `index.css` 2.08KB gzip (unchanged) ·
  `full.css` 7.79 → 8.04KB gzip (10KB budget → PASS).

## [3.0.0] - 2026-08-22

The namespace cleanup — one prefix, `bf`, across every public surface.
This is a **breaking release** for anyone upgrading from 2.x: token
names, the theme attribute, and the utility-class prefix all change.
`npm run migrate:v3` rewrites consumer markup/CSS/JS for you;
[docs/migration-3.md](docs/migration-3.md) has the manual map. No
other behavior, palette, or layout value changed.

### Breaking

- **Tokens renamed** `--fz-*` → `--bf-*` (~130 custom properties,
  names otherwise identical). Every `var(--fz-…)` override in
  consumer CSS must become `var(--bf-…)`.
- **Theme attribute renamed** `data-theme` → `data-bf-theme`
  (`auto` / `light` / `dark` / `contrast` values unchanged). The
  demo's switcher-button pattern follows: `data-theme-btn` →
  `data-bf-theme-btn`.
- **Utility classes renamed** `.fz-*` → `.bf-*` — the `utilities.css`
  set (`.bf-row`, `.bf-stack`, `.bf-visually-hidden`, …) plus the
  component helpers (`.bf-brand`, `.bf-nav-toggle`, `.bf-avatar`,
  `.bf-prose`, …). Class names otherwise identical.
- **Internal marker renamed** `data-fz-tabs-js` → `data-bf-tabs-js`
  (set by `js/tabs.js`; module-set, never hand-authored).
- **Internal keyframes renamed** `fz-dialog-in`, `fz-skeleton-shimmer`,
  `fz-spin` → `bf-dialog-in`, `bf-skeleton-shimmer`, `bf-spin`
  (invisible unless you reference them by name).
- **Nothing dropped.** Audited for deprecated-in-2.x items per the
  plan; v2 shipped zero deprecations, so nothing was removed beyond
  the renames above.

### Added

- **Migration guide** — [docs/migration-3.md](docs/migration-3.md):
  old → new mapping tables, a manual checklist, and the edge cases
  (OS dark-mode hooks untouched, starter/custom theme overrides,
  `@property` copies of animated tokens).
- **Codemod script** — `build/codemod-3.mjs` via `npm run migrate:v3`:
  walks your files, applies exactly the four rename rules, prints
  per-file change counts; dry-run by default, `--write` to apply.

### Fixed

- **CI: cross-engine visual specs ran on the wrong OS.** The Firefox
  (ubuntu) and WebKit (macOS) behavior jobs also executed
  `tests/visual.spec.js`, where Playwright demands `*-linux.png` /
  `*-darwin.png` baselines that were never committed — every run
  failed with "A snapshot doesn't exist". Baselines are `*-win32.png`
  by design, so those jobs now run behavior specs only, and a new
  Windows `visual-cross` job exercises the committed Firefox/WebKit
  baselines alongside the existing Chromium `visual` job.

### Tests

- Counts unchanged from v2.8 — Chromium **133** (a11y 19 · JS 31 ·
  CSS 80 · visual 3), Firefox and WebKit **114** each (1 engine-gated
  skip) — all green, every committed visual baseline intact: the
  rename moves names, not pixels. The API audit and token-parity
  tests now pin the `--bf-*` / `data-bf-theme` spellings instead.

## [2.8.0] - 2026-08-22

Presentation-ready polish: docs that generate themselves, an API
reference that can't drift, a theme gallery — and the gallery
immediately caught four sub-AA color pairs in the shipped starter
themes. No public surface changed except the starter-theme token
values listed under Fixed.

### Added

- **Theme gallery page** — `demo/gallery.html` renders every starter
  theme (and contrast) as **live preview cards side by side**: each
  card carries its own `data-theme`, so all six palettes resolve on
  one page with zero JS, next to a real button/input/badge strip per
  theme. The global switcher is the same tiny `data-theme-btn`
  pattern as the demo. Linked from the demo hero and the docs-site
  nav; `tests/helpers.js` gains `gotoGallery()` (ADR-0003 seam).
  Pinned by three tests: one axe scan covers all six rendered themes
  at once, and two CSS tests prove the previews are live — six cards
  must resolve six *distinct* `--fz-primary` values, and each themed
  card must carry the attribute naming what it previews.
- **API reference audit** — `docs/api.md` is now machine-checked in
  both directions against `src/`: every documented `data-*` attribute
  must be implemented somewhere real, and everything implemented must
  be documented or explicitly allowlisted. The first run found eight
  implemented-but-undocumented attributes, now tabled:
  `data-breadcrumbs`, `data-pagination`, `data-striped`,
  `data-carousel` (the scroller itself), and the stepper's
  `data-step` / `data-step-circle` / `data-step-label` /
  `data-complete`. The three internal seams (`data-fz-tabs-js`,
  `data-nav-js`, `data-open`) get their own "Internal markers"
  section — module-set, never hand-authored, kept out of the consumer
  table by test. Four source-parse tests in `tests/css.spec.js`;
  Chromium CSS suite 80 → 84 tests.
- **Token reference auto-gen** — the token tables in
  [theming.md](docs/theming.md) are generated from
  `src/tokens.css` by `build/token-docs.mjs` (`npm run docs:tokens`,
  wired into `npm run check`): each `/* ---- Section ---- */` header
  becomes a table group, each declaration a row, and its same-line
  trailing comment the Purpose column. Every token in `tokens.css`
  gained that trailing comment so the docs are single-sourced at the
  definition site. A parity test fails CI when a new token lands
  without regenerating — the hand-maintained tables could silently
  rot; these cannot.
- **Contrast-mode full suite** — beyond the existing page-wide
  contrast scan, a sweep runs axe **per component section** of the
  demo under `[data-theme="contrast"]`: ~20 scoped audits so a
  violation names its component directly instead of hiding inside a
  clean-looking page. Chromium a11y suite 17 → 19 tests.
- **Cross-engine visual baselines** — the firefox/webkit Playwright
  projects now include `tests/visual.spec.js`; snapshot names embed
  the browser (`light-firefox-win32.png`), so each engine pins its
  own rendering and no suites collide. All three engines' baselines
  regenerated this release (the demo hero gained text). This also
  retires the v2.7 caveat: a fresh Firefox binary runs the full
  ladder green.
- **Performance budget docs** — [docs/performance.md](docs/performance.md):
  the budgets, how sizes are measured (gzip level 9 is the contract;
  brotli/raw reported), and how to stay under the cap from both
  sides — framework changes and consumer imports. Linked from the
  README and the docs site.

### Fixed

- **Four starter themes shipped sub-AA light-scheme pairs** — found
  on the gallery's first axe run (no prior test ever rendered the
  starters): muted/primary text on the themes' own surfaces measured
  3.77–4.48 : 1. Darkened in place, hue preserved, dark values
  untouched (all already passed ≥ 5.7 : 1):
  dashboard `--fz-muted` `#64748b` → `#5f6e84`;
  playful `--fz-muted` `#a45378` → `#9c4f72` and
  `--fz-primary`/`--fz-focus-ring` `#e11d74` → `#c61a66`;
  forest `--fz-muted` `#6b7461` → `#626a59`.
  Every affected pair now clears 4.5 : 1 with margin (4.60–5.61).

### Tests

- Chromium 125 → **133** (a11y 17 → 19 · CSS 74 → 80 · JS 31 ·
  visual 3), all green. Firefox and WebKit each run **114**
  (113 passed + the engine-gated WebKit shim skip) and gain their
  own visual baselines.

## [2.7.0] - 2026-08-22

### Added

- **Contrast-palette parity guard** — source-parse tests lock the manual
  `[data-theme="contrast"]` palette and its OS-settings mirror
  (`prefers-contrast: more`) together: a token changed in one fails CI
  until the other matches. The print palette is pinned by *name set*
  only, since its values intentionally differ. Decision recorded in
  `docs/adr/0001` (mirrors stay hand-written; build-time generation
  rejected); glossary seeded in `CONTEXT.md`. Chromium CSS suite
  65 → 68 tests.
- **JS lifecycle seam** — all nine behavior modules now share one tiny
  plumbing module, `js/lifecycle.js`: `onDomReady()` (ready-aware init)
  and `bindOnce()` (per element+name idempotency guard) replace every
  module's hand-rolled boot code. Each module keeps a single named
  `init*(root = document)` export; re-running any init is safe —
   guards make stacked listeners impossible, and delegated listeners
   cover markup injected later. Internal only: same files, same import
   surface, no consumer change. Decision recorded in `docs/adr/0002`;
   pinned by lifecycle-seam + barrel-parity tests in `tests/js.spec.js`
   (Chromium JS suite 24 → 27 tests). Note: the modules' undocumented
   `export default autoInit` tail is gone — import the named `init*`
   or rely on the side-effect load, as `docs/javascript.md` always
   showed. Modules also gained "say so instead of failing silently"
   warnings for broken markup contracts: tabs with mismatched
   tab/panel counts now skip with a console warning instead of
   silently doing nothing, as does a popover menu initialized before
   its `[popovertarget]` trigger exists.
- **Test fixture harness** — all four suites now speak through
  `tests/helpers.js` instead of raw literals: `gotoDemo()` owns the
  `/demo/` URL, the frozen `DEMOS` map names every demo id, and
  `tokenColor()` resolves a `--fz-*` token to its live computed color
  via a throwaway probe element — so color assertions read "this element
  uses token X" truthfully under any theme or `light-dark()` flip
  instead of freezing light-theme rgb() values. Value freezes remain
  only where they pin contracts (theme/print palettes, ADR-0001 guards,
  visual baselines). Pure refactor: same 115 tests / 313 expectations.
  Decision recorded in `docs/adr/0003`.
- **Shared removal factory** — the twin removal behaviors (`chips.js`,
  `alert-dismiss.js`) were line-for-line copies; both are now thin
  adapters over one internal `js/remove-on-click.js` delegated click
  handler. Public surface unchanged: same files, same `initChips` /
  `initAlertDismiss` exports, same self-init on load, same per-root
  idempotency guarantees. A source-parse test pins that both adapters
  delegate to the shared factory (and that the factory keeps its own
  delegated listener), so the copy-paste shape cannot quietly grow
  back; `docs/javascript.md` gains the alert-dismiss section it was
   missing. Decision recorded in `docs/adr/0004`. Chromium JS suite
   27 → 28 tests.
- **Shared keyboard seams** — the four keyboard-driven behavior modules
  hand-rolled two interactions with visible drift: tabs clamped at the
  ends while popover menus wrapped modulo, and "a disclosure closed →
  give focus back to its opener" existed three times in three shapes
  (only one guarded against stealing focus from wherever the user had
  gone next). Two internal modules now own the semantics:
  `js/roving-index.js` (`createRover` — all Arrow/Home/End math,
  parameterized by axis / wrap-vs-clamp / activate hook) and
  `js/return-focus.js` (`refocusOpener` — the containment guard).
  `tabs.js`, `popover-menu.js`, `nav.js`, and `details-close.js`
  delegate to them; public surfaces are untouched — same files, same
  `init*(root)` exports, every pre-existing behavior test passes
  unchanged (source-parse pins keep the math single-sourced across
  every module in `src/js/`; barrel test learns the new plumbing
  convention). One declared semantic change: popover menus close on
  Tab even with an empty roster (only a non-item like a filter input
  inside) — the old inline math skipped that case as a guard-placement
  side effect; pinned by its own test. details-close also skips
  already-closed menus instead of redundantly re-focusing their
  summary. Decision recorded in `docs/adr/0006`. Chromium JS suite
  28 → 31 tests.
- **Disabled-dimming token** — the disabled dimming is now themable
  like every other visual: `--fz-disabled-opacity` (default `0.5`)
  replaces two hard-coded `opacity: 0.5` literals in buttons.css and
  forms.css. Not mirrored in the contrast/print palettes (they
  override colors only; disabled controls are WCAG-exempt).

### Changed

- **Shared menu-item recipe** — dropdown and popover menus styled their
  item rows with copy-pasted rules that had already drifted: popover
  links rendered underlined and accent-colored while dropdown links
  were clean, because base.css styles `a` without resetting it. One
  recipe now lives in `components/menu-items.css` (union selectors for
  both containers); each component file keeps only its panel chrome
  plus a pointer. À-la-carte consumers who import `dropdown.css` or
  `popover.css` on their own must add the new file — it is not pulled
  in transitively. Source-parse tests pin the recipe to a single file;
  a behavior test pins what menu items paint. Decision recorded in
  `docs/adr/0007`. Chromium CSS suite 69 → 74 tests.
- **forms.css de-duplication** — eight input/select/textarea state
  chains compress to `:is(input, select, textarea)` single selectors
  (`:is()` takes its arguments' max specificity), the redundant
  checkbox/radio arms fold into `input:disabled` (a dedicated switch
  arm keeps the disabled switch's not-allowed cursor winning its
  specificity tiebreak), a comment-only input-type selector list
  becomes an actual comment, and the range-focus rule is deleted.
  One deliberate visual delta: focused range sliders lose their
  duplicated rectangular outline and share the standard halo-only
  input treatment; everything else is cascade-identical.
- **Striped-table hover precedence** — striping out-specified row
  hover, working only because both happen to use the same token;
  targeted `:where()` wraps make hover win structurally. Found by the
  `:where()` audit (ADR-0007); stepper's attribute-state triples were
  audited and left alone deliberately.

### Removed

- **`@property` token registrations** — all ten typed-color blocks were
  dead weight: nothing in Barefoot animates or transitions a `--fz-*`
  variable (tokens serve only as transition durations), and each block
  hand-copied the palette's light half as its `initial-value` — silent
  drift waiting for the next accent change. Tokens ship as plain
  custom properties; consumers who animate a token register their own
  copy (`docs/theming.md` shows how). One observable change: JS reads
  of a token via `getPropertyValue()` now return the unresolved
  `light-dark(...)` string — resolve through a consumer property
  instead (three tests that pinned the registration-era serialization
  now probe what tokens paint). Not an API break by api.md's own
  contract. Decision recorded in `docs/adr/0005`. Chromium CSS suite
  68 → 69 tests (the decision is pinned by a source-parse guard).

## [2.6.0] — 2026-08-21

Responsive nav + JS growth — the biggest user-facing improvement is
mobile navigation, plus removable chips and typography tokens that
finish the "no hard-coded values" audit for weights and tracking. No
breaking changes: every default value is unchanged (the new weight and
letter-spacing tokens resolve to exactly the numbers they replace), so
2.4 apps render identically on 2.6.

### Added

- **Nav hamburger** (`js/nav.js` + `nav.css`) — opt-in responsive
  collapse for `data-nav="header"`: give the list an `id`, add a real
  `<button class="fz-nav-toggle">` with `aria-expanded`/`aria-controls`,
  load the module. Below **40rem of the nav's own width** (a container
  query — no viewport media queries, so it also collapses correctly
  inside a sidebar or grid cell) the list collapses behind the toggle
  and opens as a full-width column of tap targets. The module marks the
  nav `data-nav-js`, mirrors open state to `[data-open]`, closes on
  `Esc` (restoring focus to the toggle) and on link activation.
  **No-JS first:** without the module nothing ever hides — the button
  never renders and the list wraps like the plain topbar; a header nav
  without a complete contract (toggle + id'd list) is never armed.
- **Chip / tag** (`components/chip.css` + `js/chips.js`) —
  `[data-chip]` is a removable inline badge: pill surface, sentence
  case (badges shout, chips don't). The remove control is a real
  `<button data-chip-remove>` re-skinned to a bare glyph — danger tint
  on hover, visible ring on keyboard focus; give it an `aria-label`
  naming what it removes. Removal is opt-in JS: without the module
  nothing hides, the × just does nothing.
- **Font-weight tokens** (`tokens.css`) — `--fz-font-weight-normal`
  (400), `-medium` (500), `-semibold` (600), `-bold` (700). Every
  component now reads a named step; a theme can re-map emphasis in one
  place instead of overriding per-selector rules.
- **Letter-spacing tokens** (`tokens.css`) —
  `--fz-letter-spacing-tight` (-0.01em, brand/display), `-wide`
  (0.05em, uppercase labels), `-wider` (0.08em, overlines).
- **Nav hamburger a11y + keyboard tests** — axe-core at a mobile
  viewport with the menu open stays violation-free; toggle/`aria-expanded`
  sync, Esc-close with focus restore, link-click close, wide-viewport
  no-op, and both no-JS contracts (fixture without module; plain header
  nav never armed) are all proven.
- **Chip interaction test** — × click removes its chip; remove controls
  are named buttons; the pill/bare-glyph rendering is asserted against
  the standalone component file.

### Changed

- **`thead` tracking normalized** from `0.04em` to
  `--fz-letter-spacing-wide` (`0.05em`) — the one place the token
  values differ from the hard-coded ones they replace; imperceptible on
  uppercase small text.

### Docs

- `docs/components.md`: Navigation gains a *Hamburger* subsection;
  new *Chip* section after *Card & badge*.
- `docs/api.md`: `data-chip` / `data-chip-remove` rows.
- `docs/javascript.md`: nine modules — `chips.js` and `nav.js`
  sections, updated table and barrel description.
- `docs/theming.md`: font-weight & letter-spacing token reference.
- Demo conformance matrix gains a chip row and an expanded navigation
  row; two new demo sections (hamburger nav, chips).

### Tests & size

- Chromium suite 97 → 109 (17 a11y / 24 JS / 65 CSS / 3 visual);
  Firefox and WebKit pick up the twelve new tests (89 run, 1 skipped
  each). All green; visual baselines regenerated deliberately (the demo
  grew by two sections).
- Tokens 69 → 76. `index.css` 2.12 → 2.18KB gzip · `full.css` 7.76 →
  8.00KB gzip (10KB budget → PASS).

## [2.4.0] — 2026-08-21

Component gaps — three new components, the tests that prove them (and
one real bug they caught), and a theming tutorial. No breaking changes:
every default value is unchanged, so 2.2 apps render identically on
2.4.

### Added

- **Avatar group** (`media.css`) — `.fz-avatar-group` overlaps a stack
  of `.fz-avatar` images by a third of their size, separated by a
  surface ring. Purely visual: reading order and image semantics are
  untouched.
- **Loading spinner** (`components/spinner.css`) — `[data-spinner]`
  draws an indeterminate rotating arc from `--fz-primary` on a
  `--fz-primary-muted` track; `data-size="sm|lg"` resizes (lg tracks
  `--fz-control-height`). Frozen to a static arc under
  `prefers-reduced-motion`; roles stay in the consumer's markup.
- **Divider** (`components/divider.css`) — `[data-divider]` renders a
  centered label between two hairlines. The label is real text on any
  element that can hold it (`<hr>` is void, so it can't carry one);
  decoration lives in pseudo-elements.
- **Form-validation a11y test** — a touched-invalid field
  (`:user-invalid` painting the danger border) runs the full axe-core
  suite and stays violation-free.
- **Mobile/viewport tests** — at 375px the demo must not overflow
  horizontally, fluid type must step down without collapsing, and tap
  targets keep `--fz-control-height`.
- **Docs: theming tutorial** (`docs/theming-tutorial.md`) — "build your
  first theme" step by step: accent → surfaces → shape → ramps → ship →
  verify checklist. Linked from `theming.md` and the docs site.

### Fixed

- **`[data-grid]` single-column default is now `minmax(0, 1fr)`,**
  matching the multi-column container variants. A bare `1fr` track kept
  each item's min-content width, so narrow containers could overflow
  past their box — caught by the new mobile viewport test on its first
  run.

### Docs

- `docs/components.md`: avatar group in *Media & avatars*, new
  *Spinner* and *Divider* sections.
- `docs/api.md`: `data-spinner` / `data-divider` rows; `data-size`
  covers the spinner.
- Demo conformance matrix gains avatar-group, spinner, and divider rows;
  three new demo sections (divider, spinner, avatar group).

### Tests & size

- Chromium suite 91 → 97 (16 a11y / 15 JS / 63 CSS / 3 visual); Firefox
  and WebKit pick up the five new CSS tests (77 passed, 1 skipped each).
  All green; visual baselines regenerated deliberately (the demo grew by
  three sections).
- No new tokens (69 unchanged). `index.css` 2.12KB gzip (unchanged) ·
  `full.css` 7.56 → 7.76KB gzip (10KB budget → PASS).

## [2.2.0] — 2026-08-21

Token & test gaps — filling foundational holes. No new components, no
breaking changes: every default value is unchanged, so 2.0 apps render
identically on 2.2.

### Added

- **Alpha ramps completed** (`tokens.css`) — `--fz-info-muted`,
  `--fz-warning-muted`. All four status colors now have muted tints,
  derived via `color-mix()` like the rest of the ramp family.
- **`--fz-border-width`** token (`1px`) — every component border reads
  the token; override one variable for thicker strokes everywhere.
- **`--fz-radius-full`** token (`999px`) — pills (badge, switch, slider
  track, progress/meter bars) read the token.
- **Z-index scale** — `--fz-z-dropdown` (10), `--fz-z-sticky` (20),
  `--fz-z-dialog` (50), `--fz-z-toast` (60): one ladder, documented in
  the token reference. Dropdown panels, `.fz-sticky`, open dialogs, and
  toasts consume their rungs (sticky chrome and non-modal dialogs now
  stack coherently instead of ad-hoc).
- **Contrast-mode a11y test** — `data-theme="contrast"` runs the full
  axe-core suite (black-on-white / white-on-black stays violation-free).
- **Reduced-motion test** — under `prefers-reduced-motion: reduce`,
  smooth scroll switches off, transitions collapse, and the skeleton
  shimmer stops.
- **Print stylesheet test** — even with a dark theme active, print
  media forces ink-on-white, kills shadows, and avoids splitting blocks.
- **Token smoke tests** — stroke/pill tokens resolve and drive real
  components; the z-ladder orders dropdown < sticky < dialog < toast.
- **CI: axe-core on every PR** — the conformance suite is its own named
  workflow job, not bundled into the behavior job.

### Docs

- **Stepper** section in `docs/components.md` (markup, state
  attributes, orientation variant).
- **View transitions** section in `docs/components.md` (the opt-in
  `components/view-transition.css` hooks).
- Token reference (`docs/theming.md`) updated: new alpha ramps, radii,
  strokes, and z-index scale tables.

### Tests & size

- Chromium suite 86 → 91 (15 a11y / 15 JS / 58 CSS / 3 visual); Firefox
  and WebKit pick up the four new CSS tests. All green; visual
  baselines unchanged (no default renders differently).
- Tokens: 62 → 69 (17 `light-dark()`, 10 `@property` unchanged).
- `index.css` 2.06 → 2.12KB gzip · `full.css` 7.47 → 7.56KB gzip
  (10KB budget → PASS).

## [2.0.0] — 2026-08-20

The design-system release. API freeze, token audit, and docs rewrite.
**No breaking changes** — v2.0 is a stability declaration, not a
rewrite. If your app works on 1.9, it works on 2.0 with zero changes.

### Added

- **Alpha ramp tokens** (`tokens.css`) — `--fz-surface-2`,
  `--fz-surface-3`, `--fz-overlay`, `--fz-overlay-heavy`,
  `--fz-primary-subtle`, `--fz-primary-muted`, `--fz-primary-strong`,
  `--fz-primary-darken`, `--fz-danger-darken`, `--fz-danger-muted`,
  `--fz-success-muted`, `--fz-border-strong`. All derived from base
  tokens via `color-mix()` — override `--fz-primary` and the ramps
  follow.
- **`--fz-backdrop`** token — dialog/modal backdrop overlay, `light-dark()`
  pair, `@property`-registered. Replaces the hardcoded
  `rgb(0 0 0 / 0.5)`.
- **`--fz-shadow-sm`** token — small shadow for subtle depth (range
  slider thumb). Replaces the hardcoded `0 1px 2px rgb(0 0 0 / 0.25)`.
- **API reference** (`docs/api.md`) — frozen export map, `data-*`
  attribute reference, stability tiers, deprecation policy, and
  1.x→2.0 migration guide.
- **Updated token reference** (`docs/theming.md`) — restructured into
  categories (Colors, Alpha ramps, Radii, Spacing, Typography, Effects,
  Layout) with the new tokens documented.

### Changed

- Components now use alpha ramp tokens instead of inline `color-mix()`
  in several places: button hover darken, input hover border, form
  validation focus rings, dialog backdrop, range slider shadow.
- Disabled opacity normalized to `0.5` across buttons and forms
  (was `0.5` in buttons, `0.6` in forms).
- Landing page (`docs/index.html`) updated: forest theme added to
  live switcher, size stats updated, API reference linked in nav/footer.

### Token count

- **Before:** 49 tokens (16 `light-dark()`, 9 `@property`)
- **After:** 62 tokens (17 `light-dark()`, 10 `@property`)

## [1.9.0] — 2026-08-20

Components, complete: stepper progress tracker, input groups with leading
affix, and date/number/email polish — all CSS-only.

### Added

- **Stepper** (`components/stepper.css`) — `[data-stepper]` progress tracker
  with native `<ol>` semantics and `aria-current="step"`. Horizontal
  (default) and vertical (`data-orientation="vertical"`) variants.
  Completed steps styled from `--fz-success`, current from `--fz-primary`,
  pending from `--fz-border`/`--fz-muted`. Connecting lines follow completion.
- **Input groups** (`components/forms.css`) — `[data-input-group]` wraps an
  input with a leading affix (icon, currency symbol, unit). The affix
  receives `aria-hidden="true"` and shares the input's focus and validation
  states via `:has()` selectors. Works with `input`, `select`, `textarea`.
- **Date/number/email polish** (`components/forms.css`) — Native pickers and
  spinners preserved; themed surface and validation states apply. Number
  inputs hide spinner by default (`appearance: textfield`); date inputs get
  themed calendar picker indicator with opacity transition (0.6 base, 1 on
  hover).

### Tests

- +9 CSS behavior tests: stepper horizontal/vertical token mapping, input
  group focus/validation sharing, date/number/email themed surface, number
  spinner hidden, calendar picker indicator.
- +3 accessibility tests: stepper native `ol` semantics with `aria-current`,
  input group affix `aria-hidden`, date/number/email native validation
  announcement.
- Chromium 86 / Firefox 69 (1 skipped) / WebKit 69 (1 skipped) suites green;
  axe-core zero violations; visual baselines regenerated for expanded demo.

## [1.8.0] — 2026-08-19

Content & media: fluid type scale, a prose wrapper for long-form content,
circular avatars, aspect-ratio embeds, responsive images, and thumbnail
cards — all CSS-only.

### Added

- **Fluid type scale** (`tokens.css`) — `--fz-type-xs` through
  `--fz-type-2xl`: headings now use `clamp()` so they shrink on small
  screens and cap on large ones, replacing the fixed `rem` sizes.
  Override any step with a fixed `rem` to opt back into a static scale.
- **Prose wrapper** (`components/prose.css`) — `.fz-prose` imposes
  heading rhythm and section spacing on long-form content: one beat
  between siblings, a full section gap before headings, tight gap below.
  The element look (blockquote, code, tables) comes from the base and
  component layers; the wrapper only adds pace.
- **Avatars** (`components/media.css`) — `.fz-avatar` circular images
  sized from `--fz-avatar-size` (2.5rem, matches `--fz-control-height`);
  `data-size="sm|lg"` for 1.75rem / 4rem.
- **Aspect-ratio embeds** (`components/media.css`) — `[data-media]` locks
  a ratio box on `img`, `video`, `iframe`, or any element (default 16:9);
  `data-ratio="4/3|1/1|21/9"` picks another frame.
- **Thumbnail cards** (`components/media.css`) — `.card[data-media]`
  bleeds media to the top edge; the body below keeps standard card padding.
- **Responsive images** (`base.css`) — `img` and `video` get `height:
  auto` so they scale down to their container and keep their aspect ratio.
- **Tests** — +9 CSS behavior tests (fluid type, prose rhythm, avatar,
  media ratios, responsive images, media cards). Chromium 75 / Firefox 61
  / WebKit 61 suites green; axe-core still zero violations; visual
  baselines regenerated for the expanded demo.

[1.8.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.8.0

## [1.7.0] — 2026-08-19

Feedback & status: the app can now tell the user what happened. Semantic
status tokens, role-aware alerts, field-level validation states, pure-CSS
skeletons, and declarative toasts — all JS-free except the opt-in alert
dismiss.

### Added

- **Status tokens** (`tokens.css`) — `--fz-success`, `--fz-info`,
  `--fz-warning` (+ `*-fg` pairs), all `light-dark()`, `@property`-
  registered, and audited against the `contrast` theme /
  `prefers-contrast` / print overrides. `badge` gains
  `data-variant="success|info|warning"`.
- **Alerts** (`components/alert.css`) — `[data-alert]` role-aware status
  notices: bare (neutral) or `data-alert="danger|success|info|warning"`,
  edge-tinted from the tokens. ARIA semantics (`role="alert"`,
  `aria-live="polite"`) come from your markup — Barefoot only paints.
  Dismissible via `[data-alert-dismiss]` + opt-in `js/alert-dismiss.js`
  (wired into `js/barefoot.js`).
- **Field-level validation** (`components/forms.css`) — `:user-invalid`
  / `:user-valid` and `[aria-invalid="true"/"false"]` now paint the
  control border danger/success (touched-only, nothing on page load).
  Message helpers: `.fz-field-hint`, `.fz-field-error`,
  `.fz-field-success`. Also fixed a latent cascade bug: the shared
  text-input rule was `(0,5,1)` from five `:not([type])` exclusions and
  silently out-specified hover/focus/validation rules — it's now
  `:where()`-scoped so those rules win again.
- **Skeleton** (`components/skeleton.css`) — `.skeleton`, a pure-CSS
  shimmering placeholder; static under `prefers-reduced-motion`.
- **Toasts** (`components/popover.css`) — `[popover][data-kind="toast"]`
  pinned to the bottom edge, `data-variant` tints from the status tokens.
  Declarative (Popover API): trigger opens, Esc/click-away closes.
  Auto-dismiss stays out — it needs JS.
- **Visual harness** (`tests/visual.spec.js`) — infinite animations
  (the skeleton shimmer) are cancelled, not force-finished, so the
  full-page capture stays deterministic.

### Tests

- +10 CSS behavior tests (status tokens flip with `color-scheme`, alert
  edge tints, alert dismiss, `:user-invalid`/`:user-valid` border
  painting, `[aria-invalid]` mirror, skeleton base + reduced-motion,
  toast open/Esc/edge pin + variant tint, badge variants) and +1 a11y
  state (toast-open axe run). Chromium 62 / Firefox 52 / WebKit 52 suites
  green; axe-core still zero violations; visual baselines regenerated for
  the expanded demo.

## [1.6.0] — 2026-08-19

The app shell: full spacing scale, auto-flowing grid variants, site
navigation, and split/sticky layout — everything a real app needs to put
Barefoot's components on a page. All CSS-only, no new JS.

### Added

- **Full spacing scale** (`utilities.css`) — `.fz-mt-1…8` /
  `.fz-mb-1…8` (margin-block-start/end), `.fz-p-1…8` (all-sides
  padding), `.fz-px-1…8` / `.fz-py-1…8` (padding-inline/block), each
  mapped to the matching `--fz-space-*` token. Axis shorthands win over
  `.fz-p-*` when both are applied.
- **Grid variants** (`components/grid.css`) — `[data-grid="auto-fit"]`
  and `[data-grid="auto-fill"]` flow as many columns as fit (each ≥
  `--fz-grid-min`, 14rem) without a container query, and
  `data-gap="0|1…8"` tunes the gap from the spacing scale. The fixed
  container-query counts no longer override the variants.
- **Navigation** (`components/nav.css`) — `[data-nav]` topbar row with
  an optional `.fz-brand` and a link list (`data-nav="header"` /
  `"footer"` variants, hairline separators); `aria-current="page"`
  marks the active link (accent + semibold). Wraps on narrow screens —
  nothing toggles, nothing hides.
- **Split layout** (`utilities.css`) — `.fz-sidebar`: the first child is
  the aside (`--fz-sidebar-width`, 16rem), the rest flows beside it, and
  the split stacks to one column when the row can't fit the aside plus
  ≥60% main. Zero media queries.
- **Sticky utility** (`utilities.css`) — `.fz-sticky` pins an element to
  `--fz-sticky-top` (`0`) while its scrolling ancestor moves.
- **New tokens** (`tokens.css`) — `--fz-grid-min`, `--fz-grid-gap`,
  `--fz-sidebar-width`, `--fz-sticky-top`.

### Tests

- +7 CSS behavior tests (spacing scale + axis-shorthand precedence,
  grid `auto-fit` track count/width, `data-gap`, nav current-page +
  pills, nav footer variant, sidebar split + narrow stack, sticky) and
  +1 a11y keyboard test (nav links focusable in order, `aria-current`
  carried). Chromium 55 / Firefox 42 / WebKit 42 suites green; axe-core
  still zero violations; visual baselines regenerated for the expanded
  demo.

## [1.5.0] — 2026-08-19

The form is finished: `<select>` gets a themed chevron, `file` and `color`
inputs get a skin, textareas can auto-grow, required fields announce
themselves visually, and the whole form signals invalid state. Plus base
typography polish, a skip-link utility, and animated accordion disclosure.

### Added

- **`<select>` skin** (`components/forms.css`) — `appearance: none` + a
  themed chevron (a `currentColor` SVG arrow) replaces the raw OS arrow;
  the dropdown list stays native. `[multiple]` / `[size]` selects keep
  the browser's control.
- **`input[type="file"]`** — the button is skinned via
  `::file-selector-button` with the button tokens; it stays a native
  file input.
- **`input[type="color"]`** — a themed swatch sized to the control
  height, with a focus ring from the shared input rule.
- **Required marker** — a label that *wraps* a required control gets a
  danger asterisk (`label:has(> input[required])::after`); screen
  readers already announce the `required` attribute.
- **Auto-grow textarea** — opt-in `[data-autogrow]` sets
  `field-sizing: content` (progressive enhancement; the fixed rows /
  `min-height` hold where unsupported).
- **Form-level invalid signal** — `form:has(:user-invalid)` draws a
  subtle ring around the whole form once any touched field is invalid.
- **`<output>`** styled as a live-region value (semibold, text color).
- **Base polish** (`src/base.css`) — `mark` (accent tint via
  `color-mix`), `figure`/`figcaption`, `address` (no italics),
  `del`/`ins` (kept inline, tinted). `kbd`/`samp` already shipped in
  `components/code.css`.
- **Skip-link utility** (`utilities.css`) — `.fz-skip-link`, first
  element in `<body>`; clipped out of view until keyboard focus, then
  revealed top-left (WCAG 2.4.1 bypass-block pattern).
- **Accordion open/close motion** (`components/accordion.css`) — the
  panel height animates `0` ↔ `auto` via
  `interpolate-size: allow-keywords` where supported; engines without it
  keep the instant toggle. `prefers-reduced-motion` collapses it
  globally.

### Tests

- +7 CSS behavior tests (select chevron, file-button skin, color swatch,
  required asterisk, autogrow, `form:has(:user-invalid)`, output), +1
  a11y keyboard test (skip link hidden until focus).
- Chromium 47 / Firefox 35 / WebKit 35 suites green; axe-core still zero
  violations across all states; visual baselines regenerated for the
  expanded demo form.

## [1.4.0] — 2026-08-19

Form controls get a real skin, breadcrumbs and pagination ship, a fourth
starter theme joins, OS accessibility settings are honored, and the
carousel grows opt-in autoplay + prev/next controls. Plus a stylelint
pass and an auto-generated README size table.

### Added

- **Form control skins** (`components/forms.css`) — a custom range-slider
  skin (WebKit + Gecko pseudo-elements, focus-visible ring) and themed
  `<progress>` / `<meter>` bars that match the accent instead of the raw
  browser default.
- **Breadcrumbs** (`components/breadcrumbs.css`) — `[data-breadcrumbs]`
  nav: slash separators, `aria-current="page"` muted.
- **Pagination** (`components/pagination.css`) — `[data-pagination]` nav:
  the current page is a filled `<span aria-current="page">`, never a link.
- **Forest theme** (`themes/forest.css`) — a fourth starter theme: deep
  greens on warm paper.
- **Tooltip trigger affordance** (`components/popover.css`) — `[data-tooltip]`
  gets a dotted underline + `cursor: help`, pairing with
  `[popover][data-kind="tooltip"]`.
- **`js/carousel.js`** (opt-in, ~4.8KB, zero deps) — autoplay
  (`data-autoplay="ms"`, 3000ms default, 1000ms floor, pauses on hover /
  focus / hidden tab, never starts under reduced motion) and
  `data-carousel-prev` / `data-carousel-next` buttons (also work without
  autoplay). Marks the scroller `role="group"` +
  `aria-roledescription="carousel"` only when the author hasn't already.
  Wired into the all-in-one `js/barefoot.js` import.
- **OS accessibility settings** (`src/tokens.css`) — `@media
  (prefers-contrast: more)` forces black-on-white tokens; `@media
  (prefers-reduced-transparency: reduce)` drops shadows. An explicit
  `data-theme` still wins over both.
- **stylelint** — `.stylelintrc.json` tuned to the codebase's deliberate
  style + `npm run lint:css`; the source is lint-clean.
- **Auto-generated README size table** — `build/readme-size.mjs` +
  `npm run docs:size` regenerate the size table between
  `<!-- SIZES:START -->` markers from `dist/sizes.json`.

### Changed

- `npm run check` now also runs `docs:size` and `lint:css`.
- Range/progress/meter drop `accent-color` for the full skin; text inputs,
  checkboxes, and radios keep the native themed `accent-color`.

### Fixed

- Carousel `step()` snap math: prev/next move exactly one slide and wrap
  in every engine (the centered-snap offset — 60cqi slides — is cancelled
  by computing snap positions from each slide's `offsetLeft`, instead of
  raw `scrollLeft` arithmetic).

### Tests

- +10 behavior tests (6 CSS, 4 JS): range/progress/meter skins,
  breadcrumbs, pagination, forest theme, prefers-contrast; carousel
  role/roledescription marking, prev/next wrap, autoplay (asserts the
  contract — it initiates a forward scroll — because headless Firefox
  doesn't run smooth-scroll animations), autoplay-off under reduced motion.
- Chromium 39 / Firefox 28 / WebKit 28 suites green; visual baselines
  regenerated for the expanded demo.

## [1.3.1] — 2026-08-18

Fix for the one remaining known gap: anchored popovers with an off-screen
trigger.

### Fixed

- **Anchored popover off-screen guard** (`js/popover-anchor.js`, opt-in,
  ~2.3KB, zero deps) — when a script opens an anchored popover whose
  trigger is **fully outside the viewport**, the popover is closed
  immediately. This resolves the Firefox behavior where such a popover is
  clamped to the viewport edge (visible at the wrong place): Firefox 153
  clamps, Chromium/WebKit pin it to the off-screen trigger — no engine
  honors `position-visibility: anchors-visible` yet, so nothing hides it.
  The guard matches that spec intent. A trigger **in view** is untouched:
  click-to-open and programmatic opens behave exactly as native.
- Wired into the all-in-one `js/barefoot.js` import.
- Regression tests run in every engine (Chromium 29 / Firefox 18 /
  WebKit 18 total suites): script-open with the trigger off-screen closes
  the popover; a trigger in view still opens normally.

## [1.3.0] — 2026-08-18

Safari/WebKit tab-order shim for `details` panels, anchor-positioning
robustness (viewport-edge flip), and a fail-fast release workflow.

> **Note:** the shim work was originally scoped as "1.2.0", but it was
> never published under its own version (no `v1.2.0` tag, no
> `barefoot-css@1.2.0` on npm). It shipped in this release instead.

### Added

- **`js/details-tabindex.js`** (opt-in, <1KB, zero deps) — WebKit/Safari
  skips the contents of an *open* `<details>` in the sequential tab order
  (items stay clickable, but Tab never reaches them). The shim walks the
  panel of every open `details` and gives its focusable descendants an
  explicit `tabindex="0"` (preserving deliberate `tabindex="-1"`). Watches
  the `open` attribute via a `MutationObserver` — a `<details>` can flip
  via click, keyboard, or script, and Chromium doesn't fire the `toggle`
  event on a summary click — plus a pass at init for panels already open.
- Wired into the all-in-one `js/barefoot.js` import.
- **`position-try-fallbacks: flip-block`** on anchored menus and tooltips —
  when the trigger sits near a viewport edge, the popover flips to the
  opposite side instead of spilling off-screen (menu below a button at the
  bottom of the screen flips above it). The preferred `position-area` is
  tried first; the fallback only kicks in when it would overflow.

### Fixed

- WebKit: links, buttons, and inputs inside open `<details>` panels are now
  reachable by keyboard. The existing Esc-close test's WebKit workaround
  was removed — the real Tab contract now runs in every engine.

### CI / engineering

- **Release preflight** — the publish workflow now runs `npm whoami`
  before the long build+test run, so a missing/invalid `NPM_TOKEN` fails
  in seconds with a clear signal. The workflow header documents the
  requirement in plain words: the token must be a **granular access token
  with "Publish to the public registry" and "bypass 2FA" enabled** (npm
  otherwise rejects automated publishes with `E403`).

### Notes

- The **Firefox off-screen-trigger clamp** remains an upstream browser bug
  (popover clamps to the viewport edge when its trigger is off-screen at
  open time). Verified still present in Firefox 153 on 2026-08-18; the
  spec-default `position-visibility: anchors-visible` does not mitigate it
  in any engine (both compute it as default yet neither hides the popover).
  The flip fallback is the adjacent, shipable improvement; the bug itself
  is tracked in plan.md.

## [1.1.0] — 2026-08-12

Tight follow-up release: switch component, stackable tables, print
support, and packaging insurance.

### Added

- **Switch** — `input[type="checkbox"][data-switch]` (CSS-only toggle:
  track + thumb drawn with background layers on the element, so it
  stays a native checkbox — keyboard-focusable, screen-reader-
  announced, theme-aware; supports `:checked` and `:indeterminate`).
- **Stackable tables** — `table[data-table="stack"]` stacks rows as
  cards when the nearest query container is <40rem (wrap in
  `.fz-contain`; a `<table>` element itself can't be a size container).
  The `<th>` headers stay in the DOM, so screen readers still announce
  them.
- **Print stylesheet** — `@media print` in the base layer: flat colors,
  no decorative depth, and `break-inside: avoid` on tables/cards.
- `scrollbar-gutter: stable` on `<html>` so content doesn't jump when
  a scrollbar appears or disappears.

### CI / engineering

- **Fresh-install packaging smoke test** — CI packs the tarball, installs
  it into a throwaway consumer project, and resolves every public export
  (`barefoot-css`, `full.css`, components, themes, `js/*`, `src/*`) to a
  real file. Catches packaging bugs before they reach npm.

### Notes

- Checkbox/radio skins remain the native `accent-color` look: already
  theme-aware and zero-risk. Custom skins add cross-browser risk for
  no reliability gain, so they were cut from this release.

## [1.0.0] — 2026-08-12

First public release to npm as **`barefoot-css`** (the bare name `barefoot`
was taken on npm by an unrelated project).

### Added

- Core: cascade-layer architecture (`@layer reset, tokens, base, components,
  utilities`), custom reset, `--fz-*` token system with `light-dark()`
  pairs and `@property`-registered variables.
- Theme presets `auto` / `light` / `dark` / `contrast` via `data-theme`;
  starter themes `editorial`, `dashboard`, `playful` + `custom` template.
- 14 components (buttons, forms, dialog, popover, dropdown, accordion,
  carousel, table, code, card, badge, tabs, grid, view-transition).
- Container-query `[data-grid]` responsive variants and container-unit
  (`60cqi`) carousel slides.
- Anchored popovers (`position-area`) and `view-transition` theme crossfades.
- Opt-in JS modules (zero deps): WAI-ARIA tabs (`js/tabs.js`), reliable
  Esc-close for `details[data-menu]` (`js/details-close.js`), popover-menu
  keyboard nav (`js/popover-menu.js`), all three in `js/barefoot.js`.
- Docs site and conformance demo, deployed to GitHub Pages.

### Fixed

- Dark-mode button hover contrast (1.25:1 → passing) surfaced by the
  axe-core suite; demo `<main>` landmark and `role="group"` form issues.
- Serve bug: no directory→`index.html` mapping made `/demo/` 404.
- Dialog entrance fallback for engines without `transition-behavior: allow-discrete`.

### CI / engineering

- Playwright + `@axe-core/playwright` suite: zero axe violations across
  four page states; keyboard-contract tests; cross-engine behavior runs
  (Chromium, Firefox, WebKit); visual regression with committed baselines.
- Bundled demo webfonts (Inter + JetBrains Mono, OFL) so visual baselines
  are machine-independent.
- Size budget: `index.css` 1.28KB gzipped (limit 10KB), enforced in the
  build and a standalone `npm run size` check.
- Release workflow: tag `v*` → build + budget + tests → `npm publish`
  → GitHub Release.

[3.1.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v3.1.0
[1.7.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.7.0
[1.6.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.6.0
[1.5.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.5.0
[1.3.1]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.3.1
[1.3.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.3.0
[1.1.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.1.0
[1.0.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.0.0
