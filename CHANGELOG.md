# Changelog

All notable changes to Barefoot CSS are documented here. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **CI: cross-engine visual specs ran on the wrong OS.** The Firefox
  (ubuntu) and WebKit (macOS) behavior jobs also executed
  `tests/visual.spec.js`, where Playwright demands `*-linux.png` /
  `*-darwin.png` baselines that were never committed — every run
  failed with "A snapshot doesn't exist". Baselines are `*-win32.png`
  by design, so those jobs now run behavior specs only, and a new
  Windows `visual-cross` job exercises the committed Firefox/WebKit
  baselines alongside the existing Chromium `visual` job.

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

[1.7.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.7.0
[1.6.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.6.0
[1.5.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.5.0
[1.3.1]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.3.1
[1.3.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.3.0
[1.1.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.1.0
[1.0.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.0.0
