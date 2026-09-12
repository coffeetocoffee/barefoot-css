# Barefoot — Recipes & On-Ramp

These are compositions, not components. Start with semantic HTML, import only
the opt-in files named by a recipe, and add application behavior separately.
No recipe is added to `full.css`.

## Sidebar + table + filter bar

Use a named `nav` for filters, a real `table` for tabular data, and the
container-aware layout primitives for the shell.

```html
<div class="bf-sidebar">
  <nav aria-label="Table filters">
    <form class="bf-stack">
      <label>Status <select><option>All</option></select></label>
      <button type="submit">Apply filters</button>
    </form>
  </nav>
  <main>
    <h1>Deployments</h1>
    <div class="bf-table-sticky" role="region" aria-label="Deployments" tabindex="0">
      <table>
        <caption>Recent deployments</caption>
        <thead><tr><th scope="col">Service</th><th scope="col">Status</th></tr></thead>
        <tbody><tr><td>Web</td><td>Healthy</td></tr></tbody>
      </table>
    </div>
  </main>
</div>
```

Import `layout-sidebar.css`, `table-sticky.css`, and the form files you use.
The scroll region contract is intentional: Verify audits its focusability and
accessible name.

## Settings form + save state

Keep the form native and let the v6.5 state contract describe asynchronous
work. Use `role="status"` for a successful non-urgent save and `role="alert"`
for a failure.

```html
<form class="bf-stack" aria-labelledby="settings-title">
  <h1 id="settings-title">Settings</h1>
  <label>Display name <input name="display-name" required></label>
  <button type="submit">Save changes</button>
  <p class="bf-state" data-state="loading" role="status" aria-busy="true" hidden>
    Saving…
  </p>
  <p class="bf-state" data-state="error" role="alert" hidden>
    We could not save your changes.
  </p>
</form>
```

The submit handler owns `hidden`, `aria-busy`, and focus. CSS never pretends to
be an async state machine.

## Empty dashboard

Use a heading to name the empty region, keep decorative artwork hidden from
assistive technology, and provide one clear next action.

```html
<section class="empty-state" aria-labelledby="empty-title">
  <span aria-hidden="true">◌</span>
  <h2 id="empty-title">No projects yet</h2>
  <p>Create your first project to get started.</p>
  <a href="/projects/new">Create a project</a>
</section>
```

## Primitive selection

- Key/value data: import `components/data-display.css`, use a `.bf-key-value`
  `<dl>` with one wrapper `<div>` per term/definition pair.
- Dashboard metric: import `components/data-display.css`, use `.bf-stat` and
  a text label plus a `.bf-stat-value`; `data-trend` is visual only.
- Chronology: use the existing `ol[data-timeline]` from `timeline.css`.
- Long-form content: use `.bf-prose` from `prose.css`; it keeps a readable
  `65ch` measure and heading rhythm.
- Navigation context: use `data-breadcrumbs` and `data-pagination` with
  `aria-current="page"`; the current item is not a link.
- Progress: use native `<progress>` for completion and `<meter>` for a value
  within a known range; add a visible label and context.

## Coming from Pico, Bootstrap, or Tailwind

**Pico:** keep the semantic markup and replace broad global imports with the
Barefoot core plus the component files you use. Barefoot's element-first base
is the closest migration path; `.card`, `.badge`, and `.bf-*` are the small
escape hatches.

**Bootstrap:** replace `.row`/`.col-*` viewport assumptions with `.bf-flow`,
`.bf-switcher`, or `.bf-sidebar` container primitives. Replace alert utility
classes with semantic `data-alert` markup and choose `role="alert"` or
`role="status"` yourself.

**Tailwind:** move repeated utility clusters into a semantic component or
recipe, then import the matching Barefoot shard. Use logical properties and
container primitives rather than viewport-specific `md:`/`lg:` forks. Keep
application-specific styling in the later `@layer user` layer.

## RTL

Barefoot uses logical properties for component geometry: `margin-inline`,
`padding-inline`, `inset-inline`, and `border-inline`. Set `dir="rtl"` on the
document or a subtree; do not mirror icons or reorder content with CSS.
Tables, sticky columns, avatar groups, pagination, and timelines preserve DOM
reading order while their visual edges follow the writing direction.
