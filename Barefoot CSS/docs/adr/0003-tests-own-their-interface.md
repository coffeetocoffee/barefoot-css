# ADR-0003: Tests own their interface — a fixture harness, not demo coupling

**Status:** Accepted (2026-08-22)

## Context

Before this arc, the test suites' only interface was `demo/index.html`
itself: 106 `page.goto("/demo/")` calls, 61 references to 31 distinct
`#demo-*` ids spread across three spec files, ~60 inline color literals
in assertions (each naming its token in a trailing comment — a comment
doing a constant's job), and 8 copy-pasted fixture strings.

Two detonators followed from that shape:

1. **Rename a demo id** → up to three spec files fail at once, for a
   change that touched no tested behavior.
2. **Retint a token** → every assertion that froze its old `rgb()`
   fails, although what the tests actually mean — "this element uses
   `--fz-surface-alt`" — is still true. Value-pinning already has a
   home: the contrast-parity source-parse guards (ADR-0001) and the
   visual baselines.

An architecture scan (2026-08-21) flagged this as candidate C2.

## Decision

`tests/helpers.js` becomes the seam between suites and what they
assert. Its whole surface:

- **`gotoDemo(page)`** — the only place the `/demo/` URL string lives.
- **`mountFixture(page, html)`** — navigate-then-setContent, baking in
  the documented trap that `setContent` alone bases URLs at
  `about:blank`, so `/dist/*` assets would not resolve.
- **`DEMOS`** — frozen named constants for every demo id the suites
  reference (`DEMOS.demoChips`, not `"#demo-chips"`; keys mirror the
  ids verbatim so selector and constant map by inspection). Renames
  become a one-edit change.
- **`tokenColor(page, name)`** — probe-element runtime resolution:
  append a throwaway node whose `style.color = var(--fz-x)`, read its
  computed color, remove it. The engine resolves `light-dark()` and
  the active scheme, so one comparison reads "element uses token X"
  truthfully under any theme — light, dark, or contrast.
- Shared fixture strings for markup pasted more than once.

Conventions that come with it:

- Suites import helpers; raw `"/demo/"` strings and `#demo-*` literals
  never appear in a spec file again.
- Assertions that previously froze literal colors compare against
  `tokenColor()` instead. Freezing *values* stays the job of ADR-0001
  guards and visual baselines; suite assertions pin *mechanism*.
- Migration rule for this arc: **assertion-count parity** — same test
  count, same `expect()` count per file as before. The harness changes
  how tests speak, not what they check.

Rejected alternatives:

- **Source-parse token table** (parse hexes from `tokens.css` in Node,
  convert to `rgb()`): duplicates the browser's resolution job and
  breaks on `light-dark()`.
- **Full fixture decoupling** (no suite ever touches the demo): loses
  "we test what ships" coverage and rewrites every test for no
  mechanism gain. Constants decouple names; the demo page remains the
  integration target.

## Consequences

- Demo id renames: one edit in `DEMOS`. Token retints: zero suite
  edits (visual baselines regenerate deliberately).
- New specs start from helpers; grep enforces no raw literals return.
- `helpers.js` is test infrastructure only — nothing in `src/` or
  `dist/` knows it exists, keeping the framework's shipped surface
  unchanged by this entire arc.
