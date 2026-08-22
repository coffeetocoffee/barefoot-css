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
- **Lifecycle seam** — `src/js/lifecycle.js`, the two primitives every
  opt-in JS module shares: `onDomReady(fn)` (ready-aware init) and
  `bindOnce(el, name)` (idempotency guard). Internal plumbing — not
  exported from the barrel, not part of the public API. See ADR-0002.
- **bindOnce guard** — idempotency keyed per element *and* name
  (WeakMap): first call for a pair returns true, repeats return false.
  Guards wiring only — scans for late-injected content must run on
  every init call ("scan first, guard last"). See ADR-0002.
- **Removal factory** — `src/js/remove-on-click.js`, the delegated
  click handler both removal behaviors share: clicking a trigger
  selector removes its closest target selector. Internal plumbing —
  adapters (`chips.js`, `alert-dismiss.js`) keep the public surface;
  the factory is not exported from the barrel. See ADR-0004.