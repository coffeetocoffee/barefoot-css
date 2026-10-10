/* Barefoot — the Verify registry's DOCUMENTATION PROSE (v8.7.8).
   The other half of the contract registry: for every rule id in
   verify-contracts-{core,forms,tables}.js, the docs file that states the
   contract and the verbatim sentence(s) it rests on.

   Why this is a separate module (ADR-0015 amendment): the runtime rule
   objects carry only what the checker executes — id, domain, select,
   check, fix, module, wcag. `docs` and `quote` exist for the
   traceability gate and the published manifest, and nothing in the
   browser reads them. They used to live on the rules and were cut out of
   the shipped copy by a text transform in build/build.mjs, which scanned
   for the literal marker "    quote: [" with no notion of JS syntax — a
   rule whose fix string quoted the registry's own format deleted 13KB of
   real rule code, and the size gate reported the corruption as an
   improvement. A file boundary replaces the transform: the shipped
   slices simply do not import this module, so there is nothing to strip
   and nothing to corrupt.

   The split costs one invariant, pinned both directions by
   tests/verify.spec.js: every runtime rule has prose here, and every
   entry here names a live rule. A rule added to a slice without prose
   (or prose orphaned by a renamed rule) fails the suite.

   Imported by tests/verify.spec.js, build/build.mjs (the manifest), and
   verify/pack.mjs. NEVER by src/js/verify-contracts*.js or anything else
   under src/js/ — that is what keeps it out of dist/.

   Zero dependencies. */

/* Rule id -> { docs, quote }. Order mirrors the slices (core, forms,
   tables) for a readable diff; lookups are by id. */
export const VERIFY_PROSE = Object.freeze({
  "popover-target-exists": {
    docs: "docs/components.md",
    quote: [
      "`popovertarget` must name the `id` of a live `[popover]` element — a typo'd or missing id leaves the trigger a silent no-op.",
    ],
  },
  "sticky-scroll-focusable": {
    docs: "docs/components.md",
    quote: [
      "Give the wrapper `tabindex=\"0\"` and an accessible name: tables hold no focusable content, so without it keyboard users can't scroll (WCAG 2.1.1; axe's `scrollable-region-focusable` flags it).",
    ],
  },
  "skip-link-first": {
    docs: "docs/components.md",
    quote: [
      "Pair it with `.bf-skip-link` as the first element in `<body>` so the first Tab stop skips past the nav to `<main>`.",
    ],
  },
  "module-pairing": {
    docs: "docs/components.md",
    quote: [
      "Without the module the button is a no-op visual affordance.",
      "No-JS first: without the module nothing hides, the × just does nothing.",
      "Load `js/toast.js` to enable.",
      "the prev/next buttons are dead controls, so Verify's `module-pairing` reports them unless `js/carousel.js` (or the barrel) is loaded.",
    ],
  },
  "carousel-control-target": {
    docs: "docs/components.md",
    quote: [
      "`data-carousel-prev` / `data-carousel-next` must name a live `[data-carousel]` scroller",
      "one unresolvable control must not take the rest of the opt-in JS down with it.",
    ],
  },
  "nav-complete-contract": {
    docs: "docs/components.md",
    quote: [
      "A header nav without a complete contract (toggle + id'd list) is never armed for collapse.",
    ],
  },
  "native-button-contract": {
    docs: "docs/architecture.md",
    quote: [
      "Verify audits only framework-owned semantic shape, not generic HTML.",
      "It warns when a `div[role=\"button\"]` is used instead of a native button or when a page has more than one `main` landmark.",
    ],
  },
  "page-structure-contract": {
    docs: "docs/architecture.md",
    quote: [
      "It warns when a `div[role=\"button\"]` is used instead of a native button or when a page has more than one `main` landmark.",
    ],
  },
  "event-contract": {
    docs: "docs/javascript.md",
    quote: [
      "The `bf:tabactivate` payload names the active tab and panel by id — a tab whose `aria-controls` points at nothing dispatches an event a listener cannot act on.",
    ],
  },
  "roving-focus": {
    docs: "docs/keyboard.md",
    quote: [
      "A roving-tabindex surface keeps exactly one Tab stop: a tablist whose tabs are all `tabindex=\"-1\"` can never be entered, and one where several are tab stops makes every tab one.",
      "A popover menu with neither `autofocus` nor `js/popover-menu.js` is pointer-only; one carrying `autofocus` is a valid no-JS keyboard floor, and what remains module-only is the APG nicety — the arrow keys.",
    ],
  },
  "coexistence-clean": {
    docs: "docs/coexistence.md",
    quote: [
      "Only an unlayered rule can defeat Barefoot's layered `:focus-visible` ring: a co-loaded reset that sets `outline: none` on a broad `:focus` selector wins every layered style at once and the ring disappears — layer the reset, or drop the declaration.",
    ],
  },
  "describedby-wired": {
    docs: "docs/components.md",
    quote: [
      "Pair each field with `.bf-field-error` or `.bf-error-text` wired up via `aria-describedby`.",
    ],
  },
  "state-live-contract": {
    docs: "docs/states.md",
    quote: [
      "Loading and empty states use `role=\"status\"`; error states use `role=\"alert\"`.",
    ],
  },
  "validation-summary-contract": {
    docs: "docs/states.md",
    quote: [
      "An error summary uses `role=\"alert\"` and `tabindex=\"-1\"` so focus can land on it before the first invalid field.",
    ],
  },
  "state-conflict": {
    docs: "docs/states.md",
    quote: [
      "`data-state` stays single-valued; when several conditions hold at once the precedence is loading > error > empty > partial > full, with freshness (`stale` → `refreshing` → `fresh`) and an optimistic mutation cycle (`optimistic` → `confirmed` → `rolled-back`) as the other two axes.",
    ],
  },
  "async-live": {
    docs: "docs/forms.md",
    quote: [
      "An async-pending field carries `aria-busy=\"true\"` and a `role=\"status\"` region that announces the outcome — a decorative spinner alone announces nothing.",
    ],
  },
  "stepper-complete": {
    docs: "docs/forms.md",
    quote: [
      "A wizard stepper marks exactly one step with `aria-current=\"step\"`, on an `<li>` of its `<ol>` — a current marker on markup the stepper does not track is a step the user is not on.",
    ],
  },
  "reading-order-after-reflow": {
    docs: "docs/adaptive.md",
    quote: [
      "Adaptive reflow must never reorder the DOM: `order` on an item and a reversed flex direction both paint a reading sequence the markup does not promise (WCAG 1.3.2), so neither appears inside a reflowing container.",
    ],
  },
  "aria-sort-wired": {
    docs: "docs/components.md",
    quote: [
      "Sorting is single-column: `aria-sort` lives on one `<th>` at a time, its only valid values are `ascending` and `descending`, and a sorted column carries the sort button — an arrow without the control is decoration.",
      "a page that sorted on the server declares the same state with `data-sort=\"asc\"` or `data-sort=\"desc\"` and gets the identical arrow; the two attributes must agree when both are present",
    ],
  },
  "selection-complete": {
    docs: "docs/components.md",
    quote: [
      "A multi-select table with a select-all control must state `aria-selected` on every row and name the select-all control — a nameless checkbox and a half-marked grid are invisible to assistive technology.",
    ],
  },
});

/* The documentation view of a rule set: runtime rules + their prose,
   joined by id. Throws on a rule with no prose rather than emitting a
   rule that silently fails the traceability gate. Used by the manifest
   builder and by anything that needs the registry in its documented
   shape (the tests, the packs). */
export function withProse(rules) {
  return rules.map((rule) => {
    const entry = VERIFY_PROSE[rule.id];
    if (!entry) {
      throw new Error(
        `[barefoot-css] verify: rule "${rule.id}" has no entry in verify/prose.mjs — ` +
          "every rule quotes the docs sentence that states its contract (ADR-0015)"
      );
    }
    return { ...rule, ...entry };
  });
}
