# ADR-0016: container-aware layout contract

**Status:** Accepted (2026-09-08)

## Context

v5.0 made components container-aware, but page authors still assembled them
with hand-rolled wrappers and viewport thinking. v6.2 extends the thesis one
level up: layout primitives must answer "how wide am I *here*?" The existing
`.bf-sidebar` utility already wraps by available space, but its collapse point
is implicit; `.bf-stack`/`.bf-row` are not breakpoint-driven.

## Decision

1. **Layout behavior ships opt-in, per file.** New classes live in separate
   component files and are never added to frozen `full.css` (ADR-0008):
   `components/layout-flow.css`, `components/layout-switcher.css`, and
   `components/layout-sidebar.css`.
2. **Containers follow the adaptive corrections.** A container cannot style
   itself: `.bf-switcher` and the `.bf-sidebar` upgrade self-container and
   restyle children; `.bf-flow` auto-establishes its parent via `:has()`,
   following the v5.1 pattern.
3. **Thresholds mirror the adaptive tokens.** Container queries use the
   documented `--bf-adaptive-1/2` literals because Lightning CSS cannot
   resolve `var()` inside `@container` conditions. `.bf-flow` adds a
   `cqi`-gated rhythm enhancement with the static token gap as fallback.
4. **The sidebar upgrade respects cascade layers.** It shares the `utilities`
   layer with `.bf-sidebar`, so it must be imported after `full.css` or
   `utilities.css` to win the specificity tie.
5. **The playground may use demo-only scripting.** Native `resize` handles
   mouse resizing; there is no native keyboard equivalent, so the demo page
   uses small inline slider/readout chrome. No shipped framework JS is added.

## Consequences

- Layout stays tiny and optional; each file remains well under 1KB gzipped.
- Auto-established containers can change `cqi` resolution for nearby
  descendants; this is the accepted v5.1 tradeoff.
- Unsupported engines keep the base stack, wrapping row, and sidebar
  heuristic by omission.
