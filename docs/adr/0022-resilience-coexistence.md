# ADR-0022: resilience & coexistence — elastic i18n, the side-by-side contract, print full-or-cut

**Status:** Accepted (2026-09-17)

## Context

Through v7.8 the framework assumed its own document: one Barefoot, one
language, one screen. Three classes of real page broke that:

1. **Text expansion.** German runs ~30% longer than English, Arabic and
   user-generated content more still. Expansion breaks more layouts than
   direction ever did, and nothing in the framework answered it: a long
   label overflowed its row or clipped, and the fix was always
   hand-rolled per page (`white-space`, fixed widths, media queries).
2. **Side-by-side.** Consumers run Barefoot next to Tailwind, Bootstrap,
   or a legacy reset. The framework's element styles all live in cascade
   layers by design — which means an *unlayered* co-loaded reset beats
   every one of them, and the highest-casualty surface is the
   `:focus-visible` ring (pillar #4): it disappears on every element at
   once, silently, with no error and no axe finding (axe does not measure
   computed outline). The guidance existed nowhere, and the failure was
   un-debuggable.
3. **Print depth.** The v6.3 print layer flattened and re-tabulated, but
   a wide table still clipped at the page edge, a heading could orphan
   its content, and page geometry was undefined.

## Decision

1. **Elastic is a primitive, not a setting.** Opt-in
   `components/elastic.css` ships `.bf-elastic` — `inline-size:
   fit-content` clamped between `--bf-elastic-min` (the control floor)
   and `min(100%, --bf-elastic-max)` (the measure) — plus
   `overflow-wrap: anywhere` and `text-wrap: balance`. The clamp absorbs
   +30% with no media query; `anywhere`, not `break-word`, because a
   too-long word must always yield. `.bf-elastic-row` is the toolbar
   half: wrapping flex whose items may shrink below min-content. Two new
   tokens in tokens.css; `index.css` stays under budget.
2. **The coexistence contract is documentation plus one declaration.**
   `components/coexistence.css` is `@layer reset, tokens, base,
   components, utilities, user;` and nothing else — layer order is fixed
   by first appearance of each *name*, so importing it appends `user`
   last regardless of which Barefoot files follow. `docs/coexistence.md`
   states the three setups (layered-with-layered, layered-with-unlayered,
   CDN+npm hybrid) and the one rule that matters: layered styles lose to
   unlayered ones, so a global focus reset must be layered or dropped —
   no import order can save it, and saying otherwise would be voodoo.
3. **Print is full or cut, never a clipped half.** `@page { margin: 2rem }`
   sits outside the component layer (document-level, and layer-independent);
   `orphans`/`widows: 2` and `break-after: avoid` on headings keep lines
   and titles from stranding; `data-print="cols-1…6"` on a table keeps a
   prefix of its columns for the cut case; cells get `overflow-wrap:
   anywhere` for the full case (nothing lost). A page that wants neither
   prints its wide section landscape — documented as the third honest
   option, since `@page` size cannot be scoped to an element.
4. **The Verify rule audits the un-debuggable failure.** `coexistence-clean`
   walks same-origin `document.styleSheets` for an unlayered rule setting
   `outline: none`/`0` on an element-level `:focus` selector, recursing
   through `@media`/`@supports`/`@container` but never into `@layer`
   (rules with `layerName` are layered and cannot be the offender — that
   is the whole point). Class-scoped resets (`.btn:focus`) are a deliberate
   choice and stay silent. Cross-origin sheets throw on `cssRules` and are
   skipped, with the limitation named in the docs. Read-only: it reads the
   CSSOM, never the computed outline of a focused element, so it never
   moves focus or mutates the DOM — the checker's own guardrail.

## Consequences

- Two opt-in CSS files and one attribute (`data-print`, enumerated
  `cols-1`…`cols-6`) join the API; `docs/api.md` gains the row and the
  audit stays green in both directions.
- Two tokens are additive (`--bf-elastic-min`, `--bf-elastic-max`);
  `theming.md`'s generated region regenerates.
- The registry budget moves 8192 → 10240 bytes gzip (one more rule plus
  its CSSOM walk and quoted docs sentence), deliberately in review. The
  Phase 4 test pins the new number.
- `demo/resilience.html` proves the release on its own page — the
  conformance demo's visual baselines stay untouched, per house style.
  The page loads `js/verify.js` so the coexistence stage shows the
  offender live; it stays clean at rest (the hostile reset is injected
  only by a stage button).
- `full.css` and its frozen import set are untouched (ADR-0008); the
  print layer's existing rules evolve under `npm run size` as before.

## Rejected

- **A JS focus-ring probe** (focus a throwaway element and read its
  computed `outline`): it measures the truth, but it moves focus and
  mutates the DOM from a checker whose contract is to do neither. The
  CSSOM walk is read-only and names the exact offending rule, which is
  a better failure message anyway.
- **Re-asserting Barefoot's surfaces unlayered** to beat an unlayered
  reset: that would defeat the `@layer user` escape hatch the framework
  is built on. The doc tells you to layer the reset instead.
- **Scoped `@page` size for one wide table**: `@page` is document-level
  by spec; pretending otherwise is the shallow middle this layer exists
  to avoid. Landscape is a page-level choice, stated plainly.
- **`data-print="hide"` on cells**: `.bf-no-print` already hides any
   element on paper, so a per-cell attribute would duplicate it. Only
   the genuinely new capability (a column prefix) gets an attribute.
