# Barefoot — Status & plan

_Last updated: 2026-08-30 — v4.9.0 shipped (theme toggle + persistence — `js/theme.js`)_

## Snapshot

- **Current:** `barefoot-css@4.9.0` (2026-08-30) — **the theme
  persistence release**: the one script every demo page hand-rolled is
  now a first-party opt-in module. `js/theme.js` wires
  `[data-bf-theme-btn]` buttons to `data-bf-theme` on `<html>`,
  remembers the choice in localStorage (`barefoot-theme` key), re-applies
  it at init, crossfades clicks through `startViewTransition` (skipped
  under reduced motion), validates names like every variant value, and
  hands control back to the OS on `auto` — `light-dark()` keeps
  following system changes with zero JS. The 4.8 zero-JS validation
  release stands beneath it: touched textual fields draw a check/cross
  shape cue beside the `:user-valid`/`:user-invalid` border (pure CSS,
  `currentColor` SVG — no palette baked in), `forced-colors: active`
  is hardened across forms/pagination/segmented/command/ghost
  buttons/skeleton (structure instead of hue), tokens export as a W3C
  DTCG `tokens.json` (light/dark/core, `color-mix()` mixed out to hex
  for Figma/iOS/Android), and gzip/brotli are measured by the build
  again. `full.css` stays frozen at its 4.5 import set (ADR-0008) —
  per-component is the headline path.
- **Next:** TBD — post-4.9 ideas stay off-roadmap until the next scan
  picks them up.
- **Tests:** Chromium (19 a11y / 35 JS / 118 CSS, 2 engine-gated
  skips / 3 visual) · Firefox 144 passed, 12 skipped · WebKit 148
  passed, 7 skipped — green. Skips are engine-gated (interest invokers,
  SDA, base-select fallback; cross-doc VT lives gated on
  `pageswap`/`pagereveal`, proven live on Chromium; the v4.8
  forced-colors tests are chromium-gated emulation). One WebKit flake
  is known and pre-existing: the popover empty-roster Tab refocus test
  (js.spec, ADR-0006) intermittently misses the focus return on win32
  WebKit — it fails on a clean tree too. Specs touch the
  demo only through `tests/helpers.js`. Visual baselines are win32 and
  unchanged this arc (the theme switcher moved from the demo's inline
  script to `js/theme.js` with identical behavior). ubuntu/macos jobs
  stay behavior-only.
- **Build:** `index.css` 2.54KB gzip · `full.css` 10.01KB gzip —
  **frozen at its 4.5 import set** (ADR-0008); existing files still
  evolve under `npm run size`. Gzip (level 9) and brotli are measured
  by the build again: in-process zlib with a fresh-child-process
  fallback for the Node 26/Windows break, raw budget kept only as the
  last resort. New DTCG export `dist/tokens.json` ships outside the
  CSS payload.
- **History:** milestones 0.1 → 4.9.0 shipped; per-release detail lives
  in `CHANGELOG.md`. Arc shape: components & theming depth (0.x–2.x),
  namespace cleanup + deprecation policy (3.x), platform catch-up +
  layout + motion + selects/sticky tables (4.x), navigation
  transitions + bundle freeze (4.6), one-color theming + Studio +
  CSS-only primitives (4.7), validation finish + forced colors +
  DTCG export + measured sizes (4.8), theme persistence as the
  smallest honest opt-in JS (4.9).

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
- **Budget:** ≤ 10KB gzipped, enforced by `npm run size` on every check.
  Raw/gzip/brotli all reported; gzip is the contract because that's what
  most CDNs serve.

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
  `editorial`, `dashboard`, `playful`, `forest`, `sunset`, `coastal` —
  this is the marketing demo.
- `themes/custom.css` is a commented template for users' own themes.
- Color tokens are plain custom properties — no `@property` shipped
  (ADR-0005); register your own copy to animate a token.

### 3. JS-free interactivity

| Pattern | Primitive | JS needed |
|---|---|---|
| Dropdown / menu | Popover API (`popovertarget`) | none |
| Accordion | `<details data-accordion name>` | none |
| Tooltip | popover (`data-tooltip`) | none |
| Carousel | scroll-snap | none |
| Modal | `<dialog>` + `showModal()` | one native line |

**Decision (honest scoping):** `<dialog>` is *not* declarative — opening a
modal requires `showModal()`. The fully JS-free modal-like layer is the
Popover API. We ship both and document the difference. Tabs ship as the
`details[name]` accordion; true tabs with arrow-key navigation are an
opt-in JS module.

### 4. Accessibility out of the box

- Semantic HTML is the base: `button`, `ul/nav`, `dialog`, `details`,
  `th`. No div soup.
- Focus management inherited from the platform: focus traps, Esc-to-close,
  light-dismiss.
- Visible `:focus-visible` ring everywhere; AA contrast in the default
  palette; `prefers-reduced-motion` respected.
- Conformance page at `demo/index.html`: every component labeled with its
  WCAG level and a keyboard-only walkthrough.
- **CI:** axe-core on every PR + visual regression with committed
  baselines.

### 5. No "Bootstrap look"

- Neutral default palette: ink on paper, thin borders, no shadows,
  no gradients, small neutral radii.
- Every visual is a variable — "If you want blue, change one line."
- Six starter themes prove the point: they only override variables.

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

(v4 raised the contract explicitly: Chrome 125+, Firefox 128+,
Safari 26.2+.)

## Next

The v4.9 review menu is resolved: theme toggle + persistence shipped as
`js/theme.js` (see Snapshot); the layout-primitives idea was already
live since 4.x — `bf-container`/`bf-stack` in `utilities.css`, the
container-driven `[data-grid]` in `components/grid.css`, and the
`[data-layout]` app shell in `components/layout.css` — so nothing new
was built there; the command-palette module, a starter repo, and the
`@barefoot/core` vs `@barefoot/extended` package split were declined
(the palette violates pillar #3 — opt-in JS only where no native
primitive works; the starter is what `demo/` and the theme gallery
already are; the split fights ADR-0008, where per-component imports +
the frozen `full.css` already give the minimal path). The bundle freeze
from 4.6 stays recorded in ADR-0008 and pinned by test.

## Watch-list (no action until browsers fix it)

- `grid-template-rows: masonry` landing across engines — the v4.1
  `grid-lanes` variant then collapses to a one-liner.

## Decision log

Live decisions only — history lives in CHANGELOG and docs/.

- **Opt-in JS exists only where no native primitive works** — WAI-ARIA
  tab semantics (roving tabindex, panel hiding) and row sorting cannot
  be expressed in CSS. The consumer opts in (`js/tabs.js`,
  `js/table-sort.js`); semantics stay native; without JS pages stay
  valid. Popover menus get roving focus, not a modal trap — popovers
  are non-modal by design.
- **Theme persistence is the smallest honest opt-in JS.** `light-dark()`
  already follows the OS with zero script; what no native primitive does
  is wire switcher buttons and remember a choice — so `js/theme.js` does
  exactly that and nothing else: no `<theme-toggle>` custom element, no
  `matchMedia` listener, no theme state machine. `data-bf-theme` on
  `<html>` stays the single source of truth; the module validates names
  like every variant value and treats storage as best-effort.
- **Opt-in JS ships readable, not minified.** Auditable source is a
  feature of a zero-dependency framework.
- **Custom checkbox/radio skins stay cut; the switch ships.**
  `accent-color` themes checkboxes/radios for free; the switch
  genuinely needs drawing (track + thumb) while keeping native
  checkbox semantics.
- **The divider label lives on a real element, not `<hr>`.** Void
  elements can't hold text; `[data-divider]` applies to any
  text-holding element, the hairlines are decorative pseudo-elements.
- **Grid tracks never trust item min-content.** Every `[data-grid]`
  track list uses `minmax(0, …)` — bare `1fr` keeps each item's
  min-content width and overflows narrow containers (caught by the
  v2.4 viewport test).
- **The hamburger collapses at the nav's own width**, not the
  viewport — `[data-nav="header"]` is an inline-size container; the
  collapse fires inside sidebars/grid cells at the right moment.
- **`data-nav-js` arms only complete contracts.** The CSS hides
  nothing unless the module armed the nav (toggle + id'd list both
  present); no-JS-first holds in both directions.
- **Docs generate from source where drift hurts** — README sizes and
  the token tables regenerate on every `npm run check`; the `data-*`
  table in api.md is audited against `src/` in both directions.
- **Starter themes clear AA in both schemes.** The gallery renders
  every starter at once under axe (how four sub-AA pairs were caught);
  every new starter gets its card there on arrival.
- **Majors break by raising the floor, not renaming.** v3 spent its
  breaking budget on the `bf` namespace once; v4 spends it on the
  browser baseline and platform-obsoleted surface. Deprecations follow
  the api.md policy: announce → grace → removal, never silently, never
  without a concrete replacement. Engine-gap shims die only when
  upstream actually fixed the gap (gate-check first).
- **Platform primitives gate on `@supports` and degrade by omission.**
  No polyfill, no JS imitation, no half-rendered fallback. Corollaries
  from shipping 3.1: prefer anonymous timelines (`scroll(nearest …)`
  on the scroller's own pseudo) — named chains parse but can resolve
  unreliably on early WebKit; size pseudo-element slots in `%` (a
  container's own pseudos aren't its descendants, so `cqi` resolves
  against an ancestor); keep timeline longhands out of any rule an
  `animation` shorthand touches (see AGENTS.md).
- **`full.css` is frozen; per-component is the headline.** Since 4.6
  (ADR-0008) the bundle gains no imports — its list is pinned verbatim
  by test — while existing files keep evolving under `npm run size`.
  The advertised numbers are `index.css` + à-la-carte components;
  growth is opt-in by construction.
- **Deprecation notices warn on use, not on import.** `warnOnce` in
  lifecycle.js fires once per page, only when markup matches an
  announced surface; otherwise silent. Pinned by the lifecycle
  re-init spec.
- **Forced colors get structure, not color.** Under
  `forced-colors: active` the system palette erases author hues and
  box-shadows, so v4.8 restores affordances structurally — dashed
  invalid borders, real focus outlines, rings on background-only
  state cues — instead of re-asserting palette colors or reaching
  for `forced-color-adjust: none`. Shape survives any system theme.
- **The DTCG export resolves, it doesn't transcribe.** `tokens.json`
  carries values a designer can paste, not the CSS source: light-dark
  pairs split per scheme, aliases walked, `color-mix()` fallbacks
  mixed out to hex with the browser's own OKLab math, the oklch
  Chroma layer represented by its canonical fallbacks. Typed where
  DTCG has a type; honestly untyped where it doesn't (`none`,
  easing keywords). Pinned by source-parse tests.

## Non-goals

- No utility framework. The `.bf-*` set stays tiny and layout-only.
- No JS framework integration (no React/Vue wrappers).
- No IE/legacy support. Modern CSS is the point.
- No component classes for everything — elements first, always.
