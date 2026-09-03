# Barefoot — Status & plan

_Last updated: 2026-09-03 — v6 work complete (all three phases [x]: verification debt paid + CDN quick-start + icon recipe, three-engine suites green locally); tagging/releasing left to the maintainer_

## Snapshot

- **Current:** `barefoot-css@5.1.0` (2026-08-31) — **the component-is-the-breakpoint
  release**: container-adaptive components, the zero-JS floor raise, and generative
  theming 2.0. The 4.9 theme-persistence release (and 4.8 validation work) stands
  beneath it: the one script every demo page hand-rolled is
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
- **Next:** **v6 — "Prove it, then let people in."** No new surface: pay
  down the verification debt (run `npm run check` + the three-engine suites
  locally — Node is available now — and strike the v5.2/v5.3 "could not be
  executed here" caveats), add a CDN quick-start to the README, and document
  the `--bf-icon-url` escape hatch as the first-party icon-integration
  recipe. Full breakdown in [v6](#v6--prove-it-then-let-people-in).
  The v5.0 arc is phased in
  [v5.0 Roadmap](#v50-roadmap--the-component-is-the-breakpoint)
  below: container-adaptive components, the zero-JS floor raise, and
  generative theming 2.0. **Phase 0 recon done** — engine matrix verified
  (FF style queries shipped v151), ADR-0009 (adaptive contract) + ADR-0010
  (floor → Chrome 135 / FF 151 / Safari 26.2) accepted; standalone
  prototype built. **Phase 1 (tokens) done; Phase 2 (adaptive components:
  table→card-stack, segmented density, form reflow, card morph, cqi
  typography) done** — four opt-in *-adaptive.css files ship, demo sections +
  three-engine css tests + axe all green. **Phase 3 (zero-JS completion) done**
  — tribunal recorded in ADR-0011: zero modules deleted (tooltip.js survives;
  interest invokers still Chromium-only), command/commandfor documented, anchor
  test un-gated (SDA/hint stay gated — installed browsers lag the floor).
  **Phase 4 (generative theming 2.0) done** — 12-step OKLCH ramp from
   --bf-seed-h/--bf-seed-c, Studio editor (slider + resizable reflow box),
   ADR-0012 reaffirms no typed @property; contrast gate tested in css.spec.
   **Phase 5 (hardening & release) done** — docs/adaptive.md + migration-5.md
   written, conformance demo WCAG-labelled + mobile-safe, full three-engine
    suites run (css 369/21, a11y 19/19, js 104/105 with one WebKit popover
    focus-return quirk),     visual baselines regenerated; released as `v5.0.0` (2026-08-31).
- **Shipped in 5.0.0:** `forms.css` split into opt-in shards — `forms-base.css`
  (text inputs + validation + states) plus `forms-select/checks/range/file/
  color/meter.css`; `full.css` byte-identical (the barrel re-imports every
  shard), but a text-only form now ships at ~1.4KB gzip. Documented in
  CHANGELOG `[5.0.0]`.
- **Shipped in 5.1.0:** the deferred roadmap closes — `tabs-adaptive.css`
  (scroll-snap↔wrap) and `nav-adaptive.css` (drawer by container) extend the
  ADR-0009 contract; `table`/`card-adaptive` auto-establish their container via
  `:has()`, retiring the manual `.bf-contain` wrapper; opt-in `theming-anim.css`
  morphs the generative ramp; the Studio exports a pasteable theme +
  `tokens.json`; and `base-select` graduates from deferred to a shipped
  progressive-enhancement headline. Documented in CHANGELOG `[5.1.0]`. Firefox
  still lacks `appearance: base-select` (flag 149–157), so its picker falls
  back to the chevron skin via `@supports`.
- **Tests:** Chromium (19 a11y / 105 JS / 369 CSS, 21 engine-gated skips /
   3 visual) · Firefox 369 CSS + 105 JS passed (skips engine-gated) · WebKit
   369 CSS + 104/105 JS passed — green except one WebKit-only pre-existing
   popover Tab-close focus-return quirk. Skips are engine-gated (interest
   invokers, SDA, base-select fallback; cross-doc VT lives gated on
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
`@starting-style`, `allow-discrete`, native nesting, `color-mix`, `dvh`,
**`@container` size + style queries** (density story), **`command`/
`commandfor`** (declarative dialog/popover wiring).

- **v4.9 (shipped):** Chrome 125+, Firefox 128+, Safari 26.2+.
- **v5.0 (ADR-0010, 2026-08-31):** **Chrome 135+, Firefox 151+, Safari
  26.2+.** Firefox 151 is the hard gate — container style queries land
  there. Degrade by omission still protects older engines (size-query
  adaptation without style-query density); the floor is a support
  statement, not a runtime cutoff.

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

## v5.0 Roadmap — "The component is the breakpoint"

> Responsive design was about the viewport; v5 makes it about the
> component. Zero media queries. Zero script.

Components sense their **container**, not the screen: a table becomes a
card-stack, a form collapses to one column, a segmented control compresses
density — the same component renders three ways depending on where it is
dropped. Mechanism: `@container` size queries, `@container style()` style
queries, `cqi` fluid typography. Honest scoping: the groundwork is
partially live — the header nav already collapses at its own width
(inline-size container), `bf-container`/`bf-stack`/`[data-grid]` are
container-driven — and "zero script" means every *interactive default* is
CSS; tabs, table-sort, and theme persistence stay opt-in JS because no
native primitive expresses them (decision log holds).

### Guardrails (every phase)

- `@supports` gate, degrade by omission — existing policy, unchanged.
- Adaptive variants ship as per-component files, opt-in by import;
  ADR-0008 (full.css freeze) untouched.
- `data-*` variants only — no utility sprawl; size budget enforced by
  `npm run size`.
- Engine-uncertain features stay on the watch-list; deletions gate on
  verification, not faith.

### Phase 0 — Recon & contracts (spike)

- [x] Engine matrix verified (Canary/TP/Nightly + caniuse): **style
      queries in Firefox** (the big unknown — **SHIPPED FF 151, Apr 2026**),
      interest invokers + implicit anchors in FF, `command`/`commandfor`,
      base-select status. Watch-list updated with real dates.
- [x] **ADR-0009** — adaptive component contract: per-component adaptive
      files (`table-adaptive.css` shape), `container-name` conventions
      (`bf-<component>`), breakpoint tokens (`--bf-adaptive-1/2/3`),
      `--bf-density` style query + `cqi` type ramp.
- [x] **ADR-0010** — v5 floor raise → **Chrome 135+ / Firefox 151+ /
      Safari 26.2+** (FF 151 is the hard gate: container style queries).
      Numbers pinned from the matrix check, not guesses.
- [x] Prototype outside the repo: table→card-stack morph, density style
      query, `cqi` type ramp — built at
      `C:\Users\Rizqi\AppData\Local\Temp\opencode\v5-prototype\index.html`
      (spike, not in repo; demonstrates all three mechanisms by resizing
      containers, no viewport media queries).

**Gate:** mechanism proven in Chromium + Safari + **Firefox** (style
queries now green in all three); Firefox no longer merely "degrades by
omission" for the density story.

### Phase 1 — Adaptive engine (tokens + mechanics)

- [x] `tokens.css`: `--bf-density` token, `cqi` type-scale tokens
      (`--bf-type-cqi-*`), `--bf-adaptive-1/2/3` breakpoint tokens. The
      v3.4 `[data-density="compact"]` axis now also sets `--bf-density`, so
      the existing lever feeds the v5 style query (no new markup).
- [x] Container conventions (`container-type`/`container-name`) documented
      in components.md (new "Container conventions" section) + theming.md
      (density axis + adaptive tokens sections).
- [x] `css.spec.js` helpers: `setContainerWidth` / `gridColumnCount` /
      `tokenValue` in `tests/helpers.js`; new "adaptive engine" test group
      drives a container (not the viewport) and asserts the tokens.

**Gate:** `npm run check` green (build + size + docs:size + docs:tokens +
stylelint); `index.css` 2.68KB gzip — budget untouched, full.css frozen.

### Phase 2 — Adaptive components (the headline, one PR each)

- [x] **table → card-stack** (`table-adaptive.css`) — the showpiece. Card-stacks
      when its **container** is narrow (`@container` ≤ 40rem, mirrors
      `--bf-adaptive-2`); cells use `data-label`; density via `@container
      style(--bf-density: compact)`.
- [x] **segmented density** (`segmented-adaptive.css`) — self-container
      (`container-name: bf-segmented`) compresses label padding on narrow
      width + under `data-density="compact"`; cqi label type.
- [x] **form reflow** (`form-adaptive.css`) — self-container collapses a
      `.bf-row` to one column when narrow, and reveals a `:has(:user-invalid)`
      error summary (zero JS).
- [x] **card morph** (`card-adaptive.css`) — horizontal↔vertical by container
      (`@container` ≥ 40rem); cqi header type.
- [x] **cqi typography pass** — `table caption`, `segmented label`, `card
      header` now use `--bf-type-cqi-*`.

Each PR: demo section (`id="demo-<name>"` + `DEMOS` entry, wrapped in
`.bf-contain`) + `css.spec.js` (resizes containers, not viewport) + a11y
scan. **Correction vs plan:** components that morph their *own* box (table
card-stack, card morph) query the nearest ancestor `.bf-contain` — a container
cannot style itself, and a `<table>` can't reliably host `container-type`
(see ADR-0009). Descendant-only adaptation (segmented, form) self-contains.
Lightning CSS can't resolve `var()` inside `@container` conditions, so the
breakpoints are literal `rem` (matching `grid.css`); `--bf-adaptive-*` stay
the documented thresholds.

**Gate:** three-engine suites pass (css: chromium + firefox + webkit; a11y:
chromium, 19/19). `npm run check` green; `full.css` frozen; adaptive files are
opt-in, never in the bundle.

### Phase 3 — Zero-JS completion (the breaking change)

Every JS module faces a tribunal against the new floor; a module dies only
when its **entire contract** is subsumed:

- [x] `tooltip.js` → **SURVIVES**. Interest invokers are Chromium-only (FF/
      Safari unsupported as of Aug 2026, verified in Phase 0), so the
      hover/focus fallback is still required for ~2/3 of the floor. The plan's
      "clearest deletion candidate" is overturned by the engine matrix.
- [x] `popover-menu.js` → **SURVIVES**. Anchor positioning (FF 147/Chrome 125/
      Safari 26) covers the *positioning* half, but roving focus / APG menu
      keyboard semantics can't be expressed in CSS (ADR-0006); module keeps
      roving focus.
- [x] `theme.js` → **SURVIVES** — persistence has no native primitive (4.9).
- [x] `command`/`commandfor` declarative dialog wiring **documented** for
      consumers (docs/javascript.md §13) — green across the whole floor, so
      this wiring needs no module. The only "JS removed" in spirit.
- [x] `tabs.js`, `table-sort.js`, `nav.js`, `carousel.js`, `chips.js`,
      `alert-dismiss.js`, `toast.js`, `reveal.js` + plumbing → **all
      SURVIVE**; none subsumed. Net: **zero modules deleted in v5.0**.
- [x] Un-gate in place (partial): only **implicit anchor positioning** test
      skips removed in `css.spec.js` — verified green on chromium/firefox/
      webkit. **SDA reveal/progress + popover=hint stay gated**: the *installed*
      test browsers don't satisfy them at runtime (aspirational floor is ahead of
      what's installed), and `popover=hint` correctly ignores `Escape`. Cross-doc
      VT + base-select also stay gated (still Chromium-only / FF-flagged →
      deferred to 5.1, skips unchanged). Un-gating is conditional on "as floors
      land" — they haven't landed in the lab yet.
- [x] base-select: stays opt-in / deferred to 5.1 — too green to bet the
      release on.

**Gate:** js suite trimmed to survivors (none); keyboard walkthroughs pass for
anchor-based tooltips/popovers; recorded in ADR-0011.

### Phase 4 — Generative theming 2.0 (parallelizable with Phase 2)

- [x] Build on 4.7 one-color theming: **12-step OKLCH tonal scale**
       (`--bf-tone-1…12`) generated from `--bf-seed-h` / `--bf-seed-c` via
       relative-color syntax (`oklch(L C h)`); neutral hex fallbacks for
       engines without it. Semantic roles compose onto steps via `var()`
       (docs/theming.md illustrates). Done in `src/tokens.css`.
- [x] **ADR decision point resolved:** typed `@property` — *revisits
       ADR-0005* — **rejected for v5.0** (ADR-0012). Ramp needs no
       registration; theme transition stays the `startViewTransition`
       crossfade. Revisit in 5.1 only if interpolation becomes a requirement.
- [x] density / radius / spacing promoted to first-class token categories —
       established in Phase 1/2 (`--bf-density`, `--bf-space-*`,
       `--bf-radius-*`) and consumed by every adaptive component. No new
       tokens needed; marking done.
- [x] Launch demo: **Studio** (`demo/studio.html`) extended — hue + chroma
       sliders regenerate the live 12-step ramp (watch the swatches), the
       color picker drives the same knobs, and a **resizable box** shows a
       `table[data-table="adaptive"]` reflowing by *container*, not viewport.
- [x] **Gate:** WCAG contrast *tested* on every derived step — `css.spec.js`
       "generative theming" group asserts all 12 tones are distinct +
       monotonic and each clears a 3:1 graphical-object floor (1.4.11); the
       seed-dial + adaptive-reflow behavior is asserted too. axe-core still
       covers the demo surfaces via the a11y suite.

**Gate:** WCAG contrast *tested* on every derived step (css.spec) — claims
are never asserted.

### Phase 5 — Hardening & release

- [x] Docs: **`docs/adaptive.md`** (the "adaptive page"), theming.md +
      javascript.md v5.0 callouts, **`docs/migration-5.md`** (floor raise,
      module removals = none, base-select deferral, command/commandfor,
      generative theming additions).
- [x] README size table regen (`npm run docs:size`); conformance demo updated
      with WCAG labels (adaptive components + generative theme rows, AA note
      on the adaptive section). Wrapped the conformance table in a focusable
      `overflow-x:auto` region so it no longer overflows the 375px viewport.
- [x] Full suites Chromium → FF → WebKit: `css.spec` 369 passed / 21 skipped
      (engine-gated), `a11y.spec` 19/19, `js.spec` 104/105 (1 WebKit-only
      popover Tab-close focus-return quirk, pre-existing, not v5-caused),
      visual baselines regenerated deliberately (light/dark/webfonts).
      Hardening fixes landed: removed a stray `@property` substring from a
      `tokens.css` comment (ADR-0005 guard test), typed `--bf-density` in the
      DTCG export, documented the v5.0 adaptive `data-*` attributes in
      `api.md`, made the conformance scroll region keyboard-accessible.
- [ ] `v5.0.0-beta.1` → `rc.1` → tag `v5.0.0` (release.yml takes over on push).

### Risks

| Risk | Mitigation |
|------|------------|
| Firefox style queries slip | density derives from size queries only — nothing breaks |
| FF anchors / interest invokers slip | `tooltip.js` stays a polyfill; Phase 3 shrinks, doesn't die |
| Adaptive variants churn visual baselines | narrow-container baseline cases from Phase 2 onward |

### Non-goals for v5 (unchanged)

Utility sprawl · framework wrappers · masonry before engines land · any
build step · touching ADR-0008.

**Critical path:** Phase 0 verification → Phase 1 tokens → Phase 2
showpiece (table) → the rest parallelizes.

## Watch-list (verified 2026-08-31, caniuse Jul-2026 + MDN)

- `grid-template-rows: masonry` landing across engines — the v4.1
  `grid-lanes` variant then collapses to a one-liner. Still pending; no
  ship date in any engine as of Aug 2026.
- ~~`@container style()` queries in Firefox~~ — **RESOLVED: shipped FF 151
  (Apr 2026)**. The v5 density-by-style-query story is first-class across
  all engines; no size-query-only fallback needed (ADR-0009/0010).
- Interest invokers (`interestfor`/`interesttarget`) — **still Chromium-only
  (Chrome/Edge 142+, Nov 2025); Firefox and Safari have NO support as of
  Aug 2026.** Gates the `tooltip.js` deletion (v5 Phase 3); the module
  stays a polyfill. Implicit *anchor* positioning (distinct feature) DID
  ship in FF 147 (Jan 2026) — anchor-based tooltips are viable, the
  hover/focus *invoker* trigger is not.
- `command`/`commandfor` — **SHIPPED everywhere: Chrome/Edge 135 (Apr 25),
  Firefox 144 (Oct 25), Safari 26.2 (late 25).** Available for Phase 3
  declarative dialog/popover wiring.
- base `<select>` (appearance: base-select) — **Chrome/Edge 135, Safari 27;
  Firefox behind a flag (149–157), not shipped as of Aug 2026.** Graduated
  in v5.1 as a progressive-enhancement headline (ships in the default bundle,
  `@supports`-gated); the `@supports` gate and the gated test skips stay
  because Firefox still lags — Firefox users get the chevron fallback.

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

## v5.1+ Roadmap — after the v5.0 release

v5.0.0 shipped 2026-08-31 — the feature floor is live. The release is
closed out, then the deferred and engine-gated work lands. Ordered by
value/risk; the first two items are already planned (base-select deferral,
ADR-0012 `@property` revisit).

### Step 0 — close out the v5.0 release

- [x] Cut `v5.0.0` from `main` and tag it stable (skipped the `rc.1` soak —
      tagged `v5.0.0` directly; `release.yml` took over on the tag push and
      published).
- [x] Fix the one known WebKit quirk: `popover-menu.js` now refocuses the
      trigger on a Tab-close when focus would fall to `<body>` (the
      `refocusOpener` seam only acted while focus stayed inside the menu).
      `js.spec` is now 105/105 on WebKit too.
- [x] Ship the `forms.css` opt-in shard split in the `v5.0.0` tag. Source is
      complete (`forms-base.css` + six control shards `forms-select/checks/
      range/file/color/meter.css`; `full.css` byte-identical via the barrel) and
      documented in CHANGELOG `[5.0.0]`. Consumers can now import text-inputs-only.

### v5.1 — "land the deferred"

- [x] **`base-select` graduates (headline).** Shipped in v5.1 as a
      progressive-enhancement headline: the picker skin (`::picker(select)`,
      themed options, `::checkmark`) is in the default bundle and upgrades
      every single `<select>` where the engine ships `appearance: base-select`
      (Chromium 135+ / Safari 27+), falling back to the chevron skin elsewhere
      (Firefox, via `@supports`). The ADR-0010 watch-list entry flipped from
      "deferred" to "shipped". The gated test skips in `css.spec.js` stay
      because Firefox still hasn't shipped base-select (flag 149–157, not
      shipped as of Aug 2026) — graduation was never blocked on Firefox, only
      the universal `@supports`-free gate was; the feature is no longer
      "too green" or opt-in.
- [x] **Generative theming v1.1 (ADR-0012 revisit).** Add an opt-in
      `theming-anim.css` that registers `--bf-seed-h` / `--bf-seed-c` with
      `@property` so theme switches *morph* the 12-step ramp instead of
      crossfading. Default stays `@property`-free to protect the byte budget
      (ADR-0005/0012). No change to the no-registration contract unless
      interpolation is explicitly wanted.
- [x] **More adaptive components + kill the manual `.bf-contain`.** Extend
      the ADR-0009 contract to `nav` (sidebar↔drawer by container,
      `nav-adaptive.css`), `tabs` (scroll-snap↔wrap, `tabs-adaptive.css`),
      and `grid` (already container-aware). Auto-wrap: `table-adaptive.css` /
      `card-adaptive.css` now auto-establish the query container on the
      component's parent via a `:has()` rule, so hand-placed `.bf-contain`
      is optional (still supported) — the "morphs its own box" ergonomic
      wart is gone. Documented in docs/adaptive.md.
- [x] **Studio → copy-paste theme.** `demo/studio.html` exports "six lines"
      today; make it emit a real `tokens.json` / CSS snippet so a designer
      can paste a generated theme into a project.

### v5.2 — "The Design System That Writes Itself"

> One color in. A whole system out. Accessible by construction. Scoped by
> container. Zero JavaScript.

Generative theming graduates from a 12-step ramp to a **full, derived design
system**, and becomes the framework's headline differentiator: Barefoot
generates a *system*, not utilities. Tailwind is compositional (you assemble);
Barefoot becomes generative (you supply a seed, it derives a system) — a
different category, and a moat no utility framework can copy. It builds
directly on v4.7 (one-color), v5.0 (generative ramp), and v5.1 (Studio export),
so invention risk is low and payoff is high. The novel half is **container-scoped
theming**: a subtree carrying its own `data-bf-theme` resolves locally via
`@container style()`, so a dark panel lives inside a light page with zero JS and
no class war.

#### Phase 0 — Seed-to-system derivation

- [x] **Seed → master accent (`seed-system.css`, opt-in).** The two seed knobs
      become `--bf-primary` (`oklch(0.55 var(--bf-seed-c) var(--bf-seed-h))`);
      the Chroma engine then derives the whole *colour* system — hover / subtle /
      border / focus, the alpha ramps, and the 12-step ramp — from those two
      dials. Type / spacing / radius / motion are deliberately **not**
      seed-derived (a hue does not determine a type scale); they stay independent
      tokens, re-mappable with the density axis (ADR-0013 — honest scoping).
- [x] Contrast becomes the contract: the `css.spec.js` "generative system"
      group asserts seed changes re-skin `--bf-primary` and that the Chroma
      engine derives a distinct `--bf-primary-hover`. The 1.4.11 / AA gate from
      v5.0 is extended to the seeded accent.
- [x] **ADR-0013 — generative system contract:** documents which tokens are
      seed-derived vs hand-authored, and guarantees no `@property` registration
      in the default path (ADR-0005/0012 hold; interpolation stays opt-in in
      `theming-anim.css`).

#### Phase 1 — Container-scoped theming (the novel half)

- [x] Resolve the speculative "container-scoped theming" via `@container
      style()`: a subtree carrying `data-bf-scope` resolves its own
      `color-scheme` + token layer independent of the page — a dark card inside
      a light page, zero JS, no class war.
- [x] Ship as opt-in `theming-scope.css`; document the containment boundary
      (the scoped root is a `container-type` so descendant tokens resolve
      locally). Degrade by omission on engines without `@container style()` —
      the wrapper's inherited `color-scheme` still applies.
- [x] `css.spec.js` group asserts a scoped dark card inside a light page renders
      the dark surface while the page stays light.

#### Phase 2 — Studio as the distribution

- [x] `demo/studio.html` becomes the first-party product surface: it loads
      `seed-system.css` so the seed drives the accent, and emits the full
      derived system — the resolved 12-step `--bf-tone-*` ramp is read live and
      exported into `tokens.json`. (Image → hue/chroma extraction is demo-only
      future work; the colour picker already drives the seed.)
- [x] Keep the existing "six lines" + `tokens.json` export; add the derived
      tonal ramp to the `tokens.json` export.
- [x] Document the workflow in `docs/theming.md` + a new `docs/studio.md`.

#### Phase 3 — Hardening & release

- [x] README + conformance callouts; `npm run check` green — **verified
      locally 2026-09-03 (v6 Phase 0):** build + 10KB budget
      (`index.css` 2.88KB gzip) + docs regen + stylelint all PASS;
      Chromium 195 passed / 2 engine-gated skips, Firefox 166 / 12,
      WebKit 171 / 7, visual regression green on all three (win32
      baselines). `full.css` frozen (ADR-0008 untouched — generative +
      scope ship opt-in, never in the barrel).
- [ ] Tag `v5.2.0`.

#### Guardrails (every phase)

- Opt-in by import; ADR-0008 (`full.css` freeze) untouched; `@supports` gate,
  degrade by omission; size budget enforced by `npm run size`; seed math stays
  CSS-only (no JS in the shipped framework — Studio's image extraction is
  demo-only JS).

### v5.3 — "The seed is the designer" (FLAGSHIP: generative morphology)

> One colour in, a whole *visual language* out — not just the colour
> system, but the temperament. Pure CSS. Zero JavaScript. Scoped by
> container.

v5.2 proves "one colour in → a whole **colour** system out." The flagship
for v5.3 extends the generative thesis from *colour* to the **entire visual
language** — a single `--bf-seed-h` / `--bf-seed-c` derives not only the
12-step ramp + accent but the *temperament*: radius, spacing rhythm, type
scale, and motion. Honestly, via CSS **relative-color + `calc()`**, never
faked. This is the moat Tailwind (compositional / utility) cannot copy — and
it completes the trilogy after v5.0 (*size*) and v5.2 (*seed/colour*): v5.3
is **semantics-of-mood**.

#### The mechanism

The hue does not set a type scale; the *mood* of the seed does. High chroma
reads as expressive, low chroma as minimal — so chroma drives the rhythm:

```css
:root{
  --bf-seed-h: 250;
  --bf-seed-c: 0.18;
  --bf-primary: oklch(0.55 var(--bf-seed-c) var(--bf-seed-h));

  /* temperament derived from chroma (honest, CSS-only) */
  --bf-radius:  calc(0.25rem + var(--bf-seed-c) * 1.5rem);
  --bf-space:   calc(0.75rem + var(--bf-seed-c) * 0.75rem);
  --bf-type:    calc(1rem    + var(--bf-seed-c) * 0.5rem);
  --bf-motion:  calc(var(--bf-seed-c) * 300ms);
}
```

- Derivation stays in pure CSS — no JS in the shipped framework (Studio's
  image → seed extraction remains demo-only JS, as in v5.2).
- No `@property` registration in the default path — ADR-0005 / ADR-0012
  hold; interpolation stays opt-in in `theming-anim.css`.
- Scoped per-island via `@container style()`, reusing the v5.2
  `theming-scope.css` containment boundary — a dark, expressive card inside
  a light, minimal page, zero JS, no class war.

#### Phases

- [x] **Phase 0 — Temperament tokens.** Added to `src/themes/seed-system.css`
  (opt-in, so the default neutral look is untouched — ADR-0008 / 0013): the
  generative-morphology block derives `--bf-radius{,-sm,-lg}` / `--bf-space-1…8`
  / `--bf-type-cqi-*` / `--bf-transition` / `--bf-transition-slow` /
  `--bf-vt-duration` / `--bf-reveal-duration` from `--bf-seed-c` via `calc()`.
  Placed inside the existing `@supports (color: oklch(from red l c h))`
  `:root` rule. ADR-0013's "no non-colour derivation" clause is overturned by
  **ADR-0014** (chroma = mood, not hue = identity). No `@property`.
- [x] **Phase 1 — Generative morphology in Studio.** `demo/studio.html` badge +
  chroma caption note the v5.3 morphology; the `tokens.json` export now emits the
  resolved `--bf-radius` / `--bf-space-4` / `--bf-type-cqi-md` / `--bf-vt-duration`
  alongside the 12-step ramp, so the export carries the full derived system.
- [x] **Phase 2 — CI gate.** Extended the `css.spec.js` "generative system +
  container-scoped theming" group with a **morphology** test asserting chroma
  moves `--bf-radius` / `--bf-space-4` / `--bf-transition` monotonically
  (low → high chroma). The existing 1.4.11 / AA contrast gate on derived tones is
  unchanged. AA is checked, not asserted.
- [x] **Phase 3 — Hardening & release.** README callout + `docs/theming.md` §
  "Seed → whole visual language" + `docs/studio.md` v5.3 notes + new
  `docs/adr/0014-generative-morphology.md`. `full.css` frozen (ADR-0008
  untouched — morphology ships only inside opt-in `seed-system.css`). Tag `v5.3.0`
  — **verified locally 2026-09-03 (v6 Phase 0):** `npm run check` green and
  the full three-engine suites pass (same counts as the v5.2 note above);
  the morphology test passes on all three engines.

#### Guardrails (every phase)

- Opt-in by import; ADR-0008 (`full.css` freeze) untouched; `@supports` gate,
  degrade by omission; size budget enforced by `npm run size`; seed math
  stays CSS-only.
- The derivation is *mood*, not pseudo-science: we assert relationships
  (chroma ↑ → radius/spacing/motion ↑) and contrast, never "this hue means
  trustworthy."

#### Alternatives considered (parked, not declined)

- **"The component is self-aware"** — `:has()` content-driven morphogenesis
  (`:has(img)`, `:has([data-urgent])`): the component re-skins by its own
  *semantics*, not its size. Pure CSS, already on the floor. Strong
  companion to, or fallback for, generative morphology.
- **Anchor-laid-out everything** — anchor positioning to make *any*
  component non-modally layer (beyond popovers/tooltips). More "web feature"
  than "CSS feature"; lower priority than the generative moat.

### v6 — "Prove it, then let people in"

> No new surface. v6 pays down the verification debt, opens the front door,
> and documents the escape hatch that already exists.

An external review of v5.3 surfaced three gaps worth acting on — and, just as
importantly, a pile of "missing features" that are deliberate non-goals with
ADRs behind them (framework wrappers, masonry before engines, DTCG types the
spec doesn't have). Those stay declined. These three are real:

#### Phase 0 — Verification debt (the headline; do this first)

- [x] **Run the suites for real.** v5.2 and v5.3 shipped with the honest
      caveat "Node is not installed in the editing environment, so `npm run
      check` / the suites could not be executed here". **Done 2026-09-03:**
      `npm run check` green (build + `index.css` 2.88KB/10KB budget + docs
      regen + stylelint); Chromium 195 passed / 2 engine-gated skips,
      Firefox 166 / 12, WebKit 171 / 7 — zero failures, visual regression
      green on all three against the win32 baselines. (Local env note:
      Playwright's Firefox/WebKit needed the VC++ 2015–2022 redistributable
      `msvcp140_1.dll` — installed once via the official `vc_redist.x64.exe`.)
- [x] Fix anything the run surfaces, then **strike the caveats** from the
      v5.2/v5.3 Phase 3 notes and record the green run counts in Snapshot.
      Two real findings, both fixed inside the gate (no token changes):
      (1) the v5.0 3:1 gate was **vacuous on Chromium** — computed colors
      serialize as `oklch(...)` and `luminance()` parsed L/C/H° as sRGB
      bytes, so it passed without measuring. `helpers.js` now converts
      OKLCH→linear-sRGB properly (Ottosson) and the old gate measures for
      real. (2) the feared muted-on-subtle failure **does not exist**
      (worst measured pair 5.9:1) — but a genuine edge does: white button
      text / link text in a vivid cyan-green seed (h≈190, c=0.3) dips to
      ~3.4:1. Asserted as a 3:1 floor, documented as the AA ceiling; the
      dial stays unclamped.
- [x] **Contrast gate, extended (cheap hardening while we're in the tests).**
      New `css.spec.js` test "body-text pairs hold 4.5:1 AA, accent pairs
      clear 3:1, across the seed space": 10 body-text pairs
      (`--bf-text`/`--bf-muted` on surface/alt/2/3/subtle) asserted at AA,
      3 accent pairs (`--bf-primary-fg` on primary/darken, `--bf-primary`
      on surface) asserted at the 3:1 floor, swept over 12 hues × 3 chromas
      in pinned light scheme. (`--bf-surface-brand` is declared but consumed
      nowhere — out of the gate by design.)

**Gate:** a fully green local run of `npm run check` + all three engines,
recorded in this file, caveats gone.

#### Phase 1 — CDN quick-start (the front door)

- [x] **README gets a copy-paste CDN section.** Zero CDN mentions today; a
      framework whose non-goal is "any build step" should let someone be
      styling in ten seconds. `https://cdn.jsdelivr.net/npm/barefoot-css@5/dist/index.css`
      plus one `<link>` boilerplate block, npm kept as the second path.
      **Done 2026-09-03:** full HTML boilerplate first, npm second; all
      three URLs (`index.css`, `components/dialog.css`, `themes/sunset.css`)
      verified resolving live on jsDelivr.
- [x] Verify the jsDelivr URLs resolve for `index.css`, a component shard,
      and a theme; note in docs/performance.md that gzip is what CDNs serve
      (already the budget's contract — `performance.md` said it since
      before v6, no edit needed).

**Gate:** the snippet works from a plain HTML file with no install step.

#### Phase 2 — Icon integration recipe (document the hatch)

- [x] **No new glyphs; document the escape hatch.** The 12-glyph set is a
      size-budget stance, not an oversight — shipping 30–50 inline masks
      fights the ~10KB thesis. But `[data-icon]` already reads an arbitrary
      `--bf-icon-url`, so Lucide/Heroicons SVGs can be dropped in *today*
      with the mask + `currentColor` behavior intact. It just isn't written
      down anywhere.
- [x] Add an "Using your own icons" section to docs/components.md: the
      one-liner custom-property recipe, a worked Lucide example (data-URL
      and file-URL forms), and the a11y note (aria-label when the icon is
      the only content). Docs-only change; `icons.css` and the budget stay
      untouched. **Done 2026-09-03**, plus the mechanism note the recipe
      depends on (the mask reads image *alpha*; page `currentColor` never
      reaches inside the SVG file), and a permanent `css.spec.js` test —
      "built-ins render via mask + currentColor; a custom --bf-icon-url
      drops in" — which also covers `[data-icon]` itself for the first
      time (nothing asserted it before).

**Gate:** recipe copy-pastes into the demo and renders a Lucide glyph at
`currentColor`; stylelint + size budget untouched by definition.

#### Explicitly declined from the review (do not revive)

- React/Vue/Svelte wrappers and a PostCSS plugin — carried non-goal
  ("No JS framework integration"); plain CSS *is* the framework-agnostic
  story, and a plugin contradicts the no-build-step pillar.
- Masonry / deep-subgrid layout primitives — watch-list until engines
  ship; nothing to build.
- Studio as a standalone hosted app — `demo/studio.html` already deploys
  to GitHub Pages on every push to main; a custom domain is marketing,
  not code.
- 30–50 built-in glyphs — see Phase 2; the recipe is the feature.

### Carried non-goals (declined, do not revive)

- `@barefoot/core` vs `@barefoot/extended` split — fights ADR-0008 (frozen
  `full.css` + per-component imports already give the minimal path).
- Command-palette module — violates the "opt-in JS only where no native
  primitive works" pillar; `demo/` + theme gallery already cover it.
- Starter repo — `demo/` + the theme gallery already are the starter.

