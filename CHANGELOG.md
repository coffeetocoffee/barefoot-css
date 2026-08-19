# Changelog

All notable changes to Barefoot CSS are documented here. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
  is tracked in status.md.

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

[1.3.1]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.3.1
[1.3.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.3.0
[1.1.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.1.0
[1.0.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.0.0
