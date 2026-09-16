# ADR-0020: form architecture — the async contract, the wizard boundary, and field arrays

**Status:** Accepted (2026-09-16)

## Context

v7.0 gave the framework a state machine; v7.2 composed it into a data
view. The next layer down is the form — and forms are where the
framework's central rule ("CSS presents state, JS mutates state") gets
tested hardest. Four gaps showed up:

1. **Async validation had no contract.** "Username taken" is a field
   error with a timing story: a value is typed, a check is in flight, a
   result arrives. The framework could paint a spinner (it has one) but
   stated nothing about `aria-busy`, nothing about the live region that
   has to announce the outcome, and nothing about how an async failure
   composes with `:user-invalid` on the *same* field. The result was
   every consumer re-inventing a divergent, often silent, pattern.
2. **Conditionally-shown fields had no boundary.** "Field B shows iff
   Field A is checked" is one `:has()` and is fine. "B shows iff A *and*
   the country is Germany *and* the tier is not free" is a three-deep
   `:has()` chain that recalculates on every keystroke and cannot be
   verified by reading it. Nothing said where the line is.
3. **Wizards were implicit.** The stepper ships and paints, but "how do
   I make this a wizard" — panel ownership, `aria-current="step"` as a
   single-valued contract, back-preserves-input — lived nowhere. The
   stepper's docs even claimed `[data-stepper]` sits on an `<ol>` while
   the demo and the CSS both use a wrapper element.
4. **Repeated fields had no shape.** "Add another phone" was raw flexbox
   per project: label, control, and a remove button that strands focus
   when its row disappears. No native element covers it, so this is
   exactly the `.card` / `.badge` case for a class.

## Decision

1. **The async contract is three pieces and one attribute.** A new
   `data-async-pending` attribute on the field's wrapper is the whole
   opt-in surface; `components/forms-async.css` paints it. The contract
   around it: `aria-busy="true"` on the same wrapper while the check is
   in flight, and a `role="status"` `.bf-async-text` region that stays in
   the DOM — its text is swapped, never the node toggled, because a live
   region that doesn't exist when the text lands announces nothing. The
   class renders the region only while it holds text (`:empty`), so the
   "hidden until needed" behavior costs the author nothing.
2. **The async failure is an ordinary field error.** It does not get its
   own state: the app sets `aria-invalid="true"` and fills
   `.bf-error-text`, so the existing validation layer paints it
   identically to a native constraint failure, and the *same* field can
   be `required` and `pattern`-gated and async-checked without the two
   mechanisms colliding. The mutual-exclusion is by construction, and
   documented: **don't fire the async check while the control is
   natively invalid** — the pattern failure is already the answer. This
   is the "debounce that doesn't fight `:user-invalid`" requirement, and
   it is guidance rather than CSS because the timing is the app's.
3. **The boundary for conditional fields is written down.** One observed
   fact → one `:has()` selector, fine in pure CSS. More than one → stop:
   JS sets `data-state`, CSS only reveals. The Rube Goldberg chain is
   banned, not merely discouraged — three conditions is a state machine
   pretending to be a stylesheet.
4. **The wizard contract is `aria-current="step"`, single-valued.** The
   stepper already paints it; what was missing was the contract. A
   wizard marks exactly one step, on an `<li>` of its `<ol>`; a stepper
   with *no* current step is a completed tracker (a receipt), not a
   violation — the rule audits wizards only. Back-preserves-input is
   stated as a hard rule with a mechanism: hide panels with `hidden`,
   never remove them, because removal destroys the value, the
   `:user-valid` state, and focus at once.
5. **Field arrays get the small class they need.** `components/field-array.css`
   aligns a repeated row (label spanning, control growing, remove button
   parked at the inline end) and sets `min-inline-size: 0` on the
   fieldset — a fieldset's UA `min-content` width overflows narrow
   containers, the same trap the decision log already records for grid
   tracks. The array stays JS-owned: appending, removing, renumbering
   accessible names, and moving focus off a doomed row are the app's,
   and the docs say so.
6. **Two Verify rules pin the auditable half.** `async-live` (WCAG
   4.1.2): a pending field carries `aria-busy="true"` and a live region
   — a decorative spinner alone announces nothing. `stepper-complete`
   (WCAG 4.1.2): one current step, on a tracked `<li>`. Both stay silent
   where the surface is absent (no attribute, no rule; no current step,
   no rule). Everything behavioral — debounce windows, focus movement,
   panel ownership — is guidance in `docs/forms.md`, not a contract,
   because Verify audits markup shape, never timing.
7. **One demo page, composed.** `demo/form-architecture.html` proves the
   async field, the wizard, both sides of the conditional boundary, the
   field array, and upload progress on its own page — the v6.2/v7.0/v7.2
   precedent, so the conformance demo's visual baselines stay untouched.

## Consequences

- Three new opt-in surfaces (`forms-async.css`, `field-array.css`, two
  registry rules) and one new demo page. `full.css` stays frozen; the
  `index.css` budget is untouched — no new tokens (the async paint
  reuses `--bf-info` / `--bf-info-subtle`).
- `data-async-pending` joins the public API table; the audit test pins
  both directions. The `data-stepper` row is corrected to the shape the
  CSS and demo have always used (wrapper of an `<ol>`, or the `<ol>`
  itself) — a doc fix, not a behavior change.
- The registry budget holds at 6656 bytes gzip (measured 6530 after the
  two quoted rules landed) — the v7.2 headroom absorbed them; no bump,
  no new budget line.
- Non-goals hold: no framework bindings, no form schema language, no
  validation library. The app owns the submit handler; the framework
  owns the paint and the contract.
- Degrade by omission holds in both directions: without the CSS the
  attribute paints nothing, and without the attribute the form is still
  a valid native form.
