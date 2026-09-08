# ADR-0015: Barefoot Verify — one registry, two delivery formats

**Status:** Accepted (2026-09-08)

## Context

The vNext roadmap ("Barefoot Verify") names the core insight: Verify
generalizes something Barefoot already ships. `warnOnce` in lifecycle.js
fires "on use, not on import" for deprecated surfaces; Verify promotes
that idea from deprecation warnings to **contract warnings** — and audits
what **axe can't know**. Axe checks generic WCAG; only Barefoot knows
that `popovertarget` needs a live id, that a sticky table needs a
focusable wrapper, that `data-alert-dismiss` without `alert-dismiss.js`
is a no-op button.

Before any checker engine (Phase 1) or CI pack (Phase 2) can exist, the
contracts themselves need a home — a single, pinned, machine-readable
registry that docs, checker, and packs all read. Writing the checker
first would bake the rules into code with no traceability; the registry
is the gate for Phase 0.

Two forces shape the delivery mechanism:

1. **The zero-JS pillar (pillar #3) says opt-in JS only where no native
   primitive works.** No browser API audits markup contracts. Verify is
   therefore the *most* justified JS in the repo — but that argument
   must be written down or the community smells a contradiction.
2. **Two audiences, two moments of failure.** The paste-the-CDN-link
   beginner (the v6 front door) needs the warning *in their console,
   on their page* — a CI pack never reaches them. The design-system
   team needs the same rules *in their CI*, where a silent warning is
   ignorable and a red build is not. Shipping only one format strands
   the other audience.

## Decision

**One registry, two formats, zero duplication of rule logic.**

### The registry — `src/js/verify-contracts.js`

Every implicit contract in `docs/components.md` becomes a rule object:
`id`, `select` (selector(s) finding the surface), `check` (a pure DOM
assertion), `fix` (the console fix hint), `docs` + `quote` (the verbatim
docs sentence(s) the rule restates), optional `module` (the arming
opt-in module) and `wcag` (the success criterion at stake).

`check` is deliberately pure — `(el, ctx) => detail | null` with
`ctx = { byId, armed }` — no closures over module state, so the same
function runs unchanged in-page (`page.evaluate`) and serializes into
the Phase-2 pack. This is what makes "one registry, two formats"
literally true: formats wrap the rules, they don't restate them.

Seed rules (Phase 0), each traceable to a sentence in `docs/components.md`:

| Rule | Audits |
|---|---|
| `popover-target-exists` | `popovertarget` resolves to a live `[popover]` id |
| `sticky-scroll-focusable` | sticky-table scroll wrapper has `tabindex="0"` + a name (WCAG 2.1.1) |
| `skip-link-first` | `.bf-skip-link` is first in `<body>`, href resolves |
| `describedby-wired` | `.bf-field-error` is referenced by some control's `aria-describedby` |
| `module-pairing` | dismiss/chips/toast buttons whose JS module isn't loaded |
| `nav-complete-contract` | toggle + id'd `<ul>` + `aria-controls` resolve |

The registry is the single source of truth for docs, checker, and packs
— pinned by test (`tests/verify.spec.js`, the API-audit pattern turned
outward: every `id` is unique kebab-case, every rule carries `docs` +
`quote` and the quote must appear verbatim in the named docs file).

### Format 1 — `js/verify.js` (Phase 1)

Dev-only module; console warnings styled after `warnOnce` (once per
page, only when markup matches). Explicit import, so zero cost unless
you ask; never ships in the `barefoot.js` barrel. Audience: the
beginner — *you wrote plain HTML and got it subtly wrong; the framework
caught it in your console.*

### Format 2 — contract-packs (Phase 2)

`barefoot-css/verify/pack.mjs` — importable Playwright/axe-composable
assertions for the consumer's test suite, reusing the
`tests/helpers.js` patterns. Same rules, same registry. Audience: the
design-system team — the contracts pinned in their CI.

### Volume: the `warnOnce` precedent is the law

Warn exactly once per rule per page, only when the surface exists,
never for markup Barefoot doesn't manage. If it ever nags on valid
pages, the tool dies — trust is the entire product. (Tension 3,
settled.)

### Audience, if forced to headline one

The beginner story (Tension 2). The pack exists so the same truth the
beginner's console shows can also gate a CI build; the console is where
the thesis ("the framework that checks your laces") is visible.

## Consequences

- **Phase 1's engine** can be thin: walk `VERIFY_RULES`, run each
  `check` in-page, format warnings. It writes no rule logic of its own.
- **Phase 2's pack** can be thin too: serialize `select` + `check` into
  `page.evaluate` assertions. Barefoot's own suites refactoring to
  consume the packs is the dogfooding credibility claim.
- **Docs gain an obligation:** a new contract lands in `docs/` and the
  registry in the same change, or the traceability test fails. This is
  the same discipline the api.md audit already enforces for `data-*`
  attributes.
- **The six seed rules are a floor, not a ceiling** — later phases add
  rules as docs grow, via the same quote-or-it-doesn't-exist gate.
- **The checker never mutates DOM or styles** (guardrail, every phase):
  it warns. `data-bf-verify="strict"` (Phase 1) may throw in CI at the
  consumer's explicit opt-in.
- **ADR-0008 untouched:** the registry is a JS file, `full.css` gains
  nothing; the JS size table gets policed in Phase 4 when `verify.js`
  itself lands.

## Rejected

- **Rebuilding axe:** the registry only audits what Barefoot's own docs
  state. Generic WCAG (contrast, landmarks, label presence) stays
  axe's job. Honest scoping: never compete with the general-purpose
  tool.
- **Rules-as-JSON:** a `check` is code; JSON would either embed
  expression strings (a second language to audit) or push logic into
  the engine (restating rules per format — the duplication this ADR
  exists to kill). An ES module also travels with zero build step,
  matching every other `src/js` module.
- **Checker-first:** writing `verify.js` before the registry would make
  docs, checker, and packs three sources for one truth, and the
  drift the api.md audit fights would begin on day one.
- **Shipping the checker in the `barefoot.js` barrel:** violates
  opt-in-by-import (pillar #3); every rule firing costs a DOM walk on
  pages that never asked for it.
- **Lint-rule / AST format:** the contracts live in *runtime DOM
  state* (is the module armed? does the id resolve?), which static
  analysis can't see — `popovertarget="menu"` is correct or broken
  depending on the rest of the document.

## Tensions settled (for the record)

1. **"Zero-JS framework ships a JS checker — hypocrisy or honesty?"**
   Honesty. Pillar #3's full text is "opt-in JS only where no native
   primitive works." No browser API audits markup contracts, so this
   is the most justified JS in the repo — and it is opt-in by import,
   never in the barrel, never mutating anything.
2. **Audience.** The beginner headline: *you wrote plain HTML and got
   it subtly wrong; the framework caught it in your console.* The
   pack serves the design-system team with the same rules.
3. **Silent failure vs nagging.** The `warnOnce` volume: once per
   rule per page, only when markup matches. A false positive is a
   bug of the same severity as a missed warning — it burns the trust
   that is the entire product.
