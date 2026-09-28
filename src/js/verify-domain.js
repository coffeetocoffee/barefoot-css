/* Shared implementation for domain-scoped Verify entry points. */
import { onDomReady, isArmed, warnOnce } from "./lifecycle.js";
import { VERIFY_DEPRECATIONS } from "./deprecations.js";
import { rulesForDomain } from "./verify-contracts.js";

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
  const registry = rulesForDomain(domain);
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
