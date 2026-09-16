# Barefoot — Verify

*You wrote plain HTML and got it subtly wrong; the framework caught it
in your console.*

Barefoot's CSS is zero-JS and axe checks generic WCAG — but only Barefoot
knows its own markup contracts: that `popovertarget` needs a live id, that
a sticky table's scroll wrapper must be focusable and named, that a
`[data-alert-dismiss]` button without `alert-dismiss.js` is a dead control.
Verify audits exactly those contracts, and nothing else — **it never
rebuilds axe**.

Verify is **opt-in by import**: it never ships in `js/barefoot.js`, and a
page that doesn't import it pays nothing. When it runs it only ever
**warns** — it never mutates the DOM or styles.

## Quick start

```html
<script type="module">
  import "barefoot-css/js/verify.js";
</script>
```

That's it. On load, every rule runs once against the page; anything
broken prints one console warning per rule, listing every offending
element and the fix:

```
[barefoot-css] verify: popover-target-exists — 2 violations
  · popovertarget="ghost" does not match any id in the document
  · popovertarget="plain" resolves, but the target has no popover attribute, so the trigger does nothing
  Fix: point popovertarget at the id of a live [popover] element (docs/components.md, Popover)
```

## Strict mode (CI)

Set `data-bf-verify="strict"` on `<html>` and violations **throw** instead
of warning — one aggregate error listing every rule's findings, for a CI
that wants red builds, not console lines:

```html
<html lang="en" data-bf-verify="strict">
```

A clean page never throws, strict or not.

## The rules

The registry (`src/js/verify-contracts.js`) is the single source of truth —
docs, checker, and CI packs all read it (ADR-0015). Every rule quotes the
exact sentence in `docs/` that states its contract, and a test fails if
that quote drifts. Seed rules:

| Rule | Audits | Since |
|---|---|---|
| `popover-target-exists` | `popovertarget` resolves to a live `[popover]` id | 6.1 |
| `sticky-scroll-focusable` | sticky-table scroll wrapper has `tabindex="0"` + an accessible name (WCAG 2.1.1) | 6.1 |
| `skip-link-first` | `.bf-skip-link` is the first element in `<body>` and its `href` resolves | 6.1 |
| `describedby-wired` | every `.bf-field-error` or `.bf-error-text` is referenced by some control's `aria-describedby` | 6.1 |
| `module-pairing` | dismiss/chips/toast controls whose opt-in JS module isn't loaded | 6.1 |
| `nav-complete-contract` | hamburger toggle points at an id'd direct `<ul>` of its nav | 6.1 |
| `state-live-contract` | loading/empty/error state has live-region semantics and loading has `aria-busy` | 6.5 |
| `validation-summary-contract` | error summary is assertive, focusable, and owned by a form | 6.5 |
| `state-conflict` | a `.bf-state` whose `data-state` is not one documented value — a typo, or two states in one attribute | 7.0 |
| `event-contract` | a tab's `aria-controls` resolves, so the `bf:tabactivate` payload is truthful | 7.0 |
| `aria-sort-wired` | a sortable table's `aria-sort` is a valid direction, on one column, backed by the sort button; `data-sort` agrees with it (WCAG 4.1.2) | 7.2 |
| `selection-complete` | a multi-select table with a select-all control names the control and states `aria-selected` on every row (WCAG 4.1.2) | 7.2 |
| `async-live` | an async-pending field carries `aria-busy="true"` and a live region announcing the outcome (WCAG 4.1.2) | 7.4 |
| `stepper-complete` | a wizard stepper marks exactly one `aria-current="step"`, on an `<li>` of its `<ol>` (WCAG 4.1.2) | 7.4 |

New rules land with a docs sentence first (or in the same change) — the
traceability gate rejects a rule without one.

## How module-pairing knows a module loaded

Behavior modules record themselves with `arm()` from `js/lifecycle.js` at
import time — `armed()` reports module-instance state, not DOM attributes.
If you import `js/barefoot.js`, every module arms and the pairing rules go
quiet. If you import only `js/verify.js`, any dismissal/chips/toast control
on the page is (truthfully) a dead control and will be reported as one.

## For dynamic content

```js
import { verify, runVerify } from "barefoot-css/js/verify.js";

// Re-scan after injecting markup:
verify();            // warns/throws per config, returns violations
runVerify();         // pure read: returns violations, prints nothing
```

`runVerify()` returns `[{ id, selector, detail, fix }]` — the same shape
the CI contract-packs build on.

## The rules in detail

Each section: the contract in one sentence, broken markup (what Verify
catches) and corrected markup (what Verify stays silent on). Try them
live on the [conformance demo](../demo/index.html#verify) — the badge
flips as you break and fix.

### `popover-target-exists`

`popovertarget` must name the `id` of a live `[popover]` element — a
typo'd or missing id leaves the trigger a silent no-op.

```html
<!-- ✗ broken: "ghost" matches nothing -->
<button type="button" popovertarget="ghost">Menu</button>

<!-- ✗ broken: target exists but is not a popover -->
<button type="button" popovertarget="pane">Menu</button>
<div id="pane">…</div>

<!-- ✓ fixed -->
<button type="button" popovertarget="menu">Menu</button>
<div popover id="menu">…</div>
```

### `sticky-scroll-focusable` (WCAG 2.1.1)

A sticky table's scroll wrapper needs `tabindex="0"` and an accessible
name — tables hold no focusable content, so keyboard users otherwise
can't scroll the region.

```html
<!-- ✗ broken: scrollable, but unreachable by keyboard and unnamed -->
<div style="overflow: auto; height: 16rem">
  <table data-table="sticky-head">…</table>
</div>

<!-- ✓ fixed -->
<div style="overflow: auto; height: 16rem"
     role="region" aria-label="Quarterly ledger" tabindex="0">
  <table data-table="sticky-head">…</table>
</div>
```

### `skip-link-first`

`.bf-skip-link` must be the first element in `<body>` (anything visible
before it takes the first Tab stop) and its `href` must resolve.

```html
<!-- ✗ broken: the hero takes the first Tab stop before the skip link -->
<body>
  <header class="hero">…</header>
  <a class="bf-skip-link" href="#main">Skip to content</a>

<!-- ✗ broken: href points at no id in the document -->
<body>
  <a class="bf-skip-link" href="#content">Skip to content</a>

<!-- ✓ fixed -->
<body>
  <a class="bf-skip-link" href="#main">Skip to content</a>
  <main id="main">…</main>
```

### `describedby-wired`

Every `.bf-field-error` or `.bf-error-text` must be referenced by some control's
`aria-describedby` — an unwired error is never announced with its field.

```html
<!-- ✗ broken: the message exists but no control references it -->
<input id="email" type="email">
<small id="email-error" class="bf-field-error">Enter an email.</small>

<!-- ✓ fixed -->
<input id="email" type="email" aria-describedby="email-error">
<small id="email-error" class="bf-field-error">Enter an email.</small>
```

### `module-pairing`

Dismiss/chips/toast controls whose opt-in JS module isn't loaded are
dead buttons. The rule fires only when the surface exists and the
module doesn't — load `js/barefoot.js` (or the single module) and it
stays silent.

```html
<!-- ✗ broken: a no-op button while js/alert-dismiss.js is not loaded -->
<div data-alert="danger" role="alert">
  <p>Failed.</p>
  <button type="button" data-alert-dismiss aria-label="Dismiss">×</button>
</div>

<!-- ✓ fixed: the module is loaded, the button works, Verify says nothing -->
<script type="module">import "barefoot-css/js/barefoot.js";</script>
<div data-alert="danger" role="alert">
  <p>Failed.</p>
  <button type="button" data-alert-dismiss aria-label="Dismiss">×</button>
</div>
```

### `nav-complete-contract`

A hamburger toggle needs a complete contract: it lives inside a
`[data-nav="header"]` / `[data-nav="drawer"]` nav, points
`aria-controls` at the nav's own direct `<ul>`, and that list carries
an `id`. An incomplete contract is never armed for collapse.

```html
<!-- ✗ broken: aria-controls points at an id that isn't the list -->
<nav data-nav="header" aria-label="Primary">
  <button type="button" class="bf-nav-toggle"
          aria-expanded="false" aria-controls="menu">Menu</button>
  <ul id="site-menu">…</ul>
</nav>

<!-- ✓ fixed -->
<nav data-nav="header" aria-label="Primary">
  <button type="button" class="bf-nav-toggle"
          aria-expanded="false" aria-controls="site-menu">Menu</button>
  <ul id="site-menu">…</ul>
</nav>
```

### `state-live-contract`

Loading and empty states use `role="status"`; error states use `role="alert"`.
Loading regions also carry `aria-busy="true"` while work is pending.

```html
<!-- ✗ broken: no live semantics and no busy state -->
<section class="bf-state" data-state="loading">Loading…</section>

<!-- ✓ fixed -->
<section class="bf-state" data-state="loading" role="status" aria-busy="true">
  Loading…
</section>
<section class="bf-state" data-state="error" role="alert">Failed.</section>
```

### `validation-summary-contract`

An error summary uses `role="alert"` and `tabindex="-1"` so focus can land on it before the first invalid field.

```html
<!-- ✗ broken: not assertive and not a focus target -->
<form><div class="bf-error-summary">Fix it.</div><input required></form>

<!-- ✓ fixed -->
<form>
  <div class="bf-error-summary" role="alert" tabindex="-1">Fix it.</div>
  <input required>
</form>
```

### `native-button-contract`

Verify audits only framework-owned semantic shape, not generic HTML. It warns
when a `div[role="button"]` is used instead of a native button or when a page
has more than one `main` landmark.

```html
<!-- ✗ broken: a div does not get native button keyboard behavior -->
<div role="button">Save</div>

<!-- ✓ fixed -->
<button type="button">Save</button>
```

### `page-structure-contract`

Keep one `<main>` landmark per page. Verify reports a duplicate main when a
page surface is present; heading conformance remains the responsibility of
axe and the application.

```html
<!-- ✗ broken: two page landmarks -->
<main><h1>One</h1></main>
<main><h1>Two</h1></main>

<!-- ✓ fixed -->
<main><h1>One</h1></main>
```

### `state-conflict`

`data-state` is single-valued. Two states written into one attribute (or a
value that is not in the documented set) means the attribute is trying to do
the precedence table's job — write one value, the highest that applies.

```html
<!-- ✗ broken: both loading and empty at once — the precedence table, not
     the attribute, decides what shows -->
<section class="bf-state" data-state="loading empty" role="status">…</section>

<!-- ✗ broken: a value the layer does not paint -->
<section class="bf-state" data-state="loadng" role="status">…</section>

<!-- ✓ fixed: one value, loading wins while the request is in flight -->
<section class="bf-state" data-state="loading" role="status" aria-busy="true">…</section>
```

### `event-contract`

The `bf:tabactivate` payload names the active tab and panel by id — a tab
whose `aria-controls` points at nothing dispatches an event a listener cannot
act on, and the module hides a panel that does not exist.

```html
<!-- ✗ broken: aria-controls resolves to no id in the document -->
<div data-bf-tabs>
  <div role="tablist" aria-label="Sections">
    <button id="tab-1" role="tab" aria-controls="panel-ghost">One</button>
  </div>
  <div id="panel-1" role="tabpanel" aria-labelledby="tab-1">…</div>
</div>

<!-- ✓ fixed -->
<div data-bf-tabs>
  <div role="tablist">
    <button id="tab-1" role="tab" aria-controls="panel-1">One</button>
  </div>
  <div id="panel-1" role="tabpanel" aria-labelledby="tab-1">…</div>
</div>
```

### `aria-sort-wired`

Sorting is single-column: `aria-sort` lives on one `<th>` at a time, its only valid values are `ascending` and `descending`, and a sorted column carries the sort button — an arrow without the control is decoration. A server-rendered sort declares the same state with `data-sort="asc"` or `data-sort="desc"` and gets the identical arrow; the two attributes must agree when both are present.

```html
<!-- ✗ broken: two columns claim the sort, and neither has a control -->
<table data-bf-sort>
  <thead><tr>
    <th aria-sort="ascending">Service</th>
    <th aria-sort="descending" data-sort="asc">Deploys</th>
  </tr></thead>
  <tbody><tr><td>api</td><td>12</td></tr></tbody>
</table>

<!-- ✗ broken: "asc" is not an ARIA value -->
<table data-bf-sort>
  <thead><tr><th aria-sort="asc"><button type="button">Service</button></th></tr></thead>
  <tbody><tr><td>api</td></tr></tbody>
</table>

<!-- ✓ fixed: one sorted column, the button behind it, a valid direction -->
<table data-bf-sort>
  <thead><tr>
    <th aria-sort="ascending" data-sort="asc"><button type="button">Service</button></th>
    <th><button type="button">Deploys</button></th>
  </tr></thead>
  <tbody><tr><td>api</td><td>12</td></tr></tbody>
</table>
```

A table with no `aria-sort` at all (before its first sort, or without the module) is not a violation — the rule only audits tables that claim an order.

### `selection-complete`

A multi-select table with a select-all control must state `aria-selected` on every row and name the select-all control — a nameless checkbox and a half-marked grid are invisible to assistive technology. The rule matches any table whose rows carry `aria-selected` and stays silent on tables without a select-all control (bring-your-own row selection) and on every table that completes the contract.

```html
<!-- ✗ broken: the select-all checkbox has no name -->
<table>
  <thead><tr><th><input type="checkbox"></th><th>Service</th></tr></thead>
  <tbody><tr aria-selected="false"><td><input type="checkbox"></td><td>api</td></tr></tbody>
</table>

<!-- ✗ broken: a select-all grid with an unmarked row -->
<table>
  <thead><tr>
    <th><input type="checkbox" class="bf-select-all" aria-label="Select all rows"></th>
    <th>Service</th>
  </tr></thead>
  <tbody>
    <tr aria-selected="true"><td><input type="checkbox" checked></td><td>api</td></tr>
    <tr><td><input type="checkbox"></td><td>web</td></tr>
  </tbody>
</table>

<!-- ✓ fixed: named control, selection stated on every row -->
<table>
  <thead><tr>
    <th><input type="checkbox" class="bf-select-all" aria-label="Select all rows"></th>
    <th>Service</th>
  </tr></thead>
  <tbody>
    <tr aria-selected="true"><td><input type="checkbox" checked aria-label="Select api"></td><td>api</td></tr>
    <tr aria-selected="false"><td><input type="checkbox" aria-label="Select web"></td><td>web</td></tr>
  </tbody>
</table>
```

The select-all's `checked`/`indeterminate` state is not audited here — it is JS-owned, because CSS cannot check a box truthfully (a painted check on an unchecked control is its own WCAG 4.1.2 lie). Name every row's checkbox too; the row's `aria-selected` is the contract, the checkbox is how a user reaches it.

### `async-live`

An async-pending field carries `aria-busy="true"` and a `role="status"` region that announces the outcome — a decorative spinner alone announces nothing.

```html
<!-- ✗ broken: the info tint and spinner are present, but nothing is
     announced and assistive technology can't mark the value provisional -->
<div class="bf-form-group" data-async-pending>
  <label for="username">Username</label>
  <input id="username" type="text">
  <small class="bf-async-text">Checking availability…</small>
</div>

<!-- ✗ broken: busy is declared, but no live region carries the outcome -->
<div class="bf-form-group" data-async-pending aria-busy="true">
  <label for="username">Username</label>
  <input id="username" type="text">
</div>

<!-- ✓ fixed: the pending state is declared and the region announces it -->
<div class="bf-form-group" data-async-pending aria-busy="true">
  <label for="username">Username</label>
  <input id="username" type="text" aria-describedby="username-async">
  <small class="bf-async-text" id="username-async" role="status">
    Checking availability…
  </small>
</div>
```

The rule audits only the pending state itself — the debounce timing and the failure result (an ordinary `aria-invalid="true"` + `.bf-error-text`) are guidance in [forms.md](forms.md), not contracts.

### `stepper-complete`

A wizard stepper marks exactly one step with `aria-current="step"`, on an `<li>` of its `<ol>` — a current marker on markup the stepper does not track is a step the user is not on.

```html
<!-- ✗ broken: two steps claim the current position at once -->
<div data-stepper>
  <ol>
    <li aria-current="step">…</li>
    <li aria-current="step">…</li>
  </ol>
</div>

<!-- ✗ broken: the current marker is not a step of the stepper's list -->
<div data-stepper>
  <ol><li>…</li></ol>
  <p aria-current="step">You are on step 2</p>
</div>

<!-- ✓ fixed: one current step, on a step item of the stepper's <ol> -->
<div data-stepper>
  <ol>
    <li data-complete>…</li>
    <li aria-current="step">…</li>
    <li>…</li>
  </ol>
</div>
```

A stepper with no `aria-current="step"` is not a violation — it is a tracker of completed steps (a receipt, a finished flow), and the rule stays silent. Back-preserves-input and panel ownership are guidance in [forms.md](forms.md), not audited contracts.

### `roving-focus` (WCAG 2.1.1)

A roving-tabindex surface keeps exactly one Tab stop, and a popover menu needs its module to answer the keyboard at all.

```html
<!-- ✗ broken: every tab is removed from the Tab order — the list can't be entered -->
<div role="tablist">
  <button role="tab" tabindex="-1">One</button>
  <button role="tab" tabindex="-1">Two</button>
</div>

<!-- ✗ broken: the tabs module is loaded but every tab is still a stop -->
<div role="tablist">
  <button role="tab" tabindex="0">One</button>
  <button role="tab" tabindex="0">Two</button>
</div>

<!-- ✗ broken: the menu opens natively, but no module moves focus in or answers the arrows -->
<button type="button" popovertarget="menu">Actions</button>
<div popover id="menu" data-kind="menu">…</div>
<!-- (no import of js/popover-menu.js) -->

<!-- ✓ fixed: one tab stop, and the menu's module loaded -->
<div role="tablist">
  <button role="tab" tabindex="0">One</button>
  <button role="tab" tabindex="-1">Two</button>
</div>
<button type="button" popovertarget="menu">Actions</button>
<div popover id="menu" data-kind="menu">…</div>
```

The tablist half is silent when the tabs module isn't loaded and every tab is a plain Tab stop — that is the valid no-JS default (each tab reachable, click to switch); the rule only speaks up when the module owns the pattern and the stops have drifted. See [keyboard.md](keyboard.md) for the full map.

### `reading-order-after-reflow` (WCAG 1.3.2)

Adaptive reflow must never reorder the DOM — neither `order` nor a reversed flex direction may appear inside a reflowing container.

```html
<!-- ✗ broken: order paints a sequence the DOM does not promise -->
<form data-form="adaptive">
  <div class="bf-row">
    <div style="order: 2">First in markup</div>
    <div>Second in markup</div>
  </div>
</form>

<!-- ✗ broken: a reversed flex direction is the other way reflow reorders -->
<form data-form="adaptive">
  <div class="bf-row" style="flex-direction: row-reverse">
    <div>First in markup</div>
    <div>Second in markup</div>
  </div>
</form>

<!-- ✓ fixed: the DOM order is the visual order, at every container width -->
<form data-form="adaptive">
  <div class="bf-row">
    <div>First in markup</div>
    <div>Second in markup</div>
  </div>
</form>
```

The rule reads computed style inside every adaptive surface (table, card, form), so a reordering that only applies inside an inactive `@container` state stays silent until the container reaches it — and a static reorder is caught at rest. The reasoning lives in [adaptive.md](adaptive.md).

## CI contract-packs

The same rules, pinned in your own Playwright suite — no checker on the
page, no console output; violations are ordinary test failures:

```js
import { runPack, runRule, assertClean } from "barefoot-css/verify/pack.mjs";

test("the app honors Barefoot's contracts", async ({ page }) => {
  await page.goto("/dashboard");
  await assertClean(page);                       // throws with a full report
  // or, composable:
  expect(await runPack(page)).toEqual([]);       // all rules
  expect(await runRule(page, "sticky-scroll-focusable")).toEqual([]); // one
});
```

How it works: the sweep is evaluated **in the page under test** and
imports `js/verify-contracts.js` from the same files the page loads —
CI pins byte-for-byte what ships, never a Node-side copy of the rules.

Two options, both honest-scoped:

- **`base`** (default `"/dist/"`) — where the framework's ESM files live
  on the page's origin. Self-hosting npm users keep the default; CDN
  users pass their jsDelivr base, e.g.
  `"https://cdn.jsdelivr.net/npm/barefoot-css@6/dist/"`.
- **`armed`** (default: every module) — which behavior modules the page
  under test loads. The *browser* checker detects loaded modules itself;
  CI cannot reach into the page's module registry, so here you declare
  it. Pages loading only some modules pass the subset — `module-pairing`
  then audits the rest as dead controls:
  `runPack(page, { armed: ["nav", "toast"] })`.

The pack is zero-dependency and assertion-agnostic — `assertClean`
throws a formatted report for any runner; `runPack`/`runRule` return
data so `expect(...)` composes. Barefoot's own test suite consumes the
pack for every registry sweep (see `tests/verify.spec.js`), which is
the dogfooding proof ADR-0015 asks for.

## What Verify is not

- **Not axe.** Generic WCAG — contrast, landmarks, label presence — stays
  with axe-core (run on every PR in this repo's CI). Verify audits only
  what Barefoot's own docs state.
- **Not a validator.** It checks Barefoot's contracts, not HTML validity.
- **Not silent-failure-proof for its own sake.** The volume law is the
  `warnOnce` precedent: once per rule per page, only when markup matches,
  never for markup Barefoot doesn't manage. If it ever nags on a valid
  page, that's a bug of the same severity as a missed warning — trust is
  the entire product.
- **Not a bundler dependency.** The pack drives a Playwright `page`; the
  browser checker runs on any page that imports it. Neither has a build
  step or a framework wrapper — plain files, plain imports.
