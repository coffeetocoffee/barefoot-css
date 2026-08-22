# Barefoot — Status & plan

_Last updated: 2026-08-22 — v3.0.0_

## Snapshot

- **Current:** `barefoot-css@3.0.0` (2026-08-22) — the breaking
  cleanup: one namespace, `bf`. Tokens `--fz-*` → `--bf-*`, theme
  attribute `data-theme` → `data-bf-theme`, utility classes
  `.fz-*` → `.bf-*`, internal marker `data-fz-tabs-js` →
  `data-bf-tabs-js` (plus the internal `fz-*` keyframe names).
  Consumers migrate with `npm run migrate:v3` (codemod) or by hand
  via `docs/migration-3.md`. Nothing deprecated in 2.x existed to
  drop; no other public surface changed.
- **Next:** TBD — first post-v3 arc. Candidates live in the
  watch-list or a fresh architecture scan; no commitments yet.
- **Upkeep:** the 2026-08-21 architecture scan (candidates C1–C7)
  completed in v2.7 — lifecycle/keyboard/removal seams, shared CSS
  recipes, palette-parity guard, test fixture harness (ADRs
  0001–0007). v2.8 added no new runtime machinery; it pinned docs to
  code instead (api.md audit, token-table parity).
- **Tests:** Chromium 133 (19 a11y / 31 JS / 80 CSS / 3 visual) ·
  Firefox 114 run, 1 skipped · WebKit 114 run, 1 skipped — all
  green, and every engine now runs its own visual baselines. Specs
  address the demo only through `tests/helpers.js`. In CI the visual
  specs are Windows-only (win32 baselines): Chromium in `visual`,
  Firefox+WebKit in `visual-cross`; the ubuntu/macos jobs stay
  behavior-only.
- **Build:** `index.css` 2.08KB gzip · `full.css` 7.79KB gzip (10KB
  budget → PASS).
- **Done:** milestones 0.1 → 2.8. Full history: `CHANGELOG.md`.

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

- Every design decision is a `--bf-*` custom property on `:root`.
- Color tokens use **`light-dark()`** so dark mode follows the OS with zero
  attributes. `[data-bf-theme]` just flips `color-scheme` — no duplicate
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
and `.bf-*` utilities.

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
- [x] **2.8** — polish & docs before the v3 wave: theme gallery page
  (six live preview cards; its first axe run caught four sub-AA
  starter-theme pairs — fixed in place), API reference audit
  (docs ↔ src, both directions, eight attributes tabled, internal
  markers allowlisted), token reference auto-gen (`npm run
  docs:tokens`; purposes live as trailing comments in `tokens.css`),
  contrast-mode per-section axe sweep, cross-engine visual baselines
  (Firefox/WebKit projects join the visual suite), performance
  budget docs (`docs/performance.md`). Shipped as
  `barefoot-css@2.8.0` (2026-08-22).
- [x] **3.0** — the namespace cleanup: tokens `--fz-*` → `--bf-*`,
  theme attribute `data-theme` → `data-bf-theme`, utility classes
  `.fz-*` → `.bf-*`, internal marker `data-fz-tabs-js` →
  `data-bf-tabs-js`; migration guide (`docs/migration-3.md`) +
  codemod (`npm run migrate:v3`). Nothing deprecated in 2.x existed
  to drop. Shipped as `barefoot-css@3.0.0` (2026-08-22).

## Next

No arc committed yet — the first post-3.0 session picks one from the
watch-list or a fresh scan.

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
- **Docs generate from source where drift hurts.** README sizes
  (`build/readme-size.mjs`) and the token tables in theming.md
  (`build/token-docs.mjs`, purposes = trailing comments in
  `tokens.css`) are regenerated on every `npm run check`; the
  `data-*` table in api.md is pinned to `src/` by a two-way audit.
  Hand-maintained reference tables rot silently; generated and
  audited ones can't.
- **Starter themes clear AA in both schemes.** The theme gallery
  renders every starter at once under axe — which is how four
  light-scheme muted/primary pairs shipped sub-4.5:1 unnoticed.
  Fixed by darkening tokens in place (hue kept); any new starter
   gets its card on the gallery page, so this class of bug cannot
   ship quietly again.
- **v3 picked `bf`, not `barefoot`, as the namespace.** Every token,
  class, and attribute a consumer types gets the short prefix
  (`var(--bf-primary)`, `.bf-row`, `data-bf-theme`) while staying
  collision-proof against framework CSS; the package keeps its full
  name, only the prefix shortens.

## Non-goals

- No utility framework. The `.bf-*` set stays tiny and layout-only.
- No JS framework integration (no React/Vue wrappers).
- No IE/legacy support. Modern CSS is the point.
- No component classes for everything — elements first, always.
