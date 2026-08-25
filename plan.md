# Barefoot — Status & plan

_Last updated: 2026-08-25 — v4.5.0 shipped_

## Snapshot

- **Current:** `barefoot-css@4.5.0` (2026-08-25) — customizable
  `<select>` (`appearance: base-select` picker skin, `@supports`-gated,
  degrade by omission) plus sticky table head/column variants. All
  additive.
- **Next:** TBD — post-4.5 ideas stay off-roadmap until the next scan
  picks them up.
- **Tests:** Chromium 146 (19 a11y / 29 JS / 101 CSS / 3 visual) ·
  Firefox 138, 4 skipped · WebKit 138, 4 skipped — green; skips are
  engine-gated (interest invokers, SDA, the base-select chevron
  fallback). WebKit ships base-select too, so the picker specs run on
  both Chromium and WebKit. Specs touch the demo only through
  `tests/helpers.js`. Visual specs run Windows-only in CI (win32
  baselines); ubuntu/macos jobs stay behavior-only.
- **Build:** `index.css` 2.31KB gzip (unchanged) · `full.css` 9.55KB
  gzip (+0.23KB, ~0.45KB headroom under the 10KB budget). Gzip is
  measured by hand at level 9: since the zlib bypass on Node
  26/Windows, `npm run check` enforces only the 3× raw fallback.
- **History:** milestones 0.1 → 4.5 shipped; per-release detail lives
  in `CHANGELOG.md`. Arc shape: components & theming depth (0.x–2.x),
  namespace cleanup + deprecation policy (3.x), platform catch-up +
  layout + motion + selects/sticky tables (4.x).

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

Post-4.5 ideas stay off-roadmap until the next scan picks them up.

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
- **Deprecation notices warn on use, not on import.** `warnOnce` in
  lifecycle.js fires once per page, only when markup matches an
  announced surface; otherwise silent. Pinned by the lifecycle
  re-init spec.

## Non-goals

- No utility framework. The `.bf-*` set stays tiny and layout-only.
- No JS framework integration (no React/Vue wrappers).
- No IE/legacy support. Modern CSS is the point.
- No component classes for everything — elements first, always.
