# Changelog

All notable changes to Barefoot CSS are documented here. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.1.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.1.0
[1.0.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.0.0
