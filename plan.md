# Barefoot — Project plan

Status: **Complete (0.1 → 1.5)** — see [status.md](status.md) for the live tracker.

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
- `@property` registers typed variables (progressive enhancement: animatable,
  validated) — ignored by older browsers, safe to ship.

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
arrow-key navigation are deferred as an opt-in JS module (see status.md).

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
- [x] **1.4** — the full candidate list below. Shipped as
  `barefoot-css@1.4.0` (2026-08-19).
- [x] **1.5** — the candidate list below. Shipped as
  `barefoot-css@1.5.0` (2026-08-19).

## Next — v1.6.0 → v2.0.0 ("the app shell → the design system")

Shipped through 1.5.0. The core (elements, components, interactivity,
a11y, theming) is complete, and the size budget has ~6x headroom
(`index.css` 1.57KB gzipped of the 10KB limit). The 1.6 → 2.0 arc fills
what a real app still needs, then freezes the API.

### v1.6 — Layout & navigation (the app shell)

- [ ] **Full spacing scale from the tokens** — `.fz-mt/mb/p-{1..8}`,
      `.fz-px/py` (layout-only; stays inside the no-utility-framework
      non-goal).
- [ ] **`[data-grid]` variants** — `auto-fit`/`minmax` + gap options.
- [ ] **`components/nav.css`** — `<nav>` topbar/header/footer patterns,
      `[aria-current]` states, pairs with `.fz-skip-link`.
- [ ] **`.fz-sidebar` split layout** (content + aside) and a `.fz-sticky`
      utility.
- [ ] Tests, docs, and demo coverage for each.

### v1.7 — Feedback & status

- [ ] **Semantic status tokens** — `--fz-success`, `--fz-info`,
      `--fz-warning`: `light-dark()` pairs, `@property` registrations,
      contrast-audited.
- [ ] **`components/alert.css`** — role-aware notices (`role="alert"` for
      errors, `aria-live` for dynamic), dismissible.
- [ ] **Field-level validation states** — `:user-invalid` / `:user-valid`
      + `[aria-invalid]` styling and error-message helpers.
- [ ] **`components/skeleton.css`** — loading placeholders, pure CSS,
      respects `prefers-reduced-motion`.
- [ ] **Toasts via the Popover API** — if they stay honest (declarative,
      JS-free).

### v1.8 — Content & media

- [ ] **Fluid type scale** — headings via `clamp()` / container units,
      replacing the fixed `rem` sizes.
- [ ] **`.fz-prose`** long-form wrapper — heading rhythm, code, tables,
      blockquote inside an article.
- [ ] **`.fz-avatar`**, `[data-media]` aspect-ratio embeds, responsive
      image sizing, thumbnail cards.

### v1.9 — Components, complete

- [ ] Stepper, fieldset/legend, input groups (leading icon), date/number/
      email polish.
- [ ] Component consistency pass across every file; full demo section;
      re-run the axe matrix.

### v2.0 — The design-system release

- [ ] **Token audit** — complete semantic palette, alpha ramps via
      `color-mix`, auto-generated token reference in docs (size-table
      pattern).
- [ ] **Public API freeze** — lock the `data-*` attribute API, the
      `--fz-*` contract, and the export map; document the deprecation
      policy (v2 promise: no silent breaks).
- [ ] **Theme gallery** on the docs site — all starter themes behind a
      live switcher (the marketing demo).
- [ ] **Docs rewrite** restructured by category; a 1.x → 2.0 note that
      says "nothing changed".
- [ ] **Final size re-verification** — stays well under the 10KB budget.

## Done — v1.5.0 candidates ("Forms, finished", all shipped in 1.5.0)

1.4 skinned range/progress/meter, but the form was still unfinished:
`<select>` showed the raw OS arrow, `file`/`color` inputs were skipped,
textareas couldn't auto-grow, and there was no required-asterisk
affordance. v1.5 closed those gaps and rounded out base polish — all
CSS-only, no new JS.

### Form completion (`src/components/forms.css`)
- [x] **`<select>` custom skin** — themed chevron (data-URI arrow on the
  element, `appearance: none`), excluded for `[multiple]` / `[size]`;
  keeps the native dropdown + focus ring.
- [x] **`input[type="file"]`** — style `::file-selector-button` with the
  button tokens (stays a native control).
- [x] **`input[type="color"]`** — swatch: fixed size, radius, border,
  focus ring.
- [x] **Required marker** — `label:has(> input[required])::after` →
  `"*"` in danger color (screen readers already announce `required`).
- [x] **Auto-grow textarea** — `field-sizing: content` as an opt-in
  `[data-autogrow]` (progressive enhancement; no-op where unsupported).
- [x] **`form:has(:user-invalid)`** — subtle surface shift; docs on
  pairing with `aria-invalid`.
- [x] **`<output>`** live-region styling.

### Base polish (`src/base.css`)
- [x] `mark` (accent tint via `color-mix`), `kbd`, `samp`,
  `figure`/`figcaption`, `address`, `del`/`ins`.

### Utilities (`src/utilities.css`)
- [x] **`.fz-skip-link`** — visually hidden until `:focus-visible`,
  pinned top-left.

### Motion (`src/components/accordion.css`)
- [x] **`<details>` open/close height animation** — `interpolate-size:
  allow-keywords` + `transition-behavior: allow-discrete` (safe no-op
  elsewhere; must not break the existing accordion tests).

### Tests / docs / versioning
- [x] +7 CSS behavior tests (select chevron, file button, required
  marker, autogrow, mark/kbd, form-`:has`, output), +1 a11y test (skip
  link).
- [x] Update `docs/components.md` (forms), `docs/accessibility.md`
  (skip link + required marker), regenerate README size table.
- [x] Versioned `barefoot-css@1.5.0` (published 2026-08-19).

## Done — v1.4.0 candidates (all shipped in 1.4.0)

- [x] Range-slider skin + `<progress>`/`<meter>` styling (CSS-only)
- [x] Tooltip via the Popover API (CSS-only, `data-tooltip`)
- [x] Carousel autoplay + controls as opt-in `js/carousel.js`
- [x] Breadcrumbs, pagination, one more starter theme (forest)
- [x] `prefers-contrast` / `prefers-reduced-transparency`, stylelint,
      auto-generated README size table

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

## Non-goals

- No utility framework. The `.fz-*` set stays tiny and layout-only.
- No JS framework integration (no React/Vue wrappers).
- No IE/legacy support. Modern CSS is the point.
- No component classes for everything — elements first, always.
