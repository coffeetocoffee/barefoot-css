/* Barefoot — Verify: the contract checker (Phase 1, ADR-0015).
   Audits the framework's own markup contracts — the ones axe can't
   know — against the machine-readable registry in verify-contracts.js.
   This is the most justified JS in the repo: no browser API audits
   markup contracts, and pillar #3's "opt-in JS only where no native
   primitive works" holds — it is opt-in by import, never in the
   barefoot.js barrel, and it only ever WARNS.

   Volume law (the warnOnce precedent — trust is the entire product):
   - once per rule per page, not once per element;
   - only when markup actually matches a rule's selector (warn on use,
     not on import);
   - never for markup Barefoot doesn't manage;
   - one warning names every offending element and carries the fix.

   Dev-gated: it never throws for normal pages. Set
   data-bf-verify="strict" on <html> to make violations throw instead —
   for a consumer's CI that wants red builds, not console lines; the
   thrown error lists every rule's findings in one pass.

   Usage:
     import "barefoot-css/js/verify.js";        → check on load
     import { verify, runVerify } from "…"      → manual / re-scan

   Zero dependencies. Ships as-is like its siblings; runs against
   dist/js/verify-contracts.js (a byte-for-byte copy of src/js/).
*/

import { onDomReady, isArmed, warnOnce } from "./lifecycle.js";
import { VERIFY_RULES } from "./verify-contracts.js";

/* Run every rule against the document; returns
   [{ id, selector, detail, fix }] — empty when the page honors every
   contract. Pure read: no warnings here, no DOM mutation anywhere. */
export function runVerify(root = document, ctx = defaultCtx()) {
  const violations = [];
  for (const rule of VERIFY_RULES) {
    for (const selector of [].concat(rule.select)) {
      for (const el of root.querySelectorAll(selector)) {
        const detail = rule.check(el, ctx);
        if (detail) violations.push({ id: rule.id, selector, detail, fix: rule.fix });
      }
    }
  }
  return violations;
}

/* Root-relative context. getElementById is document-global by spec, so
   the default ctx resolves ids against the whole document — the honest
   scope for "does this popovertarget point at a live element?" The ctx
   parameter exists so the contract-packs (Phase 2) can scope or fake
   it (their fixtures arm modules explicitly). */
function defaultCtx() {
  return {
    byId: (id) => document.getElementById(id),
    armed: (name) => isArmed(name),
  };
}

/* One rule's violations as one readable message. */
function format(rule, list) {
  const lines = list.map((v) => `  · ${v.detail}`).join("\n");
  const count = list.length === 1 ? "1 violation" : `${list.length} violations`;
  return `verify: ${rule.id} — ${count}\n${lines}\n  Fix: ${rule.fix}`;
}

/* Check the page and report: warnOnce-styled console warnings (once per
   rule per page), or one aggregate throw under data-bf-verify="strict".
   Returns the violations so callers (tests, packs) can assert. */
export function verify(root = document) {
  const violations = runVerify(root);
  const byRule = new Map();
  for (const v of violations) {
    if (!byRule.has(v.id)) byRule.set(v.id, []);
    byRule.get(v.id).push(v);
  }

  const strict =
    document.documentElement.getAttribute("data-bf-verify") === "strict";
  const messages = [];
  for (const [id, list] of byRule) {
    const rule = VERIFY_RULES.find((r) => r.id === id);
    const message = format(rule, list);
    messages.push(`[barefoot-css] ${message}`);
    if (!strict) warnOnce(`verify:${id}`, message);
  }

  if (strict && violations.length > 0) {
    throw new Error(
      `[barefoot-css] verify (strict): ${violations.length} contract ` +
        `violation(s) across ${byRule.size} rule(s)\n\n${messages.join("\n\n")}`
    );
  }
  return violations;
}

onDomReady(() => verify());
