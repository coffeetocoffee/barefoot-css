# Barefoot — Status

_Last updated: 2026-08-19 — milestones **0.1 + 0.2 + 0.3 + 1.0 + 1.1 + 1.2 + 1.3 + 1.3.1 + 1.4 + 1.5**_

## Summary

Milestones 0.1, 0.2, 0.3, 1.0, 1.1, 1.2, 1.3, 1.3.1, 1.4, and 1.5 are **done**.

- **1.5.0:** the form is finished — a themed `<select>` chevron, a
  skinned `file`/`color` input, opt-in auto-grow textareas
  (`field-sizing: content`), a required-asterisk affordance for wrapped
  labels, a `form:has(:user-invalid)` whole-form invalid ring, and
  `<output>` styling. Plus base polish (`mark`, `figure`, `address`,
  `del`/`ins`), the `.fz-skip-link` utility, and animated accordion
  disclosure (`interpolate-size: allow-keywords`). All CSS-only.
  **Published as `barefoot-css@1.5.0`** (2026-08-19).

- **1.4.0:** the full v1.4.0 candidate list shipped — form-control skins
  (range/progress/meter), breadcrumbs, pagination, a fourth starter theme
  (forest), OS accessibility settings (`prefers-contrast` /
  `prefers-reduced-transparency`), the opt-in `js/carousel.js` autoplay +
  controls module, stylelint, and an auto-generated README size table.
  **Published as `barefoot-css@1.4.0`** (2026-08-19).

- **1.3.1:** the last known gap closed — the opt-in `js/popover-anchor.js`
  guard closes an anchored popover whose trigger is fully off-screen at
  open time (Firefox clamped it to the viewport edge; Chromium/WebKit
  pinned it off-screen; no engine hides it). **Published as
  `barefoot-css@1.3.1`** (2026-08-18).

- **1.3:** anchor-positioning robustness (`position-try-fallbacks:
  flip-block` — anchored menus/tooltips flip away from viewport edges
  instead of spilling off-screen) and a fail-fast release workflow
  (`npm whoami` preflight + documented bypass-2FA token requirement).
  **Published as `barefoot-css@1.3.0`** (2026-08-18).

- **1.2:** the Safari/WebKit `<details>` tab-order shim
  (`js/details-tabindex.js`) — open-`<details>` panel contents are now
  reachable by Tab in every engine, with regression tests that run the
  real keyboard contract cross-browser. **Note:** this milestone was
  never published under its own version — the v1.3.0 release carried it
  (see below).

- **1.1:** switch component, stackable container-query tables, print
  stylesheet, `scrollbar-gutter` stability, and a fresh-install
  packaging smoke test in CI. Published as `barefoot-css@1.1.0`.

- **0.1:** core architecture, all CSS components, build pipeline with size
  budget, conformance demo, docs. Size target beaten by a wide margin
  (budget 10KB gzipped; we ship 1.28KB).
- **0.2:** CI wired — Playwright + axe-core accessibility conformance
  (zero violations, verified), visual regression with committed baselines,
  size-budget check, GitHub Actions workflow. The tests caught and we
  fixed a real dark-mode contrast bug and two demo landmark/role issues.
- **0.3:** opt-in JS extras shipped — WAI-ARIA tabs (`js/tabs.js`),
  reliable Esc-close for `details[data-menu]` (`js/details-close.js`),
  and popover-menu keyboard support (`js/popover-menu.js`), plus
  `components/tabs.css` and a `tests/js.spec.js` suite. Zero dependencies,
  all verified green.
- **1.0:** container-query `[data-grid]` variants, container-unit carousel
  slides (`60cqi`), anchored popovers (`position-area`), view-transition
  theme crossfades, a dogfooded docs site at `/`, npm publish prep
  (1.0.0 manifest + release workflow), and a new `tests/css.spec.js`
  behavior suite.

## Test results (current)

```
$ npm test  →  47 passed (Chromium)
    9 × accessibility (axe-core: resting, dark, dialog-open, dropdown-open
     states report ZERO violations; focus ring; details toggle; popover
     Esc; dialog Esc + focus return; skip link hidden until keyboard focus)
    15 × opt-in JS (tabs click + arrows + Home/End; tabs no-JS-first: all
     panels visible without the module, group marked data-fz-tabs-js +
     hidden inactive with it; details Esc-close with focus return; details
     tab-order shim: Tab reaches panel links in every engine, already-open
     panels fixed at init, closed untouched, tabindex=-1 preserved;
     popover-menu arrows + focus restore; popover-anchor off-screen guard:
     script-open with the trigger off-screen closes the popover, a trigger
     in view still opens; carousel: role + aria-roledescription marked,
     prev/next scroll + wrap, autoplay initiates a forward scroll, autoplay
     stays off under reduced motion)
    20 × CSS behavior (container-query grid 1 vs 3 columns; carousel in
     container units; stackable table header hidden/visible; anchored
     popover below trigger; anchored popover flips above a trigger near
     the viewport bottom; theme switch via startViewTransition;
     range/progress/meter skins; breadcrumbs separator + current muted;
     pagination current is a filled span; forest accent; prefers-contrast
     tokens; select chevron; file-button skin; color swatch; required
     asterisk; autogrow field-sizing; form:has(:user-invalid); output)
    3 × visual regression (light + dark full-page + webfont canary)

$ npm run test:ff       → 35 passed (Firefox: JS + CSS behavior)
$ npm run test:webkit   → 35 passed (WebKit/Safari: JS + CSS behavior)
```

## Build results (current)

```
full.css                      24.07KB raw     5.21KB gzip     4.62KB brotli
index.css                      4.93KB raw     1.57KB gzip     1.35KB brotli
js/carousel.js                 4.78KB raw     1.92KB gzip     1.63KB brotli
components/forms.css           5.92KB raw     1.54KB gzip     1.31KB brotli
js/tabs.js                     2.70KB raw     1.10KB gzip     0.89KB brotli
js/popover-anchor.js           2.26KB raw     1.04KB gzip     0.84KB brotli
js/details-tabindex.js         1.86KB raw     0.91KB gzip     0.73KB brotli
js/popover-menu.js             2.17KB raw     0.89KB gzip     0.75KB brotli
components/buttons.css         2.06KB raw     0.60KB gzip     0.49KB brotli
components/dropdown.css        1.45KB raw     0.54KB gzip     0.42KB brotli
utilities.css                  1.29KB raw     0.53KB gzip     0.42KB brotli
js/details-close.js            0.90KB raw     0.51KB gzip     0.39KB brotli
components/popover.css         1.25KB raw     0.48KB gzip     0.39KB brotli
components/dialog.css          1.05KB raw     0.48KB gzip     0.38KB brotli
components/accordion.css       1.34KB raw     0.47KB gzip     0.37KB brotli
components/table.css           0.87KB raw     0.40KB gzip     0.32KB brotli
components/tabs.css            0.73KB raw     0.34KB gzip     0.26KB brotli
components/pagination.css      0.75KB raw     0.33KB gzip     0.25KB brotli
themes/playful.css             0.58KB raw     0.33KB gzip     0.30KB brotli
themes/editorial.css           0.57KB raw     0.32KB gzip     0.27KB brotli
components/badge.css           0.52KB raw     0.27KB gzip     0.22KB brotli
themes/forest.css              0.47KB raw     0.27KB gzip     0.23KB brotli
themes/dashboard.css           0.49KB raw     0.26KB gzip     0.22KB brotli
components/carousel.css        0.44KB raw     0.26KB gzip     0.20KB brotli
components/breadcrumbs.css     0.51KB raw     0.25KB gzip     0.18KB brotli
js/barefoot.js                 0.41KB raw     0.24KB gzip     0.20KB brotli
components/code.css            0.45KB raw     0.24KB gzip     0.18KB brotli
themes/custom.css              0.45KB raw     0.23KB gzip     0.19KB brotli
components/card.css            0.29KB raw     0.20KB gzip     0.14KB brotli
components/view-transition.css 0.28KB raw     0.16KB gzip     0.14KB brotli
components/grid.css            0.26KB raw     0.16KB gzip     0.11KB brotli

budget: dist/index.css 1.57KB gzip (limit 10.00KB) → PASS
```

Opt-in JS (`dist/js/`, raw): carousel 4.78KB, tabs 2.70KB,
popover-anchor 2.26KB, popover-menu 2.17KB, details-tabindex 1.86KB,
details-close 0.90KB, barefoot 0.41KB. Not part of the CSS budget — opt-in
by import.

## What's done

### 0.1 — core
- [x] Cascade layer architecture (`@layer reset, tokens, base, components, utilities`)
- [x] Custom reset (~0.4KB minified, no dependency)
- [x] Token system: `--fz-*` variables, `light-dark()` pairs, `@property` typed vars
- [x] Theme presets: `auto` / `light` / `dark` / `contrast` via `data-theme`
- [x] Base layer: typography, focus-visible rings, reduced-motion safety
- [x] Components (14): buttons, forms, dialog, popover, dropdown, accordion, carousel, table, code, card, badge, tabs, grid, view-transition
- [x] Starter themes (3): editorial, dashboard, playful + custom template
- [x] Build: Lightning CSS bundling + minify, per-entry-point output
- [x] Size budget enforced in build + standalone `npm run size` check
- [x] Conformance demo page (`demo/index.html`) with keyboard walkthroughs
- [x] Docs: README, plan, status, theming, components, accessibility

### 0.2 — CI & conformance tests
- [x] Playwright + `@axe-core/playwright` test suite (`tests/a11y.spec.js`)
- [x] axe-core on 4 page states (resting, dark, dialog-open, dropdown-open) — **zero violations**
- [x] Keyboard-contract tests: focus ring, details toggle + item focus, popover Esc-close, dialog Esc + focus return
- [x] Visual regression (`tests/visual.spec.js`) with committed `*-win32.png` baselines
- [x] Size-budget check wired as `npm run size` (CI-gateable)
- [x] GitHub Actions workflow (`.github/workflows/ci.yml`): build+size on Linux, behavior + a11y (axe-core, JS, CSS) on Linux/Chromium, behavior (JS + CSS) on Firefox (Linux) and WebKit (macOS), visual on Windows (baselines are OS-sensitive)
- [x] Fixed real issues the tests surfaced: dark-mode button hover contrast (1.25:1 → passing), demo `<main>` landmark, `role="group"` on `<form>`

### 0.3 — opt-in JS extras
- [x] `src/js/tabs.js` — WAI-ARIA tabs: roving tabindex, automatic activation, Arrow/Home/End (~2.5KB)
- [x] `src/js/details-close.js` — reliable Esc-close for `details[data-menu]`, focus returns to summary (~0.9KB)
- [x] `src/js/popover-menu.js` — arrow-key nav + Home/End + focus restore for `[popover][data-kind="menu"]` (~2.0KB)
- [x] `src/js/barefoot.js` — all three in one import
- [x] `components/tabs.css` styling (active-tab underline, `[hidden]` rule)
- [x] `tests/js.spec.js` — 4 tests for the modules, all green
- [x] Build copies `src/js/*` → `dist/js/*` verbatim (readable, no bundler)

### 1.0 — modern CSS features, docs site, publish prep
- [x] Container-query `[data-grid]` variants: responsive columns in a `container-type: inline-size` context instead of media queries
- [x] Carousel slides sized in container units (`60cqi`) — adapt to the carousel, not the viewport
- [x] Anchored popovers with `position-area` (menu pins below its trigger)
- [x] `components/view-transition.css` + `startViewTransition` theme crossfade on the demo/docs switcher
- [x] Dogfooded docs site at `docs/index.html` (served at `/` by `build/serve.mjs`, `/demo/` still served)
- [x] `tests/css.spec.js` — 4 behavior tests (grid columns, container units, popover anchoring, theme transition)
- [x] npm publish prep: `package.json` 1.0.0 (`prepack`/`prepublishOnly` gates, `sideEffects`, `publishConfig`)
- [x] Release workflow (`.github/workflows/release.yml`): tag `v*` → build + budget + tests → `npm publish`
- [x] Fixed serve bug uncovered by tests: no directory→`index.html` mapping made `/demo/` 404; generic trailing-slash handling added
- [x] Cross-browser behavior CI: `playwright.config.js` projects for Chromium (full suite), Firefox + WebKit (JS + CSS behavior, `npm run test:ff` / `test:webkit`); WebKit run pinned to macOS in CI
- [x] Dialog entrance fallback: `@supports not (transition-behavior: allow-discrete)` keyframe entrance for engines without discrete transitions
- [x] Tabs no-JS-first: `tabs.js` marks the group `data-fz-tabs-js` and hides inactive panels at init; without the module every panel stays visible (tests cover both)
- [x] **Published `barefoot-css@1.0.0` to npm** (2026-08-12) via the release workflow (`git tag v1.0.0` → build + budget + tests → `npm publish`). The name `barefoot` was taken on npm by an unrelated project, so the package ships as **`barefoot-css`** (repo-matched, free, unscoped).

### 1.1 — tight follow-up
- [x] **Switch component** — `input[type="checkbox"][data-switch]` (CSS-only: track + thumb drawn with background layers on the element; native checkbox semantics, focus, `:checked`/`:indeterminate`, theme-aware). Checkbox/radio keep the native `accent-color` look (zero-risk, already themed).
- [x] **Stackable tables** — `table[data-table="stack"]` + `@container (width <= 40rem)`: rows become cards, header row hides (DOM keeps the `<th>`s for screen readers). Requires a wrapping query container (`.fz-contain` — a `<table>` can't be a size container in browsers).
- [x] **Print stylesheet** — `@media print` in base: flat colors, no depth, `break-inside: avoid` on tables/cards.
- [x] `scrollbar-gutter: stable` on `<html>` (no content jump when scrollbars toggle).
- [x] **Fresh-install packaging smoke test** — CI: `npm pack` → install in a throwaway consumer → resolve every public export to a real file.
- [x] **Published `barefoot-css@1.1.0` to npm** (2026-08-12).

### 1.2 — Safari details tab-order shim
- [x] `js/details-tabindex.js` — WebKit skips the contents of an *open*
  `<details>` in the sequential tab order (long-standing quirk); the shim
  walks the panel of every open `details` and gives its focusable
  descendants an explicit `tabindex="0"`, preserving deliberate
  `tabindex="-1"`. Watches the `open` attribute via a MutationObserver
  (a `<details>` can flip via click, keyboard, or script — and Chromium
  doesn't fire the `toggle` event on a summary click) plus a pass at
  init for panels already open. Zero dependencies, <1KB, readable.
- [x] Wired into the all-in-one `js/barefoot.js` import.
- [x] Regression tests: panel descendants reachable by Tab in every engine
  (the old WebKit workaround in the Esc-close test is gone — the real
  contract now runs everywhere); already-open panels fixed at init; closed
  panels untouched; deliberate `tabindex="-1"` preserved.
- [x] **Carried by the v1.3.0 release** — this milestone was not published
  under its own version (no `v1.2.0` tag, no `barefoot-css@1.2.0` on npm);
  it shipped inside `barefoot-css@1.3.0` (2026-08-18).

### 1.3 — anchor robustness + release hardening
- [x] `position-try-fallbacks: flip-block` on anchored menus/tooltips —
  when the trigger sits near a viewport edge, the popover flips to the
  opposite side instead of spilling off-screen (preferred `position-area`
  still tried first). Verified flipping in Firefox + Chromium.
- [x] Release workflow fail-fast: `npm whoami` preflight before the build
  + test run (a missing/invalid `NPM_TOKEN` dies in seconds), and the
  workflow header documents the granular-token-with-**"bypass 2FA"**
  requirement in plain words.
- [x] **Published `barefoot-css@1.3.0` to npm** (2026-08-18, tag
  `v1.3.0` → CI released it; GitHub Release auto-created).

### 1.3.1 — anchored popover off-screen guard
- [x] `js/popover-anchor.js` (opt-in, ~2.3KB, zero deps) — closes an
  anchored `[popover]` whose trigger is **fully outside the viewport**
  when it opens (script-opened; click-to-open has the trigger in view).
  Matches the spec intent of `position-visibility: anchors-visible`,
  which no engine implements: Firefox 153 clamps such a popover to the
  viewport edge, Chromium/WebKit pin it off-screen. Anchor found via
  `anchorElement` where supported, else the documented inline
  `anchor-name` pattern (computed-style fallback).
- [x] Wired into the all-in-one `js/barefoot.js` import.
- [x] Regression tests in every engine: script-open with the trigger
  off-screen closes the popover; a trigger in view still opens normally.
- [x] Versioned `barefoot-css@1.3.1` — **published** (2026-08-18, tag
  `v1.3.1` → CI released it; GitHub Release auto-created).

### 1.4 — forms skin, breadcrumbs/pagination, carousel controls, a11y settings
- [x] **Form-control skins** (`components/forms.css`): custom range-slider
  skin (WebKit + Gecko pseudo-elements, focus-visible ring, thumb drawn to
  the primary token) and themed `<progress>` / `<meter>` bars (accent
  fill, alt track). Verified at the pixel level — `getComputedStyle` on
  UA-shadow pseudo-elements reports defaults in Chromium, so tests assert
  on element-level styles instead.
- [x] **Breadcrumbs** (`components/breadcrumbs.css`): `[data-breadcrumbs]`
  nav with slash separators; `[aria-current="page"]` muted.
- [x] **Pagination** (`components/pagination.css`): `[data-pagination]`
  nav; current page is a filled `<span aria-current="page">` (never a
  link); `[aria-disabled="true"]` boxed.
- [x] **Forest theme** (`themes/forest.css`): fourth starter theme — deep
  greens on warm paper.
- [x] **Tooltip trigger** (`components/popover.css`): `[data-tooltip]`
  dotted underline + `cursor: help`, pairing with
  `[popover][data-kind="tooltip"]`.
- [x] **`js/carousel.js`** (opt-in, ~4.8KB, zero deps): autoplay
  (`data-autoplay="ms"`, 1000ms floor, pauses on hover/focus/hidden tab,
  off under reduced motion) + `data-carousel-prev` / `data-carousel-next`
  buttons. Marks `role="group"` + `aria-roledescription="carousel"` when
  unset. `step()` computes snap positions from each slide's `offsetLeft`
  (centered-snap offset cancels) so prev/next move exactly one slide and
  wrap in every engine. Wired into `js/barefoot.js`.
- [x] **OS accessibility settings** (`src/tokens.css`):
  `@media (prefers-contrast: more)` forces black-on-white tokens;
  `@media (prefers-reduced-transparency: reduce)` drops shadows. Explicit
  `data-theme` still wins.
- [x] **stylelint**: `.stylelintrc.json` + `npm run lint:css`; source is
  lint-clean (normalized hex lengths in base/buttons to satisfy it).
- [x] **Auto-generated README size table**: `build/readme-size.mjs` +
  `npm run docs:size` regenerates the table between `<!-- SIZES:START -->`
  markers from `dist/sizes.json`.
- [x] **Tests**: +10 behavior tests (6 CSS, 4 JS). Autoplay test asserts
  the module initiates a forward scroll (headless Firefox doesn't run
  smooth-scroll animations — verified by probe).
- [x] **Versioned `barefoot-css@1.4.0`** — **published** (2026-08-19, tag
  `v1.4.0` → CI released it; GitHub Release auto-created).

### 1.5 — forms, finished
- [x] **`<select>` skin** (`components/forms.css`): `appearance: none` +
  a themed chevron (a `currentColor` SVG arrow layered on the element)
  replaces the raw OS arrow; the dropdown list stays native.
  `[multiple]` / `[size]` selects keep the browser's control.
- [x] **`input[type="file"]`**: the button is skinned via
  `::file-selector-button` with the button tokens; still a native file
  input (hover, theme-aware).
- [x] **`input[type="color"]`**: a themed swatch sized to
  `--fz-control-height` with the shared input focus ring.
- [x] **Required marker**: `label:has(> input[required])::after` →
  danger asterisk for wrapped labels (screen readers announce the
  `required` attribute already).
- [x] **Auto-grow textarea**: opt-in `[data-autogrow]` sets
  `field-sizing: content` (progressive enhancement — verified in all
  three engines, which now ship it).
- [x] **`form:has(:user-invalid)`**: a subtle ring around the whole form
  once any touched field is invalid.
- [x] **`<output>`** styled as a live-region value.
- [x] **Base polish** (`src/base.css`): `mark` (accent tint via
  `color-mix`), `figure`/`figcaption`, `address`, `del`/`ins`. `kbd`/
  `samp` were already shipped by `components/code.css`.
- [x] **`.fz-skip-link`** (`utilities.css`): clipped until keyboard
  focus, then revealed top-left — the WCAG 2.4.1 bypass-block pattern.
- [x] **Accordion motion** (`components/accordion.css`): panel height
  animates `0` ↔ `auto` via `interpolate-size: allow-keywords` (safe
  no-op elsewhere; reduced motion collapses it globally).
- [x] **Tests**: +7 CSS behavior (select chevron, file-button skin,
  color swatch, required asterisk, autogrow, `form:has`, output), +1
  a11y keyboard test (skip link hidden until focus).
- [x] **Versioned `barefoot-css@1.5.0`** — **published** (2026-08-19, tag
  `v1.5.0` → CI released it; GitHub Release auto-created).

## Known gaps / next

- [x] **The entire v1.4.0 candidate list is shipped** (range/progress/meter
  skin, tooltip trigger, `js/carousel.js` controls + autoplay,
  breadcrumbs + pagination + forest theme, `prefers-contrast` /
  `prefers-reduced-transparency`, stylelint, auto-generated README size
  table) — 2026-08-19.
- [x] **The entire v1.5.0 candidate list is shipped** (select skin,
  file/color inputs, auto-grow textareas, required marker,
  `form:has(:user-invalid)`, `<output>`, base polish, `.fz-skip-link`,
  accordion motion) — 2026-08-19.
- [x] **v1.5.0 released** — tag `v1.5.0` pushed (2026-08-19) → the
  release workflow ran (build + budget + tests → `npm publish`); GitHub
  Release auto-created. The next-version candidate list is open; no
  known functional gaps remain.
- [x] **Firefox anchor positioning (off-screen trigger) — FIXED in 1.3.1.**
  `position-area` clamped to the viewport edge when a popover's trigger
  was *off-screen* at open time (Firefox 153), while Chromium/WebKit
  pinned it to the off-screen trigger — no engine honors the spec-default
  `position-visibility: anchors-visible`, so the popover was never hidden.
  The opt-in `js/popover-anchor.js` guard closes an anchored popover whose
  trigger is fully outside the viewport when it opens (spec-aligned),
  verified in Chromium 29 / Firefox 18 / WebKit 18. Click-to-open with a
  trigger in view is untouched. The 1.3 `position-try-fallbacks:
  flip-block` remains for the adjacent near-viewport-edge case. If
  `position-visibility: anchors-visible` ever lands in engines, the guard
  becomes a no-op and can be dropped.

## Verification commands

```bash
npm run check           # build + budget (run before every commit)
npm test                # all tests on Chromium (a11y + JS + CSS + visual)
npm run test:a11y       # axe-core conformance only
npm run test:js         # opt-in JS modules only
npm run test:css        # 1.0 CSS behavior (container queries, popovers, transitions)
npm run test:ff         # JS + CSS behavior on Firefox
npm run test:webkit     # JS + CSS behavior on WebKit/Safari
npm run test:visual     # visual regression against baselines
npm run test:visual:update   # regenerate baselines deliberately
npm run preview         # open http://localhost:4173 (docs at /, demo at /demo/)
```
