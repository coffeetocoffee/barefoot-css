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

## Dropdown (details/summary)

> **Deprecated since 3.2, removed in 4.0.** Use the [popover
> menu](#popover-fully-js-free-modal-like-layer) instead — same look,
> reliable `Esc` and light-dismiss everywhere. The markup below keeps
> working through 3.x; see [api.md → Deprecations](api.md#deprecations).

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
```

- **`.skeleton`** — a pure-CSS loading placeholder: a surface-alt bar
  with a shimmering highlight sweeping left→right. Set the size to
  match the content it will replace (text lines ≈ 1rem tall).
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

- Opt-in hooks for the View Transitions API. Import
  `components/view-transition.css` when you call
  `document.startViewTransition()` (theme switches, SPA-ish page swaps):
  the outgoing snapshot is dropped (`animation: none`) and the incoming
  one fades in over `--bf-transition-slow`, instead of the default
  cross-fade flash.
- **Reduced motion:** under `prefers-reduced-motion: reduce` both
  snapshots render statically — no fade, no movement.
- **JS:** yours — Barefoot ships only the `::view-transition-*` styling;
  you decide when to call `startViewTransition()`.
- **A11y:** motion-safe by default; without the media-query guard a
  theme flip would animate for everyone.

## Reveal (scroll-entry)

```html
<section data-reveal>…</section>
```

- Opt-in scroll-entry motion (`components/reveal.css`): the element
  fades from 0 and rises `--bf-space-4` into place as it enters the
  viewport. A scroll-driven animation (`animation-timeline: view()`)
  ties progress to the element's own position — scrolling back re-hides
  it, and there is no IntersectionObserver or JS anywhere.
- **Two gates, both load-bearing:** engines without scroll-driven
  animations never apply the rule (the start state lives only inside
  the animation, so content is simply visible); and
  `prefers-reduced-motion: no-preference` wraps everything, because
  base.css's motion kill-switch clamps *durations* — which a scroll
  timeline ignores — so the media query is what actually protects
  reduced-motion users.
- **Placement:** don't put `data-reveal` inside horizontal scrollers;
  `view()` tracks the nearest scroll container's block axis by default.

## Utilities

Layout-only, opt-in:

- **Container & flow** — `.bf-container`, `.bf-stack`, `.bf-row`,
  `.bf-gap-1…5`.
- **Spacing scale** — `.bf-mt-1…8` / `.bf-mb-1…8`
  (margin-block-start/end), `.bf-p-1…8` (all-sides padding),
  `.bf-px-1…8` / `.bf-py-1…8` (padding-inline/block). Each maps to the
  matching `--bf-space-*` token. When `.bf-p-*` and an axis shorthand are
  both applied, the axis shorthand wins.
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
