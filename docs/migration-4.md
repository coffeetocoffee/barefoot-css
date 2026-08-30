# Barefoot — Migrating from 3.x to 4.0

v4.0 is the first Barefoot major that actually deletes. It raises the
browser baseline to 2026 evergreen (Chrome 125+, Firefox 128+, Safari
26.2+), removes the three surfaces deprecated in 3.2, and tightens
the size budget.

If your app targets 2026 evergreen browsers and doesn't use any
deprecated surface, the upgrade is a version bump with no code changes.

## Fastest path: the codemod

```bash
npm run migrate:v4 -- src app        # dry run — prints per-file changes
npm run migrate:v4 -- --write src app
```

The codemod (`build/codemod-4.mjs`) walks the paths you pass, skips
`node_modules`/`dist`/dot-dirs, and applies the migration rules below
to text files (`.css .html .js .ts .md .json …`). Review the dry run,
apply, then re-run it with no changes expected.

## Browser baseline

v4.0 requires 2026 evergreen browsers:

| Browser | Minimum version |
|---|---|
| Chrome | 125+ |
| Firefox | 128+ |
| Safari | 26.2+ |
| Edge | 125+ |

This means the following features are available without shims:

- `position-visibility: anchors-visible` (Chrome 125+, Firefox 147+,
  Safari 26.2+)
- `<details>` open-panel tab order (Safari 17.4+)
- Scroll-driven animations, `@scope`, anchor positioning, popover API

If you need to support older browsers, stay on Barefoot 3.x.

## What's removed

### 1. `<details data-menu>` dropdowns → Popover-API menus

The entire details-menu pattern is removed: the `dropdown.css` styles,
the details half of `menu-items.css`, and the `data-menu` attribute.

**Before:**
```html
<details data-menu>
  <summary>Options</summary>
  <ul>
    <li><button>Edit</button></li>
    <li><button>Delete</button></li>
  </ul>
</details>
```

**After:**
```html
<button popovertarget="menu-1">Options</button>
<div popover data-kind="menu" id="menu-1">
  <ul>
    <li><button>Edit</button></li>
    <li><button>Delete</button></li>
  </ul>
</div>
```

The Popover-API menu gives you reliable Esc-close, light-dismiss, and
arrow-key navigation (via `js/popover-menu.js`). The look is identical.

### 2. `js/details-close.js` — removed

This module existed only to make Esc close `details[data-menu]`
reliably. With the details-menu pattern gone, the module has no purpose.
Popover menus close natively.

Remove the import:
```js
// before
import "barefoot/js/details-close.js";
// after — delete this line
```

### 3. `js/details-tabindex.js` — removed (baseline-gated)

WebKit's `<details>` tab-order quirk was fixed in Safari 17.4. The
shim is now dead code on all 2026 evergreen browsers.

Remove the import:
```js
// before
import "barefoot/js/details-tabindex.js";
// after — delete this line
```

### 4. `js/popover-anchor.js` — removed (baseline-gated)

`position-visibility: anchors-visible` is now Baseline 2026 (Chrome 125+,
Firefox 147+, Safari 26.2+). The off-screen anchor guard is dead code
on all modern browsers.

Remove the import:
```js
// before
import "barefoot/js/popover-anchor.js";
// after — delete this line
```

## What changed

### 5. Size budget tightened

The removal of deprecated surfaces and dead code lets Barefoot tighten
the enforced size budget. The exact number is set at release; it will
be lower than the pre-removal 10KB gzip budget.

## Migration checklist

1. **Run the codemod:** `npm run migrate:v4 -- src app` — review the
   dry run, then `--write` to apply.
2. **Remove deprecated imports:** delete any imports of
   `js/details-close.js`, `js/details-tabindex.js`, or
   `js/popover-anchor.js`.
3. **Replace `<details data-menu>`** with Popover-API menus (see
   pattern above). The codemod handles the markup rewrite.
4. **Check your browser support matrix:** if you support pre-2026
   browsers, stay on Barefoot 3.x.
5. **Run your tests:** `npm test` — everything should pass with no
   Barefoot-related failures.
6. **Pin the version:** `npm install barefoot-css@^4.0.0`

## What stays

Everything that was not deprecated in 3.2 is unchanged:

- All tokens (`--bf-*`)
- All component classes (`.card`, `.badge`, etc.)
- All `data-*` variants (except `data-menu`)
- All utility classes (`.bf-*`)
- All themes
- All JS modules except the three removed above
- `index.css` and `full.css` entry points
- The `@layer` architecture

If your app renders the same before and after this migration (apart
from the removed details-menu pattern), you did it right.
