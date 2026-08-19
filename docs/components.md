# Barefoot — Components

Element-first. You write plain HTML; Barefoot styles it. No classes needed
except where there is no native element. Every component degrades to fully
functional semantics without CSS.

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

<label for="bio">Bio (auto-grows)</label>
<textarea id="bio" rows="3" data-autogrow>…</textarea>

<label>Nickname (required)
  <input type="text" required>
</label>

<input type="checkbox"> <input type="radio">
<input type="color"> <input type="file">
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
  Pair each field with `.fz-field-error` text wired up via
  `aria-describedby`.
- **Field-level states** — `:user-invalid` / `:user-valid` fire only
  *after* a control is touched (nothing flashes on page load): invalid
  fields get the danger border, valid fields get the success border.
  Script-driven forms can mirror the state with
  `aria-invalid="true"` / `"false"` — same painting, no interaction
  heuristic. Message helpers: `.fz-field-hint` (muted guidance),
  `.fz-field-error` (danger), `.fz-field-success` (success).
- **JS:** none.
- **A11y:** native controls + browser validation UX.

## Dialog (modal)

```html
<dialog aria-labelledby="title">
  <header>Title</header>
  <p>…</p>
  <footer><button>Cancel</button><button data-variant="danger">Delete</button></footer>
</dialog>
```

```js
// The one native line Barefoot requires anywhere:
document.querySelector("dialog").showModal();
```

- `::backdrop` blurred dim; entrance animation via `@starting-style`.
- `data-width="sm|lg"` for sizing.
- **JS:** `showModal()` to open — one native method, no library.
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
- **Anchoring:** in browsers with anchor positioning (Chromium 125+,
  Firefox 147+, Safari 18.2+), give the trigger `anchor-name: --x` and the
  popover `position-anchor: --x` (use the popover's id as `--x`) and it
  pins to that trigger — the menu below, left-aligned; the tooltip above,
  centered. One inline style on each element, unique per popover, so any
  number of anchored popovers can coexist. (A named anchor is used rather
  than the `anchor` attribute because Chromium doesn't support that
  attribute yet.) Without anchor positioning the popover falls back to the
  default placement. `position-try-fallbacks: flip-block` flips the
  popover to the opposite side when the trigger sits near a viewport edge
  (e.g. a menu anchored below a button at the bottom of the screen opens
  above it instead).
- **Cross-browser:** `position-area` anchoring is verified in Chromium,
  Firefox, and WebKit (Safari) by the CI behavior suite, including the
  viewport-edge flip. One Firefox limitation: if the trigger is *off-screen*
  when the popover opens, the anchor resolves to the viewport edge —
  triggers are clicked in view, so this only matters if a script opens a
  popover programmatically. The opt-in `js/popover-anchor.js` module
  closes such popovers (matching the spec intent of `position-visibility:
  anchors-visible`); without it the popover may appear clipped at the
  viewport edge in Firefox, or pinned off-screen in Chromium/WebKit.
- **Difference from dialog:** popover is non-modal (no focus trap) — right
  for menus/tooltips, not for blocking actions.

## Dropdown (details/summary)

```html
<details data-menu>
  <summary>Actions</summary>
  <div><a href="#">Edit</a><a href="#">Share</a></div>
</details>
```

- Custom chevron marker; panel floats below the summary.
- **JS:** none.
- **A11y:** native disclosure; `Enter` toggles, `Tab` moves.
- **Esc caveat:** closing on `Esc` is browser-dependent for `<details>`
  (Chrome closes only when focus is inside the panel). If guaranteed
  Esc + click-away dismiss matters, use the **popover menu** below
  (`[popover][data-kind="menu"]`) — same look, reliable platform behavior.
- **Safari tab-order quirk:** WebKit does not include the contents of an
  open `<details>` in the sequential tab order (a long-standing Safari
  behavior), so Tab skips past its links there. Items stay clickable and
  focusable; keyboard users on Safari can reach them via the "next form
  control" key or by closing the panel first.

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
<div data-fz-tabs>
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
  module marks the group `data-fz-tabs-js` (a CSS hook) and hides inactive
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
<div class="fz-contain">                 <!-- makes the query container -->
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
  width (wrap it in `.fz-contain`): 1 column below 30rem, 2 up to 48rem,
  3 after. Same markup, zero media queries.
- **`[data-grid="auto-fit"]` / `[data-grid="auto-fill"]`** — flows as
  many columns as fit, each at least `--fz-grid-min` (14rem by default).
  Tracks size against the row itself, so no container query is needed.
  (`auto-fill` keeps empty tracks; `auto-fit` collapses them.)
- **`data-gap="0|1…8"`** — tunes the gap from the spacing scale
  (default `4` → `--fz-space-4`). Override `--fz-grid-gap` for a global
  default.
- **JS:** none.
- **A11y:** document order is visual order; cards are `<article>`s.

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

## Navigation

```html
<nav data-nav aria-label="Primary">
  <a class="fz-brand" href="/">Acme</a>
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

- **`[data-nav]`** — a topbar row: an optional `.fz-brand` (a class,
  because there is no native element for a site name) plus a link list.
  The row wraps on narrow screens — nothing toggles, nothing hides.
- **`data-nav="header"`** — topbar with a bottom hairline.
  **`data-nav="footer"`** — footer row: muted, small, top hairline, links
  pushed to the end.
- **`aria-current="page"`** — marks the active link (accent + semibold).
- **JS:** none.
- **A11y:** a `<nav aria-label>` is a named landmark for free. Pair it
  with `.fz-skip-link` as the first element in `<body>` so the first Tab
  stop skips past the nav to `<main>`.

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
```

- **`.skeleton`** — a pure-CSS loading placeholder: a surface-alt bar
  with a shimmering highlight sweeping left→right. Set the size to
  match the content it will replace (text lines ≈ 1rem tall).
- **`prefers-reduced-motion`** — the shimmer stops; the placeholder
  stays static.
- **JS:** none.
- **A11y:** decorative only — it must be replaced by (or paired with)
  real content before a screen reader would ever announce it.

## Toast

```html
<button type="button" popovertarget="toast">Show toast</button>
<div popover id="toast" data-kind="toast" data-variant="success"
     role="status"><p>Saved successfully.</p></div>
```

- **`[popover][data-kind="toast"]`** — a status notice pinned to the
  bottom edge, built on the Popover API: declarative, JS-free. The
  trigger opens it; <kbd>Esc</kbd> or click-away closes it.
- **`data-variant="success|info|warning|danger"`** tints the edge from
  the status tokens.
- **`role="status"`** for non-urgent, **`role="alert"`** for urgent
  announcements.
- **Honest note:** auto-dismiss after N seconds needs a timer, i.e. JS.
  Barefoot keeps toasts user-dismissible by default; bring your own
  timeout if you want one.
- **JS:** none.
- **A11y:** role/`aria-live` come from your markup.

## Prose

```html
<article class="fz-prose">
  <h3>Section heading</h3>
  <p>A paragraph of long-form copy…</p>
  <blockquote>“No boots, no baggage.”</blockquote>
  <h3>Another section</h3>
  <table>…</table>
</article>
```

- **`.fz-prose`** — an opt-in wrapper that imposes heading rhythm and
  section spacing on long-form content. One beat between siblings; a
  full section gap before headings; tight gap below. The element look
  (blockquote border, code/keycaps, table rows) comes from the base and
  component layers — the wrapper only adds the pace.
- The measure stays capped at `--fz-content-width` (64ch) so lines
  remain readable.
- **JS:** none.
- **A11y:** plain semantic HTML; no hidden ordering or live regions.

## Media & avatars

```html
<!-- Circular avatar, token-sized (--fz-avatar-size = 2.5rem) -->
<img class="fz-avatar" alt="Ada">

<!-- data-size="sm" (1.75rem) or "lg" (4rem) -->
<img class="fz-avatar" data-size="lg" alt="Ada">

<!-- Responsive image: shrinks to container, keeps ratio -->
<img src="wide-banner.svg" alt="…">

<!-- Aspect-ratio embed: 16:9 by default; data-ratio for 4/3, 1/1, 21/9 -->
<div data-media style="background: var(--fz-surface-alt)">
  16:9 placeholder
</div>
<div data-media data-ratio="1/1" style="background: var(--fz-surface-alt)">
  1:1
</div>

<!-- Thumbnail card: media bleeds to the top edge -->
<article class="card" data-media>
  <img data-media src="…" alt="…">
  <header>Featured</header>
  <p>Body keeps card padding.</p>
</article>
```

- **`.fz-avatar`** — circular image; size from `--fz-avatar-size`
  (2.5rem, matches `--fz-control-height`). `data-size="sm"` → 1.75rem,
  `data-size="lg"` → 4rem. Always include `alt` text.
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
```

- `data-striped` opts into zebra rows; hover highlight on by default.
- **A11y:** `<th>`/`<caption>` do the work for screen readers.

## Code

```html
<code>inline</code> <kbd>Ctrl</kbd> <pre><code>block</code></pre>
```

- Monospace stack, tinted background, kbd gets a keycap border.

## Card & badge

```html
<article class="card" data-lifted> <header>…</header> <p>…</p> </article>
<span class="badge" data-variant="primary">New</span>
```

- Classes, because there is no native `<card>`/`<badge>`. Neutral by
  default; `data-lifted` opts into a shadow. Badge variants:
  `data-variant="primary|danger|success|info|warning"` — each filled
  from its token pair.

## Utilities

Layout-only, opt-in:

- **Container & flow** — `.fz-container`, `.fz-stack`, `.fz-row`,
  `.fz-gap-1…5`.
- **Spacing scale** — `.fz-mt-1…8` / `.fz-mb-1…8`
  (margin-block-start/end), `.fz-p-1…8` (all-sides padding),
  `.fz-px-1…8` / `.fz-py-1…8` (padding-inline/block). Each maps to the
  matching `--fz-space-*` token. When `.fz-p-*` and an axis shorthand are
  both applied, the axis shorthand wins.
- **Split layout** — `.fz-sidebar`: the first child is the aside
  (`--fz-sidebar-width`, 16rem), everything else flows beside it; the
  split wraps to one column when the row can't fit the aside plus ≥60%
  main. Zero media queries.
- **Sticky** — `.fz-sticky` pins an element to `--fz-sticky-top` (`0`)
  while its scrolling ancestor moves.
- **Text & a11y** — `.fz-muted`, `.fz-center`, `.fz-overline`,
  `.fz-visually-hidden`, `.fz-skip-link`.

`.fz-skip-link` is the one a11y helper worth reaching for: put it as the
**first element in `<body>`** and it's clipped out of view until keyboard
focus, then revealed top-left so the first Tab stop is "Skip to content":

```html
<a class="fz-skip-link" href="#main">Skip to content</a>
```
