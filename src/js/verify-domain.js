/* Shared implementation for domain-scoped Verify entry points. */
import { onDomReady, isArmed, warnOnce } from "./lifecycle.js";
import { VERIFY_DEPRECATIONS } from "./deprecations.js";
import { CORE_RULES } from "./verify-contracts-core.js";
import { FORMS_RULES } from "./verify-contracts-forms.js";
import { TABLES_RULES } from "./verify-contracts-tables.js";

/* Domain -> slice, mirrored from the aggregator's BY_DOMAIN. Imported
   slice-by-slice rather than through rulesForDomain() so importing
   `barefoot-css/verify/tables` pulls only the tables rules — going
   through the aggregator would concatenate all three slices and make the
   domain entries no lighter than the "all" entry. tests/verify.spec.js
   pins the two maps against each other. */
const BY_DOMAIN = Object.freeze({
  core: CORE_RULES,
  forms: FORMS_RULES,
  tables: TABLES_RULES,
});

function context() {
  return { byId: (id) => document.getElementById(id), armed: (name) => isArmed(name) };
}

function sweep(root, registry, ctx) {
  const found = [];
  for (const entry of registry) {
    for (const selector of [].concat(entry.select)) {
      for (const el of root.querySelectorAll(selector)) {
        const detail = entry.check(el, ctx);
        if (detail) found.push({ id: entry.id, selector, detail, fix: entry.fix });
      }
    }
  }
  return found;
}

export function createDomainEntry(domain) {
  const registry = BY_DOMAIN[domain];
  if (!registry) throw new Error(`Unknown Verify domain "${domain}"`);
  function runVerify(root = document, ctx = context()) {
    return sweep(root, registry, ctx);
  }
  function verify(root = document, deprecations = VERIFY_DEPRECATIONS) {
    const violations = runVerify(root);
    const byRule = new Map();
    for (const finding of violations) {
      if (!byRule.has(finding.id)) byRule.set(finding.id, []);
      byRule.get(finding.id).push(finding);
    }
    for (const [id, list] of byRule) {
      const lines = list.map((v) => `  · ${v.detail}`).join("\n");
      warnOnce(`verify:${id}`, `verify: ${id} — ${list.length} violation(s)\n${lines}\n  Fix: ${list[0].fix}`);
    }
    return violations;
  }
  onDomReady(() => verify());
  return Object.freeze({ domain, registry, runVerify, verify, deprecations });
}
