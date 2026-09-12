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
and form ownership. These rules warn only when the opt-in classes exist; they
do not scan unrelated application status text or rebuild axe.
