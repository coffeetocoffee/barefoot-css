# ADR-0002: One lifecycle seam for all opt-in JS

**Status:** Accepted (2026-08-22)

## Context

Nine behavior modules each hand-rolled their own boot sequence: waiting
for the DOM, guarding against double initialization, and exposing an
init function for dynamically injected markup. Three incompatible
shapes coexisted (dataset flags, WeakSets, bare top-level calls), and
the guard placement was unreviewed everywhere.

That drift produced a real bug class during this arc: a guard written
as an early return skipped not just rebinding but the *initial scan*,
so manually re-initializing against late-injected content silently did
nothing (`details-tabindex.js`). Its own fixture tests caught it only
because they inject markup and invoke the named export — exactly the
path consumers would take.

An architecture scan (2026-08-21) flagged the inconsistency as
candidate C3.

## Decision

Extract `src/js/lifecycle.js` exporting exactly two primitives, and
make every behavior module use them instead of rolling its own:

- `onDomReady(fn)` — runs `fn` immediately if the document is past
  loading, else on `DOMContentLoaded`. Replaces every hand-rolled
  ready check and top-level self-invocation.
- `bindOnce(el, name)` — per element+name idempotency guard (WeakMap).
  Returns `true` once, `false` on any later call with the same pair.

Conventions that come with the seam:

- Every module keeps one named export `init*(root = document)` — the
  manual-init contract for dynamic content. Auto-init default exports
  are gone; the barrel's side-effect imports remain the autoload path.
- **Scan first, guard last.** Work that must apply to late-injected
  content (initial scans, validation) runs on every call;
  `bindOnce` guards only process-wide wiring (delegated listeners,
  observers). Modules whose entire behavior is one delegated listener
  on `root` may guard first — delegation already covers future
  markup — but never when a scan exists.
- `lifecycle.js` is internal plumbing: not imported by `barefoot.js`,
  not part of the public API, absent from the docs module table.

Two source-parse/behavior tests in `tests/js.spec.js` pin the seam:
a barrel-parity test (the barrel imports every shipped behavior
module and nothing else) and a lifecycle-interface test (`bindOnce`
guard semantics plus "manual re-init after autoload changes nothing").

Rejected alternatives:

- **Keep per-module guards, document them.** The bug class above is
  precisely what ad-hoc guards allow; only a shared shape removes it
  structurally.
- **A registry / base-class / decorator wrapper.** Ceremony without
  payoff for <1KB zero-dependency modules; two composable functions
  cover every existing pattern.

## Consequences

- New behavior modules start with two import names and one
  `onDomReady(() => init…())` call — no boot code to invent.
- Re-running any init is always safe; a regression test pins it.
- Reviewers enforce scan-first/guard-last by convention recorded here.
- The two-function interface is load-bearing: widening it needs this
  ADR revisited, not a silent fourth export.
