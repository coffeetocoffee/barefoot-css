# Barefoot — Components

Element-first. You write plain HTML; Barefoot styles it. No classes needed
except where there is no native element. Every component degrades to fully
functional semantics without CSS.

All components use **logical CSS properties** (`margin-inline`,
`padding-block`, `inset-inline-start`, `text-align: start`, logical
`border-radius`) so they mirror correctly in RTL layouts — set
`dir="rtl"` on `<html>` and everything flips automatically. See the
[i18n test page](../demo/i18n.html) for a full RTL conformance demo.

Import from `dist/components/*.css` (or get everything with `full.css`).

## Buttons

```html
<button>Save</button>                       <!-- neutral -->
<button data-variant="primary">Save</button>
<button data-variant="ghost">Ghost</button>
<button data-variant="danger">Delete</button>
<input type="submit" value="Submit">        <!-- submit = primary -->
<button data-size="sm">Small</button>
<button disabled>Disabled</button>
```

- `[type="submit"]` is the primary action — semantic, no class.
- **JS:** none.
- **A11y:** native button; `Tab` + `Enter`/`Space`; `:disabled` styling.

## Forms

```html
<label for="email">Email</label>
<input id="email" type="email">

<label for="country">Country</label>
<select id="country">…</select>

<label for="framework">Framework</label>
<input id="framework" list="framework-list">
<datalist id="framework-list">
  <option value="Barefoot"></option>
  <option value="Bootstrap"></option>
</datalist>

<label for="bio">Bio (auto-grows)</label>
<textarea id="bio" rows="3" data-autogrow>…</textarea>

<label>Nickname (required)
  <input type="text" required>
</label>

<fieldset data-segmented>
  <legend>View</legend>
  <label><input type="radio" name="view" checked> Day</label>
  <label><input type="radio" name="view"> Week</label>
  <label><input type="radio" name="view"> Month</label>
</fieldset>

<input type="checkbox"> <input type="color"> <input type="file">
<input type="range"> <progress max="100" value="60">
<output>40</output>
```

- Checkboxes/radios use `accent-color` — native, themed, free. Range
  sliders get a full custom skin (track + thumb in the theme tokens, with
  a `:focus-visible` ring), and `<progress>` / `<meter>` are drawn as
  themed bars (accent fill, alternate track) instead of the browser's
  default widget.
- **`<select>`** gets a themed chevron (`appearance: none` + a
  `currentColor` arrow); the dropdown list itself stays native.
  `[multiple]` / `[size]` selects keep the browser's control.
  Where an engine ships *customizable select* (`appearance: base-select`,
  Chromium 135+), single selects upgrade automatically, no markup
  change: the open picker becomes a themed panel — `::picker(select)`
  with the popover recipe (surface, hairline border, radius, lifted
  shadow) — options get token hover/checked states and a primary
  `::checkmark`, group labels read muted, and the closed field swaps
  the SVG chevron for the themed `::picker-icon`. Engines without
  support keep exactly the chevron skin above: degrade by omission,
  no polyfill.
- **`<datalist>`** — the field reserves space for the engine's picker
  affordance (`input[list]`), styled with the same tokens as the select
  chevron. The suggestion popup itself is engine-drawn and not
  author-stylable anywhere; Barefoot doesn't pretend otherwise.
- **Segmented control** — `data-segmented` on a `<fieldset>` of radio
  buttons turns it into a button group. The radios become invisible
  overlays (semantics, focus and arrow-key roving stay native); labels
  paint as segments, `label:has(input:checked)` is the raised one,
  disabled options dim. The legend names the group for screen readers
  and is clipped from sight automatically.
- **`input[type="file"]`** — the button is skinned via
  `::file-selector-button` with the button tokens; it stays a native file
  input.
- **`input[type="color"]`** — a themed swatch sized to the control height.
- **Auto-grow textarea** — add `data-autogrow` to opt into
  `field-sizing: content` (progressive enhancement; the fixed `rows`/
  `min-height` still hold where unsupported).
- **Required marker** — a label that *wraps* a required control gets a
  danger asterisk automatically (`label:has(> input[required])`). Screen
  readers already announce the `required` attribute.
- **Form-level invalid signal** — `form:has(:user-invalid)` draws a
  subtle ring around the whole form once any touched field is invalid.
  Pair each field with `.bf-field-error` text wired up via
  `aria-describedby`.
- **Field-level states** — `:user-invalid` / `:user-valid` fire only
  *after* a control is touched (nothing flashes on page load): invalid
  fields get the danger border, valid fields get the success border.
  Script-driven forms can mirror the state with
  `aria-invalid="true"` / `"false"` — same painting, no interaction
  heuristic. Message helpers: `.bf-field-hint` (muted guidance),
  `.bf-field-error` (danger), `.bf-field-success` (success).
- **JS:** none.
- **A11y:** native controls + browser validation UX.

## Dialog (modal)

```html
<dialog id="confirm" aria-labelledby="title">
  <header>Title</header>
  <p>…</p>
  <footer>
    <button command="close" commandfor="confirm">Cancel</button>
    <button data-variant="danger" command="close" commandfor="confirm">Delete</button>
  </footer>
</dialog>
```

```js
// Engines without Invoker Commands support need the one native line
// Barefoot requires anywhere:
document.querySelector("dialog").showModal();
```

- `::backdrop` blurred dim; entrance animation via `@starting-style`.
- `data-width="sm|lg"` for sizing.
- **JS:** none where the Invoker Commands API exists (`command` /
  `commandfor` on buttons open and close declaratively); otherwise
  `showModal()` to open — one native method, no library.
- **A11y:** focus trap and `Esc` come from `<dialog>`.
- **Entrance fallback:** engines without `allow-discrete`/`@starting-style`
  get a keyframe entrance (via `@supports not (transition-behavior:
  allow-discrete)`) instead of snapping in instantly; reduced-motion is
  respected.

## Popover (fully JS-free modal-like layer)

```html
<button style="anchor-name: --menu" popovertarget="menu">Actions</button>
<div popover id="menu" data-kind="menu" style="position-anchor: --menu">
  <a href="#">Rename</a>
</div>
```

- `data-kind="menu"` → panel with menu item styling.
- `data-kind="tooltip"` → small muted tooltip. Mark the trigger with
  `data-tooltip` for the affordance (dotted underline, `cursor: help`).
- **JS:** none — Popover API is declarative.
- **A11y:** light-dismiss + `Esc` native. Position with anchor positioning
  or your own CSS.
- **Anchoring (implicit, 3.1):** in browsers with anchor positioning
  (Chromium 125+, Firefox 147+, Safari 18.2+) a popover pins to its own
  invoker automatically — the invoker *is* the default anchor — so the
  common case needs no anchoring markup at all:

  ```html
  <button popovertarget="menu">Actions</button>
  <div popover id="menu" data-kind="menu">…</div>
  ```

  The stylesheet's `position-area` does the placing: menus open below,
  left-aligned; tooltips above, centered. To anchor a popover to
  something that is *not* its invoker, fall back to explicit named
  anchors — `anchor-name: --x` on that element and
  `position-anchor: --x` on the popover (one inline style on each,
  unique per popover). Without anchor positioning all of this is inert
  and popovers keep default placement. `position-try-fallbacks:
  flip-block` flips the popover to the opposite side when the trigger
  sits near a viewport edge (e.g. a menu anchored below a button at the
  bottom of the screen opens above it instead).
- **Hover/focus tooltips (`popover="hint"`, 3.1):** upgrade the bubble to
  a hint popover and add an interest invoker alongside the click one:

  ```html
  <button data-tooltip interestfor="tip"
          popovertarget="tip" popovertargetaction="show">?</button>
  <div popover="hint" id="tip" data-kind="tooltip">…</div>
  ```

  Three tiers, one markup, zero JS: engines with interest invokers
  (Chromium 139+) show on hover and keyboard focus and dismiss on
  hover-away/blur; every Popover-API engine keeps click-to-show via
  `popovertarget`; engines without the hint state treat it as a plain
  auto popover. A hint also never tears down an open menu/dialog —
  it lives one dismissal tier below them.
- **Cross-browser:** `position-area` anchoring is verified in Chromium,
  Firefox, and WebKit (Safari) by the CI behavior suite, including the
  viewport-edge flip. One Firefox limitation: if the trigger is *off-screen*
  when the popover opens, the anchor resolves to the viewport edge —
  triggers are clicked in view, so this only matters if a script opens a
   popover programmatically. The opt-in `js/popover-anchor.js` module
   closes such popovers (matching the spec intent of `position-visibility:
   anchors-visible`; a baseline-gated removal candidate for 4.0 —
   see [api.md → Deprecations](api.md#deprecations)); without it the popover may appear clipped at the
  viewport edge in Firefox, or pinned off-screen in Chromium/WebKit.
- **Difference from dialog:** popover is non-modal (no focus trap) — right
  for menus/tooltips, not for blocking actions.

## Accordion / tabs (details, one-at-a-time)

```html
<details data-accordion name="faq" open><summary>Q</summary><p>A</p></details>
<details data-accordion name="faq"><summary>Q</summary><p>A</p></details>
```

- A shared `name` makes the browser allow only one open — the
  one-at-a-time disclosure pattern, zero JS.
- Panels animate open/close (height `0` ↔ `auto` via
  `interpolate-size: allow-keywords`) where supported; engines without it
  keep the instant toggle. `prefers-reduced-motion` collapses the
  transition globally.
- **JS:** none.
- **A11y:** native disclosure semantics; `Tab` between summaries,
  `Enter` toggles.

## Tabs (opt-in JS)

```html
<div data-bf-tabs>
  <div role="tablist" aria-label="Sections">
    <button role="tab" aria-controls="panel-1" aria-selected="true">One</button>
    <button role="tab" aria-controls="panel-2" aria-selected="false">Two</button>
  </div>
  <div role="tabpanel" aria-labelledby="tab-1" tabindex="0">…</div>
  <div role="tabpanel" aria-labelledby="tab-2" tabindex="0">…</div>
</div>
```

```html
<script type="module">
  import "barefoot-css/js/tabs.js";
</script>
```

- **JS:** opt-in `js/tabs.js` (~2.7KB, zero deps) — WAI-ARIA tabs with
  arrow-key navigation, `Home`/`End`, automatic activation. On init the
  module marks the group `data-bf-tabs-js` (a CSS hook) and hides inactive
  panels.
- **A11y:** full APG tabs pattern (roving tabindex, `aria-selected`,
  `aria-controls`). **No-JS first:** without the module every panel stays
  visible — content is never lost; with it, inactive panels hide
  synchronously at init (load the module in `<head>` so it runs before
  first paint and there's no flash).
- Styling ships in `components/tabs.css`.

## Popover menus, Esc-close & friends

See [docs/javascript.md](javascript.md) for the opt-in JS modules
(tabs, details Esc-close, details tab-order shim, popover-menu keyboard
support, carousel controls + autoplay) and their markup.

## Grid

```html
<div class="bf-contain">                 <!-- makes the query container -->
  <div data-grid>                        <!-- 1 / 2 / 3 columns -->
    <article class="card">…</article>
  </div>
</div>

<div data-grid="auto-fit">               <!-- as many columns as fit -->
  <article class="card">…</article>
</div>

<div data-grid="auto-fit" data-gap="2">  <!-- gap from the spacing scale -->
  <article class="card">…</article>
</div>
```

- **Base `[data-grid]`** — the column count responds to the *container's*
  width (wrap it in `.bf-contain`): 1 column below 30rem, 2 up to 48rem,
  3 after. Same markup, zero media queries.
- **`[data-grid="auto-fit"]` / `[data-grid="auto-fill"]`** — flows as
  many columns as fit, each at least `--bf-grid-min` (14rem by default).
  Tracks size against the row itself, so no container query is needed.
  (`auto-fill` keeps empty tracks; `auto-fit` collapses them.)
- **`data-gap="0|1…8"`** — tunes the gap from the spacing scale
  (default `4` → `--bf-space-4`). Override `--bf-grid-gap` for a global
  default.
- **`[data-grid="masonry"]`** (v4.1) — items of unequal height pack
  tightly into rows (waterfall / Pinterest layout). Uses `display:
  grid-lanes` where supported (`@supports`-gated); falls back to a
  standard `auto-fill` grid in engines without it. Same `data-gap` and
  `--bf-grid-min` controls apply.
- **JS:** none.
- **A11y:** document order is visual order; cards are `<article>`s.

## App shell layout (v4.3)

```html
<div data-layout="sidebar">
  <header>…</header>           <!-- auto-maps to "header" area -->
  <nav aria-label="Primary">…</nav>  <!-- auto-maps to "nav" area -->
  <main>…</main>               <!-- auto-maps to "main" area -->
  <footer>…</footer>           <!-- auto-maps to "footer" area -->
</div>

<div data-layout="sidebar" data-collapse data-collapsed>
  <header>…</header>
  <nav data-area="nav">…</nav>  <!-- explicit override for non-semantic -->
  <main>…</main>
  <footer>…</footer>
</div>
```

- **`[data-layout="sidebar"]`** — CSS Grid app shell with named areas:
  `"header header" / "nav main" / "footer footer"`. Direct-child semantic
  elements (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`) auto-map
  to their grid areas. Use `[data-area="header|nav|main|aside|footer"]` to
  override for non-semantic markup.
- **Nested scroll regions** — the sidebar (`<nav>`) gets `position: sticky`
  + `overflow-y: auto` by default; main scrolls independently via
  `overflow-y: auto`. Override with `--bf-layout-sidebar-scroll: visible`.
- **`[data-collapse]`** — enables sidebar collapse. Add `[data-collapsed]`
  to shrink to `--bf-layout-sidebar-collapsed` (4rem) and hide nav labels.
  Collapse is triggered by `js/nav.js` or a CSS-only checkbox hack. A
  `@container` query auto-collapses at narrow widths.
- **Tokens** — `--bf-layout-sidebar-width` (16rem),
  `--bf-layout-sidebar-collapsed` (4rem), `--bf-layout-header-height`
  (3.5rem), `--bf-layout-gap` (var(--bf-space-4)).
- **JS:** none (collapse can be CSS-only or use `js/nav.js`).
- **A11y:** semantic elements carry native landmarks; `nav` is a named
  landmark. Independent scroll regions are keyboard-navigable.

## Carousel (scroll-snap)

```html
<div data-carousel tabindex="0" aria-label="Slides">
  <div>Slide</div><div>Slide</div>
</div>
```

- `scroll-snap-type: x mandatory`; scrollbar hidden but scrolling works
  (touch, wheel, and — with the `tabindex` — keyboard).
- **JS:** none for the base scroller. Opt-in `js/carousel.js` adds
  prev/next buttons (`data-carousel-prev` / `data-carousel-next` pointing
  at the scroller's id) and autoplay (`data-autoplay="3000"`). Without it
  nothing changes.
- **A11y:** keep the `tabindex` and `aria-label`; that's what makes it
  keyboard reachable.
- **Scroll progress bar (opt-in, pure CSS):** add `data-progress` to
  the scroller itself and a hairline bar appears along its bottom edge,
  filling as you scroll:

  ```html
  <div data-carousel data-progress tabindex="0" aria-label="Slides">…</div>
  ```

  It's a scroll-driven animation (`animation-timeline:
  scroll(nearest inline)` — an anonymous timeline, so no wrapper, no
  `timeline-scope`, no extra markup), so it tracks position with zero
  JS and stays live under reduced motion — a progress bar is position
  feedback, not animation. Engine tiers, verified in CI: Chromium and
  Safari 26+ resolve the anonymous timeline and draw a live bar;
  engines without scroll-driven animations render nothing — every rule
  sits behind a `@supports (animation-timeline: scroll())` gate. The
  fill uses `--bf-primary` over a `--bf-border` track; follows
  `[dir="rtl"]`.

## Breadcrumbs

```html
<nav aria-label="Breadcrumb" data-breadcrumbs>
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/docs/">Docs</a></li>
    <li><span aria-current="page">Theming</span></li>
  </ol>
</nav>
```

- Slash separators between items; the current page is muted text. Mark the
  last item `aria-current="page"` (a `<span>`, not a link).
- **JS:** none.
- **A11y:** `<nav aria-label>` + `<ol>` give screen readers the landmark
  and list semantics.

## Pagination

```html
<nav aria-label="Pagination" data-pagination>
  <ol>
    <li><span aria-disabled="true" aria-hidden="true">←</span></li>
    <li><span aria-current="page">1</span></li>
    <li><a href="#pagination">2</a></li>
    <li><a href="#pagination" aria-label="Next page">→</a></li>
  </ol>
</nav>
```

- The current page is a **filled `<span aria-current="page">`, never a
  link** — the page you're on isn't clickable. Disabled controls are
  `<span aria-disabled="true" aria-hidden="true">`, not dead links.
- **JS:** none.
- **A11y:** `<nav aria-label>` + `<ol>`; labelled prev/next arrows.

## Stepper

```html
<div data-stepper>
  <ol>
    <li data-complete>
      <div data-step>
        <span data-step-circle>1</span>
        <span data-step-label>Account</span>
      </div>
    </li>
    <li aria-current="step">
      <div data-step>
        <span data-step-circle>2</span>
        <span data-step-label>Profile</span>
      </div>
    </li>
    <li>
      <div data-step>
        <span data-step-circle>3</span>
        <span data-step-label>Confirm</span>
      </div>
    </li>
  </ol>
</div>
```

- A progress tracker for multi-step flows. The state lives in plain
  attributes the consumer controls: `data-complete` on finished steps,
  `aria-current="step"` on the active one. Completed circles fill from
  `--bf-success`, current from `--bf-primary`, pending stay muted — and
  the connecting lines follow completion.
- **`data-orientation="vertical"`** stacks the steps (default is
  horizontal).
- **JS:** none.
- **A11y:** native `<ol>` semantics; screen readers announce the current
  step from `aria-current="step"`. Nothing is invented.

## Navigation

```html
<nav data-nav aria-label="Primary">
  <a class="bf-brand" href="/">Acme</a>
  <ul>
    <li><a href="/" aria-current="page">Home</a></li>
    <li><a href="/docs">Docs</a></li>
  </ul>
</nav>

<nav data-nav="footer" aria-label="Footer">
  <span>© 2026 Acme</span>
  <ul><li><a href="/privacy">Privacy</a></li></ul>
</nav>
```

- **`[data-nav]`** — a topbar row: an optional `.bf-brand` (a class,
  because there is no native element for a site name) plus a link list.
  The row wraps on narrow screens — nothing toggles, nothing hides.
- **`data-nav="header"`** — topbar with a bottom hairline.
  **`data-nav="footer"`** — footer row: muted, small, top hairline, links
  pushed to the end.
- **`aria-current="page"`** — marks the active link (accent + semibold).
- **JS:** none.
- **A11y:** a `<nav aria-label>` is a named landmark for free. Pair it
  with `.bf-skip-link` as the first element in `<body>` so the first Tab
  stop skips past the nav to `<main>`.

### Hamburger (opt-in JS)

```html
<nav data-nav="header" aria-label="Primary">
  <a class="bf-brand" href="/">Acme</a>
  <button type="button" class="bf-nav-toggle"
          aria-expanded="false" aria-controls="site-menu">Menu</button>
  <ul id="site-menu">
    <li><a href="/" aria-current="page">Home</a></li>
    …
  </ul>
</nav>
```

- Load `js/nav.js`: when the **nav itself** is narrower than 40rem (a
  container query — no viewport media queries, so it also collapses
  correctly inside a sidebar or grid cell), the list collapses behind
  the toggle and opens as a full-width column. Above that width the
  toggle never renders and the row wraps as usual.
- The toggle is author markup — a real `<button>` with
  `aria-expanded`/`aria-controls`; the module only flips states and
  marks the nav `data-nav-js`. Open state is `[data-open]` on the nav.
- `Esc` (focus anywhere inside an open menu) closes it and returns
  focus to the toggle; activating a link closes it too.
- **No-JS first:** without the module nothing ever hides — the button
  never renders and the list stays visible exactly like the plain
  wrapped topbar. A header nav without a complete contract (toggle +
  id'd list) is never armed for collapse.

## Alert

```html
<div data-alert="danger" role="alert">
  <p>Deploy failed — the build timed out.</p>
  <button type="button" data-alert-dismiss aria-label="Dismiss">×</button>
</div>

<div data-alert="success" aria-live="polite">Backup completed.</div>
```

- **`[data-alert]`** — a role-aware status notice. Bare by default
  (neutral surface); `data-alert="danger|success|info|warning"` tints
  the inline-start edge from the matching status token.
- **ARIA is yours to choose:** `role="alert"` for errors (assertive),
  `role="status"` / `aria-live="polite"` for non-urgent updates. Barefoot
  only paints; it never invents a live region.
- **Dismissible:** a `[data-alert-dismiss]` button + the opt-in
  `js/alert-dismiss.js` module (wired into `js/barefoot.js`) removes the
  alert on click. Without the module the button is a no-op visual
  affordance.
- **JS:** none required; opt-in `js/alert-dismiss.js` for dismissal.
- **A11y:** `role="alert"` / `aria-live` semantics come from your
  markup; the dismiss control is a real `<button>` (focusable).

## Skeleton

```html
<div class="skeleton" style="height: 1rem; width: 60%"></div>

<!-- Shape variants -->
<div class="skeleton" data-shape="circle" style="width: 2.5rem; height: 2.5rem"></div>
<div class="skeleton" data-shape="text" style="height: 1rem"></div>
<div class="skeleton" data-shape="text" style="height: 1rem"></div>
<div class="skeleton" data-shape="text" style="height: 1rem"></div>
<div class="skeleton" data-shape="card"></div>
```

- **`.skeleton`** — a pure-CSS loading placeholder: a surface-alt bar
  with a shimmering highlight sweeping left→right. Set the size to
  match the content it will replace (text lines ≈ 1rem tall).
- **`data-shape="circle"`** — round shape for avatar placeholders.
- **`data-shape="text"`** — multi-line text placeholder; consecutive
  text skeletons get varied widths (100%, 80%, 60%) for a natural look.
- **`data-shape="card"`** — composite loading state for card placeholders.
- **`prefers-reduced-motion`** — the shimmer stops; the placeholder
  stays static.
- **JS:** none.
- **A11y:** decorative only — it must be replaced by (or paired with)
  real content before a screen reader would ever announce it.

## Spinner

```html
<div data-spinner role="status">
  <span class="bf-visually-hidden">Loading…</span>
</div>

<div data-spinner data-size="sm"></div>
<div data-spinner data-size="lg"></div>
```

- **`[data-spinner]`** — an indeterminate loading indicator, pure CSS:
  a rotating arc drawn from the accent tokens (`--bf-primary` on a
  `--bf-primary-muted` track). Default 1.5rem; `data-size="sm"` → 1rem,
  `data-size="lg"` → `--bf-control-height`.
- **`prefers-reduced-motion`** — the rotation stops; a static arc
  remains.
- **JS:** none.
- **A11y:** the motion is decorative. Announce progress with text and
  a live role from your markup (`role="status"` + visually hidden text,
  as above) — Barefoot never invents roles for you.

## Toast

```html
<button type="button" popovertarget="toast">Show toast</button>
<div popover="manual" id="toast" data-kind="toast" data-variant="success" role="status">
  <p>Saved successfully.</p>
  <button type="button" popovertarget="toast">Close</button>
</div>

<!-- Auto-dismiss (opt-in JS) -->
<div popover="manual" id="toast-auto" data-kind="toast" data-duration="3000" role="status">
  <p>Saved successfully.</p>
  <div data-toast-progress></div>
  <button type="button" popovertarget="toast-auto">Close</button>
</div>
```

- **`[popover][data-kind="toast"]`** — a status notice pinned to the
  bottom edge, built on the Popover API: declarative, JS-free.
  Toasts are usually `popover="manual"` — no light-dismiss, so an app
  opens them when work finishes and closes them on a timer or their
  Close button (both declarative with `popovertarget`). Plain `popover`
  works too if you want Esc/click-away lifetime instead.
- **Stacking** — toasts that share a parent (siblings in one wrapper)
  stack upward: each open toast lifts above open siblings that follow
  it in the DOM. Append newest last and the column grows, oldest on
  top; closing one lets the rest settle back down. Not siblings?
  They simply overlap, newest on top. Pure CSS (`:has(~ …)` chains,
  enumerated five deep).
- **`data-variant="success|info|warning|danger"`** tints the edge from
  the status tokens.
- **`role="status"`** for non-urgent, **`role="alert"`** for urgent
  announcements.
- **Auto-dismiss (opt-in JS):** add `data-duration="ms"` (default 3000)
  to auto-dismiss after N milliseconds. The timer pauses on hover and
  keyboard focus. Respects `prefers-reduced-motion` — under reduced
  motion the toast stays open until manually closed. Load
  `js/toast.js` to enable.
- **JS:** none.
- **A11y:** role/`aria-live` come from your markup.

## Prose

```html
<article class="bf-prose">
  <h3>Section heading</h3>
  <p>A paragraph of long-form copy…</p>
  <blockquote>“No boots, no baggage.”</blockquote>
  <h3>Another section</h3>
  <table>…</table>
</article>
```

- **`.bf-prose`** — an opt-in wrapper that imposes heading rhythm and
  section spacing on long-form content. One beat between siblings; a
  full section gap before headings; tight gap below. The element look
  (blockquote border, code/keycaps, table rows) comes from the base and
  component layers — the wrapper only adds the pace.
- The measure stays capped at `--bf-content-width` (64ch) so lines
  remain readable.
- **JS:** none.
- **A11y:** plain semantic HTML; no hidden ordering or live regions.

## Media & avatars

```html
<!-- Circular avatar, token-sized (--bf-avatar-size = 2.5rem) -->
<img class="bf-avatar" alt="Ada">

<!-- data-size="sm" (1.75rem) or "lg" (4rem) -->
<img class="bf-avatar" data-size="lg" alt="Ada">

<!-- Avatar group: overlapping stack -->
<div class="bf-avatar-group">
  <img class="bf-avatar" alt="Ada">
  <img class="bf-avatar" alt="Grace">
  <img class="bf-avatar" alt="Linus">
</div>

<!-- Responsive image: shrinks to container, keeps ratio -->
<img src="wide-banner.svg" alt="…">

<!-- Aspect-ratio embed: 16:9 by default; data-ratio for 4/3, 1/1, 21/9 -->
<div data-media style="background: var(--bf-surface-alt)">
  16:9 placeholder
</div>
<div data-media data-ratio="1/1" style="background: var(--bf-surface-alt)">
  1:1
</div>

<!-- Thumbnail card: media bleeds to the top edge -->
<article class="card" data-media>
  <img data-media src="…" alt="…">
  <header>Featured</header>
  <p>Body keeps card padding.</p>
</article>
```

- **`.bf-avatar`** — circular image; size from `--bf-avatar-size`
  (2.5rem, matches `--bf-control-height`). `data-size="sm"` → 1.75rem,
  `data-size="lg"` → 4rem. Always include `alt` text.
- **`.bf-avatar-group`** — an overlapping stack of avatars: each pulls
  back over the previous one by a third of its size, and a surface ring
  keeps the faces distinct. Purely visual — reading order, tab order,
  and image semantics are untouched.
- **`[data-media]`** — locks a ratio box on an `img`, `video`,
  `iframe`, or any element (a bare `div` becomes a placeholder box).
  Width follows the container; height follows the ratio. Default 16:9;
  `data-ratio="4/3|1/1|21/9"` picks another frame. Use `object-fit:
  cover` on replaced elements so the content fills the box.
- **`.card[data-media]`** — a thumbnail card whose first child (a
  `[data-media]` element or `img`) bleeds to the top edge; the rest of
  the card keeps standard padding. The card clips the media to its own
  border radius.
- **Responsive images** — `img` and `video` have `max-width: 100%` and
  `height: auto` in the base layer, so they scale down and keep their
  aspect ratio automatically.
- **JS:** none.
- **A11y:** images need `alt`; iframe embeds should include a `title`.

## Table

```html
<table data-striped>
  <caption>…</caption>
  <thead><tr><th>…</th></tr></thead>
  <tbody>…</tbody>
</table>

<!-- Sticky header + column, over a scroll wrapper -->
<div style="max-height: 16rem; overflow: auto;">
  <table data-table="sticky-head sticky-col">
    <thead><tr><th>…</th><th>…</th></tr></thead>
    <tbody>…</tbody>
  </table>
</div>

<!-- Sortable (opt-in JS) -->
<table data-bf-sort>
  <thead><tr>
    <th><button type="button">Task</button></th>
    <th><button type="button">Points</button></th>
  </tr></thead>
  <tbody>…</tbody>
</table>
```

- `data-striped` opts into zebra rows; hover highlight on by default.
- **Sticky header / column** — `data-table="sticky-head"` pins the
  header row; `data-table="sticky-col"` pins the leading column
  (logical `inline-start`, so RTL mirrors). Values compose:
  `"sticky-head sticky-col"`. Wrap the table in a scroll container with
  a bounded height/width (`overflow: auto`) — that scroller is what the
  cells stick against. Give the wrapper `tabindex="0"` and an
  accessible name: tables hold no focusable content, so without it
  keyboard users can't scroll (WCAG 2.1.1; axe's
  `scrollable-region-focusable` flags it). Sticky cells get an opaque
  `--bf-surface` background (transparent ones show rows through) and
  `z-index: var(--bf-z-sticky)`.
- **Sortable** — put real `<button>`s in the header cells and add
  `data-bf-sort` (with `js/table-sort.js`, see
  [JavaScript](javascript.md)); the buttons are re-skinned to inherit
  the th voice, with ↕/↑/↓ indicators following the module's
  maintained `aria-sort`. Without JS nothing sorts — a plain table.
- **A11y:** `<th>`/`<caption>` do the work for screen readers; sorting
  state is announced via `aria-sort`; sticky variants are purely
  presentational and change no semantics.

## Timeline

```html
<ol data-timeline>
  <li><time>3.3</time> Segmented control, sortable tables…</li>
  <li><time>3.2</time> Deprecation sweep…</li>
</ol>
```

- **`[data-timeline]`** — an ordered list drawn as entries on a spine:
  each `li` gets a dot (`::before`) aligned to its first line, and all
  but the last get the connecting line (`::after`). Spacing comes from
  padding, so it collapses like normal list margins.
- The list keeps its native semantics — numbered, navigable, announced
  as a list.
- **JS:** none. **A11y:** plain list; content is yours.

## Empty state

```html
<div class="empty-state">
  <span aria-hidden="true">∅</span>
  <h2>No projects yet</h2>
  <p class="bf-muted">Create one to get started.</p>
  <button type="button" data-variant="primary">New project</button>
</div>
```

- **`.empty-state`** — a centered dashed panel for "nothing here yet":
  flex column, generous padding, muted border. A class because there's
  no native element for it.
- First-child glyph slots are decorative by convention — mark them
  `aria-hidden`; meaning belongs in the heading.
- **JS:** none. **A11y:** heading + copy carry the message.

## Code

```html
<code>inline</code> <kbd>Ctrl</kbd> <pre><code>block</code></pre>
```

- Monospace stack, tinted background. Keycaps (`<kbd>`) live in the
  base layer, so they ship with the core import — no component opt-in.

## Card & badge

```html
<article class="card" data-lifted> <header>…</header> <p>…</p> </article>
<span class="badge" data-variant="primary">New</span>
```

- Classes, because there is no native `<card>`/`<badge>`. Neutral by
  default; `data-lifted` opts into a shadow. Badge variants:
  `data-variant="primary|danger|success|info|warning"` — each filled
  from its token pair.

## Chip (removable tag)

```html
<span data-chip>
  css
  <button type="button" data-chip-remove aria-label="Remove css">×</button>
</span>
```

- **`[data-chip]`** — an inline badge for user-entered tags: pill
  surface, sentence case (badges shout, chips don't). The remove
  control is a **real `<button>`** re-skinned to a bare glyph — danger
  tint on hover, visible ring on keyboard focus.
- Give each remove button an `aria-label` naming what it removes; the
  chip label itself stays announced like any other text.
- **JS:** opt-in — `js/chips.js` removes the closest `[data-chip]` on
  click. No-JS first: without the module nothing hides, the × just
  does nothing.
- **A11y:** native button semantics do the work; nothing is invented.

## Divider

```html
<!-- Labelled divider: any element that can hold text -->
<p data-divider>Section two</p>
<h2 data-divider>Chapter 3</h2>

<!-- A bare <hr> stays the plain base rule (an <hr> is void — it
     cannot contain text, so the label lives on a real element) -->
<hr>
```

- **`[data-divider]`** — a separator with a centered label: muted,
  small text between two hairlines drawn by pseudo-elements. The label
  is real content, announced like any other text; the rules are
  decorative.
- Colors and stroke come from `--bf-muted` / `--bf-border` /
  `--bf-border-width`; spacing matches the base `<hr>` rhythm.
- **JS:** none.
- **A11y:** nothing hidden — text stays text, decoration stays in
  pseudo-elements.

## View transitions

```html
<link rel="stylesheet" href="barefoot-css/components/view-transition.css">
<script>
  if (document.startViewTransition) {
    document.startViewTransition(() => { root.dataset.bfTheme = "dark"; });
  } else {
    root.dataset.bfTheme = "dark";
  }
</script>
```

- Opt-in hooks for the View Transitions API, two tiers in one file.
- **Same-document** (every engine with `startViewTransition()`): import
  the file when you call it (theme switches, SPA-ish page swaps) — the
  outgoing snapshot is dropped (`animation: none`) and the incoming one
  fades in over `--bf-transition-slow`, instead of the default
  cross-fade flash.
- **Cross-document navigation (v4.6):** importing the file also opts
  every same-origin MPA navigation into a root crossfade
  (`@view-transition { navigation: auto }`) — SPA-feel page transitions
  with zero JS. Both pages must import the file; that is the whole
  contract.
- **Shared-element morphs:** give an element a name on *both* pages and
  it flies between them while everything else crossfades:

  ```html
  <img src="hero.png" style="view-transition-name: hero">
  ```

  Naming stays author-authored (CSS cannot mint unique names). Every
  named group's geometry is timed by the motion tokens:
  `--bf-vt-duration` / `--bf-vt-easing`. The root snapshot keeps its own
  pace (`--bf-transition-slow`).
- **Reduced motion:** under `prefers-reduced-motion: reduce` both tiers
  switch off — same-document snapshots render statically, and
  cross-document navigations opt back out entirely
  (`@view-transition { navigation: none }`). The guards live in this
  file on purpose: `::view-transition-*` pseudos are top-layer and out
  of reach of base.css's duration clamp.
- **Degrade by omission:** engines without cross-document transitions
  ignore the unknown at-rule and navigate exactly as before. No
  polyfill, no JS imitation.
- **JS:** yours for same-document calls — Barefoot ships only the
  `::view-transition-*` styling; cross-document transitions need none.
- **A11y:** motion-safe by default; without the media-query guard a
  theme flip would animate for everyone.

## Reveal (scroll-entry)

```html
<section data-reveal>…</section>
<section data-reveal="left">…</section>
<section data-reveal="right">…</section>
<section data-reveal="down">…</section>
<section data-reveal="fade">…</section>
```

- Opt-in scroll-entry motion (`components/reveal.css`): the element
  fades and slides into place as it enters the viewport. A scroll-driven
  animation (`animation-timeline: view()`) ties progress to the
  element's own position — scrolling back re-hides it, and there is no
  IntersectionObserver or JS anywhere.
- **Direction variants** (v4.4): `data-reveal="left|right|up|down|fade"`.
  Each maps to a distinct `@keyframes` using `translate` on one axis
  or `opacity` only. Default is `up` (fade + rise).
- **Two gates, both load-bearing:** engines without scroll-driven
  animations never apply the rule (the start state lives only inside
  the animation, so content is simply visible); and
  `prefers-reduced-motion: no-preference` wraps everything, because
  base.css's motion kill-switch clamps *durations* — which a scroll
  timeline ignores — so the media query is what actually protects
  reduced-motion users.
- **Placement:** don't put `data-reveal` inside horizontal scrollers;
  `view()` tracks the nearest scroll container's block axis by default.

## Staggered reveal (v4.4)

```html
<div data-reveal-group>
  <article data-reveal>…</article>
  <article data-reveal>…</article>
  <article data-reveal>…</article>
</div>
```

- `data-reveal-group` on a container staggers its children's reveal
  animations sequentially. `js/reveal.js` sets `--bf-reveal-index`
  (0, 1, 2, …) on each child; the CSS applies
  `animation-delay: calc(var(--bf-reveal-index) * var(--bf-reveal-stagger))`.
- Without JS, all children animate simultaneously — the stagger degrades
  gracefully. Tokens: `--bf-reveal-stagger` (100ms),
  `--bf-reveal-duration` (600ms).

## Scroll-progress bar (v4.4)

```html
<div data-progress>…</div>
<div data-progress="top">…</div>
```

- `data-progress` on any scroll container draws a thin bar that fills
  as you scroll. Uses the ANONYMOUS scroll timeline pattern from the
  carousel: `animation-timeline: scroll(nearest block)` on the
  container's own `::after`. `@supports (animation-timeline: scroll())`
  gated. `data-progress="top"` pins to top; default is bottom.
- Tokens: `--bf-progress-height` (3px), `--bf-progress-color`
  (var(--bf-primary)).
- **JS:** none. Live under `prefers-reduced-motion` (position feedback,
  not animation).

## Parallax (v4.4)

```html
<img data-parallax src="…">
```

- `data-parallax` on a decorative element makes it scroll at a
  different speed for a subtle depth effect. Pure CSS via
  `animation-timeline: scroll()` with `animation-range` tuned for a
  20-30% offset. `@supports`-gated; falls back to static position.
- **Placement:** don't put `data-parallax` inside horizontal scrollers.
- **A11y:** decorative only — content order and announcements unchanged.
  Motion stops under `prefers-reduced-motion`.

## Icons (v4.7)

```html
<span data-icon="search" aria-hidden="true"></span>
<span data-icon="close" aria-hidden="true"></span>
<span data-icon="star" data-size="lg" aria-hidden="true"></span>
<button type="button" aria-label="Search"><span data-icon="search" aria-hidden="true"></span> Search</button>
```

- **`[data-icon]`** — CSS-only icons via `mask: url()` + `currentColor`, sized by `--bf-icon-size` (1.25rem; `data-size="sm"` → 1rem, `lg` → 1.5rem). The mask is an inline SVG data URL, so no sprite, no font, 0KB JS, and the glyph inherits `color` automatically — hover, theme, and `currentColor` just work.
- Twelve glyphs: `search`, `close`/`x`, `menu`, `check`, `chevron-down`, `chevron-right`, `plus`, `trash`, `star`, `heart`, `settings`/`gear`, `user`. Add a new one by adding a `[data-icon="name"] { --bf-icon-url: url("data:image/svg+xml,…") }` rule — same pattern.
- **A11y:** icons are decorative (`aria-hidden="true"`); where the icon is the only content, give the parent button a visible label or `aria-label`.

## Command palette (v4.7)

```html
<button command="show-modal" commandfor="cmd">⌘K</button>
<dialog id="cmd" data-command>
  <form method="dialog">
    <input type="search" list="cmd-list" placeholder="Type a command…" aria-label="Command">
    <datalist id="cmd-list">
      <option value="New file"></option>
      <option value="Toggle theme"></option>
    </datalist>
  </form>
  <div data-command-list>
    <a href="#" data-command-item><span data-icon="search" aria-hidden="true"></span> Search docs</a>
    <a href="#" data-command-item data-selected><span data-icon="plus" aria-hidden="true"></span> New project</a>
  </div>
  <p data-command-hint><kbd>↑</kbd><kbd>↓</kbd> navigate · <kbd>Enter</kbd> run · <kbd>Esc</kbd> close</p>
</dialog>
```

- **`<dialog data-command>`** — a command palette built from `<dialog>` + `<input type="search" list>` + `popover` fallback. `command`/`commandfor` opens declaratively where the Invoker Commands API exists; elsewhere `dialog.showModal()` is one line.
- The list is plain `<a data-command-item>` — hover or `data-selected` paints `var(--bf-primary-subtle)`. The hint bar uses real `<kbd>` elements. The whole palette is a modal (`<dialog>` traps focus, `Esc` closes); a `[popover][data-command]` variant is also styled for light-dismiss use.
- **JS:** none.

## Data grid (v4.7)

```html
<div class="bf-contain" style="overflow:auto; max-height:24rem">
  <table data-table="sticky-head" data-grid>
    <thead><tr><th>Project</th><th>Owner</th><th>Status</th></tr></thead>
    <tbody><tr><td>…</td></tr></tbody>
  </table>
</div>
```

- Extends `components/table.css`: `data-grid` on a `<table>` makes each `<th>` `resize: horizontal` (drag the inline-end edge) and opts into a container-query stack at `≤40rem` (same breakpoint as `data-table="stack"`). Composes with `sticky-head` — header stays pinned while you resize.
- **JS:** none. **A11y:** same as table — semantic `<th>`/`<caption>` plus optional `aria-sort` from `js/table-sort.js`; the resize handle is presentational.

## Utilities

Layout-only, opt-in:

- **Container & flow** — `.bf-container`, `.bf-stack`, `.bf-row`,
  `.bf-gap-1…5`.
- **Spacing scale** — `.bf-mt-1…8` / `.bf-mb-1…8`
  (margin-block-start/end), `.bf-p-1…8` (all-sides padding),
  `.bf-px-1…8` / `.bf-py-1…8` (padding-inline/block). Each maps to the
  matching `--bf-space-*` token. When `.bf-p-*` and an axis shorthand are
  both applied, the axis shorthand wins. Under `data-density="compact"`
  the spacing scale compresses automatically.
- **Split layout** — `.bf-sidebar`: the first child is the aside
  (`--bf-sidebar-width`, 16rem), everything else flows beside it; the
  split wraps to one column when the row can't fit the aside plus ≥60%
  main. Zero media queries.
- **Sticky** — `.bf-sticky` pins an element to `--bf-sticky-top` (`0`)
  while its scrolling ancestor moves.
- **Text & a11y** — `.bf-muted`, `.bf-center`, `.bf-overline`,
  `.bf-visually-hidden`, `.bf-skip-link`.

`.bf-skip-link` is the one a11y helper worth reaching for: put it as the
**first element in `<body>`** and it's clipped out of view until keyboard
focus, then revealed top-left so the first Tab stop is "Skip to content":

```html
<a class="bf-skip-link" href="#main">Skip to content</a>
```
