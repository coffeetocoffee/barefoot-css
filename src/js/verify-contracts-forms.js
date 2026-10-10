/* Barefoot — Verify contract registry: the forms domain (ADR-0015).
   One of three domain slices of the machine-readable single source of
   truth for the framework's own markup contracts — the ones axe can't
   know. `VERIFY_RULES` in ./verify-contracts.js concatenates these three
   slices; nothing imports a slice directly except the aggregator.

   This slice holds the field- and state-shaped contracts: error wiring,
   live-region contracts for loading/error/async states, the single-value
   data-state rule, error-summary focus placement, wizard stepper
   completeness, and reading order under container reflow. Rule shape is
   documented on the aggregator; each rule's docs/quote prose is in
   verify/prose.mjs (v8.7.8).

   Not a behavior module: nothing to init, not listed in barefoot.js.
   Ships as-is like its siblings, so dist/js travels as one directory. */

export const FORMS_RULES = [
  {
    id: "describedby-wired",
    domain: "forms",
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
  },

  {
    id: "state-live-contract",
    domain: "forms",
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
  },

  {
    id: "validation-summary-contract",
    domain: "forms",
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
  },

  {
    id: "state-conflict",
    domain: "forms",
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
  },

  {
    id: "async-live",
    domain: "forms",
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
  },

  {
    id: "stepper-complete",
    domain: "forms",
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
  },

  {
    id: "reading-order-after-reflow",
    domain: "forms",
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
  },
];