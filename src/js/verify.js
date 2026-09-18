/* Barefoot — Verify: the contract checker (Phase 1, ADR-0015).
   Audits the framework's own markup contracts — the ones axe can't know
   — against the registry in verify-contracts.js, and warns once per page
   about any announced-but-not-removed surface in deprecations.js (v8.5).
   This is the most justified JS in the repo: no browser API audits markup
   contracts, and pillar #3's "opt-in JS only where no native primitive
   works" holds — opt-in by import, never in the barefoot.js barrel, and
   it only ever WARNS.

   Volume law (the warnOnce precedent — trust is the entire product):
   once per rule per page, not once per element; only when markup matches
   (warn on use, not on import); never for markup Barefoot doesn't manage;
   one warning names every offender and carries the fix.

   Two passes, one engine (ADR-0023): contracts report violations,
   deprecations report migrations. Result shapes match —
   { id, selector, detail, fix } — so tooling treats both alike; a
   deprecation additionally carries `announced` and `replacement`.

   Dev-gated: it never throws for normal pages. data-bf-verify="strict" on
   <html> makes findings throw instead — one aggregate error for a CI that
   wants red builds, not console lines.

   Usage:
     import "barefoot-css/js/verify.js";                          → check on load
     import { verify, runVerify, runDeprecations } from "…"       → manual / re-scan

   Zero dependencies. Ships as-is; runs against the dist/js/ copies of
   verify-contracts.js and deprecations.js. */

import { onDomReady, isArmed, warnOnce } from "./lifecycle.js";
import { VERIFY_RULES } from "./verify-contracts.js";
import { VERIFY_DEPRECATIONS } from "./deprecations.js";

/* One sweep over a registry (contracts or deprecations), in the
   pack-ready shape. Shared so the two passes cannot drift in what they
   return; the only difference is the extra lifecycle fields a
   deprecation carries. */
function sweep(root, registry, ctx, extra) {
  const found = [];
  for (const entry of registry) {
    for (const selector of [].concat(entry.select)) {
      for (const el of root.querySelectorAll(selector)) {
        const detail = entry.check(el, ctx);
        if (detail) {
          found.push({ id: entry.id, selector, detail, fix: entry.fix, ...extra(entry) });
        }
      }
    }
  }
  return found;
}

/* Contract rules: { id, selector, detail, fix }. Pure read — no warnings
   here, no DOM mutation anywhere. */
export function runVerify(root = document, ctx = defaultCtx()) {
  return sweep(root, VERIFY_RULES, ctx, () => ({}));
}

/* Deprecation entries: the same shape plus `announced`/`replacement`, so
   the message names the migration, not just the problem. The registry
   argument exists for the same reason `ctx` does above: the pack and the
   tests drive a declared set through the same code path a real entry
   takes. */
export function runDeprecations(root = document, registry = VERIFY_DEPRECATIONS) {
  return sweep(root, registry, defaultCtx(), (entry) => ({
    announced: entry.announced,
    replacement: entry.replacement,
  }));
}

/* Root-relative context. getElementById is document-global by spec, so the
   default ctx resolves ids against the whole document — the honest scope
   for "does this popovertarget point at a live element?" The ctx
   parameter exists so the contract-packs (Phase 2) can scope or fake it. */
function defaultCtx() {
  return {
    byId: (id) => document.getElementById(id),
    armed: (name) => isArmed(name),
  };
}

/* One finding's list as one readable message. Formatted from the finding
   itself (it carries its own id and fix), never from a registry lookup —
   the sweep may have been driven with a declared registry the module
   does not hold, and the finding is the truth either way. */
function format(finding, list) {
  const lines = list.map((v) => `  · ${v.detail}`).join("\n");
  const noun = list.length === 1 ? "1 violation" : `${list.length} violations`;
  return `verify: ${finding.id} — ${noun}\n${lines}\n  Fix: ${finding.fix}`;
}

/* A deprecation's findings: the migration, not the bug — the line names
   the replacement and the announcement, so the CHANGELOG is one hop from
   the console. */
function formatDeprecation(finding, list) {
  const lines = list.map((v) => `  · ${v.detail}`).join("\n");
  const noun = list.length === 1 ? "1 use" : `${list.length} uses`;
  return `deprecation: ${finding.id} — ${noun} of a surface deprecated in ` +
    `${finding.announced}\n${lines}\n  Replace with: ${finding.replacement} ` +
    `(Fix: ${finding.fix})`;
}

/* Check the page and report: warnOnce-styled console warnings (once per
   rule per page), or one aggregate throw under strict mode. Returns the
   contract violations so callers (tests, packs) can assert; deprecations
   are reported alongside and counted in the strict throw — a CI that
   asked for red builds wants both. */
export function verify(root = document, registry = VERIFY_DEPRECATIONS) {
  const violations = runVerify(root);
  const deprecated = runDeprecations(root, registry);

  const strict =
    document.documentElement.getAttribute("data-bf-verify") === "strict";
  const messages = [];

  const byRule = new Map();
  for (const v of violations) {
    if (!byRule.has(v.id)) byRule.set(v.id, []);
    byRule.get(v.id).push(v);
  }
  for (const [id, list] of byRule) {
    const message = format(list[0], list);
    messages.push(`[barefoot-css] ${message}`);
    if (!strict) warnOnce(`verify:${id}`, message);
  }

  const byDep = new Map();
  for (const d of deprecated) {
    if (!byDep.has(d.id)) byDep.set(d.id, []);
    byDep.get(d.id).push(d);
  }
  for (const [id, list] of byDep) {
    const message = formatDeprecation(list[0], list);
    messages.push(`[barefoot-css] ${message}`);
    if (!strict) warnOnce(`deprecation:${id}`, message);
  }

  if (strict && (violations.length > 0 || deprecated.length > 0)) {
    const total = violations.length + deprecated.length;
    throw new Error(
      `[barefoot-css] verify (strict): ${total} finding(s) across ` +
        `${byRule.size + byDep.size} rule(s)\n\n${messages.join("\n\n")}`
    );
  }
  return violations;
}

onDomReady(() => verify());
