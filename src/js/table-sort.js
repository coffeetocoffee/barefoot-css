/* Barefoot — opt-in: sortable tables.
   Sorts <tbody> rows when a real <button> inside a <th> is clicked.
   Zero dependencies, ~2KB.

   Markup (no-JS first — without this module nothing sorts; the table
   is plain but valid):
   <table data-bf-sort>
     <thead>
       <tr>
         <th><button type="button">Task</button></th>
         <th><button type="button">Points</button></th>
       </tr>
     </thead>
     <tbody>…</tbody>
   </table>

   The semantics stay yours: triggers are real buttons you label, and
   the module only reorders rows and maintains aria-sort ("ascending" /
   "descending") on the active column's th. No native element sorts
   rows — that puts this in the tabs tier of opt-in JS.

   Comparison is numeric-aware: if every non-empty cell in the column
   parses as a number (whitespace and thousands commas tolerated), rows
   compare numerically; otherwise text compares with localeCompare.
   Click once for ascending, again for descending.

   import "barefoot/js/table-sort.js"      → auto-init on load
   import { initTableSort } from "…"        → manual init for dynamic content
*/

import { onDomReady, bindOnce } from "./lifecycle.js";

/* Per-table toggle state, keyed weakly — gone when the table is. */
const sortState = new WeakMap();

function cellKey(row, col, numeric) {
  const raw = row.cells[col]?.textContent.trim() ?? "";
  if (!numeric) return raw.toLowerCase();
  const n = Number(raw.replace(/[\s,]/g, ""));
  return Number.isNaN(n) ? -Infinity : n;
}

function sortColumn(table, col) {
  const tbody = table.tBodies[0];
  if (!tbody || col < 0) return;

  const prev = sortState.get(table);
  const dir = prev && prev.col === col && prev.dir === "asc" ? "desc" : "asc";
  sortState.set(table, { col, dir });

  const rows = [...tbody.rows];
  // Numeric only when the whole column agrees — one stray text cell
  // falls the column back to string comparison.
  const numeric =
    rows.length > 0 &&
    rows.every((r) => {
      const t = r.cells[col]?.textContent.trim() ?? "";
      return t === "" || !Number.isNaN(Number(t.replace(/[\s,]/g, "")));
    });

  rows.sort((a, b) => {
    const ka = cellKey(a, col, numeric);
    const kb = cellKey(b, col, numeric);
    const order = numeric ? ka - kb : String(ka).localeCompare(String(kb));
    return dir === "asc" ? order : -order;
  });
  // Re-appending moves the existing nodes — no innerHTML round-trip,
  // listeners on cells survive.
  tbody.append(...rows);

  for (const th of table.tHead?.rows[0]?.cells ?? []) {
    if (th.cellIndex === col) {
      // ARIA spells these out; "asc"/"desc" are invalid values.
      th.setAttribute("aria-sort", dir === "asc" ? "ascending" : "descending");
    } else {
      th.removeAttribute("aria-sort");
    }
  }
}

export function initTableSort(root = document) {
  const tables = root.querySelectorAll("table[data-bf-sort]");

  for (const table of tables) {
    const triggers = table.querySelectorAll("thead th button");
    if (triggers.length === 0 || !table.tBodies[0]) continue;
    if (!bindOnce(table, "table-sort")) continue;

    for (const trigger of triggers) {
      trigger.addEventListener("click", () => {
        const th = trigger.closest("th");
        if (th) sortColumn(table, th.cellIndex);
      });
    }
  }
}

onDomReady(() => initTableSort());
