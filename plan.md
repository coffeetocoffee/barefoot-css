# Barefoot — Status & plan

_Last updated: 2026-08-22 — v2.7.0_

## Snapshot

- **Current:** `barefoot-css@2.7.0` (2026-08-22) — architecture
  deepening across all seven upkeep candidates (details in the Upkeep
  bullet): one lifecycle seam for opt-in JS, shared keyboard and
  removal seams behind the interactive components, shared menu-item
  recipe + disabled-opacity token in CSS, dead `@property`
  registrations dropped, contrast-palette parity guard, test fixture
  harness. Public surfaces unchanged except the documented range-focus
  halo and the à-la-carte import now needed for `menu-items.css`.
  Release notes: `CHANGELOG.md`.
- **Next:** v2.8.0 — polish & docs (theme gallery page, performance
  budget docs, API reference audit, token reference auto-gen,
  contrast-mode full suite, cross-browser visual refresh).
- **Upkeep:** architecture scan 2026-08-21 produced seven deepening
  candidates (C1–C7, local scratch `GRILL PLAN.txt`). Shipped early:
  C1 contrast-palette parity guard (`docs/adr/0001`), C3 one lifecycle
  seam for all opt-in JS (`js/lifecycle.js`, `docs/adr/0002`), C2
  test fixture harness (`tests/helpers.js`: gotoDemo/DEMOS/tokenColor,
  `docs/adr/0003`), C4 shared removal factory behind the chips /
  alert-dismiss adapters (`js/remove-on-click.js`, `docs/adr/0004`),
  C5 dropped the ten dead `@property` registrations
  (`docs/adr/0005`), C6 shared keyboard seams behind tabs /
  popover-menu / nav / details-close (`js/roving-index.js`,
  `js/return-focus.js`, `docs/adr/0006`) — public surfaces untouched,
  all pre-existing behavior tests pass unchanged — and C7 de-duplicated
  the component-CSS recipes (shared menu-item file, disabled-opacity
  token, `:is()` chain compression, `:where()` audit with one real
  fix; motion guards kept after the suite pinned name-level removal;
  `docs/adr/0007`). Scan complete: all seven candidates processed.
- **Tests:** Chromium 125 (17 a11y / 31 JS / 74 CSS / 3 visual) ·
  WebKit 104 run, 1 skipped · Firefox — see caveat — all green.
  Caveat: the Playwright Firefox binary broke mid-session (launch
  access-violation; CDN download refused, no system install), so its
  last full-ladder green (103 + 1 skipped) predates two review fixes
  of C7 — a disabled-switch cursor arm and a test serialization fix,
  both engine-agnostic and covered by the other engines. Re-run
  `npm run test:ff` once Firefox reinstalls. Specs address the demo
  only through `tests/helpers.js`.
- **Build:** `index.css` 2.06KB gzip · `full.css` 7.88KB gzip (10KB
  budget → PASS).
- **Done:** milestones 0.1 → 2.6. Full history: `CHANGELOG.md`.

## Vision

A CSS framework that ships ~10KB instead of 200KB, re-skins from a handful
of variables instead of a Sass recompile, needs zero JavaScript, is
accessible by default instead of "add ARIA manually," and never makes your
app look like Bootstrap.

> **Selling line:** "Your app should look like you, not like us."

## The five pillars

### 1. Size — ~10KB CSS

- **Build:** Lightning CSS bundling + minification. No `targets` set — we
  never transpile away modern CSS; that is where the size and simplicity
  come from.
- **Architecture:** `@layer reset, tokens, base, components, utilities;`
  Cascade layers kill specificity wars for free.
- **Entry points:** `index.css` (mandatory base) + per-component files.
  Users only pay for what they import.
- **No vendored reset** — we wrote our own (~0.4KB minified).
- **Budget:** `index.css` ≤ 10KB **gzipped**, enforced in the build.
  Raw/gzip/brotli all reported; gzip is the contract because that's what
  most CDNs serve. A regression check (`npm run size`) re-enforces the
  budget on every run without a rebuild.

**Decision:** The plan's word "tree-shake" was scoped honestly. esbuild and
Lightning CSS do not tree-shake CSS meaningfully — our size story is
*per-component entry points + a purge-friendly single-file structure*, not
tree-shaking.

### 2. Theming by default

- Every design decision is a `--fz-*` custom property on `:root`.
- Color tokens use **`light-dark()`** so dark mode follows the OS with zero
  attributes. `[data-theme]` just flips `color-scheme` — no duplicate
  palettes to maintain.
- Theme presets: `auto` / `light` / `dark` / `contrast`.
- Starter themes that change ~6 variables and look completely different:
  `editorial`, `dashboard`, `playful` — this is the marketing demo.
- `themes/custom.css` is a commented template for users' own themes.
- Color tokens are plain custom properties — no `@property` shipped
  (ADR-0005); register your own copy to animate a token.

### 3. JS-free interactivity

| Pattern | Primitive | JS needed |
|---|---|---|
| Dropdown / menu | `<details data-menu>` | none |
| Accordion / tabs | `<details data-accordion name>` | none |
| Tooltip / popover | Popover API (`popovertarget`) | none |
| Carousel | scroll-snap | none |
| Modal | `<dialog>` + `showModal()` | one native line |

**Decision (honest scoping):** `<dialog>` is *not* declarative — opening a
modal requires `showModal()`. The fully JS-free modal-like layer is the
Popover API. We ship both and document the difference. Tabs ship as the
`details[name]` accordion (the plan's own answer); true tabs with
arrow-key navigation are deferred as an opt-in JS module.

### 4. Accessibility out of the box

- Semantic HTML is the base: `button`, `ul/nav`, `dialog`, `details`,
  `th`. No div soup.
- Focus management inherited from the platform: focus traps, Esc-to-close,
  light-dismiss.
- Visible `:focus-visible` ring everywhere; AA contrast in the default
  palette; `prefers-reduced-motion` respected.
- Conformance page at `demo/index.html`: every component labeled with its
  WCAG level and a keyboard-only walkthrough.
- **CI (to add):** axe-core on every PR + visual regression job.

### 5. No "Bootstrap look"

- Neutral default palette: ink on paper, thin borders, no shadows,
  no gradients, small neutral radii.
- Every visual is a variable — "If you want blue, change one line."
- Three starter themes prove the point: they only override variables.

## API surface decision (element-first)

Barefoot styles **native elements globally** (Pico-style), not
utility/component classes. Rationale:

- Truest to the "barefoot" thesis — you write plain HTML.
- Accessibility for free (semantic elements, not divs).
- Cascade layers give users an escape hatch: put your own styles in a
  `@layer user;` *after* ours and you always win — no `!important`.

Trade-off accepted: element-first CSS can't be safely purged by class.
Mitigated by per-component entry points.

Classes exist only where there is no native element: `.card`, `.badge`,
and `.fz-*` utilities.

## Browser baseline

2024+ evergreen only. Required features: `light-dark()`, Popover API,
`@starting-style`, `allow-discrete`, native nesting, `color-mix`, `dvh`.

## Roadmap

- [x] **0.1** — Core architecture, tokens, base, all components, themes,
  build with size budget, conformance demo, docs.
- [x] **0.2** — CI: axe-core a11y suite (zero violations across 4 states),
  visual regression with committed baselines, size-budget job, GitHub
  Actions workflow. Also fixed a real dark-mode contrast bug the tests
  surfaced.
- [x] **0.3** — Opt-in JS extras: WAI-ARIA tabs (`js/tabs.js`), reliable
  Esc-close for `details[data-menu]` (`js/details-close.js`), popover-menu
  keyboard support (`js/popover-menu.js`), tabs styling, and a JS test
  suite. Zero dependencies, all green.
- [x] **1.0** — `@container`-based responsive variants, `view-transition`
  hooks, anchored popovers (`position-area`), cross-browser behavior CI
  (Chromium + Firefox + WebKit), dogfooded docs site, npm publish prep.
  Shipped as `barefoot-css@1.0.0` (2026-08-12).
- [x] **1.1** — fresh-install packaging smoke test in CI, CSS-only switch
  (`[data-switch]`), stackable tables (`[data-table="stack"]` +
  `@container`), print stylesheet, typography (`text-wrap` +
  `scrollbar-gutter`). Shipped as `barefoot-css@1.1.0` (2026-08-12).
- [x] **1.2** — Safari/WebKit `<details>` tab-order shim
  (`js/details-tabindex.js`), carried by the v1.3.0 release (never
  published under its own version).
- [x] **1.3** — anchor robustness (`position-try-fallbacks: flip-block`),
  fail-fast release workflow (`npm whoami` preflight + bypass-2FA token
  requirement). Shipped as `barefoot-css@1.3.0` (2026-08-18).
- [x] **1.3.1** — anchored popover off-screen guard
  (`js/popover-anchor.js`): closes an anchored `[popover]` whose trigger
  is fully outside the viewport at open time (no engine honors
  `position-visibility: anchors-visible`). Shipped as
  `barefoot-css@1.3.1` (2026-08-18).
- [x] **1.4** — form skins, breadcrumbs, pagination, forest theme, carousel
  autoplay/controls, `prefers-contrast`, stylelint. Shipped as
  `barefoot-css@1.4.0` (2026-08-19).
- [x] **1.5** — select skin, file/color inputs, auto-grow, required marker,
  form validation, skip link, accordion motion. Shipped as
  `barefoot-css@1.5.0` (2026-08-19).
- [x] **1.7** — status tokens, alerts, field validation, skeleton, toasts.
  Shipped as `barefoot-css@1.7.0` (2026-08-19).
- [x] **1.8** — fluid type, prose, avatars, media embeds, responsive images.
  Shipped as `barefoot-css@1.8.0` (2026-08-19).
- [x] **1.9** — stepper, input groups, date/number/email polish. Shipped as
  `barefoot-css@1.9.0` (2026-08-20).
- [x] **2.0** — API freeze, token audit (alpha ramps, `--fz-backdrop`,
  `--fz-shadow-sm`), docs rewrite (token reference, API reference,
  deprecation policy), theme gallery (all 5 themes in live switcher),
  1.x→2.0 migration note. Shipped as `barefoot-css@2.0.0` (2026-08-20).
- [x] **2.2** — token & test gaps: `--fz-info-muted`/`--fz-warning-muted`
  ramps, `--fz-border-width`, `--fz-radius-full`, z-index scale
  (`--fz-z-dropdown/sticky/dialog/toast`, wired into dropdown, sticky,
  dialog, toast), contrast-mode axe test, reduced-motion + print tests,
  stepper & view-transition docs, dedicated per-PR axe-core CI job.
  Shipped as `barefoot-css@2.2.0` (2026-08-21).
- [x] **2.4** — component gaps: avatar group (`.fz-avatar-group`),
  loading spinner (`[data-spinner]`), labelled divider
  (`[data-divider]`), form-validation a11y test, mobile/viewport tests
  (caught + fixed a `[data-grid]` single-column overflow), theming
  tutorial (`docs/theming-tutorial.md`). Shipped as
  `barefoot-css@2.4.0` (2026-08-21).
- [x] **2.6** — responsive nav + JS growth: nav hamburger
  (`js/nav.js`, container-query collapse, no-JS fallback), removable
  chips (`[data-chip]` + `js/chips.js`), font-weight &
  letter-spacing tokens (all weights/tracking now tokenized),
  hamburger axe + keyboard tests, chip interaction tests. Shipped as
  `barefoot-css@2.6.0` (2026-08-21).

## Next — v2.8 through v3.0

### v2.8.0 — Polish & documentation (next)

Make the project presentation-ready before the v3 breaking wave.

- [ ] **Theme gallery page** — dedicated HTML with live preview cards
- [ ] **Performance budget docs** — size targets and how to stay under them
- [ ] **API reference audit** — every `data-*` attribute tested
- [ ] **Token reference auto-gen** — script to parse tokens.css → theming.md
- [ ] **Contrast-mode full suite** — all components in contrast theme
- [ ] **Cross-browser visual baseline refresh**

### v3.0.0 — Breaking changes

The namespace cleanup. Specifics TBD based on what v2.x reveals.

- [ ] **Token rename** — `--fz-*` → `--barefoot-*` (or similar, TBD)
- [ ] **Attribute cleanup** — `data-theme` → `data-fz-theme` (avoid collisions)
- [ ] **Migration guide + codemod script**
- [ ] **Drop any deprecated items from v2.x**

## Watch-list (no action until browsers fix it)

- `position-visibility: anchors-visible` landing in engines — when it
  does, the 1.3.1 `popover-anchor.js` guard becomes a no-op and can be
  dropped. (The Firefox off-screen clamp itself is upstream, re-verified
  in Firefox 153, 2026-08-18.)

## Decision log

- **details Esc-to-close is not a contract.** Chrome closes `<details>`
  on Escape only when focus is *inside the panel*; other engines differ.
  Barefoot's CSS stays JS-free and honest; the **opt-in** `js/details-close.js`
  makes Esc close `details[data-menu]` reliably, and the docs steer menu
  needs to the Popover API.
- **Tabs are opt-in JS by necessity.** The WAI-ARIA tabs pattern (roving
  tabindex, `aria-selected`, panel hiding) cannot be done in pure CSS.
  `js/tabs.js` implements it with zero dependencies and a no-JS fallback
  where every panel stays visible.
- **Popover menus get roving focus, not a modal trap.** Popovers are
  non-modal by design; `js/popover-menu.js` adds arrow-key nav and focus
  restore without changing that.
- **Opt-in JS ships readable, not minified.** ~4.5KB total across the
  three modules; readable and commented source is a feature for a
  framework users may audit.
- **Custom checkbox/radio skins were cut, a CSS-only switch was not.**
  Native `accent-color` already follows the theme for checkboxes/radios,
  so custom skins bought nothing but cross-browser risk. The switch
  (`[data-switch]`) shipped because it genuinely needs drawing (track +
  thumb); it keeps native checkbox semantics, focus, and
  `:checked`/`:indeterminate`.
- **Visual baselines are OS/hex-sensitive.** Committed as `*-win32.png`;
  CI runs the visual job on `windows-latest` to match.
- **The 10KB budget is a floor, not a ceiling** — CI fails if
  `dist/index.css` grows past it, so size can't creep back up.
- **The divider label lives on a real element, not on `<hr>`.** `<hr>`
  is void — it cannot contain text, and `attr()`-fed pseudo-content is
  a worse contract than real text. `[data-divider]` therefore applies
  to any element that can hold text (`<p data-divider>Section</p>`);
  the hairlines are decorative pseudo-elements, the label stays
  announced like any other content.
- **Grid tracks never trust item min-content.** Every `[data-grid]`
  track list uses `minmax(0, …)` — a bare `1fr` keeps each item's
  min-content width and lets narrow containers overflow. Caught by the
  v2.4 mobile viewport test on its first run.
- **The hamburger collapse point is the nav's own width, not the
  viewport.** `[data-nav="header"]` is an inline-size container and the
  collapse is a `@container (max-width: 40rem)` rule — a nav inside a
  sidebar or grid cell collapses at the right moment, not just at a
  magic viewport number.
- **`data-nav-js` only arms complete contracts.** The module marks a
  header nav only when it has both the toggle and an id'd list; the CSS
  hides nothing without that marker. A plain topbar under the module,
  or markup missing the module, always stays fully visible — the
  no-JS-first contract holds in both directions.

## Non-goals

- No utility framework. The `.fz-*` set stays tiny and layout-only.
- No JS framework integration (no React/Vue wrappers).
- No IE/legacy support. Modern CSS is the point.
- No component classes for everything — elements first, always.
