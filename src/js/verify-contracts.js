/* Barefoot — Verify contract registry (Phase 0, ADR-0015).
   The machine-readable single source of truth for the framework's own
   markup contracts — the ones axe can't know: that popovertarget needs
   a live id, that a sticky table's scroll wrapper must be focusable and
   named, that a [data-alert-dismiss] button without its module is a
   no-op. Generic WCAG work stays with axe; this audits only what
   Barefoot itself documents.

   One registry, two delivery formats (ADR-0015):
   - js/verify.js (Phase 1) — dev-only browser checker; console warnings
     in the warnOnce style (once per page, only when markup matches);
     explicit import, so zero cost unless you ask; never in barefoot.js.
   - verify/pack.mjs (Phase 2) — the same rules exported as Playwright/
     axe-composable helpers, so consumers pin the contracts in CI.

   Sliced by domain (v8.7): the rules live in three sibling files —
   verify-contracts-core.js, -forms.js, -tables.js — and this module
   concatenates them. The split is a budget decision, not an API one:
   one 8KB+ registry was a single ratchet that every new rule pushed
   toward its ceiling, while the domain concept already existed
   (VERIFY_DOMAINS, the per-domain entry points, the manifest's
   "domains" array). Each slice now carries its own budget with real
   headroom, and rulesForDomain is a lookup instead of a filter. Every
   importer is unchanged — VERIFY_RULES is still exported from here.

   Rule shape (pinned by tests/verify.spec.js):
   - id      kebab-case rule id, unique.
   - select  CSS selector (or array of selectors) that finds the surface.
   - check   (el, ctx) => detail | null. A pure DOM assertion — no
             closures, so it runs in-page and serializes into
             page.evaluate. ctx = { byId(id), armed(module) }: armed()
             reports whether an opt-in module (file stem, e.g. "chips")
             initialized on the page; the engine owns the detection.
   - fix     the console fix hint.
   - module  (optional) the arming module path(s), e.g. "js/chips.js".
   - wcag    (optional) the WCAG success criterion at stake.

   docs + quote — the docs file that states the contract and the verbatim
   sentence(s) it rests on — are NOT here (v8.7.8). They live in
   verify/prose.mjs, keyed by rule id, because only the traceability test
   and the published manifest read them. Nothing under src/js/ may import
   that module: the shipped slices are byte-for-byte the source, which is
   what replaced the build's old text transform (a rule whose fix string
   quoted the registry's own format deleted 13KB of real rule code while
   the size gate called it an improvement). Add a rule here AND its prose
   entry there, or the suite fails.

    Not a behavior module: nothing to init, not listed in barefoot.js.
    Zero dependencies. Ships as-is like its siblings, so dist/js travels
    as one directory.
*/

import { CORE_RULES } from "./verify-contracts-core.js";
import { FORMS_RULES } from "./verify-contracts-forms.js";
import { TABLES_RULES } from "./verify-contracts-tables.js";

/* Concatenation order is the delivery order a consumer sees in the
   manifest and the pack's report: core first (document and keyboard
   shape), then forms, then tables. Tests/verify.spec.js pins the domain
   partition; the order itself is presentation only. */
export const VERIFY_RULES = Object.freeze([
  ...CORE_RULES,
  ...FORMS_RULES,
  ...TABLES_RULES,
]);

/* Domain -> its slice. rulesForDomain reads this instead of filtering the
   concatenation, so a domain lookup can't be defeated by a rule whose
   `domain` field disagrees with the file it lives in — the audit test
   below is what keeps the two in agreement. */
const BY_DOMAIN = Object.freeze({
  core: CORE_RULES,
  forms: FORMS_RULES,
  tables: TABLES_RULES,
});

export const VERIFY_DOMAINS = Object.freeze(["core", "forms", "tables"]);

export function rulesForDomain(domain = "all") {
  if (domain === "all") return VERIFY_RULES;
  if (!VERIFY_DOMAINS.includes(domain)) {
    throw new Error(`Unknown Verify domain "${domain}". Valid domains: all, ${VERIFY_DOMAINS.join(", ")}`);
  }
  return BY_DOMAIN[domain];
}