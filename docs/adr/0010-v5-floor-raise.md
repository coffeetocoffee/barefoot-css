# ADR-0010: v5 floor raise

**Status:** Accepted (2026-08-31)

## Context

v5.0 adopts platform features that did not exist at the v4.9 floor
(Chrome 125+ / Firefox 128+ / Safari 26.2+, declared in plan.md and
AGENTS.md). Per Barefoot's standing rule — "majors break by raising the
floor, not renaming" — v5 spends its breaking budget on lifting the browser
baseline to the engines that actually carry the v5 feature set. The matrix
was verified live on 2026-08-31 (caniuse July-2026 dataset + MDN):

| Feature (v5 dependency)            | Chrome/Edge | Firefox        | Safari       |
|------------------------------------|-------------|----------------|--------------|
| Container **style** queries        | 111 (Mar 23)| **151 (Apr 26)**| 18.0 (Sep 24)|
| Implicit anchor positioning        | 125 (May 24)| 147 (Jan 26)   | 26.0 (Sep 25)|
| Command API (`command`/`commandfor`)| 135 (Apr 25)| 144 (Oct 25)   | 26.2 (late 25)|
| base `<select>` (deferred to 5.1)  | 135 (Apr 25)| flag (149–157) | 27 (2026)    |
| Interest invokers                  | 142 (Nov 25)| **none**       | **none**     |

The binding constraint for the v5 *headline* (container-adaptive density via
style queries, ADR-0009) is **Firefox 151** — the feature that was the plan's
"big unknown" and is now shipped. Interest invokers are Chromium-only and are
explicitly NOT in the floor: `tooltip.js` stays a polyfill (Phase 3). base
`<select>` is deferred to 5.1 (too green in Firefox), so it does not gate the
floor.

## Decision

The v5.0 browser baseline becomes:

- **Chrome / Edge 135+** (Apr 2025) — command API, anchor positioning,
  base-select-adjacent primitives all present.
- **Firefox 151+** (Apr 2026) — the hard gate: container style queries land
  here, which the v5 density story requires.
- **Safari 26.2+** (late 2025) — command API + anchor positioning present;
  26.0 already had anchors.

This is the intersection of "every engine that ships the v5 headline feature
set." Older engines are **not** hard-blocked at runtime: Barefoot's
degrade-by-omission rule stands — a Chrome 111–134 or Firefox 128–150 user
still gets a correct, size-query-adaptive page; they merely miss the
style-query *density* compression and the declarative command wiring. The
floor is a **support statement**, not a broken-page cutoff.

The plan's pre-check candidates (Chrome 135+, "Safari already there", "FF
current") are confirmed, with one correction: "FF current" is not enough —
style queries force FF **151**, not the 144 that command API alone would
allow. The higher number wins because the headline depends on it.

## Consequences

- plan.md "Browser baseline" and AGENTS.md get the new triple
  (Chrome 135 / Firefox 151 / Safari 26.2).
- `tests/helpers.js` engine-gated skips are re-evaluated: features that were
  gated on FF style queries (the density story) can drop their skip once CI
  runs FF 151+; interest-invoker and base-select gates stay (Phase 3 / 5.1).
- `tooltip.js` survives v5 (Chromium-only interest invokers), consistent
  with the plan's Phase 3 tribunal.
- The bundle freeze (ADR-0008) is untouched — floor raises change the
  `@supports`/`@container` targets, not the import set.
- Nothing in v4.9 breaks by *syntax*; the raise is purely a support
  declaration. Consumers on older engines keep working, just less adaptively.

## Rejected

- **Floor at Firefox 144 (command-API-only):** would let v5 *claim* a
  headline it couldn't deliver on FF, since density needs style queries
  (FF 151). Dishonest scoping.
- **Floor at Firefox 128 (keep v4 floor):** forbids style-query density
  entirely; v5 would have to hedge density onto size queries only,
  weakening the thesis the release is named for.
- **Including base `<select>` in the floor:** Firefox keeps it behind a flag
  through 157; betting the release on it was already deferred to 5.1.
- **Including interest invokers in the floor:** no Firefox/Safari support as
  of Aug 2026; would orphan every non-Chromium user. `tooltip.js` stays.
