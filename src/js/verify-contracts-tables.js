/* Barefoot — Verify contract registry: the tables domain (ADR-0015).
   One of three domain slices of the machine-readable single source of
   truth for the framework's own markup contracts — the ones axe can't
   know. `VERIFY_RULES` in ./verify-contracts.js concatenates these three
   slices; nothing imports a slice directly except the aggregator.

   This slice holds the table-shaped contracts: the single-column
   aria-sort rule with its declarative data-sort mirror, and select-all
   grid completeness. Rule shape is documented on the aggregator; each
   rule's docs/quote prose is in verify/prose.mjs (v8.7.8).

   Not a behavior module: nothing to init, not listed in barefoot.js.
   Ships as-is like its siblings, so dist/js travels as one directory. */

export const TABLES_RULES = [
  {
    id: "aria-sort-wired",
    domain: "tables",
    select: "table[data-bf-sort]",
    wcag: "4.1.2",
    check(el) {
      const heads = [...el.querySelectorAll("thead th")];
      const sorted = heads.filter((th) => th.hasAttribute("aria-sort"));
      if (sorted.length > 1) {
        return `the table claims ${sorted.length} sorted columns at once — sorting is single-column, so aria-sort lives on one th at a time`;
      }
      for (const th of sorted) {
        const value = th.getAttribute("aria-sort");
        // ARIA spells these out; any other value is invalid, not merely
        // undocumented — "asc"/"desc" are the usual typos.
        if (value !== "ascending" && value !== "descending") {
          return `aria-sort="${value}" is not a valid value — ARIA allows only "ascending" or "descending"`;
        }
        // The arrow is decoration; the button is the control. A sorted
        // column without one looks sorted but nothing sorts it.
        if (!th.querySelector("button")) {
          return 'aria-sort sits on a <th> with no sort button — the arrow is decoration with no control behind it';
        }
      }
      // The declarative mirror (data-sort) must agree with the semantic
      // one when both are present — a disagreement is two sorts telling
      // different stories.
      const DIRECTION = { asc: "ascending", desc: "descending" };
      for (const th of heads) {
        const declared = th.getAttribute("data-sort");
        if (!declared) continue;
        const aria = th.getAttribute("aria-sort");
        if (aria && aria !== DIRECTION[declared]) {
          return `data-sort="${declared}" and aria-sort="${aria}" disagree on the same column — the declarative mirror must match the semantic value`;
        }
      }
      return null;
    },
    fix: 'keep aria-sort on one sortable column at a time, with a real sort button in its th, using only "ascending"/"descending"; match data-sort to it (docs/components.md, Table)',
  },

  {
    id: "selection-complete",
    domain: "tables",
    select: "table:has(tbody tr[aria-selected])",
    wcag: "4.1.2",
    check(el, ctx) {
      // A table whose rows carry selection states. The select-all
      // control implies every row is selectable; without one, row
      // selection is bring-your-own and this rule stays silent.
      const selectAll =
        el.querySelector('thead input[type="checkbox"]') ||
        el.querySelector('thead [role="checkbox"]');
      if (!selectAll) return null;

      // A nameless select-all checkbox passes axe (checkboxes are exempt
      // from its label rule) but is invisible to assistive technology —
      // exactly the gap Verify exists to close.
      const label = (selectAll.getAttribute("aria-label") || "").trim();
      const labelledby = (selectAll.getAttribute("aria-labelledby") || "").trim();
      const enclosing = selectAll.closest("label");
      const named =
        !!label ||
        (labelledby &&
          labelledby.split(/\s+/).every((id) => ctx.byId(id))) ||
        (enclosing && !!enclosing.textContent.trim());
      if (!named) {
        return "the select-all checkbox has no accessible name — give it aria-label, aria-labelledby, or a wrapping label";
      }

      // Completeness: a select-all grid states selection on every row —
      // unmarked rows are selectable rows assistive technology cannot see.
      const unmarked = [...el.querySelectorAll("tbody tr")].filter(
        (tr) => !tr.hasAttribute("aria-selected")
      );
      if (unmarked.length > 0) {
        return `${unmarked.length} row(s) of the selectable table carry no aria-selected — a select-all grid must state selection on every row`;
      }
      return null;
    },
    fix: "name the select-all control and state aria-selected on every row of a selectable table (docs/components.md, Table)",
  },
];