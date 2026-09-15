# Barefoot — States & Real Validation

The states layer is opt-in: `import "barefoot-css/components/states.css"`.
It provides a small visual vocabulary for loading, empty, and error content;
the markup supplies the semantics. Verify audits the contracts that generic
CSS and axe cannot infer from the intended state.

## Async states

Loading and empty states use `role="status"`; error states use `role="alert"`.
Set `aria-busy="true"` while a loading region is pending. Use stable text in
the live region and replace the region's contents when the request finishes.

```html
<section class="bf-state" data-state="loading" role="status" aria-busy="true">
  Loading projects…
</section>

<section class="bf-state" data-state="empty" role="status">
  <h2>No projects yet</h2>
  <p>Create your first project to get started.</p>
  <button type="button">New project</button>
</section>

<section class="bf-state" data-state="error" role="alert">
  <h2>Projects unavailable</h2>
  <p>Try again in a moment.</p>
</section>
```

`role="status"` is polite and `role="alert"` is assertive. Do not put a
decorative spinner or icon in the announcement without `aria-hidden="true"`.

## The state machine (v7.0)

`data-state` stays single-valued; when several conditions hold at once the precedence is loading > error > empty > partial > full, with freshness (`stale` → `refreshing` → `fresh`) and an optimistic mutation cycle (`optimistic` → `confirmed` → `rolled-back`) as the other two axes.

Write **one** value — the highest that applies — and let the layer paint its
family:

| Value | Family | Paints as |
|---|---|---|
| `loading` | pending | spinner + muted (nothing has arrived) |
| `refreshing` | pending | spinner + muted (content is reloading) |
| `optimistic` | pending | spinner over a raised surface — the submitted state is already shown, confirmation pending |
| `error` | failure | danger border on a danger tint |
| `rolled-back` | failure | failure surface — an optimistic change the server rejected, already undone |
| `empty` | absence | dashed, centered panel |
| `stale` | freshness | dashed and muted — content is shown but known to be outdated |
| `partial` | settled | an inline-start bar — a set that is incomplete, not empty |
| `fresh` | settled | success accent — recently updated |
| `confirmed` | settled | success accent — the optimistic change was confirmed |
| `full` | settled | deliberately unpainted — nothing to flag |

```html
<section class="bf-state" data-state="optimistic" role="status" aria-busy="true">
  <h2>Saved locally</h2>
  <p>Waiting for the server to confirm…</p>
</section>

<section class="bf-state" data-state="rolled-back" role="alert">
  <h2>Reverted to the saved draft</h2>
  <p>The server rejected the change.</p>
</section>
```

The families are visual shorthand, not extra semantics: the live-region
contract above still applies (pending and absence states are `role="status"`,
failures are `role="alert"`), and the region's own text is always the real
status — accent color only reinforces it, and under `forced-colors` the shape
(dashed borders) survives with the hue stripped.

### One rule the CSS enforces: don't show empty while loading

If a region is still pending, it never paints the empty surface — an empty
panel reads "nothing here" about data that has not arrived. A region carrying
both `aria-busy="true"` and `data-state="empty"` renders as pending: solid
border, spinner, no centered emptiness. Resolve the conflict in your state
transition instead — clear `aria-busy` when the load lands, then set `empty`.

## Composed empty state

`.bf-empty-state` is the whole panel: a decorative glyph, a heading, a muted
explanation, and the action that ends the emptiness — grid-centered, and it
fills the parent's remaining space instead of sitting in it. Give the parent
a definite block size and let this be its only child (a grid or flex parent
hands the space over); no hand-rolled flex centering.

```html
<div style="display: grid; block-size: 24rem">
  <div class="bf-empty-state">
    <span aria-hidden="true">◌</span>
    <h3>No projects yet</h3>
    <p>Create your first project, or import one from a template.</p>
    <div class="bf-row bf-gap-2">
      <button type="button" data-variant="primary">New project</button>
      <button type="button" data-variant="ghost">Import</button>
    </div>
  </div>
</div>
```

Keep the glyph decorative (`aria-hidden`) — the heading carries the meaning;
Barefoot never invents roles. The simpler `.empty-state` panel (opt-in
`components/empty-state.css`) stays available for the non-filling case.

## Validation summary

An error summary uses `role="alert"` and `tabindex="-1"` so focus can land on it before the first invalid field.
Put it inside the form and focus it after an asynchronous submit finds errors.
Native constraint validation remains the baseline; the summary is a clear,
single announcement, not a replacement for field-level messages.

```html
<form class="bf-stack" aria-labelledby="settings-title">
  <h2 id="settings-title">Settings</h2>
  <div class="bf-error-summary" role="alert" tabindex="-1">
    <strong>Please fix the highlighted fields.</strong>
  </div>
  <div class="bf-form-group">
    <label for="email">Email</label>
    <input id="email" name="email" type="email" required
           aria-describedby="email-error">
    <small class="bf-error-text" id="email-error">
      Enter a valid email address.
    </small>
  </div>
</form>
```

Focus-first-error behavior needs a submit handler because CSS cannot move
focus. Keep that handler small: focus the summary, then let the user move to
the first invalid control. `aria-describedby` remains on every invalid field,
including fields validated by a server.

## Verify contracts

`state-live-contract` checks state announcements and `aria-busy`. The
`validation-summary-contract` rule checks the summary's live role, focus target,
and form ownership. `state-conflict` rejects a `data-state` value that is not
one documented state — a typo, or two states written into one attribute, which
the precedence table resolves instead of the attribute. These rules warn only
when the opt-in classes exist; they do not scan unrelated application status
text or rebuild axe.
