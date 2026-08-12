# Barefoot — Status

_Last updated: 2026-08-12 — milestones **0.1 + 0.2 + 0.3 + 1.0 (launch-ready)**_

## Summary

Milestones 0.1, 0.2, 0.3, and 1.0 are **done**.

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
$ npm test  →  20 passed (Chromium)
   8 × accessibility (axe-core: resting, dark, dialog-open, dropdown-open
     states report ZERO violations; focus ring; details toggle; popover
     Esc; dialog Esc + focus return)
   6 × opt-in JS (tabs click + arrows + Home/End; tabs no-JS-first: all
     panels visible without the module, group marked data-fz-tabs-js +
     hidden inactive with it; details Esc-close with focus return;
     popover-menu arrows + focus restore)
   4 × CSS behavior (container-query grid 1 vs 3 columns; carousel in
     container units; anchored popover below trigger; theme switch via
     startViewTransition)
   2 × visual regression (light + dark full-page, committed baselines)

$ npm run test:ff       → 10 passed (Firefox: JS + CSS behavior)
$ npm run test:webkit   → 10 passed (WebKit/Safari: JS + CSS behavior)
```

## Build results (current)

```
full.css                      16.01KB raw     3.80KB gzip     3.34KB brotli
index.css                      3.50KB raw     1.28KB gzip     1.10KB brotli
js/tabs.js                     2.70KB raw     1.10KB gzip     0.89KB brotli
js/popover-menu.js             1.99KB raw     0.82KB gzip     0.69KB brotli
components/forms.css           2.00KB raw     0.69KB gzip     0.56KB brotli
components/buttons.css         1.84KB raw     0.58KB gzip     0.48KB brotli
components/dropdown.css        1.45KB raw     0.54KB gzip     0.42KB brotli
js/details-close.js            0.90KB raw     0.51KB gzip     0.39KB brotli
components/dialog.css          1.05KB raw     0.48KB gzip     0.38KB brotli
components/popover.css         1.10KB raw     0.43KB gzip     0.33KB brotli
utilities.css                  0.87KB raw     0.40KB gzip     0.30KB brotli
components/accordion.css       1.00KB raw     0.39KB gzip     0.30KB brotli
components/tabs.css            0.73KB raw     0.34KB gzip     0.26KB brotli
themes/playful.css             0.58KB raw     0.33KB gzip     0.30KB brotli
themes/editorial.css           0.57KB raw     0.32KB gzip     0.27KB brotli
components/table.css           0.53KB raw     0.30KB gzip     0.25KB brotli
components/badge.css           0.52KB raw     0.27KB gzip     0.22KB brotli
themes/dashboard.css           0.49KB raw     0.26KB gzip     0.22KB brotli
components/carousel.css        0.44KB raw     0.26KB gzip     0.20KB brotli
components/code.css            0.45KB raw     0.24KB gzip     0.18KB brotli
themes/custom.css              0.45KB raw     0.23KB gzip     0.19KB brotli
components/card.css            0.29KB raw     0.20KB gzip     0.14KB brotli
js/barefoot.js                 0.24KB raw     0.17KB gzip     0.14KB brotli
components/view-transition.css   0.28KB raw     0.16KB gzip     0.14KB brotli
components/grid.css            0.26KB raw     0.16KB gzip     0.11KB brotli

budget: dist/index.css 1.28KB gzip (limit 10.00KB) → PASS
```

Opt-in JS (`dist/js/`, raw): tabs 2.70KB, details-close 0.90KB,
popover-menu 1.99KB, barefoot 0.24KB. Not part of the CSS budget — opt-in
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

## Known gaps / next

- [ ] **After first push:** initial commit + GitHub remote to activate workflows; `NPM_TOKEN` secret for release; update the placeholder `github.com/your-org/barefoot` URLs in `package.json` (`repository`, `homepage`, `bugs`) before the first npm publish
- [ ] **First push:** repo has no commits yet — `git init` done, need initial commit + GitHub remote to activate the workflow
- [ ] **Firefox anchor positioning (real finding):** `position-area` clamps to the viewport edge when the popover's trigger is *off-screen* at open time (works fine when the trigger is in view — the normal click-to-open case; verified in Firefox 153). Watch for a fix; nothing to do in Barefoot's CSS.
- [ ] **Safari `<details>` tab order (real finding):** WebKit skips the contents of an open `<details>` in the sequential tab order (verified in WebKit 26.5). Items stay clickable/focusable; a tiny opt-in JS shim could add `tabindex` there if demand justifies it.

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
