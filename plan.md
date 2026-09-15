# Barefoot — Status & plan

_Last updated: 2026-09-15 — v7.0.0 "State Machine & Events" built &
verified (state vocabulary + precedence, composed empty state, the
`bf:*` event contract, two new Verify rules); v6.7.0 "Architecture &
Global" shipped_

## Snapshot

- **Shipped:** `barefoot-css@6.0.0` (2026-09-03) — v6 "Prove it, then let
  people in" (verification debt, CDN quick-start, icon recipe), preceded by
  v5.0 "the component is the breakpoint" (container-adaptive components, the
  zero-JS floor raise, generative theming 2.0) and v5.1 (base-select
  graduation, adaptive round two, Studio export). Per-release detail in the
  [Release archive](#release-archive) and `CHANGELOG.md`.
- **Shipped:** **v6.1.0 — Barefoot Verify** (ADR-0015, tag pushed).
  Phase 0 the contract registry (`src/js/verify-contracts.js`); Phase 1 the
  dev-only checker engine (`js/verify.js`, 1.61KB gzip, strict mode, arming
  seam); Phase 2 the CI contract-packs (`verify/pack.mjs` export, dogfooded
  by the suites); Phase 3 the visible layer (live badge + break/fix stage on
  demo/Studio, per-rule docs); Phase 4 hardening (JS gzip budgets policed,
  full matrix green). `release.yml` takes over on tag push.
- **Verification (2026-09-08, v6.2 matrix):** Chromium 238 passed / 2
  engine-gated skips · Firefox 207 / 12 · WebKit 212 / 7 — zero failures;
  visual regression green on all three (win32 baselines); axe green
  including the Verify stage's broken-contract state and the new
  playground page. Skips are engine-gated (interest invokers, SDA,
  `popover=hint`, cross-doc VT, base-select fallback; the v4.8
  forced-colors tests are Chromium-gated emulation). One known
  pre-existing WebKit flake: the popover empty-roster Tab refocus test
  intermittently misses the focus return on win32 — it fails on a clean
  tree too. Specs touch the demo only through `tests/helpers.js`;
  ubuntu/macos jobs stay behavior-only.
- **Build:** `index.css` 2.88KB gzip (budget ≤ 10KB, enforced by
  `npm run size`) · the JS table is now policed too (~2KB module family,
  explicit registry/barrel budgets) · `full.css` frozen at its 4.5 import
  set (ADR-0008). Gzip (level 9) and brotli are measured by the build —
  in-process zlib with a fresh-child-process fallback for the Node 26/
  Windows break. The DTCG export `dist/tokens.json` ships outside the CSS
  payload.
- **Built & verified:** **v6.3.0 — Paint & Paper** (ADR-0017, tag
  pending the maintainer). Validation groups (`.bf-form-group` +
  `.bf-error-text`, new `--bf-danger-subtle` token), the
  `.bf-table-sticky` wrapper, the opt-in `print.css` layer, and the
  proofs on `demo/paint-paper.html` (own page — the conformance
  demo's visual baselines stay untouched). Full matrix below, then
  commit + tag + push per RELEASE.md.
- **Shipped:** **v6.4.0 — Rhythm & Motion** (2026-09-12) and **v6.5.0 —
  States & Real Validation** (2026-09-12). v6.5 adds opt-in state patterns,
  validation-summary guidance, and Verify contracts for live-region and
  focus-target wiring.
- **Shipped:** **v6.6.0 — Primitives, Patterns & On-Ramp** (2026-09-12).
  v6.6 adds opt-in key/value and stat primitives, recipe and migration
  guidance, the 65ch prose measure, and RTL documentation/tests.
- **Shipped:** **v6.7.0 — Architecture & Global** (2026-09-12). v6.7 and
  v6.8 ship combined: opt-in `forms-state.css`, Verify `native-button` and
  `page-structure` usage audits, opt-in `script-type.css` with CJK and
  Arabic-family tokens, and global navigation guidance in
  `docs/architecture.md`.
- **Built & verified:** **v7.0.0 — "State Machine & Events"** (2026-09-15;
  tag = maintainer action). The v7 foundation: the full `data-state`
  vocabulary with precedence `loading > error > empty > partial > full` and
  the freshness / optimistic-mutation axes (opt-in `states.css`); the one
  hard paint rule — a busy region never renders the empty surface; the
  `.bf-empty-state` composition that fills its parent; the `bf:*` event
  contract (`bf:themechange`, `bf:tabactivate`, `bf:sort`, `bf:chipremove`,
  `bf:alertdismiss`, `bf:toastdismiss` — bubbling, observational, documented
  payloads); and two new Verify rules (`state-conflict`, `event-contract`).
  Proven on `demo/states.html` (own page — conformance baselines untouched),
  pinned by the v7.0 suites. Full matrix below; `npm run check` green.
- **Verification (2026-09-15, v7.0 matrix):** Chromium 283 passed / 2
  engine-gated skips · Firefox 248 / 12 · WebKit 253 / 7 — zero failures;
  visual regression green on all three (win32 baselines untouched — the
  new proof page ships beside the conformance demo, not inside it); axe
  green including the states page in its busy and settled-empty states.
  The registry budget moved 4096 → 5120 bytes gzip, deliberately in review
  (two new rules, quoted docs prose), and the Phase 4 budget test pins the
  new number.
- **History:** milestones 0.1 → 7.0.0 shipped.
  Arc shape: components & theming depth (0.x–2.x), namespace cleanup +
  deprecation policy (3.x), platform catch-up + layout + motion + selects/
  sticky tables (4.x), nav transitions + bundle freeze (4.6), one-color
  theming + Studio + CSS-only primitives (4.7), validation finish + forced
  colors + DTCG export + measured sizes (4.8), theme persistence as the
  smallest honest opt-in JS (4.9), adaptive + generative (5.0–5.3),
  verification + front door (v6), Barefoot Verify (v6.1), container-aware
  layout + playground (v6.2).

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

- **Tag & publish v5.2.0 / v5.3.0** (and the v6 release) — maintainer
  action only; `release.yml` takes over on the tag push.
- **Barefoot Verify — all phases complete (2026-09-08); release tag
  pending the maintainer:** the contract registry
  (`src/js/verify-contracts.js`), ADR-0015, the checker engine
  (`js/verify.js`, 1.61KB gzip, strict mode, arming registry in
  the lifecycle seam), the CI contract-packs (`verify/pack.mjs`, the
  `./verify/pack.mjs` export), the visible layer (live badge +
  break/fix stage on the demo and Studio, per-rule docs), and the
  hardening pass (JS budgets policed, three-engine matrix green,
  axe-scanned) are all in — 34 verify tests green on all three
  engines, and the suites themselves consume the pack (dogfooding
  claim met). Tag `v6.1.0` pushed; `release.yml` publishes from the tag.
- **v6.2.0 — shipped:** container-query layout primitives (`.bf-flow`, `.bf-switcher`,
  opt-in per file) plus the **Barefoot Playground**
  (`demo/playground.html`) — resizable containers (`resize: both`) with
  demo-only keyboard width sliders/readouts that let developers resize a
  box and watch the layout and adaptive components reflow live. The
  playground is the proof; the primitives are the product.
- **v6.3.0 (built & verified 2026-09-11; tag = maintainer action) — "Paint & Paper":**
  validation paint (`.bf-form-group:has(:user-invalid)` tint +
  `.bf-error-text` reveal, new `--bf-danger-subtle` token), the
  opt-in `print.css` layer (flatten, ink-on-paper, href destinations,
  `.bf-no-print`, zero cost on screen), and `.bf-table-sticky`
  (pins + mask fade, covered by `sticky-scroll-focusable`) — proven on
  `demo/paint-paper.html`, pinned by the v6.3 suites. Tag `v6.3.0`
  per RELEASE.md; `release.yml` publishes from the tag.
- **v6.4.0 — "Rhythm & Motion" shipped 2026-09-12:**
  container-aware rhythm (`.bf-rhythm`, extends `.bf-flow` with gap +
  line-height scaling at `--bf-adaptive-*` thresholds), staggered entry
  animation (`.bf-stagger`, `calc(var(--bf-stagger-index) *
  var(--bf-stagger-step))` via `@starting-style` + `view()` timeline),
  new tokens (`--bf-rhythm-gap`, `--bf-rhythm-line-height`,
  `--bf-stagger-duration`, `--bf-stagger-step`, `--bf-stagger-distance`),
  and `demo/rhythm-motion.html` proofs. Opt-in per file, never in frozen
  `full.css`. Full matrix green; `npm run check` passes. Tag `v6.4.0`
  per RELEASE.md; `release.yml` publishes from the tag.
- **v6.5.0 — "States & Real Validation" shipped 2026-09-12:** opt-in
  `components/states.css` provides loading, empty, and error state surfaces
  plus `.bf-error-summary`, with reduced-motion and forced-colors handling.
  `docs/states.md` documents live-region semantics, `aria-busy`, validation
  summaries, and the focus-first-error seam. Verify adds
  `state-live-contract` and `validation-summary-contract`, and extends
  `describedby-wired` to `.bf-error-text`. `release.yml` publishes from the
  tag.
- **v6.6.0 — "Primitives, Patterns & On-Ramp" shipped 2026-09-12:** opt-in
  `components/data-display.css` adds `.bf-key-value` and `.bf-stat`; existing
  timeline, pagination, breadcrumbs, media, meter/progress, and prose surfaces
  are consolidated in `docs/recipes.md` with sidebar/table, settings, empty
  dashboard, and Pico/Bootstrap/Tailwind on-ramps. RTL is documented and
  tested. `release.yml` publishes from the tag.
- **v6.7.0 — "Architecture & Global" shipped 2026-09-12:** v6.7 and
  v6.8 are combined into one opt-in release. `forms-state.css` maps explicit
  `data-state="invalid|loading"` form states without mutating semantics;
  `script-type.css` provides `:lang()` metrics for CJK and Arabic-family
  scripts; Verify audits native-button and page-structure usage; and
  `docs/architecture.md` documents cross-document View Transitions plus safe,
  omission-based Speculation Rules. `full.css` and `index.css` remain frozen.
  `release.yml` publishes from the tag.
- **vNext roadmap (drafted 2026-09-11):** v6.3 → v6.8, three phases ×
  two themed releases — quick wins (validation paint, print, sticky
  tables, rhythm, stagger), maturity (states pattern, validation a11y,
  missing primitives, recipes, RTL), long bets (declarative forms, data
  grid, usage audit, cross-doc VT, script-aware type). See the
  [vNext roadmap](#vnext-roadmap--v63--v68-draft-2026-09-11) section.

## v7 roadmap — v7.0 → v7.5 (draft, 2026-09-12)

> Combined from B.txt (tactical/DX) + C.txt (structural). Principle: "CSS presents state. JS mutates state."
> Every release stays on-thesis: opt-in by import, never in frozen `full.css` (ADR-0008),
> degrade by omission, every a11y contract gets a Verify rule or explicit bring-your-own statement,
> every gate pinned by test. `index.css` budget untouched.

**v7.0 — "State Machine & Events" (foundation, must come first)** ✅
(built & verified 2026-09-15; tag = maintainer action)

- **States v2 with precedence:** `loading > error > empty > partial > full`, plus
  `stale/refreshing/fresh` and `optimistic → confirmed → rolled-back`. "Don't show
  empty while loading" as contract. Extends `components/states.css`, opt-in.
- **`.bf-empty-state` composition:** grid-centered icon + headline + p + CTA that fills
  remaining parent space. No more hand-rolled flex centering.
- **`bf:*` CustomEvent contract:** every opt-in JS (`theme`, `tabs`, `table-sort`, `toast`,
  `chips`, `alert-dismiss`) dispatches a namespaced event with documented payload
  (`bf:themechange`, `bf:sort`, `bf:tabactivate`, …). Modules become extendable, not dead ends.
- Verify: `state-conflict`, `event-contract`. Docs: `docs/states.md` v2, the Events
  section in `docs/javascript.md`. Non-goal: no new components, no virtualization.
- Parked (moved from Next, not in v7 scope): `:has()` content-driven morphogenesis and
  anchor-laid-out layering (v5.3); engine-gated test skips un-block as floors land (see Watch-list).

**v7.1 — "Data Story" (needs v7.0)**

- **Density system:** `data-density` / `--bf-space-scale: 1 / 0.75` cascading to padding
  and type without breaking layout. Comfortable/compact globally.
- **Sort + selection contracts:** `aria-sort` on `<th>` audited (not decoration),
  `.bf-sort-asc/desc` via `data-*`, row selection `aria-selected / aria-multiselectable`,
  bulk-actions-on-selection pattern.
- **Composed fixture:** filter-bar + table + empty-state + pagination as one tested recipe.
  `js/table-sort.js` graduates from footnote to ADR + events + docs section.
- Verify: `aria-sort-wired`, `selection-complete`. Non-goal: no virtualization, no charting.

**v7.2 — "Form Architecture" (needs v7.0 + v7.1)**

- **Async contract:** `data-async-pending` + spinner + live-region + debounce that doesn't
  fight native `:user-invalid`. "Username taken" must work alongside `required/pattern`.
- **Wizard/stepper:** step ownership, `aria-current="step"`, back-preserves-input guidance.
- **Field-array, upload progress, fieldset opinion:** "add another phone", `forms-file.css`
  progress story, `<fieldset>/<legend>` density guidance.
- Strict boundary documented: Field B shows iff Field A checked = JS sets `data-state`,
  CSS only reveals. Ban Rube Goldberg `:has()` chains.
- Verify: `async-live`, `stepper-complete`. Non-goal: no framework bindings.

**v7.3 — "Keyboard & A11y Beyond Component" (needs real data + forms)**

- **Roving-focus micro-JS (<1KB):** menus/tablists get arrow-key navigation. Pure-CSS
  popover documented as mouse/tap-only until module loads — no handwaving "accessible
  by default".
- **Per-pattern keyboard maps:** sort roving focus, filter Esc-to-clear,
  dialog-in-dialog focus handling.
- **Adaptive SR story:** `<table>` → cards at container width is a semantic shift; add
  narration / role guidance. Add `prefers-contrast` (distinct from forced-colors),
  `prefers-reduced-transparency/data`. Audit reading order *after* container reflow.
- Verify: `roving-focus`, `reading-order-after-reflow`.

**v7.4 — "Resilience & Coexistence" (independent, push late)**

- **Fluid i18n primitives:** `min/max/fit-content + clamp()` `.bf-elastic` buttons/cards
  that survive German +30% and user content. Expansion kills more layouts than direction.
- **Side-by-side contract:** `@layer` coexistence with Tailwind preflight / Bootstrap
  reboot / existing `:root`, CDN+npm hybrid, `@import` vs `<link>` tradeoffs.
- **Print — full or cut:** `@page`, break-before/orphans/widows, print-this-table column
  selection, form-print. No shallow middle.
- Verify: `coexistence-clean`. Non-goal: no Shadow-DOM injection, no framework adapters yet.

**v7.5 — "DX Governance" (polices everything above, ships last)**

- **`.bf-debug` audit mode:** outline layer boundaries, flag deep `:has()` in red (perf),
  flag orphan `data-state` without hook. Makes architecture visible.
- **CSS `warnOnce`:** dev-only audit for deprecated class/token/attr
  ("uses `--bf-old`, aliased since 4.2, dies in 7.0"). Split Verify: contracts vs deprecations.
- **`perf-budget.mjs`:** parse/eval, `:has()` recalc, container-query, `view()` timeline,
  sticky mask paint — not just gzip bytes.
- **Recipe fixtures:** every `recipes.md` pattern gets `tests/fixtures/*.html`,
  matrix-tested + visually baselined so prose can't drift.
- **Acceptance gate:** one monstrous dashboard — 500 rows × 15 cols, wizard form,
  DE/AR translations, keyboard-only navigable. Whatever needs a hack = v7.6 scope.

### Roadmap guardrails (v7, every release)

- Opt-in by import · never in `full.css` · `index.css` budget untouched
- `data-*` additions update `docs/api.md` both directions (audit stays green)
- New demo furniture gets its own page so conformance baselines stay untouched
- No virtualized grid, no wrappers, no build step (Non-goals fence holds)

## vNext roadmap — v6.3 → v6.8 (draft, 2026-09-11)

> Distilled from three independent gap analyses (tactical, structural,
> strategic). Each phase splits into two themed releases: quick wins →
> maturity → long bets. Every item stays on-thesis: opt-in by import,
> never in frozen `full.css` (ADR-0008), degrade by omission, gated by
> test.

### Phase 1 — Quick wins (pure CSS, opt-in, zero JS)

**v6.3 — "Paint & Paper"** (visible + export credibility)

- **Validation paint:** `.bf-form-group:has(:user-invalid)` group
  tint/border + `.bf-error-text` revealed via `:has()` /
  `@starting-style`. Copy-paste form pattern, zero JS.
- **Print layer (opt-in `print.css`):** flatten container queries,
  `break-inside: avoid` on cards/rows, force ink-on-paper (plain hex,
  mirrors the print-palette stance), link `href` in parentheses,
  `.bf-no-print`. Cost: 0 bytes on screen.
- **`.bf-table-sticky`:** sticky header + first column via `@layer`
  z-index discipline + `mask-image` fade edge ("more data" affordance).
  Extends `sticky-scroll-focusable` (Verify already audits the wrapper).

**v6.4 — "Rhythm & Motion"** ✅ (built & verified 2026-09-12)

- **`.bf-rhythm`:** line-height/gap tied to `--bf-adaptive-*` so
  components breathe proportionally at any container width — extends
  `.bf-flow` and the cqi type ramp. Implemented in `components/layout-rhythm.css`.
- **`.bf-stagger`:** `calc(var(--bf-stagger-index) * var(--bf-stagger-step))`
  entry animation via `@starting-style` + `view()` timeline, with fallback.
  `prefers-reduced-motion` respected. Implemented in `components/layout-stagger.css`.
- **Demo & docs:** `demo/rhythm-motion.html`, updated `docs/layout.md`.
  Opt-in by import, never in frozen `full.css`.

### Phase 2 — Maturity (patterns + Verify contracts)

**v6.5 — "States & Real Validation"** ✅ (built, verified, and shipped
2026-09-12; make "accessible by default" auditable)

- **Empty/loading/error states as a pattern** (highest leverage):
  documented composition with `role="status"`, `aria-busy`, live-region
  contracts — plus Verify rules so the claim is auditable, not
  aspirational. A few `.bf-*` utilities; no new components.
- **Full validation a11y:** `aria-describedby` wiring on invalid fields,
  `aria-live` error summary, focus-first-error contract. Bless native
  constraint validation explicitly; Verify audits the wiring.

**v6.6 — "Primitives, Patterns & On-Ramp"** ✅ (built, verified, and shipped
2026-09-12; completeness + reach)

- **Data-display primitives:** `dl`/key-value pairs, stat blocks,
  timelines — the elements every dashboard needs.
- **Missing atoms as patterns:** pagination/breadcrumbs/`aria-current`,
  avatar/figure/media guidance, toast placement + politeness,
  `<meter>`/`<progress>` in context, prose/long-form surface
  (`max-inline-size: 65ch` measure).
- **Recipes doc + migration guides:** "sidebar + table + filter bar",
  "settings form + save state", "empty dashboard"; plus "coming from
  Pico / Bootstrap / Tailwind" on-ramps.
- **RTL stated and tested:** logical properties are already used —
  assert it, test `dir="rtl"`, document it.

### Phase 3 — Vision (architecture & platform bets)

**v6.7 — "Architecture & Audit"** ✅ (built, verified, and shipped
2026-09-12 as part of combined v6.7.0; declarative + self-aware)

- **Declarative form architecture:** `data-state="loading|invalid"` +
  `:has()` state-mapping — extends v6.3/v6.5 validation into complex flows
  without a state store. Shipped as opt-in `forms-state.css`.
- **Real data grid, gracefully:** deferred — not in v6.7.0 scope.
- **Verify → usage audit:** warn when markup drifts from the
  framework's intended semantic shape (non-native `role="button"`,
  duplicate `<main>` landmarks). Still never rebuilds axe.

**v6.8 — "Global & Seamless"** ✅ (built, verified, and shipped
2026-09-12 as part of combined v6.7.0; long-range platform)

- **Cross-document View Transitions + Speculation Rules:** persistent
  header/modal/sidebar morph across MPA navigations, no JS router.
  Shipped as documentation over the existing opt-in cross-doc VT layer
  plus safe, omission-based Speculation Rules guidance.
- **Script-aware typography:** `:lang(ja)` / `:lang(ar)` metric
  and line-box tokens — shipped as opt-in `script-type.css` with CJK
  and Arabic-family tokens.

### Roadmap guardrails (every release)

- Opt-in by import · never in `full.css` · `index.css` budget untouched
  · print/states/RTL items ship as docs + tiny layers, not components ·
  every a11y contract gets a Verify rule or an explicit "bring your
  own" statement · every gate pinned by test, per house style.

## vNext — Barefoot Verify (draft)

> **Selling line:** "The framework that checks your laces."

The core insight: Verify generalizes something Barefoot already ships.
`warnOnce` in lifecycle.js fires "on use, not on import" for deprecated
surfaces; Verify promotes that idea from deprecation warnings to
**contract warnings** — and audits what **axe can't know**. Axe checks
generic WCAG; only Barefoot knows that `popovertarget` needs a live id,
that a sticky table needs a focusable wrapper, that `data-alert-dismiss`
without `alert-dismiss.js` is a no-op button. Honest scoping: **never
rebuild axe, only audit the framework's own contracts.**

### Phase 0 — Contract registry + ADR-0015 ✅ (2026-09-08)

- **Done.** `src/js/verify-contracts.js` is the machine-readable
  registry — rule id, selector(s), pure-DOM `check` (`(el, ctx)` with
  `{ byId, armed }`, no closures, so the same function runs in-page and
  in the Phase-2 pack), fix hint, docs link, verbatim quote. Seed rules:
  `popover-target-exists`, `sticky-scroll-focusable` (WCAG 2.1.1),
  `skip-link-first`, `describedby-wired`, `module-pairing` (dismiss/
  chips/toast buttons whose JS module isn't loaded),
  `nav-complete-contract`.
- **ADR-0015 — delivery mechanism: two formats, one registry** (written,
  accepted):
  1. `js/verify.js` — dev-only module; console warnings styled after
     `warnOnce` (once per page, only when markup matches). Explicit
     import, so zero cost unless you ask.
  2. Contract-packs — the same rules exported as Playwright/
     axe-composable helpers, so consumers pin the contracts in their
     own CI.
- **Gate: met.** `tests/verify.spec.js` pins the registry format
  (exact field set, unique kebab-case ids, real modules), proves every
  rule traceable to a sentence in `docs/` (the API-audit pattern turned
  outward — one quote was caught drifting from its docs sentence during
  the first run), proves broken fixtures trip / corrected fixtures stay
  silent for all six rules, and runs the demo clean with every module
  armed. Registry is data, not behavior: excluded from the barrel
  contract, shipped in `dist/js/` by the existing build.

### Phase 1 — The checker engine (`js/verify.js`) ✅ (2026-09-08)

- **Done.** Zero-dependency, readable, measured 1.61KB gzip (in the
  ~2KB family). Dev-gated: warns in console styled after `warnOnce`
  (once per rule per page, only when markup matches — the volume law
  is pinned by test); `data-bf-verify="strict"` opts into throwing one
  aggregate error in CI. Never ships in the `barefoot.js` barrel
  (pinned by test). The lifecycle seam gained `arm()`/`isArmed()` so
  `module-pairing` reports truthfully (module-instance state, not DOM
  attributes — fixture-safe).
- **Gate: met.** The engine runs on `demo/index.html` and finds zero
  warnings (the demo is the dogfood proof — the demo itself doesn't
  import the module; the test runs the engine's own `runVerify()`
  there); deliberately-broken fixture pages (`tests/fixtures/
  verify-broken.html`) trip every rule with a correct fix hint, and
  the corrected twin page stays silent with every module armed. The
  whole suite is green on Chromium, Firefox, and WebKit.

### Phase 2 — Contract-packs for CI ✅ (2026-09-08)

- **Done.** `verify/pack.mjs` — importable assertions for the
  consumer's test suite (`runPack` / `runRule` / `assertClean`),
  shipped via the new `./verify/pack.mjs` export and covered by the
  packaging smoke test. The sweep is evaluated **in the page under
  test** and imports `js/verify-contracts.js` from the files the page
  actually loads (`base` option) — no Node-side copy of rule logic,
  no checker auto-scan inside the tested page. Arming is *declared*
  (`armed` option, default all) where the engine *detects* it — CI
  cannot reach into the page's module registry, so the consumer
  declares partial loads and `module-pairing` audits the rest.
- **Gate: met.** Barefoot's own suites are refactored to consume the
  pack — `tests/verify.spec.js` deleted its inline sweep runner and
  now sweeps through `runPack`/`runRule`, imports the registry through
  the pack's re-export, and pins the dogfood claim: a test asserts no
  local runner returns, and another asserts pack and engine agree
  rule-for-rule on the same page (two formats, one registry).

### Phase 3 — The visible layer ✅ (2026-09-08)

- **Done.** Demo + Studio carry a live Verify badge
  (`demo/verify-badge.js`, one script tag, self-contained): "✓ Barefoot
  contracts verified" / "✗ N contract violations — details in the
  console", re-scanned on markup changes via a debounced
  MutationObserver with a no-change write guard (no rescan loop). It
  refuses to run inside the Studio's preview iframe (one badge per
  visual stack) and paints from `runVerify()` while `verify()` carries
  the once-per-rule console warnings — the checker's read-only
  guardrail is untouched; the badge writes only to its own node.
- **The flagship demo moment:** the demo gains a `#verify` stage
  section — Break flips the dropdown's `popovertarget` to a dead id,
  the badge turns ✗ with the count, the console names the fix; Fix
  restores it.
- **`docs/verify.md`: one section per rule** — contract sentence,
  broken markup (✗), fixed markup (✓) — pinned by a test that walks
  `VERIFY_RULES` and asserts a heading + markup per rule (the
  docs-from-registry pattern).
- **Gates:** 31 verify tests green on all three engines; a11y suite
  green with the badge + stage on the page (role="status" live region,
  decorative glyph aria-hidden); visual baselines regenerated
  deliberately for the new demo furniture (all three engines).

### Phase 4 — Hardening & release ✅ (2026-09-08; tag = maintainer action)

- **Done.** The JS size table is measured **and policed**: `npm run
  size` enforces a gzip budget per shipped `js/` entry — the ~2KB
  module family is the default, with explicit limits for
  `js/verify-contracts.js` (4KB; data-heavy by design — every rule
  quotes its docs sentence) and `js/barefoot.js` (1KB; the barrel is
  imports only). An unbudgeted new `js/` file fails the check. Pinned
  from the test side: `verify.spec.js` Phase 4 walks `sizes.json`
  against the budget map and asserts the Verify entries cannot drop
  out of it.
- **Gates: met.** `npm run check` green; full matrix verified
  2026-09-08 — Chromium 232 passed / 2 engine-gated skips, Firefox 202
  / 12, WebKit 207 / 7 (skips are the documented engine-gated ones);
  axe-scan green on the demo including the Verify stage section in
  its resting and broken-contract states (a11y suite 20/20). The
  Verify suite (34 tests) runs in `test:ff` / `test:webkit` too.
- **Tag the release** — maintainer action per RELEASE.md (bump
  version, CHANGELOG is staged, commit `feat: v6.1.0 — Barefoot
  Verify`, push the `v6.1.0` tag; `release.yml` builds, tests, and
  publishes). Not done here on purpose.

### Guardrails (every phase)

- Opt-in by import · never in the `barefoot.js` barrel · ADR-0008
  untouched · warns, never mutates DOM or styles · the registry is the
  single source of truth for docs, checker, and packs (pinned by test,
  like the docs-from-source rulings).

### Tensions the ADR must settle

1. **"Zero-JS framework ships a JS checker" — hypocrisy or honesty?**
   Pillar #3 says opt-in JS only where no native primitive works. No
   browser API audits markup contracts, so Verify is the *most*
   justified JS in the repo — but that argument must be written into
   ADR-0015 or the community smells a contradiction.
2. **Audience.** `verify.js` serves the paste-the-CDN-link beginner
   (the v6 front door); contract-packs serve the design-system team.
   If forced to headline one: the beginner story — *you wrote plain
   HTML and got it subtly wrong; the framework caught it in your
   console.*
3. **Silent failure vs nagging.** The `warnOnce` "warn on use"
   precedent is the right volume: warn exactly once, only when the
   surface exists, never for markup Barefoot doesn't manage. If it
   ever nags on valid pages, the tool dies — trust is the entire
   product.

## v6.2.0 — "The layout is the breakpoint" (releasing 2026-09-08)

> **Selling line:** "The layout is the breakpoint." The playground is
> the proof; the primitives are the product.

Implemented and verified 2026-09-08; full matrix below, then commit +
tag + push per RELEASE.md.

The thesis so far stops at the component edge: v5 made *components*
container-aware, but developers still hand-roll Grid/Flexbox wrappers to
place them — and those wrappers still think in viewport media queries.
This release extends the thesis one level up: **the layout is the
breakpoint too.** And it ships with the demo that proves it live,
because "the component is the breakpoint" is hard to grasp while
muscle-memory says *resize the browser*.

### Phase 0 — The Playground (`demo/playground.html`) ✅ (2026-09-08)

- The conversion demo is built: resizable boxes (`resize: both`) holding
  live Barefoot surfaces — `.bf-flow`, `.bf-switcher`, an adaptive form,
  `.bf-sidebar`, and a composite sidebar → switcher → adaptive
  table/card stage. Drag the handle and watch the layout reflow at *its*
  width while the viewport never moves.
- Honest scoping: pointer resizing is native CSS, but there is no native
  keyboard equivalent — so the page adds demo-only width sliders and a
  live numeric readout per box (arrow keys work). No shipped framework
  JS is added.
- Gate: met — keyboard-operable sliders, axe-clean, and visual baselines
  untouched (`demo/index.html` was not changed).

### Phase 1 — Container-query layout primitives (the product) ✅ (2026-09-08)

- **Opt-in per file** — `components/layout-flow.css` (`.bf-flow`),
  `components/layout-switcher.css` (`.bf-switcher`), and
  `components/layout-sidebar.css` (the `.bf-sidebar` upgrade), extending
  the existing utilities rather than replacing them. Breakpoints mirror
  the container's adaptive tokens (`--bf-adaptive-1/2`).
- Measured sizes: `layout-flow.css` 0.22KB gzip, `layout-switcher.css`
  0.19KB gzip, `layout-sidebar.css` 0.13KB gzip — each well under the
  ~0.5KB target and never in frozen `full.css` (ADR-0008).
- **ADR-0016** (accepted): primitives query the *container*
  (a `.bf-sidebar` inside a grid cell collapses there, not at some
  viewport guess), reusing the v5.0 corrections (a container can't
  query itself; wrappers establish the query context via `:has()`
  where possible, mirroring `table/card-adaptive`). The sidebar upgrade
  shares the utilities layer and must be imported after it.

### Phase 2 — Docs & distribution ✅ (2026-09-08)

- Built: `docs/layout.md` (one section per primitive plus degradation),
  ADR-0016, README headline/project/docs pointers, and the Utilities
  section in `docs/components.md`.
- Gate: met — no new `data-*` attributes, so the `api.md` audit stays
  green; token tables regenerated; full matrix 2026-09-08 — Chromium
  238 passed / 2 skips, Firefox 207 / 12, WebKit 212 / 7, zero failures,
  visual green on all three, axe 21/21 including the playground page.

### Guardrails (inherited)

- Opt-in by import · never in `full.css` · `index.css` budget
  untouched (primitives ship as separate files) · degrade by omission
  · every gate pinned by test, per house style.

## Watch-list (verified 2026-08-31, caniuse Jul-2026 + MDN)

- `grid-template-rows: masonry` — still pending in every engine; no ship
  date. The v4.1 `grid-lanes` variant then collapses to a one-liner.
- ~~`@container style()` in Firefox~~ — **RESOLVED: shipped FF 151 (Apr
  2026)**. The density-by-style-query story is first-class across all
  engines (ADR-0009/0010).
- Interest invokers (`interestfor`/`interesttarget`) — **still
  Chromium-only (Chrome/Edge 142+, Nov 2025); Firefox and Safari have no
  support as of Aug 2026.** Gates the `tooltip.js` deletion; the module
  stays a polyfill. Implicit *anchor* positioning (distinct feature) DID
  ship in FF 147 (Jan 2026) — anchor-based tooltips are viable, the
  hover/focus *invoker* trigger is not.
- `command`/`commandfor` — **SHIPPED everywhere** (Chrome/Edge 135,
  Firefox 144, Safari 26.2). Available for declarative dialog/popover
  wiring.
- base `<select>` (`appearance: base-select`) — **Chrome/Edge 135,
  Safari 27; Firefox behind a flag (149–157), not shipped as of Aug
  2026.** Graduated in v5.1 as a progressive-enhancement headline
  (`@supports`-gated); Firefox users get the chevron fallback, and the
  gated test skips stay until Firefox ships.

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

Core, unchanged:

- No utility framework. The `.bf-*` set stays tiny and layout-only.
- No JS framework integration (no React/Vue wrappers).
- No IE/legacy support. Modern CSS is the point.
- No component classes for everything — elements first, always.
- No build step. No touching ADR-0008.

Declined — do not revive:

- `@barefoot/core` vs `@barefoot/extended` split — fights ADR-0008
  (frozen `full.css` + per-component imports already give the minimal
  path).
- Command-palette module — violates the "opt-in JS only where no native
  primitive works" pillar; `demo/` + theme gallery already cover it.
- Starter repo — `demo/` + the theme gallery already are the starter.
- React/Vue/Svelte wrappers and a PostCSS plugin — plain CSS *is* the
  framework-agnostic story; a plugin contradicts the no-build-step
  pillar.
- Masonry / deep-subgrid layout primitives — watch-list until engines
  ship; nothing to build.
- Studio as a standalone hosted app — `demo/studio.html` already deploys
  to GitHub Pages on every push to main; a custom domain is marketing,
  not code.
- 30–50 built-in glyphs — the 12-glyph set is a size-budget stance; the
  `--bf-icon-url` recipe (v6) is the feature.

## Release archive

### v5.0 — "The component is the breakpoint" (released 2026-08-31)

> Responsive design was about the viewport; v5 makes it about the
> component. Zero media queries. Zero script.

- **ADR-0009 — adaptive component contract:** per-component
  `*-adaptive.css` files, `container-name: bf-<component>` conventions,
  breakpoint tokens `--bf-adaptive-1/2/3`, `--bf-density` style query,
  `cqi` type ramp. **ADR-0010 — floor raise:** Chrome 135+ / Firefox
  151+ / Safari 26.2+ (FF 151 is the hard gate: container style
  queries). Numbers pinned from a verified engine matrix, not guesses.
- **Adaptive components:** `table-adaptive.css` (card-stack showpiece),
  `segmented-adaptive.css` (density), `form-adaptive.css` (one-column
  reflow + `:has(:user-invalid)` error summary), `card-adaptive.css`
  (horizontal↔vertical), plus a cqi typography pass. Corrections vs
  plan: self-box morphs query the nearest ancestor container (a
  container can't style itself; a `<table>` can't host
  `container-type`), and Lightning CSS can't resolve `var()` inside
  `@container` conditions, so breakpoints are literal `rem` while
  `--bf-adaptive-*` stay the documented thresholds.
- **Zero-JS tribunal (ADR-0011): zero modules deleted.** `tooltip.js`
  survives (interest invokers still Chromium-only), `popover-menu.js`
  keeps roving focus (APG keyboard semantics aren't CSS-expressible),
  `theme.js` survives (no persistence primitive). `command`/`commandfor`
  declarative wiring documented for consumers — the only "JS removed"
  in spirit. Test un-gating partial: implicit anchors un-gated; SDA,
  `popover=hint`, cross-doc VT, and base-select stayed gated (installed
  browsers lag the aspirational floor).
- **Generative theming 2.0:** 12-step OKLCH tonal scale
  (`--bf-tone-1…12`) from `--bf-seed-h` / `--bf-seed-c` in
  `src/tokens.css`; Studio gains hue/chroma sliders + a resizable
  reflow box. **ADR-0012** rejects typed `@property` for v5.0.
  Contrast is tested per derived step (3:1 / 1.4.11 floor) in
  `css.spec.js` — claims are never asserted.
- **Hardening & release:** `docs/adaptive.md`, `migration-5.md`,
  WCAG-labelled mobile-safe demo; suites green (css 369/21 skips, a11y
  19/19, js 104/105 — one pre-existing WebKit popover quirk); visual
  baselines regenerated. `forms.css` split into opt-in shards
  (`forms-base.css` + `forms-select/checks/range/file/color/meter.css`)
  shipped in the tag: a text-only form ≈ 1.4KB gzip, `full.css`
  byte-identical via the barrel.

### v5.1 — "Land the deferred" (released 2026-08-31)

- **`base-select` graduates (headline).** The picker skin
  (`::picker(select)`, themed options, `::checkmark`, `::picker-icon`)
  ships in the default bundle, `@supports`-gated, upgrading every
  single `<select>` where the engine supports it (Chromium 135+ /
  Safari 27+). Firefox (flag 149–157) keeps the chevron skin; the
  gated test skips stay until Firefox ships.
- **`theming-anim.css` (ADR-0012 revisit).** Opt-in `@property`
  registration for `--bf-seed-h` / `--bf-seed-c` so theme switches
  *morph* the 12-step ramp instead of crossfading. The default path
  stays registration-free (ADR-0005).
- **Adaptive round two + `.bf-contain` retirement.** `nav-adaptive.css`
  (sidebar↔drawer by container) and `tabs-adaptive.css`
  (scroll-snap↔wrap) extend ADR-0009; `table`/`card-adaptive`
  auto-establish their query container on the parent via `:has()`, so
  the manual wrapper is optional.
- **Studio → copy-paste theme.** The Studio exports a real
  `tokens.json` / CSS snippet, not just "six lines".

### v5.2 — "The design system that writes itself" (built & verified; tag pending)

> One color in. A whole system out. Accessible by construction. Scoped
> by container. Zero JavaScript.

- **`seed-system.css` (opt-in) — seed → master accent.** The two seed
  knobs become `--bf-primary` (`oklch(0.55 var(--bf-seed-c)
  var(--bf-seed-h))`); the Chroma engine derives the whole colour
  system — hover / subtle / border / focus, alpha ramps, the 12-step
  ramp. Type / spacing / radius / motion deliberately stay
  hand-authored (a hue does not determine a type scale) — **ADR-0013,
  the generative system contract.**
- **`theming-scope.css` (opt-in) — container-scoped theming, the novel
  half.** A `data-bf-scope` subtree resolves its own `color-scheme` +
  token layer via `@container style()`: a dark card inside a light
  page, zero JS, no class war. Degrades by omission to the inherited
  scheme.
- **Studio becomes the distribution.** Loads `seed-system.css`, reads
  the resolved 12-step ramp live, and emits the derived system into
  `tokens.json`; workflow documented in `docs/theming.md` +
  `docs/studio.md`. (Image → hue/chroma extraction stays demo-only
  JS.)
- **Verification (2026-09-03, v6 Phase 0):** `npm run check` green;
  Chromium 195 / 2 skips, Firefox 166 / 12, WebKit 171 / 7; visual
  green on all three. `full.css` frozen — generative + scope ship
  opt-in, never in the barrel.

### v5.3 — "The seed is the designer" — generative morphology, the flagship (built & verified; tag pending)

> One colour in, a whole *visual language* out — not just the colour
> system, but the temperament. Pure CSS. Zero JavaScript. Scoped by
> container.

- **ADR-0014 — generative morphology.** Overturns ADR-0013's "no
  non-colour derivation" clause: chroma = mood, not hue = identity.
  High chroma reads expressive, low chroma minimal — so `--bf-seed-c`
  derives the temperament via `calc()`: `--bf-radius{,-sm,-lg}`,
  `--bf-space-1…8`, `--bf-type-cqi-*`, `--bf-transition{,-slow}`,
  `--bf-vt-duration`, `--bf-reveal-duration`. Ships inside opt-in
  `seed-system.css`, within the existing `@supports (color: oklch(from
  red l c h))` gate; no `@property` in the default path.
- **Studio carries the full system.** Badge + chroma caption note the
  morphology; the `tokens.json` export emits resolved `--bf-radius` /
  `--bf-space-4` / `--bf-type-cqi-md` / `--bf-vt-duration` alongside
  the ramp.
- **CI gate.** A morphology test asserts chroma moves `--bf-radius` /
  `--bf-space-4` / `--bf-transition` monotonically (low → high), green
  on all three engines; the 1.4.11 / AA contrast gate is unchanged.
  The derivation is *mood*, not pseudo-science: relationships are
  asserted, never "this hue means trustworthy."
- **Parked (not declined):** "the component is self-aware" — `:has()`
  content-driven morphogenesis (`:has(img)`, `:has([data-urgent])`;
  the component re-skins by semantics, not size); and anchor-laid-out
  everything (non-modal layering beyond popovers/tooltips).

### v6 — "Prove it, then let people in" (complete 2026-09-03; release pending)

> No new surface. Pay the verification debt, open the front door,
> document the escape hatch that already exists.

- **Phase 0 — verification debt (the headline).** The suites ran for
  real for the first time (v5.2/v5.3 shipped with the honest "could
  not be executed here" caveat); all green — Chromium 195 / 2,
  Firefox 166 / 12, WebKit 171 / 7, visual green on all three
  (win32 baselines; Playwright's FF/WebKit needed the VC++
  redistributable once). Two real findings, both fixed inside the
  gate: (1) the v5.0 3:1 contrast gate was **vacuous on Chromium** —
  computed colors serialize as `oklch(...)` and `luminance()` parsed
  L/C/H° as sRGB bytes, so it passed without measuring;
  `helpers.js` now converts OKLCH→linear-sRGB (Ottosson) and the gate
  measures for real. (2) The feared muted-on-subtle failure does not
  exist (worst pair 5.9:1), but a genuine edge does — white button/
  link text on a vivid cyan-green seed (h≈190, c=0.3) dips to ~3.4:1,
  asserted as a 3:1 floor and documented as the AA ceiling; the dial
  stays unclamped. Contrast gate extended: 10 body-text pairs at AA +
  3 accent pairs at 3:1, swept over 12 hues × 3 chromas in pinned
  light scheme.
- **Phase 1 — CDN quick-start (the front door).** README copy-paste
  `<link>` boilerplate first, npm second; the three jsDelivr URLs
  (`index.css`, a component shard, a theme) verified resolving live.
  Gate: the snippet works from a plain HTML file with no install step.
- **Phase 2 — icon integration recipe (document the hatch).**
  `docs/components.md` gains "Using your own icons": the
  `--bf-icon-url` one-liner, a worked Lucide example (data-URL and
  file-URL forms), the a11y note, and the mechanism note the recipe
  depends on (the mask reads image *alpha*; page `currentColor` never
  reaches inside the SVG file). Plus a permanent `css.spec.js` test
  covering `[data-icon]` for the first time. Docs-only; `icons.css`
  and the budget untouched.

### v6.2 — "The layout is the breakpoint" (released 2026-09-08)

> **Selling line:** "The layout is the breakpoint." The playground is
> the proof; the primitives are the product.

- **Primitives:** opt-in `layout-flow.css` (`.bf-flow`, 0.22KB gzip),
  `layout-switcher.css` (`.bf-switcher`, 0.19KB), `layout-sidebar.css`
  (deterministic `.bf-sidebar` collapse, 0.13KB) — thresholds mirror
  `--bf-adaptive-1/2`, never in frozen `full.css` (ADR-0008).
- **Playground:** `demo/playground.html` — resizable boxes with
  keyboard-operable width sliders and live readouts; flow, switcher,
  adaptive form, sidebar, and a composite sidebar → switcher →
  adaptive table/card stage.
- **Contract:** ADR-0016; tuning tokens `--bf-flow-space`,
  `--bf-switcher-gap`, `--bf-switcher-min` in `tokens.css`;
  `docs/layout.md`; no new `data-*` attributes.
- **Verification (2026-09-08):** `npm run check` green; Chromium 238 /
  2 skips, Firefox 207 / 12, WebKit 212 / 7, zero failures; visual
  green on all three; axe 21/21 including the playground.

### v6.3 — "Paint & Paper" (built & verified 2026-09-11; tag pending)

> **Selling line:** "Paint & paper." Visible validation, sticky tables
> with a scroll hint, and a print layer — still zero JavaScript.

- **Validation paint:** opt-in `forms-validation.css` (`.bf-form-group`,
  `.bf-error-text`, `--bf-danger-subtle` token) — group tint + message
  reveal via `:has(:user-invalid)` / `@starting-style`, `aria-invalid`
  mirror for script-driven forms, bring-your-own wiring statement
  until v6.5 audits it.
- **Print layer:** opt-in `print.css` — every rule inside `@media
  print` (zero cost on screen): container layouts flatten, adaptive
  stacks re-tabulate, sticky cells unstick, http(s) destinations print,
  `.bf-no-print` hides, `break-inside: avoid` extends.
- **`.bf-table-sticky`:** scroll container + pinned header + pinned
  leading column + `@supports`-gated `mask-image` fade, on the
  `--bf-z-sticky` ladder; covered by Verify's `sticky-scroll-focusable`.
- **Contract:** ADR-0017; `docs/paint-paper.md`; proofs on
  `demo/paint-paper.html` (own page — conformance baselines untouched);
  no new `data-*` attributes, so the `api.md` audit stays green;
  `full.css` frozen, `index.css` untouched.
- **Verification (2026-09-11):** `npm run check` green (index 2.91KB
  gzip, JS budgets policed, AA contrast gate green, stylelint clean);
  full Chromium suite 250 passed / 2 engine-gated skips, Firefox 217 /
  12, WebKit 222 / 7 — zero failures; visual green on all three
  (baselines untouched); axe 23/23 including the paint-paper page in
  its resting and invalid-group states.
