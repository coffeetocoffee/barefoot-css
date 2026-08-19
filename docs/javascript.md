# Barefoot — Opt-in JavaScript

Barefoot's CSS is **zero-JS**. When native elements aren't quite enough,
six small opt-in modules add the missing behavior. Each is a single
ES module, **zero dependencies**, and ships readable in `dist/js/`.

| Module | Size (raw) | Adds |
|---|---|---|
| `js/tabs.js` | ~2.7KB | WAI-ARIA tabs: roving tabindex, arrow-key nav |
| `js/details-close.js` | ~0.9KB | Reliable Esc-close for `details[data-menu]` |
| `js/details-tabindex.js` | ~1.9KB | WebKit tab-order fix for open `<details>` panels |
| `js/popover-menu.js` | ~2.2KB | Arrow-key nav + focus restore for popover menus |
| `js/popover-anchor.js` | ~2.3KB | Closes anchored popovers whose trigger is off-screen |
| `js/carousel.js` | ~4.8KB | Carousel autoplay + prev/next controls |
| `js/barefoot.js` | — | All six in one import |

## Loading

```html
<!-- all six -->
<script type="module">
  import "barefoot-css/js/barefoot.js";
</script>

<!-- just carousel -->
<script type="module">
  import "barefoot-css/js/carousel.js";
</script>
```

Each module auto-initializes existing matching markup on load. Importing
the module is enough — no init call needed.

For dynamic content, import the named functions:

```js
import { initTabs } from "barefoot-css/js/tabs.js";
initTabs(document.getElementById("app"));
```

## 1. Tabs (`js/tabs.js`)

Styles live in `components/tabs.css`; the module drives behavior.

```html
<div data-fz-tabs>
  <div role="tablist" aria-label="Sections">
    <button id="tab-1" role="tab" aria-controls="panel-1" aria-selected="true">One</button>
    <button id="tab-2" role="tab" aria-controls="panel-2" aria-selected="false">Two</button>
  </div>
  <div id="panel-1" role="tabpanel" aria-labelledby="tab-1" tabindex="0">…</div>
  <div id="panel-2" role="tabpanel" aria-labelledby="tab-2" tabindex="0">…</div>
</div>
```

Behavior: automatic activation — `←`/`→` switch and select, `Home`/`End`
jump, `Tab` leaves the tablist into the active panel. `aria-selected` and
`tabindex` are managed for you.

**No-JS first:** without the module every panel stays visible — content
is never hidden from a user without JS, it just loses the tab chrome.
On init the module marks the group `data-fz-tabs-js` (a hook for CSS or
other code) and hides inactive panels synchronously. Load the module in
`<head>` (or before your content) so it runs before first paint and
there's no flash of all panels.

## 2. Details Esc-close (`js/details-close.js`)

Fixes the browser-dependent Esc behavior of `<details>` (Chrome closes
only when focus is *inside* the panel). With this module, pressing `Esc`
anywhere inside an open `details[data-menu]` closes it and returns focus
to the summary.

```html
<details data-menu>
  <summary>Actions</summary>
  <div><a href="#">Edit</a><a href="#">Share</a></div>
</details>
```

Load the module; every `details[data-menu]` gets the behavior. No markup
changes.

## 3. Details tab order (`js/details-tabindex.js`)

WebKit/Safari skips the contents of an *open* `<details>` in the
sequential tab order (a long-standing WebKit quirk): panel links and
buttons stay clickable, but Tab never reaches them. This module walks the
panel of every open `details` and gives its focusable descendants an
explicit `tabindex="0"`, so keyboard users can Tab into the panel in every
engine.

```html
<details>
  <summary>Actions</summary>
  <div><a href="#">Edit</a><a href="#">Share</a></div>
</details>
```

- Watches the `open` attribute (a MutationObserver), so panels opened by
  click, keyboard, or script are all covered.
- Skips elements with a deliberate `tabindex="-1"`.
- Panels already open when the module loads are fixed at init.
- In Chromium/Firefox this is effectively a no-op — their native tab order
  already includes open `<details>` contents.

## 4. Popover menu keyboard support (`js/popover-menu.js`)

For `[popover][data-kind="menu"]`, the APG menu-button behaviors:

- Focus moves to the first item when the menu opens.
- `↓`/`↑`/`Home`/`End` navigate the items.
- `Esc` (native) or `Tab` closes it; focus returns to the trigger.

This is **roving focus, not a modal trap** — popovers stay non-modal by
design. Use a `<dialog>` for blocking actions.

## 5. Anchored popover off-screen guard (`js/popover-anchor.js`)

For `[popover]` elements that pin to a trigger via anchor positioning
(`position-anchor`), the guard closes a popover whose trigger is **fully
outside the viewport when it opens**:

- A script calls `showPopover()` while the trigger is scrolled away, and
  no engine hides the popover: Firefox 153+ clamps it to the viewport
  edge (visible at the wrong place), Chromium/WebKit pin it to the
  off-screen trigger. Both are wrong — the guard closes it instead,
  matching the spec intent of `position-visibility: anchors-visible`,
  which no engine implements yet.
- A trigger **in view** is untouched: click-to-open and programmatic
  opens behave exactly as native. Only the fully-off-screen case is
  closed.
- Runs once per popover open; the anchor is found via the popover's
  `anchorElement` when supported, else the documented inline
  `anchor-name` pattern (with a computed-style fallback).

Without the module, the CSS-only behavior (including the viewport-edge
flip in 1.3) is unchanged — the guard is purely additive.

## 6. Carousel controls + autoplay (`js/carousel.js`)

The base `[data-carousel]` is a pure scroll-snap scroller (CSS only,
zero JS). This module adds optional autoplay and prev/next buttons.

```html
<div data-carousel id="c" tabindex="0" aria-label="Slides" data-autoplay="3000">
  <div>Slide 1</div><div>Slide 2</div><div>Slide 3</div>
</div>
<button type="button" data-carousel-prev="#c" aria-label="Previous slide">←</button>
<button type="button" data-carousel-next="#c" aria-label="Next slide">→</button>
```

- **Autoplay** — `data-autoplay="ms"` (3000ms default, floored at 1000ms).
  It pauses on hover, keyboard focus, and when the tab is hidden, and
  never starts under `prefers-reduced-motion: reduce`. An autoplaying
  carousel is marked `aria-live="off"` unless the author already set it —
  the prev/next controls (and the scroller's own keyboard use) are the way
  in.
- **Controls** — `data-carousel-prev` / `data-carousel-next` take a
  selector for the scroller (it's a sibling, never a child — children
  become slides). Clicking steps exactly one slide and wraps at both ends.
  Controls work with or without autoplay.
- **Semantics** — the module sets `role="group"` +
  `aria-roledescription="carousel"` on scrollers that don't already have a
  role; it never invents a name.
- **No-JS first** — without this module the scroller is still
  keyboard-scrollable and keyboard users never lose the slides. Nothing
  is hidden from a JS-less user; they just don't get auto-advance or
  buttons.

## Why no bundle

These are opt-in by design. Importing them is a deliberate choice the
user makes — matching the "you only pay for what you import" rule of the
framework. No builder, no framework, no polyfills; modern browsers only.
