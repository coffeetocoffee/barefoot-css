/* Barefoot — the deprecation registry (v8.5, "DX Governance").
   The machine-readable twin of the contract registry: surfaces the
   framework has ANNOUNCED as deprecated but not yet removed, so the same
   warn-on-use plumbing that audits contracts can say "this dies in the
   next major — here is the replacement" the moment the markup appears.

   Why a second registry instead of a flag on the first (ADR-0023):
   contracts are permanent truth; deprecations are time-bound. A contract
   quotes a sentence that must stay true; a deprecation quotes the
   announcement that will be deleted the day the surface is removed, and
   carries lifecycle fields a contract never has. Mixing them means the
   traceability gate can never tell "this must hold" from "this must go".

   Entry shape (pinned by tests/verify.spec.js):
   - id          kebab-case, unique, matching the CHANGELOG entry.
   - select      selector (or array) finding the deprecated surface.
   - check       (el, ctx) => detail | null — pure DOM, no closures: runs
                 in-page and through the pack like a contract rule.
   - fix         the migration hint.
   - docs        the file that announces it (api.md's table, or the
                 migration guide).
   - quote       the verbatim announcement sentence — same traceability
                 gate as contracts: drift fails the test.
   - announced   the version that announced it.
   - replacement the concrete replacement — policy: "if no replacement
                 exists, the item is not deprecated."
   - removed     optional: the version that removed it. An entry with one
                 leaves the registry (history lives in CHANGELOG).

   THE REGISTRY IS EMPTY TODAY, AND THAT IS THE HONEST STATE: every
   surface announced since 3.x was removed in 4.0 (docs/api.md). The pass
   is armed, not idle — the day a surface is announced it gains an entry
   and every page using it warns once. A registry that ships a fabricated
   deprecation to prove its own machinery would be a self-inflicted false
   positive, and trust is the entire product. The suite proves the
   machinery with a synthetic entry through the same seams a real one uses.

   Not a behavior module: nothing to init, not in barefoot.js. Imported by
   js/verify.js (the checker) and verify/pack.mjs (the CI format) exactly
   as verify-contracts.js is. Zero dependencies; ships as-is, so dist/js
   travels as one directory. */

export const VERIFY_DEPRECATIONS = [];
