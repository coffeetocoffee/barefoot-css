# Barefoot — Architecture & Global Navigation

The v6.7 combined architecture layer is opt-in. Import
`components/forms-state.css` when application code can truthfully set a
form's `data-state`.

## Declarative form states

`data-state="invalid"` maps an application-owned form state to a visible
danger edge and the native `:invalid` controls inside it. `data-state="loading"`
adds a progress cursor and prevents pointer activation while a request is
pending. CSS does not invent or remove state, submit forms, or move focus.

The state attribute belongs on the form, and an invalid form still needs
native constraints, field messages, and the validation-summary contract:

```html
<form data-state="invalid" aria-labelledby="title">
  <h2 id="title">Profile</h2>
  <div class="bf-error-summary" role="alert" tabindex="-1">
    Please fix the highlighted fields.
  </div>
  <label>Email <input type="email" required aria-describedby="email-error"></label>
  <small id="email-error" class="bf-error-text">Enter a valid email.</small>
</form>
```

An application that changes `data-state` must also keep `aria-busy`, live
regions, and focus behavior accurate. Use the existing `docs/states.md`
guidance for those seams.

## Verify usage audit

Verify audits only framework-owned semantic shape, not generic HTML. It warns
when a `div[role="button"]` is used instead of a native button or when a page
has more than one `main` landmark. These warnings are guidance, not a
replacement for axe.

## Cross-document navigation

Import `components/view-transition.css` on every same-origin document in a
navigation pair to opt into the browser's cross-document View Transitions API.
The existing layer degrades by omission and disables navigation transitions
under reduced motion.

Speculation Rules are HTML, not CSS. Add them as a separate, browser-gated
enhancement when prefetching is appropriate:

```html
<script type="speculationrules">
{
  "prefetch": [{"where": {"href_matches": "/projects/*"}}]
}
</script>
```

Do not prefetch authenticated, personalized, or destructive destinations.
Navigation must remain correct when the browser ignores the rule.

## Script-aware typography

Import `components/script-type.css` for multilingual surfaces. `:lang(ja)` /
`:lang(ko)` / `:lang(zh)` use CJK metrics, while Arabic-family scripts use
appropriate leading and reset tracking. The selectors follow the nearest
semantic `lang` attribute, so mixed-script passages do not need classes.
