# Barefoot CSS — domain glossary

Precise terms used across plan.md, AGENTS.md, and conversations.
ADRs live in `docs/adr/`.

## Glossary

- **Canonical palette** — the 16 high-contrast semantic color tokens as
  declared under `[data-theme="contrast"]` in `src/tokens.css`. The
  single hand-edited source for contrast mode. See ADR-0001.
- **Palette mirror** — a rule restating the canonical contrast values for
  a trigger CSS cannot OR with the attribute selector (currently only
  `@media (prefers-contrast: more)`). Structural duplication by design;
  parity is enforced by a test, not by generation. See ADR-0001.
- **Print palette** — deliberately different ink-first plain-hex values
  in `src/base.css` (`@media print`, with `!important`). Not a mirror:
  three values intentionally differ from contrast mode. See ADR-0001.
- **Lifecycle seam** — `src/js/lifecycle.js`, the primitives every
  opt-in JS module shares: `onDomReady(fn)` (ready-aware init) and
  `bindOnce(el, name)` (idempotency guard), plus `warnOnce(key, msg)`
  and `arm(name)` / `isArmed(name)` (the arming registry Verify reads).
  Internal plumbing — not exported from the barrel, not part of the
  public API. See ADR-0002.
- **bindOnce guard** — idempotency keyed per element *and* name
  (WeakMap): first call for a pair returns true, repeats return false.
  Guards wiring only — scans for late-injected content must run on
  every init call ("scan first, guard last"). See ADR-0002.
- **Removal factory** — `src/js/remove-on-click.js`, the delegated
  click handler both removal behaviors share: clicking a trigger
  selector removes its closest target selector. Internal plumbing —
  adapters (`chips.js`, `alert-dismiss.js`) keep the public surface;
  the factory is not exported from the barrel. See ADR-0004.
- **Contract registry** — `src/js/verify-contracts.js`, the
  machine-readable single source of truth for Barefoot's own markup
  contracts: rule id, selector(s), pure-DOM `check(el, ctx)`, fix hint,
  docs link + verbatim `quote`. Data, not behavior — never in the
  barrel; consumed by `js/verify.js` (Phase 1) and the contract-packs
  (Phase 2). See ADR-0015.
- **Contract pack** — `verify/pack.mjs`, the registry exported as
  Playwright-composable assertions (`runPack` / `runRule` /
  `assertClean`) for consumers' CI. The sweep is evaluated in the page
  under test and imports the registry from the files the page loads
  (`base` option, default `/dist/`) — CI pins what ships. Arming is
  *declared* (`armed` option, default all) where the browser engine
  *detects* it. Shipped via the `./verify/pack.mjs` export; never in
  dist/js, never measured as page payload. See ADR-0015.
- **Verify context (`ctx`)** — the second argument of a registry
  rule's `check`: `{ byId(id), armed(module) }`. `armed` reports
  whether an opt-in module (file stem, e.g. `"chips"`) initialized on
  the page; the engine owns the detection. The checker itself never
  mutates DOM or styles.
- **Docs traceability** — every registry rule quotes the exact sentence
  in `docs/` that states its contract; `tests/verify.spec.js` fails if
  the quote drifts or the docs sentence disappears. A new rule without
  a docs sentence cannot land. See ADR-0015.
- **Arming** — `arm(name)` at import time in behavior modules that a
  Verify rule audits (today: chips, alert-dismiss, toast). Module-
  instance state, not DOM attributes; `isArmed(name)` answers the
  registry's `ctx.armed()` query. A module not imported is (truthfully)
  not armed — `module-pairing` reports its controls as dead. See ADR-0015.
- **Verify volume law** — the engine warns once per rule per page (not
  once per element), only when markup matches a rule's selector, and
  one warning lists every offender plus the fix. Under
  `data-bf-verify="strict"` it throws one aggregate error instead.
  A false warning is a bug of the same severity as a missed one. See
  ADR-0015, `docs/verify.md`.