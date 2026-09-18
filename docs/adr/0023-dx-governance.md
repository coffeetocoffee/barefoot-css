# ADR-0023: DX governance — the debug overlay, the deprecation split, the perf budget

**Status:** Accepted (2026-09-18)

## Context

Through v8.0 the framework could tell you *what it is* (docs) and *what
it should be on your page* (Verify's contract rules), but not much else
about how it behaves. Three gaps stood between Barefoot and "self-aware":

1. **Architecture was invisible.** A developer staring at a page could
   not tell which elements the base layer paints (no opt-in needed), which
   are opt-in surfaces, and which `data-state` attributes promise a paint
   nothing delivers. Layer order and the opt-in boundary were prose, not
   perception.
2. **Deprecations had no machine.** The api.md policy promised announce →
   grace → removal, but the "announce" leg lived in CHANGELOG prose. The
   `warnOnce` plumbing existed to warn on deprecated markup, yet nothing
   drove it — there was no place for an announcement to become a warning.
   Folding deprecations into the contract registry would have forced
   contracts (permanent truth, quoted sentences that must stay true) and
   deprecations (time-bound, quoted announcements that will be deleted) to
   share a shape that could not tell "this must hold" from "this must go".
3. **Bytes were policed, behavior was not.** `sizes.json` capped gzip;
   nothing capped a `:has()` chain or a nested `:has()`, whose recalc
   cost is superlinear and invisible to any byte budget.

## Decision

1. **`.bf-debug` is a pure-CSS audit overlay.** Opt-in `components/debug.css`
   ships unlayered — the overlay must paint over every layer, and it is
   scoped to a `.bf-debug` subtree, so a page that does not opt in is
   untouched. It outlines the framework's own surfaces by role (base:
   dotted; layout: dashed; component: solid), flags orphan `data-state`
   (an attribute whose hook — `.bf-state` or `<form>` — does not exist) in
   red with a label, and opens with a legend. Precedence comes from rule
   order at equal specificity (`:where()` everywhere), never `!important`.
   What CSS cannot see is said plainly: deep `:has()` is reported by
   `npm run perf`, unlayered resets by Verify's `coexistence-clean`.
2. **Deprecations get a second registry.** `js/deprecations.js` is the
   machine-readable twin of the contract registry, with lifecycle fields a
   contract never has (`announced`, `replacement`, optional `removed`),
   traceable to api.md's announcements by the same quote gate. The checker
   runs two passes — contracts warn "this is broken", deprecations warn
   "this is leaving; here is the replacement" — sharing one sweep so the
   result shapes cannot drift. The pack gains `runDeprecationPack`. The
   registry ships **empty**, and that is the honest state: every surface
   announced since 3.x was removed in 4.0. A fabricated entry "to prove
   the machinery" would be a self-inflicted false positive on every
   consumer's console; the suite proves the machinery with a synthetic
   entry driven through the same seams a real one takes.
3. **`perf-budget.mjs` polices behavior, not bytes.** Static analysis of
   the shipped CSS bounds `:has()` occurrences, chains, and — at a budget
   of zero — deep/nested `:has()`; plus `@container` blocks and contexts,
   `view()`/`scroll()` timelines, `mask` declarations, and the longest
   compound chain. Budgets are measured, carry headroom, and a breach
   exits non-zero. `npm run perf` joins `npm run check`. This is a static
   gate and says so: runtime profiling stays bring-your-own, because
   pretending to measure milliseconds on a CI machine would be the shallow
   middle the framework avoids.

## Consequences

- Three new opt-in/dev files join the repo: `components/debug.css` (CSS,
  unlayered), `js/deprecations.js` (empty registry + contract), and
  `build/perf-budget.mjs` (the gate). `full.css` and `index.css` are
  untouched (ADR-0008); no new `data-*` attributes ship, so the api.md
  audit stays green in both directions.
- The checker engine (`js/verify.js`) grows a second pass; its size budget
  moves from the 2KB family default to an explicit 2560 bytes gzip,
  deliberately in review, pinned by the Phase 4 test.
- `docs/debug.md` documents the overlay; `docs/performance.md` documents
  the selector budgets; `docs/verify.md` documents the deprecation pass;
  `docs/javascript.md` documents `runDeprecations`. The acceptance gate
  (`demo/acceptance.html`) proves the whole release on its own page —
  500×15 sortable/selectable/sticky table, a wizard mid-flow, DE/AR text
  expansion, keyboard-only navigation — with the conformance demo's visual
  baselines untouched.

## Rejected

- **Folding deprecations into `verify-contracts.js` as a flag:** forces
  permanent truth and time-bound announcement into one quote gate; a
  contract that could be deleted would quietly stop being audited.
- **A JS focus-ring probe for the debug layer:** moves focus and mutates
  the DOM — the checker's own guardrail — and `coexistence-clean` already
  reads the CSSOM for the one overlay CSS cannot express.
- **Runtime perf assertions in CI:** a timing failure on a cold machine is
  noise, not signal. The static budget bounds the shapes that cost; the
  acceptance page is the profiler's playground, with honest, generous
  structural gates.
