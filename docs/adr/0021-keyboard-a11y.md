# ADR-0021: keyboard beyond the component — maps, roving sort headers, filter Esc-to-clear, preference layers

**Status:** Accepted (2026-09-16)

## Context

Through v7.4 the framework's keyboard story stopped at the component edge:
tabs and popover menus had arrow-key modules, and everything else was "the
platform handles it." Four gaps showed up once real pages were audited:

1. **No per-pattern map existed.** Each surface documented its own keys (or
   didn't), so a keyboard user had to assemble the contract from six pages —
   and the honest line ("a popover menu without its module is pointer-only")
   lived nowhere at all.
2. **Sort headers were Tab-only.** The header buttons are a horizontal line
   of controls — exactly the shape the roving seam was built for — but
   `table-sort.js` never joined it, so arrow keys did nothing there while
   working two components over.
3. **Filter inputs had no reset.** No native primitive clears an input on
   Escape; every page with a filter re-implemented the same keydown handler
   (or, more often, shipped without one).
4. **Two preferences were half-answered.** The core already swaps the
   palette under `prefers-contrast` and drops shadows under
   `prefers-reduced-transparency` — but the swap left hairlines thin and
   state tints translucent, and nothing flattened the remaining alphas.

## Decision

1. **The map is a doc, not a module.** `docs/keyboard.md` states the
   native-vs-opt-in contract per pattern in one table, and `demo/keyboard.html`
   proves it on its own page. Where the platform covers a surface (dialogs,
   accordions), the map says "nothing" — an explicit nothing, not a gap.
2. **Sort headers join the rover.** `table-sort.js` binds `createRover` over
   its header buttons (horizontal, clamp). No new key math exists anywhere:
   the ADR-0006 source-parse test already forbids arrow-key literals outside
   `roving-index.js`, so the enhancement could only have been built this way.
3. **`filter-clear.js` is one shared line.** `input[data-bf-filter]` +
   Escape clears and reports `bf:filterclear`; empty + Escape is a no-op. It
   joins the barrel (it is a behavior module) but arms nothing (no Verify
   rule audits it — a filter without the module still filters; only the
   reset is missing).
4. **Nested dialogs get documentation, not a module.** The platform's
   contract (topmost-layer Esc, focus return) is complete on Chromium and
   Firefox; WebKit gaps focus return (lands on the outer dialog / body).
   The suite pins layering everywhere and focus return where it holds, with
   the reason string attached. Building a module to polyfill WebKit focus
   return would be JS imitating the platform — explicitly declined.
5. **The preference layer finishes, never fights.** `a11y-prefs.css` is
   `@layer components`, so the core's unlayered accessibility blocks win
   where they overlap (verified: the layer's muted/border values lose to
   the core swap, by design). The layer owns only the remainder: doubled
   border width and flattened tints under `prefers-contrast`, solid
   backdrop / flattened tints / no shimmer under reduced transparency,
   no shimmer under reduced data (forward-compatible — no engine
   implements it yet).
6. **Two Verify rules, both structural.** `roving-focus` audits the
   one-tab-stop contract and the pointer-only menu (the two things axe
   cannot know about Barefoot's keyboard surfaces). `reading-order-after-
   reflow` reads computed `order` / flex direction inside adaptive
   containers (WCAG 1.3.2). Both require `tabs.js` / `popover-menu.js` to
   `arm()` — the arming list grows only when a rule audits, per lifecycle
   convention.

## Consequences

- `bf:filterclear` joins the v7.0 event contract; the docs-from-source test
  pins its documentation.
- The registry budget moves 6656 → 8192 bytes gzip (two more quoted rules),
  deliberately in review.
- A 1.5px border nudge was rejected during implementation: headless
  Chromium snaps sub-2px used widths to whole device pixels, so the layer
  doubles to 2px — unambiguous on every engine, and directly assertable.

## Rejected

- **A `js/dialog-focus.js` module** to paper over WebKit's focus-return gap:
  behavior modules exist where *no* native primitive works, not where one
  engine lags.
- **Milder-contrast palette overrides in the layer**: offering "your palette,
  stronger" would silently replace the core's maximum-contrast stance for
  anyone importing the file. The layer thickens and flattens; it never
  re-hues.
- **A `prefers-reduced-data` image/font budget in CSS**: cannot be done
  truthfully in a stylesheet. The layer drops decorative repaint and the
  docs state the bring-your-own plainly.
