# Barefoot — Accessibility

Barefoot's stance: **accessibility is inherited from the platform, not
added as an afterthought.** We style native elements, which ship semantics,
focus management, and keyboard behavior for free. We never make you "add
ARIA to the divs" — there are no divs.

## What we guarantee

- **Keyboard operable, all components.** The full keyboard matrix is in
  `demo/index.html`. Everything is reachable with `Tab`, `Enter`, `Space`,
  `Esc`, and arrow keys where native.
- **Visible focus everywhere.** `:focus-visible` ring on all interactive
  elements, with sufficient contrast against every surface.
- **AA contrast by default.** The default ink-on-paper palette passes
  WCAG 2.1 AA. The `contrast` theme goes further.
- **Reduced motion respected.** `prefers-reduced-motion` collapses all
  transitions and animations globally.
- **Semantic landmarks.** Sections use real headings; components use
  `button`, `details/summary`, `dialog`, `th/caption`, `progress`.
- **Focus trap + Esc**, **light dismiss**: inherited from `<dialog>` and
  the Popover API.
- **Skip link.** The `.fz-skip-link` utility (first element in `<body>`)
  is clipped out of view until keyboard focus, so the first Tab stop is
  "Skip to content" — the WCAG 2.4.1 bypass-block pattern, free.
- **Validation without JS.** `:user-invalid` / `:user-valid` /
  `[aria-invalid]` get a danger (invalid) or success (valid) border —
  touched only, nothing flashes on page load. Labels that wrap a
  required control get an asterisk, and `form:has(:user-invalid)` draws
  a subtle ring around the whole form — all browser-driven, no script.
- **Status feedback.** Alerts take their live-region semantics from
  *your* markup (`role="alert"`, `aria-live="polite"`); toasts (Popover
  API) pair `role="status"` / `role="alert"` with an open/close contract
  (`Esc`, click-away). Skeleton is decorative — it never announces.

## How each component earns it for free

| Component | Native primitive | What the browser gives us |
|---|---|---|
| Button | `<button>` | `Enter`/`Space` activation, disabled semantics |
| Forms | `<input>/<select>/<textarea>` | labels, validation, autofill, invalid state || Dialog | `<dialog>` | focus trap, `Esc` close, modal semantics |
| Popover | Popover API | `Esc`, click-away dismiss, top-layer |
| Dropdown | `<details>/<summary>` | disclosure semantics, toggle, `Esc` |
| Accordion | `<details name>` | disclosure semantics, exclusivity |
| Carousel | scrollable div + `tabindex` | keyboard scrolling (with our docs) |
| Table | `<th>/<caption>` | header/cell association for SRs |
| Navigation | `<nav>` + `<ul>` | named landmark, list semantics, `aria-current` |
| Layout | flex/grid + `position: sticky` | visual structure only; order is document order |
| Alert | `role="alert"` / `aria-live` | live-region semantics are your markup; we paint |
| Skeleton | decorative | no announced semantics; content replaces it |
| Toast | Popover API | `Esc` + click-away dismiss, top-layer |

## What we ask of you (small, documented)

1. **Carousel:** keep `tabindex="0"` and add `aria-label`.
2. **Dialog:** give it an accessible name (`aria-labelledby` or a
   `<header>`), and open with `showModal()`, not `show()`.
3. **Icons/link labels:** provide text; don't ship icon-only buttons
   without an accessible name.
4. **Images:** `alt` text is yours, not ours — including `.fz-avatar`
   and any `img` inside `.card[data-media]` or `[data-media]`.
5. **Embeds:** `iframe` with `[data-media]` should include a `title`
   attribute for screen readers.

That's the whole list. Compare that to "add `role`, `tabindex`, focus trap,
Esc handler, and `aria-expanded` to every widget" — the Bootstrap way.

## Honest exceptions

- **WAI-ARIA tabs** (arrow-key navigation) needs JS — it's the opt-in
  `js/tabs.js` module. Without it, `details[name]` gives you the
  one-at-a-time disclosure, or every panel just stays visible.
- **`<details>` Esc-to-close is browser-dependent by default.** Chrome
  closes on Escape only when focus is *inside the panel*; Firefox closes
  from the summary. Options: use the **Popover API** for menus (Esc +
  click-away is part of the platform), or load the opt-in
  `js/details-close.js` to make Esc close `details[data-menu]` reliably
  and return focus to the summary.
- **Popover menus** are non-modal by design (roving focus, not a modal
  trap) — correct for menus, wrong for blocking actions; use dialog for
  those. The opt-in `js/popover-menu.js` adds arrow-key nav + focus
  restore.
- **Safari doesn't tab into open `<details>` content** (a long-standing
  WebKit behavior): links inside an open `<details>` are skipped by the
  sequential tab order in Safari. They stay clickable and programmatically
  focusable; load the opt-in `js/details-tabindex.js` shim to give open
  `<details>` panels a real tab stop in every engine.

## Conformance matrix (from demo/index.html)

| Component | WCAG | Walkthrough |
|---|---|---|
| Button | AA | Tab → Enter/Space |
| Form controls | AA | Tab → type |
| Dialog | AA | Esc closes, focus trapped |
| Popover | A | Enter opens, Esc/click-away closes |
| Dropdown | AA | Enter toggles, Tab through items |
| Accordion | AA | Tab between, Enter toggles |
| Tabs (opt-in JS) | AA | Tab into tablist, arrows switch, Home/End jump |
| Carousel | A | Tab, then arrow keys |
| Table | AA | th/caption announced |
| Navigation | AA | Tab through links; `aria-current` announces the current page |
| Layout | AA | Sidebar stacks when narrow; sticky pins while scrolling |
| Alert | AA | `role="alert"` announces errors; `aria-live` announces updates |
| Skeleton | AA | decorative; real content replaces it |
| Toast | AA | `role="status"` announces politely; Esc/click-away closes |
| Prose | AA | semantic headings/blockquote/table; rhythm only, no hidden content |
| Media & avatars | AA | images carry `alt`; `[data-media]` keeps ratio; avatars are images |

## CI — wired (0.2, expanded for 1.0)

`npm test` runs the conformance suite (see `tests/`); GitHub Actions
(`.github/workflows/ci.yml`) runs all of it on every push/PR:

- **axe-core a11y** — demo page in five states (resting, dark,
  dialog-open, dropdown-open, toast-open) must report **zero
  violations**.
- **Keyboard-contract tests** — focus ring present, `<details>` toggle
  and item focus, popover Esc-close, dialog Esc + focus return.
- **Cross-engine behavior** — the JS + CSS behavior suites re-run on
  **Firefox** (Linux runner) and **WebKit/Safari** (macOS runner), not
  just Chromium.
- **Visual regression** — light/dark full-page screenshots vs committed
  `*-win32.png` baselines (visual job pinned to a Windows runner).
- **Size budget** — `npm run size` fails if `index.css` exceeds 10KB gzip.
