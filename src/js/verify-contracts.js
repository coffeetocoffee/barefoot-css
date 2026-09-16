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

   Rule shape (pinned by tests/verify.spec.js):
   - id      kebab-case rule id, unique.
   - select  CSS selector (or array of selectors) that finds the surface.
   - check   (el, ctx) => detail | null. A pure DOM assertion — no
             closures, so it runs in-page and serializes into
             page.evaluate. ctx = { byId(id), armed(module) }: armed()
             reports whether an opt-in module (file stem, e.g. "chips")
             initialized on the page; the engine owns the detection.
   - fix     the console fix hint.
   - docs    the docs file that states the contract.
   - quote   verbatim sentence(s) from that file. Every rule is
             traceable to a sentence in docs/, pinned by test — the
             API-audit pattern turned outward.
   - module  (optional) the arming module path(s), e.g. "js/chips.js".
   - wcag    (optional) the WCAG success criterion at stake.

   Not a behavior module: nothing to init, not listed in barefoot.js.
   Zero dependencies. Ships as-is like its siblings, so dist/js travels
   as one directory.
*/

export const VERIFY_RULES = [
  {
    id: "popover-target-exists",
    select: "[popovertarget]",
    check(el, ctx) {
      const id = el.getAttribute("popovertarget");
      const target = id ? ctx.byId(id) : null;
      if (!target) {
        return `popovertarget="${id || ""}" does not match any id in the document`;
      }
      if (!target.hasAttribute("popover")) {
        return `popovertarget="${id}" resolves, but the target has no popover attribute, so the trigger does nothing`;
      }
      return null;
    },
    fix: "point popovertarget at the id of a live [popover] element (docs/components.md, Popover)",
    docs: "docs/components.md",
    quote: [
      "`popovertarget` must name the `id` of a live `[popover]` element — a typo'd or missing id leaves the trigger a silent no-op.",
    ],
  },

  {
    id: "sticky-scroll-focusable",
    select: ['[data-table~="sticky-head"]', '[data-table~="sticky-col"]'],
    wcag: "2.1.1",
    check(el, ctx) {
      // Find the scroll container the sticky cells stick against; the
      // walk is bounded so a table with no wrapper stays silent (a
      // sticky table over plain page scroll is not a violation).
      let wrapper = null;
      let node = el.parentElement;
      for (let hops = 0; node && hops < 6; hops++) {
        const overflow = getComputedStyle(node);
        if (/(auto|scroll)/.test(`${overflow.overflowX} ${overflow.overflowY}`)) {
          wrapper = node;
          break;
        }
        node = node.parentElement;
      }
      if (!wrapper) return null;
      if (!wrapper.hasAttribute("tabindex")) {
        return 'the scroll wrapper of a sticky table is not keyboard-focusable — give it tabindex="0"';
      }
      const label = wrapper.getAttribute("aria-label") || wrapper.getAttribute("title");
      if (label && label.trim()) return null;
      const labelledby = (wrapper.getAttribute("aria-labelledby") || "").trim();
      if (labelledby && labelledby.split(/\s+/).every((id) => ctx.byId(id))) {
        return null;
      }
      return "the scroll wrapper of a sticky table has no accessible name — give it aria-label or aria-labelledby";
    },
    fix: 'give the sticky table\'s scroll wrapper tabindex="0" and an accessible name (docs/components.md, Table)',
    docs: "docs/components.md",
    quote: [
      'Give the wrapper `tabindex="0"` and an accessible name: tables hold no focusable content, so without it keyboard users can\'t scroll (WCAG 2.1.1; axe\'s `scrollable-region-focusable` flags it).',
    ],
  },

  {
    id: "skip-link-first",
    select: "a.bf-skip-link",
    check(el, ctx) {
      // Elements that render nothing don't take the first Tab stop, so
      // they may precede the skip link; anything visible may not.
      const INERT = ["SCRIPT", "TEMPLATE", "NOSCRIPT", "LINK", "STYLE", "META"];
      let before = el.previousElementSibling;
      while (before) {
        if (!INERT.includes(before.tagName)) {
          return "the skip link is not the first element in <body>, so the first Tab stop lands on something else";
        }
        before = before.previousElementSibling;
      }
      const href = el.getAttribute("href") || "";
      if (href.startsWith("#") && !ctx.byId(href.slice(1))) {
        return `href="${href}" does not match any id in the document`;
      }
      return null;
    },
    fix: "put the skip link as the first element in <body> and point it at your main landmark (docs/components.md, Navigation)",
    docs: "docs/components.md",
    quote: [
      "Pair it with `.bf-skip-link` as the first element in `<body>` so the first Tab stop skips past the nav to `<main>`.",
    ],
  },

  {
    id: "describedby-wired",
    select: ".bf-field-error",
    check(el) {
      const id = el.id;
      if (!id) {
        return "the field error text has no id, so no control can reference it via aria-describedby";
      }
      for (const control of document.querySelectorAll("input, select, textarea")) {
        const refs = (control.getAttribute("aria-describedby") || "").trim();
        if (refs.split(/\s+/).includes(id)) return null;
      }
      return `no control lists "${id}" in its aria-describedby, so the error is never announced with its field`;
    },
    fix: 'wire the field error to its control with aria-describedby="<error-id>" (docs/components.md, Forms)',
    docs: "docs/components.md",
    quote: [
      "Pair each field with `.bf-field-error` or `.bf-error-text` wired up via `aria-describedby`.",
    ],
  },

  {
    id: "module-pairing",
    select: [
      "[data-alert-dismiss]",
      "[data-chip-remove]",
      '[popover][data-kind="toast"][data-duration]',
    ],
    module: ["js/alert-dismiss.js", "js/chips.js", "js/toast.js"],
    check(el, ctx) {
      const module = el.hasAttribute("data-alert-dismiss")
        ? "alert-dismiss"
        : el.hasAttribute("data-chip-remove")
          ? "chips"
          : "toast";
      if (ctx.armed(module)) return null;
      return `this control is a no-op — the opt-in js/${module}.js module is not loaded`;
    },
    fix: "load barefoot-css/js/barefoot.js (or the single module) or drop the dead control (docs/components.md, Alert / Chip / Toast)",
    docs: "docs/components.md",
    quote: [
      "Without the module the button is a no-op visual affordance.",
      "No-JS first: without the module nothing hides, the × just does nothing.",
      "Load `js/toast.js` to enable.",
    ],
  },

  {
    id: "nav-complete-contract",
    select: ".bf-nav-toggle",
    check(el, ctx) {
      const nav = el.closest('[data-nav="header"], [data-nav="drawer"]');
      if (!nav) {
        return 'the toggle must live inside a [data-nav="header"] or [data-nav="drawer"] nav';
      }
      const list = nav.querySelector(":scope > ul");
      if (!list) {
        return "the nav has no direct <ul> link list, so the collapse contract is incomplete";
      }
      if (!list.id) {
        return "the nav list has no id, so the collapse contract is incomplete";
      }
      const ref = el.getAttribute("aria-controls");
      if (!ref || ctx.byId(ref) !== list) {
        return `aria-controls="${ref || ""}" must point at the nav's own list (#${list.id})`;
      }
      return null;
    },
    fix: "complete the hamburger contract: a toggle with aria-controls pointing at an id'd direct <ul> of the nav (docs/components.md, Hamburger)",
    docs: "docs/components.md",
    quote: [
      "A header nav without a complete contract (toggle + id'd list) is never armed for collapse.",
    ],
  },

  {
    id: "state-live-contract",
    select: ".bf-state[data-state]",
    check(el) {
      const state = el.getAttribute("data-state");
      const role = el.getAttribute("role");
      const live = el.getAttribute("aria-live");
      if (state === "loading" && el.getAttribute("aria-busy") !== "true") {
        return 'a loading state must carry aria-busy="true" while its region is pending';
      }
      if (state === "error" && role !== "alert" && live !== "assertive") {
        return 'an error state must use role="alert" or aria-live="assertive"';
      }
      if (state !== "error" && role !== "status" && live !== "polite") {
        return 'a non-error state must use role="status" or aria-live="polite"';
      }
      return null;
    },
    fix: 'give the state an appropriate live-region contract: loading/empty use role="status" and error uses role="alert" (docs/states.md)',
    docs: "docs/states.md",
    quote: [
      "Loading and empty states use `role=\"status\"`; error states use `role=\"alert\"`.",
    ],
  },

  {
    id: "validation-summary-contract",
    select: ".bf-error-summary",
    check(el, ctx) {
      const role = el.getAttribute("role");
      const live = el.getAttribute("aria-live");
      if (role !== "alert" && live !== "assertive") {
        return 'an error summary must use role="alert" or aria-live="assertive"';
      }
      if (el.getAttribute("tabindex") !== "-1") {
        return 'an error summary must use tabindex="-1" so focus can land on it before the first invalid field';
      }
      const form = el.closest("form");
      if (!form) return "an error summary must be inside the form it describes";
      if (!form.querySelector("input, select, textarea")) {
        return "an error summary must describe a form with at least one control";
      }
      return null;
    },
    fix: 'place the summary inside its form with role="alert" and tabindex="-1" (docs/states.md)',
    docs: "docs/states.md",
    quote: [
      "An error summary uses `role=\"alert\"` and `tabindex=\"-1\"` so focus can land on it before the first invalid field.",
    ],
  },

  {
    id: "native-button-contract",
    select: 'div[role="button"], span[role="button"]',
    wcag: "4.1.2",
    check() {
      return "a role=\"button\" on a div or span cannot provide native keyboard and form behavior";
    },
    fix: "use a native <button type=\"button\"> instead of a non-button element with role=\"button\" (docs/architecture.md)",
    docs: "docs/architecture.md",
    quote: [
      "Verify audits only framework-owned semantic shape, not generic HTML.",
      "It warns when a `div[role=\"button\"]` is used instead of a native button or when a page has more than one `main` landmark.",
    ],
  },

  {
    id: "page-structure-contract",
    select: "main:has(h1)",
    check() {
      const mains = document.querySelectorAll("main").length;
      if (mains > 1) return `the document has ${mains} main landmarks; keep one main landmark per page`;
      return null;
    },
    fix: "keep one <main> landmark per page (docs/architecture.md)",
    docs: "docs/architecture.md",
    quote: [
      "It warns when a `div[role=\"button\"]` is used instead of a native button or when a page has more than one `main` landmark.",
    ],
  },

  {
    id: "state-conflict",
    select: ".bf-state[data-state]",
    check(el) {
      const VALID = new Set([
        "loading", "refreshing", "error", "empty", "partial", "full",
        "stale", "fresh", "optimistic", "confirmed", "rolled-back", "invalid",
      ]);
      const state = el.getAttribute("data-state") || "";
      // A value outside the set is either a typo or two states written
      // into one attribute — the precedence table, not the attribute,
      // decides what shows when several conditions hold.
      if (!VALID.has(state)) {
        return `data-state="${state}" is not one documented state — write a single value; when several conditions hold, precedence is loading > error > empty > partial > full`;
      }
      return null;
    },
    fix: "write one documented data-state value; when several conditions hold, the precedence is loading > error > empty > partial > full (docs/states.md)",
    docs: "docs/states.md",
    quote: [
      "`data-state` stays single-valued; when several conditions hold at once the precedence is loading > error > empty > partial > full, with freshness (`stale` → `refreshing` → `fresh`) and an optimistic mutation cycle (`optimistic` → `confirmed` → `rolled-back`) as the other two axes.",
    ],
  },

  {
    id: "event-contract",
    select: '[data-bf-tabs] [role="tab"][aria-controls]',
    check(el, ctx) {
      const id = el.getAttribute("aria-controls");
      if (!ctx.byId(id)) {
        return `aria-controls="${id}" resolves to nothing, so the bf:tabactivate payload names a panel that does not exist`;
      }
      return null;
    },
    fix: "point aria-controls at the existing panel id so the bf:tabactivate payload is truthful (docs/javascript.md, Events)",
    docs: "docs/javascript.md",
    quote: [
      "The `bf:tabactivate` payload names the active tab and panel by id — a tab whose `aria-controls` points at nothing dispatches an event a listener cannot act on.",
    ],
  },

  {
    id: "aria-sort-wired",
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
    docs: "docs/components.md",
    quote: [
      "Sorting is single-column: `aria-sort` lives on one `<th>` at a time, its only valid values are `ascending` and `descending`, and a sorted column carries the sort button — an arrow without the control is decoration.",
      "a page that sorted on the server declares the same state with `data-sort=\"asc\"` or `data-sort=\"desc\"` and gets the identical arrow; the two attributes must agree when both are present",
    ],
  },

  {
    id: "async-live",
    select: "[data-async-pending]",
    wcag: "4.1.2",
    check(el) {
      // The pending paint is an info tint and a spinner — neither is an
      // announcement. aria-busy tells assistive technology the field's
      // value is provisional; the live region tells it what happened.
      if (el.getAttribute("aria-busy") !== "true") {
        return 'an async-pending field must carry aria-busy="true" while its check is in flight';
      }
      const isLive =
        el.matches('[role="status"], [role="alert"], [aria-live]') ||
        !!el.querySelector('[role="status"], [role="alert"], [aria-live]');
      if (!isLive) {
        return 'an async-pending field needs a role="status" region announcing the outcome — a decorative spinner alone announces nothing';
      }
      return null;
    },
    fix: 'give the pending field aria-busy="true" and a role="status" region that announces the check (docs/forms.md, Async validation)',
    docs: "docs/forms.md",
    quote: [
      "An async-pending field carries `aria-busy=\"true\"` and a `role=\"status\"` region that announces the outcome — a decorative spinner alone announces nothing.",
    ],
  },

  {
    id: "stepper-complete",
    select: "[data-stepper]",
    wcag: "4.1.2",
    check(el) {
      // A stepper with no current step is a completed tracker (a receipt,
      // a done flow) — the rule audits wizards, which mark where the user
      // is. Silence there is correct, not a gap.
      const current = [...el.querySelectorAll('[aria-current="step"]')];
      if (current.length === 0) return null;
      if (current.length > 1) {
        return `the stepper marks ${current.length} steps as current — aria-current="step" belongs on one step at a time`;
      }
      // The list is the stepper's structure; the marker belongs to one of
      // its items. data-stepper may sit on the wrapper or on the <ol>
      // itself (both shapes ship), so accept either.
      const list = el.matches("ol") ? el : el.querySelector("ol");
      if (!list) {
        return "a wizard stepper tracks its steps in an <ol> — the list semantics are the structure the current step belongs to";
      }
      if (!current[0].closest("li")) {
        return 'aria-current="step" must sit on a step <li> of the stepper\'s list — a current marker on markup the stepper does not track is a step the user is not on';
      }
      return null;
    },
    fix: 'mark exactly one step aria-current="step", on an <li> of the stepper\'s <ol> (docs/forms.md, Wizard)',
    docs: "docs/forms.md",
    quote: [
      "A wizard stepper marks exactly one step with `aria-current=\"step\"`, on an `<li>` of its `<ol>` — a current marker on markup the stepper does not track is a step the user is not on.",
    ],
  },

  {
    id: "selection-complete",
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
    docs: "docs/components.md",
    quote: [
      "A multi-select table with a select-all control must state `aria-selected` on every row and name the select-all control — a nameless checkbox and a half-marked grid are invisible to assistive technology.",
    ],
  },

  {
    id: "roving-focus",
    select: ['[role="tablist"]', '[popover][data-kind="menu"]'],
    wcag: "2.1.1",
    check(el, ctx) {
      // A popover menu opens natively — popovertarget is a platform
      // primitive — but nothing in the platform moves focus into it on
      // open, and no native element answers the arrow keys. That is the
      // module's entire justification, and a page running the surface
      // without it is pointer-only. "Accessible by default" would be a
      // lie, so the rule names the gap instead of waving at it.
      if (el.matches('[popover][data-kind="menu"]')) {
        if (!ctx.armed("popover-menu")) {
          return 'this popover menu is pointer-only — js/popover-menu.js is not loaded, so focus never enters it and the arrow keys do nothing';
        }
        return null;
      }
      // Tablist: roving tabindex keeps exactly one Tab stop. Zero stops
      // means the widget can never be entered at all — a violation with
      // or without the module. Several stops is only wrong once the
      // module owns the pattern: without JS, every tab reachable by Tab
      // is the valid no-JS default (click to switch).
      const tabs = [...el.querySelectorAll('[role="tab"]')];
      if (tabs.length === 0) return null;
      const stops = tabs.filter((t) => t.tabIndex === 0);
      if (stops.length === 0) {
        return 'the tablist has no tab stop — every tab is tabindex="-1", so keyboard users cannot enter it (WCAG 2.1.1)';
      }
      if (stops.length > 1 && ctx.armed("tabs")) {
        return `${stops.length} tabs are tab stops at once — roving tabindex keeps one Tab stop; move the rest to tabindex="-1"`;
      }
      return null;
    },
    fix: 'keep one tab stop in a tablist (tabindex="0" on the active tab, "-1" on the rest) and load js/popover-menu.js so a popover menu answers the keyboard (docs/keyboard.md)',
    docs: "docs/keyboard.md",
    quote: [
      "A roving-tabindex surface keeps exactly one Tab stop: a tablist whose tabs are all `tabindex=\"-1\"` can never be entered, and one where several are tab stops makes every tab one.",
      "A popover menu without `js/popover-menu.js` is pointer-only — no native primitive moves focus into it on open or answers the arrow keys.",
    ],
  },

  {
    id: "reading-order-after-reflow",
    select: ['[data-table~="adaptive"]', '[data-card="adaptive"]', '[data-form="adaptive"]'],
    wcag: "1.3.2",
    check(el) {
      // Container reflow changes *layout*, not the tree: the card-stacked
      // table is still the same <table> in the same order, so a screen
      // reader's sequence and the visual one agree. The two CSS ways to
      // break that promise are `order` on an item and a reversed flex
      // direction — both invisible to axe, both real the moment the
      // container reflows. The scan reads computed style (as
      // sticky-scroll-focusable does), so a rule reordering inside an
      // inactive @container is silent until the container reaches that
      // state, and a static reorder is caught at rest.
      for (const node of [el, ...el.querySelectorAll("*")]) {
        const cs = getComputedStyle(node);
        if (cs.order !== "0") {
          return "an item inside the reflowing container carries a CSS order — visual order after reflow must stay the reading order the DOM promises (WCAG 1.3.2)";
        }
        if (cs.flexDirection.includes("reverse")) {
          return "the reflowing container reverses its flex direction — visual order after reflow must stay the reading order the DOM promises (WCAG 1.3.2)";
        }
      }
      return null;
    },
    fix: "remove order and reversed flex direction from inside an adaptive container; reflow may relayout, never reorder (docs/adaptive.md)",
    docs: "docs/adaptive.md",
    quote: [
      "Adaptive reflow must never reorder the DOM: `order` on an item and a reversed flex direction both paint a reading sequence the markup does not promise (WCAG 1.3.2), so neither appears inside a reflowing container.",
    ],
  },
];
