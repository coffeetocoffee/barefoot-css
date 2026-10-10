/* Barefoot — Verify contract registry: the core domain (ADR-0015).
   One of three domain slices of the machine-readable single source of
   truth for the framework's own markup contracts — the ones axe can't
   know. `VERIFY_RULES` in ./verify-contracts.js concatenates these three
   slices; nothing imports a slice directly except the aggregator.

   This slice holds the document- and navigation-shaped contracts: page
   landmarks, the skip link, popover wiring, carousel control targets,
   native-button semantics, the opt-in module pairing rule, tab and menu
   keyboard floors, and the coexistence audit. Rule shape is documented
   on the aggregator; each rule's docs/quote prose is in
   verify/prose.mjs (v8.7.8).

   Not a behavior module: nothing to init, not listed in barefoot.js.
   Ships as-is like its siblings, so dist/js travels as one directory. */

/* Coexistence helper (v8.0, ADR-0022): find the first UNLAYERED rule that
   kills the focus ring on a broad selector. Cascade layers put every
   layered style below an unlayered one, so only a reset outside any
   @layer can defeat the layered `:focus-visible` ring — a rule scoped to
   a class/attribute is a deliberate per-control choice and stays silent.
   Cross-origin sheets throw on cssRules access (a CDN-served stylesheet
   is unreadable from the page); the rule then audits same-origin and
   inline sheets only — stated in docs/coexistence.md. Pure DOM/CSSOM
   read, no closures: runs in-page and through the pack unchanged. */
function isBroadFocusSelector(selectorText) {
  // Every comma-separated part must mention :focus and be free of any
  // class, id, or attribute constraint — element-level only.
  return selectorText
    .split(",")
    .every((part) => /:focus/.test(part) && !/[.#[]/.test(part));
}

function killsFocusRing(style) {
  // Lengths canonicalize in the CSSOM ("0" often serializes as "0px"),
  // so parse the number rather than comparing strings.
  const width = parseFloat(style.outlineWidth);
  return (
    style.outlineStyle === "none" ||
    style.outline === "none" ||
    style.outline === "0" ||
    (!Number.isNaN(width) && width === 0)
  );
}

function isLayered(rule) {
  // A layer block is the offender's opposite: its rules sit below ours
  // by cascade-layer order. `layerName` is the spec interface on
  // Firefox/Safari; this Chromium's CSSOM omits it, so the constructor
  // name is the fallback signal. Never descend past one.
  return "layerName" in rule || rule.constructor.name === "CSSLayerBlockRule";
}

function findUnlayeredFocusReset(rules) {
  for (const rule of rules) {
    if (isLayered(rule)) continue;

    // A style rule is the offender class. Its own .cssRules is the
    // native-nesting list — empty but TRUTHY in Chromium — so check the
    // style first, and only descend when nesting is real (length > 0).
    if (rule.selectorText !== undefined) {
      if (
        killsFocusRing(rule.style) &&
        isBroadFocusSelector(rule.selectorText)
      ) {
        return rule.selectorText;
      }
      if (rule.cssRules && rule.cssRules.length > 0) {
        const inner = findUnlayeredFocusReset(rule.cssRules);
        if (inner) return inner;
      }
      continue;
    }

    // Grouping at-rules (@media / @supports / @container / @keyframes).
    if (rule.cssRules) {
      const inner = findUnlayeredFocusReset(rule.cssRules);
      if (inner) return inner;
    }
  }
  return null;
}

function firstUnlayeredFocusReset(styleSheets) {
  for (const sheet of styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin stylesheet — unreadable from the page
    }
    const found = findUnlayeredFocusReset(rules);
    if (found) return found;
  }
  return null;
}

export const CORE_RULES = [
  {
    id: "popover-target-exists",
    domain: "core",
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
  },

  {
    id: "carousel-control-target",
    domain: "core",
    select: ["[data-carousel-prev]", "[data-carousel-next]"],
    // Resolved exactly as js/lifecycle.js queryFirst does — getElementById
    // for the `#id` form, a guarded querySelector otherwise — so a value
    // this rule calls dead is the value the module skipped. It reports, it
    // never throws (a bad selector would take the sweep down too), and
    // every attribute present is audited.
    check(el) {
      const doc = el.ownerDocument;
      for (const attr of ["data-carousel-prev", "data-carousel-next"]) {
        if (!el.hasAttribute(attr)) continue;
        const sel = (el.getAttribute(attr) || "").trim();
        if (!sel) return `${attr} is empty — point it at the scroller, e.g. "#slides"`;
        let target = null;
        if (sel.charCodeAt(0) === 35) {
          // `#id` is an ID lookup, not a selector parse: an id CSS would
          // reject (a leading digit) still resolves and works.
          target = doc.getElementById(sel.slice(1));
        } else {
          try {
            target = doc.querySelector(sel);
          } catch {
            return `${attr}="${sel}" is not a valid selector, so the control is a no-op`;
          }
        }
        if (!target) return `${attr}="${sel}" matches nothing, so the control is a no-op`;
        if (!target.hasAttribute("data-carousel")) {
          return `${attr}="${sel}" resolves to a non-[data-carousel] element`;
        }
      }
      return null;
    },
    fix: 'point data-carousel-prev / data-carousel-next at the scroller\'s id selector, e.g. "#slides" (docs/components.md, Carousel)',
  },

  {
    id: "sticky-scroll-focusable",
    domain: "core",
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
  },

  {
    id: "skip-link-first",
    domain: "core",
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
  },

  {
    id: "module-pairing",
    domain: "core",
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
  },

  {
    id: "nav-complete-contract",
    domain: "core",
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
  },

  {
    id: "native-button-contract",
    domain: "core",
    select: 'div[role="button"], span[role="button"]',
    wcag: "4.1.2",
    check() {
      return "a role=\"button\" on a div or span cannot provide native keyboard and form behavior";
    },
    fix: "use a native <button type=\"button\"> instead of a non-button element with role=\"button\" (docs/architecture.md)",
  },

  {
    id: "page-structure-contract",
    domain: "core",
    select: "main:has(h1)",
    check() {
      const mains = document.querySelectorAll("main").length;
      if (mains > 1) return `the document has ${mains} main landmarks; keep one main landmark per page`;
      return null;
    },
    fix: "keep one <main> landmark per page (docs/architecture.md)",
  },

  {
    id: "event-contract",
    domain: "core",
    select: '[data-bf-tabs] [role="tab"][aria-controls]',
    check(el, ctx) {
      const id = el.getAttribute("aria-controls");
      if (!ctx.byId(id)) {
        return `aria-controls="${id}" resolves to nothing, so the bf:tabactivate payload names a panel that does not exist`;
      }
      return null;
    },
    fix: "point aria-controls at the existing panel id so the bf:tabactivate payload is truthful (docs/javascript.md, Events)",
  },

  {
    id: "roving-focus",
    domain: "core",
    select: ['[role="tablist"]', '[popover][data-kind="menu"]'],
    wcag: "2.1.1",
    check(el, ctx) {
      // A popover menu opens natively — popovertarget is a platform
      // primitive — and the platform supplies the focus management too
      // (ADR-0024): autofocus inside a popover is honored on show, Tab
      // walks the items in DOM order, Esc closes and returns focus to
      // the invoker. Markup carrying autofocus is a valid no-JS
      // keyboard floor, so the rule stays silent there — the same
      // precedent as the no-JS tablist below. What remains module-only
      // is the APG nicety (arrows/Home/End roving, close-on-Tab), so a
      // menu with neither the module nor autofocus is the one state
      // that answers no keyboard at all: pointer-only.
      if (el.matches('[popover][data-kind="menu"]')) {
        if (ctx.armed("popover-menu")) return null;
        if (!el.querySelector("[autofocus]")) {
          return "this popover menu opens pointer-only — put autofocus on its first item so the platform moves focus in on open, or load js/popover-menu.js for the arrow-key roving and close-on-Tab";
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
    fix: 'keep one tab stop in a tablist (tabindex="0" on the active tab, "-1" on the rest); give a popover menu autofocus on its first item or load js/popover-menu.js (docs/keyboard.md)',
  },

  {
    id: "coexistence-clean",
    domain: "core",
    select: "html",
    check() {
      /* The one silent casualty of a side-by-side setup. Barefoot's
         `:focus-visible` ring lives in the base cascade layer, and
         layered styles LOSE to unlayered ones — so a co-loaded reset
         (Tailwind v3 preflight, an older Bootstrap Reboot, a hand-rolled
         `*:focus { outline: none }`) defeats the ring on every element
         at once, with no error and no visual left but the bare outline.
         axe cannot see computed outline; this reads the cascade's own
         structure. Only an UNLAYERED broad focus reset can do it: a
         rule scoped to a class (`.btn:focus`) is a deliberate choice,
         and anything inside an @layer stays below ours by order. */
      const offender = firstUnlayeredFocusReset(document.styleSheets);
      if (offender) {
        return `${offender} sets outline:none on a broad :focus selector and is not inside an @layer — an unlayered reset defeats every layered style, so Barefoot's :focus-visible ring disappears (docs/coexistence.md)`;
      }
      return null;
    },
    fix: "put the reset inside an @layer (any name) or drop its outline:none — a layered reset keeps the cascade's order and the ring (docs/coexistence.md)",
  },
];