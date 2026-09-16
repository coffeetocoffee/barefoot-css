# Barefoot — Keyboard & a11y beyond the component (v7.8)

> **Selling line:** "The platform does the typing; the module finishes the sentence."

Barefoot's first move is always a native element — a `<button>` types its own
keyboard contract, a `<details>` opens on Enter, a `<dialog>` traps Tab. This
page is the honest map of where that stops and the opt-in JS starts, pattern by
pattern. If a row says "nothing," the platform already covers it and no module
exists — on purpose.

Live proofs: [the keyboard page](../demo/keyboard.html) (every surface below,
in one page, with an event log).

## The keyboard map

| Pattern | Native keyboard | Opt-in module adds |
|---|---|---|
| Popover menu | Tab reaches the trigger; Enter/Space opens it | `js/popover-menu.js` — arrows + Home/End between items, focus moves in on open, Esc/Tab closes and returns focus |
| Tabs | Tab through every tab; Enter/click switches the panel | `js/tabs.js` — roving tabindex (one Tab stop), arrows + Home/End |
| Sortable table | Tab through the header buttons; Enter/Space sorts | `js/table-sort.js` — arrows move focus between the sort buttons |
| Filter / search input | Plain text editing | `js/filter-clear.js` — Escape clears and reports `bf:filterclear` |
| Dialog, nested included | Tab trap, Esc closes, focus returns to the opener | Nothing — `showModal()` is one native line |
| Accordion | Enter/Space toggles; arrows move between summaries | Nothing |
| Carousel | Tab to the controls; scroller takes arrows natively | `js/carousel.js` — prev/next buttons, autoplay |
| Header nav | Tab through links; hamburger is a real button | `js/nav.js` — Esc closes the open drawer |
| Toast | It announces; the close button is a button | `js/toast.js` — timed dismiss, pause on hover |

The arrow-key math for the first three rows is one internal seam,
`js/roving-index.js` (ADR-0006): menus wrap past the ends (WAI-ARIA APG),
tablists and sort headers clamp. Home/End always jump to the ends; keys pressed
from outside the list enter at the nearest end.

## The roving-tabindex contract

A roving-tabindex surface keeps exactly one Tab stop: a tablist whose tabs are
all `tabindex="-1"` can never be entered, and one where several are tab stops
makes every tab one. `js/tabs.js` owns this — it lifts the active tab to
`tabindex="0"` and sinks the rest — and Verify's `roving-focus` rule audits it
(warns when the contract drifts, with the fix in the message).

The same rule audits the honest gap. The Popover API opens a menu just fine
(`popovertarget` is declarative), but opening is not focus management. A popover
menu without `js/popover-menu.js` is pointer-only — no native primitive moves
focus into it on open or answers the arrow keys. Verify says so in your console
instead of the docs waving at "accessible by default."

## Per-pattern notes

### Popover menu

```html
<button type="button" popovertarget="menu">Actions</button>
<div popover id="menu" data-kind="menu" aria-label="Actions">
  <button type="button">Rename</button>
  <button type="button">Duplicate</button>
</div>
```

Open with Enter/Space or click; ↓/↑ move between items (wrapping), Home/End
jump. Esc closes and focus returns to the trigger; Tab closes too — Tab always
means "done with this menu," even when the roster is empty (ADR-0006). This is
roving focus, not a modal trap: popovers are non-modal by design, and light
dismiss still works.

### Tabs

```html
<div data-bf-tabs>
  <div role="tablist" aria-label="…">
    <button id="t1" role="tab" aria-controls="p1" aria-selected="true">One</button>
    <button id="t2" role="tab" aria-controls="p2" aria-selected="false">Two</button>
  </div>
  <div id="p1" role="tabpanel" aria-labelledby="t1" tabindex="0">…</div>
  <div id="p2" role="tabpanel" aria-labelledby="t2" tabindex="0">…</div>
</div>
```

→/← move and activate (automatic activation); Home/End jump. Without the module
every tab is a Tab stop and every panel shows — the no-JS floor loses nothing.
`js/tabs.js` reports `bf:tabactivate`; a tab whose `aria-controls` points at
nothing dispatches an event a listener cannot act on, so `event-contract` audits
that too.

### Sortable table

The sort buttons are a horizontal line of controls, so they get the same
treatment as a tablist: focus one, press →/← to move (clamped at the ends),
Enter/Space to sort. `aria-sort` stays on one `<th>` at a time (the
`aria-sort-wired` rule audits it); `bf:sort` reports the column and direction.

### Filter input — Escape clears

```html
<label for="q">Filter the stack</label>
<input type="search" id="q" data-bf-filter>
```

No native primitive clears an input on Escape — the platform hands you a text
field and a keyboard event. `js/filter-clear.js` is the one shared line: Escape
clears the value and dispatches `bf:filterclear` (bubbling, `detail: { value: "" }`)
so the page's filter logic re-runs. Empty input + Escape is a no-op — there is
nothing to report.

### Dialog, nested included

```html
<button type="button" id="open-outer">Open dialog</button>
<dialog id="outer" aria-labelledby="outer-title">
  <form method="dialog">
    <h2 id="outer-title">Confirm</h2>
    <button type="button" id="open-inner">Read the policy</button>
    <button type="submit" value="cancel">Cancel</button>
  </form>
</dialog>
```

`showModal()` is the one native line — everything else is the platform's: Tab
stays inside the topmost dialog, Esc closes the inner dialog first, and focus
returns to the button that opened it. A `<form method="dialog">` makes the
cancel button close natively, no JS. Nested dialogs are still one topmost layer;
the inner one's opener stays visible inside the outer one, which is exactly the
case focus return was built for. (No `js/dialog-*.js` module exists, by design —
there is nothing left for it to do.)

Engine gap, stated not waved at: WebKit closes the layering correctly but does
not return focus to the opener — inner close lands focus on the outer `<dialog>`
element, outer close strands it on `<body>`. The suite pins the layering on all
three engines and the focus return on Chromium/Firefox with the reason string
attached.

## Screen readers and adaptive reflow

Reflow changes layout, never the tree: a card-stacked table is the same
`<table>` in the same order, so the reading sequence and the visual one agree.
The contract — and the two CSS ways to break it — live in
[adaptive.md](adaptive.md), and Verify's `reading-order-after-reflow` rule
audits it.

## User preferences

Three preferences the core palette doesn't assume are answered by an opt-in
layer, `components/a11y-prefs.css` — `prefers-contrast`, reduced transparency,
reduced data. See [accessibility.md](accessibility.md).
