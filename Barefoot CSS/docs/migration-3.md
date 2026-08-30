# Barefoot — Migrating from 2.x to 3.0

v3.0.0 is the namespace cleanup: every public `fz` surface becomes
`bf`. Nothing else changed — no palette, layout, or behavior value was
touched, and nothing that existed in 2.x was removed (v2 shipped no
deprecations). If your app renders the same before and after this
migration, you did it right.

## Fastest path: the codemod

```bash
npm run migrate:v3 -- src app        # dry run — prints per-file changes
npm run migrate:v3 -- --write src app
```

The codemod (`build/codemod-3.mjs`) walks the paths you pass, skips
`node_modules`/`dist`/dot-dirs, and applies exactly the four rules
below to text files (`.css .html .js .ts .md .json …`). Review the dry
run, apply, then re-run it with no changes expected.

## The mapping

### 1. Tokens — `--fz-*` → `--bf-*`

Every custom property keeps its name after the prefix; only the two
letters change, dashes included:

```css
/* before */              /* after */
var(--fz-primary)     →   var(--bf-primary)
var(--fz-space-4)     →   var(--bf-space-4)
```

This covers overrides in your own CSS, starter-theme copies, and any
`@property` registrations you made for animated tokens (ADR-0005:
register your own copy if you animate one) — rename those
`syntax`-identical declarations' `inherits` targets too.

### 2. Theme attribute — `data-theme` → `data-bf-theme`

```html
<!-- before -->                          <!-- after -->
<html data-theme="dark">             →   <html data-bf-theme="dark">
<html data-bf-theme="contrast">
```

Values are unchanged: `auto` / `light` / `dark` / `contrast`. The
attribute is now namespaced so it can never collide with your own or
another library's `data-theme`.

Two adjacent renames ride along:

- The demo's switcher-button pattern: `data-theme-btn="light"` →
  `data-bf-theme-btn="light"`.
- Any CSS/JS of yours targeting `[data-theme]`, e.g.
  `[data-bf-theme="dark"] { … }`.

**OS dark mode is untouched:** without the attribute,
`light-dark()` still follows the OS via `color-scheme`. Only explicit
overrides move.

### 3. Utility and helper classes — `.fz-*` → `.bf-*`

Same classes, new prefix:

| before | after |
|---|---|
| `.fz-container`, `.fz-stack`, `.fz-row`, `.fz-sidebar` | `.bf-container`, … |
| `.fz-gap-*`, `.fz-mt-*`, `.fz-mb-*`, `.fz-p*-*` | `.bf-gap-*`, … |
| `.fz-visually-hidden`, `.fz-skip-link`, `.fz-sticky` | `.bf-visually-hidden`, … |
| component helpers: `.fz-brand`, `.fz-nav-toggle`, `.fz-avatar(-group)`, `.fz-prose`, `.fz-field-hint/error/success` | same names with `.bf-` |

### 4. Tabs module marker — `data-fz-tabs-js` → `data-bf-tabs-js`

Set by `js/tabs.js` at runtime; if you have CSS/tests of your own that
key off it, rename there too.

### 5. Keyframes (only if referenced)

Internal animation names moved: `fz-dialog-in` → `bf-dialog-in`,
`fz-skeleton-shimmer` → `bf-skeleton-shimmer`, `fz-spin` → `bf-spin`.
Invisible unless your CSS re-declares `animation:` with these names.

## Manual checklist

1. `grep -rn "fz" your-src/` (case-insensitive `-i` catches prose) —
   after migration the only hits should be your own unrelated strings.
2. Starter/custom themes: if you copied `themes/editorial.css` etc. or
   the old `themes/custom.css` template, re-copy from v3 or apply rule 1.
3. Docs/comments mentioning old names — update at leisure; they don't
   affect rendering.
4. Pin `barefoot-css@^3.0.0`; mixing 2.x CSS with 3.x markup silently
   un-styles themes (the attribute simply won't match).

## Why breaking at all?

`data-theme` is the web's most-collided attribute name; `fz` said
nothing about Barefoot. One short, unique prefix across tokens,
classes, and attributes means consumers can grep one string and own
their whole override surface. The decision is recorded in
[plan.md](../plan.md)'s decision log.
