# Barefoot — Opt-in JavaScript

Barefoot's CSS is **zero-JS**. When native elements aren't quite enough,
three small opt-in modules add the missing behavior. Each is a single
ES module, **zero dependencies**, and ships readable in `dist/js/`.

| Module | Size (raw) | Adds |
|---|---|---|
| `js/tabs.js` | ~2.7KB | WAI-ARIA tabs: roving tabindex, arrow-key nav |
| `js/details-close.js` | ~0.9KB | Reliable Esc-close for `details[data-menu]` |
| `js/popover-menu.js` | ~2.0KB | Arrow-key nav + focus restore for popover menus |
| `js/barefoot.js` | — | All three in one import |

## Loading

```html
<!-- all three -->
<script type="module">
  import "barefoot/js/barefoot.js";
</script>

<!-- just tabs -->
<script type="module">
  import "barefoot/js/tabs.js";
</script>
```

Each module auto-initializes existing matching markup on load. Importing
the module is enough — no init call needed.

For dynamic content, import the named functions:

```js
import { initTabs } from "barefoot/js/tabs.js";
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

## 3. Popover menu keyboard support (`js/popover-menu.js`)

For `[popover][data-kind="menu"]`, the APG menu-button behaviors:

- Focus moves to the first item when the menu opens.
- `↓`/`↑`/`Home`/`End` navigate the items.
- `Esc` (native) or `Tab` closes it; focus returns to the trigger.

This is **roving focus, not a modal trap** — popovers stay non-modal by
design. Use a `<dialog>` for blocking actions.

## Why no bundle

These are opt-in by design. Importing them is a deliberate choice the
user makes — matching the "you only pay for what you import" rule of the
framework. No builder, no framework, no polyfills; modern browsers only.
