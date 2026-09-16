# Barefoot — Form Architecture (v7.4)

Forms are where "CSS presents state, JS mutates state" gets tested. This
doc is the contract layer over the form surfaces you already know —
native controls ([components.md](components.md#forms)), validation groups
([paint-paper.md](paint-paper.md)), and the state machine
([states.md](states.md)) — plus three opt-in pieces: async validation
(`components/forms-async.css`), field arrays (`components/field-array.css`),
and the wizard pattern on the existing stepper.

## The state boundary

One rule, drawn hard: **CSS presents state, JavaScript mutates state.**

| Concern | Owner | How |
|---|---|---|
| Field validity (native) | the platform | `:user-invalid` / `:user-valid` — fire only after a control is touched |
| Field validity (server) | the app | `aria-invalid="true"` / `"false"` — same paint, no interaction heuristic |
| Async check in flight | the app | `data-async-pending` + `aria-busy="true"` on the wrapper; CSS paints, the platform announces |
| Which wizard step is current | the app | `aria-current="step"` on one `<li>`; CSS paints, JS moves it |
| A field's value | the user, via the control | never the framework — CSS cannot check a box truthfully |
| Focus | the app | CSS cannot move focus; the summary's `tabindex="-1"` is the seam |

**Conditional fields get one `:has()`, no chains.** "Field B shows if and
only if Field A is checked" is one selector and is fine in pure CSS:

```css
form:has(#billing-same:checked) [data-billing-fields] { display: block; }
```

The moment the condition is not a single observed fact — "B shows if A is
checked *and* the country is Germany *and* the tier is not free" — stop.
A `:has()` chain over three conditions recalculates on every keystroke and
says nothing a reader can verify. The boundary: **JS sets `data-state`
(or the attribute of your own choosing), CSS only reveals.** One mutation,
one declaration, one place to read it. Ban the Rube Goldberg chain; the
demo below shows both sides of the line.

## Async validation

A field whose value is checked somewhere else — "username taken", "slug
already used", an upload in flight. Opt-in `components/forms-async.css`
paints the contract; the app owns the timing.

```html
<div class="bf-form-group" data-async-pending aria-busy="true">
  <label for="username">Username</label>
  <input id="username" type="text" required pattern="[a-z]{3,}"
         aria-describedby="username-async username-taken">
  <small class="bf-async-text" id="username-async" role="status">
    Checking availability…
  </small>
  <small class="bf-error-text" id="username-taken" role="alert">
    That one is taken. Try another.
  </small>
</div>
```

An async-pending field carries `aria-busy="true"` and a `role="status"` region that announces the outcome — a decorative spinner alone announces nothing. That is the whole audited contract (Verify's `async-live` rule); the rest is guidance:

- **Debounce, don't fight.** Wait after the last keystroke (250–400 ms)
  before firing. While the control is natively invalid, don't fire at
  all — the pattern failure is already the answer. This keeps the pending
  paint and the invalid paint mutually exclusive by construction, so
  "username taken" works *alongside* `required`/`pattern`, never against
  them.
- **The region stays in the DOM.** Swap its text — `region.textContent =
  "Checking availability…"` then `"That one is taken."` — never append and
  remove the node. A live region that doesn't exist when the text lands
  announces nothing. The class renders the region only while it holds
  text, so clear it to `""` when idle.
- **The failure is an ordinary field error.** Set `aria-invalid="true"`
  and fill the `.bf-error-text` message; the existing validation layer
  paints it exactly like a native failure. A success clears `aria-invalid`
  and the region text — the green border comes from `:user-valid`, not
  from a victory state of your own.
- **The spinner is a pseudo-element of the message**, so it is decorative
  by construction (`aria-hidden` for free, reduced-motion guarded in-file).
  Never let a spinner be the only signal.

Upload progress is the same contract at file scale: `data-async-pending`
+ `aria-busy` on the row, `.bf-async-text` narrating ("Uploading
report.pdf…"), and a themed `<progress>` bar (`forms-meter.css`) for the
shape readers can see.

## Wizard / stepper

A multi-step flow is a stepper ([components.md](components.md#stepper))
plus one panel per step. Native semantics do the work: the stepper is an
`<ol>`, each step an `<li>`, each panel a region the app shows and hides.

```html
<form aria-labelledby="signup-title">
  <div data-stepper id="signup-steps">
    <ol>
      <li aria-current="step"><div data-step><span data-step-circle>1</span><span data-step-label>Account</span></div></li>
      <li><div data-step><span data-step-circle>2</span><span data-step-label>Profile</span></div></li>
      <li><div data-step><span data-step-circle>3</span><span data-step-label>Review</span></div></li>
    </ol>
  </div>

  <section id="step-account" aria-labelledby="step-account-title">…</section>
  <section id="step-profile" hidden>…</section>
  <section id="step-review" hidden>…</section>
</form>
```

A wizard stepper marks exactly one step with `aria-current="step"`, on an `<li>` of its `<ol>` — a current marker on markup the stepper does not track is a step the user is not on. A stepper with no current step is a *tracker*, not a wizard (a completed receipt, a done flow) and the rule stays silent.

Two ownership rules that are guidance, not CSS:

- **Back preserves input.** Hide a step panel with the `hidden` attribute;
  never remove it from the DOM. A removed panel's inputs lose their
  values, their `:user-valid` state, and — if focus was inside — their
  focus. `hidden` is a presentation change; removal is a data change.
- **Step ownership.** Each panel names its step (`aria-labelledby` to the
  step's label, or its own heading), and the step buttons move both the
  panel and `aria-current="step"` in the same handler. Validate the panel
  you are leaving before advancing; focus its first invalid control (or
  the `.bf-error-summary`) — never let "Next" silently re-render.

## Field arrays

"Add another phone." There is no native element for a variable-length row,
so `components/field-array.css` is one of the few places a class exists:

```html
<fieldset class="bf-field-array">
  <legend>Phone numbers</legend>
  <div class="bf-field-array-row">
    <label for="phone-1">Phone 1</label>
    <input id="phone-1" name="phone" type="tel" required>
    <button type="button" class="bf-field-remove"
            aria-label="Remove phone 1">×</button>
  </div>
  <button type="button">Add another phone</button>
</fieldset>
```

The array is JS-owned — append a row, remove one — and CSS only aligns the
row (label above, control growing, remove button parked at the inline
end). The two pieces that are easy to get wrong:

- **Focus survives removal.** When a row goes away, its control goes with
  it; move focus first — to the next row's control, or to the add button
  when it was the last one. A stranded focus lands on `<body>`.
- **Names stay array-shaped.** Repeated `name="phone"` (or `phone[]` for
  languages that want it) so the server receives a list, and renumber the
  labels and the remove buttons' accessible names so "Remove phone 1"
  still means the first row after a middle one is deleted.

## Fieldset opinion

Group with `<fieldset>` + `<legend>` — it is the native grouping primitive,
adds no classes, and screen readers announce the legend with every control
inside. A few opinions that hold across the whole form surface:

- **A `<fieldset>` for every related group** — a contact block, a
  preference set, a field array. The legend is the group's label; do not
  substitute a `<div>` + heading for one.
- **Density via `data-density`, not by deleting padding.** A tight form is
  `data-density="compact"` on the form (or a `--bf-space-scale` dial) —
  the scale shrinks padding *and* type together. Hand-trimming `--bf-space-*`
  per group desyncs the controls from everything else on the page.
- **`min-inline-size: 0` on every form container that can be narrow** —
  fieldsets and grid rows default to `min-content` width and will overflow
  a sidebar; the framework's own containers set it, hand-rolled ones must
  too.
- **One submit per form, and it is the primary action.** A wizard's
  step buttons are `type="button"`; only the last panel's submit submits.

## Verify contracts

Two rules pin the pieces above (`docs/verify.md`):

| Rule | Audits | Since |
|---|---|---|
| `async-live` | an async-pending field carries `aria-busy="true"` and a live region | 7.4 |
| `stepper-complete` | a wizard stepper marks exactly one `aria-current="step"`, on a tracked `<li>` | 7.4 |

Both warn only when the surface exists — no `data-async-pending`, no rule;
a stepper with no current step, no rule. They do not rebuild axe; they
audit what Barefoot's own docs state.

See it live: [demo/form-architecture.html](../demo/form-architecture.html)
proves the async field, the wizard, the conditional boundary, the field
array, and upload progress on one page.
