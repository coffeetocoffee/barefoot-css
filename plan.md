# Barefoot — Status & plan

_Last updated: 2026-08-31 — v4.9.0 shipped (theme toggle + persistence — `js/theme.js`) · v5.0 Phase 0 recon complete (engine matrix verified, ADR-0009 + ADR-0010 accepted); prototype pending_

## Snapshot

- **Current:** `barefoot-css@5.0.0` (2026-08-31) — **the component-is-the-breakpoint
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
- **Next:** **v5.1+ — "land the deferred."** v5.0.0 ("The component is the
  breakpoint") shipped 2026-08-31; the deferred and engine-gated work lands in the
  [v5.1+ Roadmap](#v51-roadmap--after-the-v50-release) below. The v5.0 arc is phased in
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
  Firefox behind a flag (149–157), not shipped as of Aug 2026.** Deferred
  to v5.1 per plan; not in the v5 floor.

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

- [ ] **`base-select` graduates (headline).** Un-gate the picker skin once
      Firefox ships `appearance: base-select` (flag dropped ~157; plan:
      "too green to bet the release on"). Today it is `@supports`-gated
      (Chromium 135+ / Safari 27); flip the watch-list entry from
      "deferred" to "shipped" and remove the gated skip in `css.spec.js`.
- [ ] **Generative theming v1.1 (ADR-0012 revisit).** Add an opt-in
      `theming-anim.css` that registers `--bf-seed-h` / `--bf-seed-c` with
      `@property` so theme switches *morph* the 12-step ramp instead of
      crossfading. Default stays `@property`-free to protect the byte budget
      (ADR-0005/0012). No change to the no-registration contract unless
      interpolation is explicitly wanted.
- [ ] **More adaptive components + kill the manual `.bf-contain`.** Extend
      the ADR-0009 contract to `nav` (sidebar↔drawer by container),
      `tabs` (scroll-snap↔wrap), and `grid` (already container-aware). Then
      auto-wrap: let authors skip hand-placing `.bf-contain` via a
      `:has()`-based heuristic or a `data-adaptive` on the section — the
      "morphs its own box" rule is the one ergonomic wart.
- [ ] **Studio → copy-paste theme.** `demo/studio.html` exports "six lines"
      today; make it emit a real `tokens.json` / CSS snippet so a designer
      can paste a generated theme into a project.

### v5.2+ — un-gate the engine-gated (speculative, flag before starting)

- [ ] **Scroll-driven animations green on Firefox.** Phase 3 found the
      *installed* FF build (1538) did not enable SDA at runtime, which is
      why reveal/progress stay gated. Once a Firefox with SDA ships, those
      tests flip green (no source change needed — just drop the skip).
- [ ] **Cross-document view transitions on Firefox/WebKit** once
      `pageswap`/`pagereveal` land there (today Chromium-only, gated).
- [ ] **Container-scoped theming** — a dark component inside a light page via
      `@container style()`. Powerful but risky; treat as experimental.

### Carried non-goals (declined, do not revive)

- `@barefoot/core` vs `@barefoot/extended` split — fights ADR-0008 (frozen
  `full.css` + per-component imports already give the minimal path).
- Command-palette module — violates the "opt-in JS only where no native
  primitive works" pillar; `demo/` + theme gallery already cover it.
- Starter repo — `demo/` + the theme gallery already are the starter.

