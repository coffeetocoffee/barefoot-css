# Barefoot — Theming

The whole framework is variables. Change a variable, everything that
depends on it follows. There is no build step, no Sass, no recompile.

## Token reference

Defined in `src/tokens.css` on `:root`.

| Token | Default (light / dark) | Purpose |
|---|---|---|
| `--fz-primary` | ink `#1a1a1a` / `#ececec` | the accent — change this and every component follows |
| `--fz-primary-fg` | `#fff` / `#141414` | text/icon on the accent |
| `--fz-surface` | `#fff` / `#161616` | page & component background |
| `--fz-surface-alt` | `#f4f4f4` / `#202020` | hover chips, code, pre |
| `--fz-text` | `#1a1a1a` / `#e8e8e8` | body text |
| `--fz-muted` | `#5a5a5a` / `#a0a0a0` | secondary text |
| `--fz-border` | `#d8d8d8` / `#3a3a3a` | hairlines, borders |
| `--fz-danger` | `#b3261e` / `#f2b8b5` | errors, destructive |
| `--fz-focus-ring` | ink / paper | focus outline color |
| `--fz-radius` | `0.375rem` | component corners |
| `--fz-radius-sm` / `--fz-radius-lg` | `0.25rem` / `0.625rem` | small / large corners |
| `--fz-space-1…8` | `0.25rem…4rem` | spacing scale |
| `--fz-font` | system-ui stack | body font |
| `--fz-font-mono` | ui-monospace stack | code font |
| `--fz-line-height` | `1.6` | body leading |
| `--fz-control-height` | `2.5rem` | buttons/inputs height |
| `--fz-shadow` | `none` | default shadow (neutral by default) |
| `--fz-shadow-lifted` | soft drop | popovers, dialogs, `data-lifted` |
| `--fz-content-width` | `64ch` | max measure for prose |
| `--fz-max-width` | `72rem` | `.fz-container` width |
| `--fz-grid-min` | `14rem` | minimum track in `[data-grid="auto-fit"/"auto-fill"]` |
| `--fz-grid-gap` | `--fz-space-4` | default `[data-grid]` gap |
| `--fz-sidebar-width` | `16rem` | aside width in `.fz-sidebar` |
| `--fz-sticky-top` | `0` | offset for `.fz-sticky` |
| `--fz-transition` / `--fz-transition-slow` | `150ms` / `250ms` ease | motion |

## How light/dark works (the trick)

Color tokens are `light-dark(lightValue, darkValue)`:

```css
:root {
  color-scheme: light dark;
  --fz-surface: light-dark(#ffffff, #161616);
}
```

The browser resolves `light-dark()` from `color-scheme`, which already
follows the OS. **Dark mode works with zero attributes and zero duplicate
palettes.** The `[data-theme]` attribute simply overrides `color-scheme`:

| Attribute | Effect |
|---|---|
| (none) / `data-theme="auto"` | follow OS preference |
| `data-theme="light"` | force light |
| `data-theme="dark"` | force dark |
| `data-theme="contrast"` | force high-contrast colors |
| `data-theme="editorial"` etc. | starter themes (see below) |

## Making your own theme

Copy `src/themes/custom.css`, rename it, override only what you want:

```css
@layer tokens {
  [data-theme="my-theme"] {
    color-scheme: light dark;
    --fz-primary: light-dark(#2563eb, #93b4fd);
    --fz-radius: 0.5rem;
    --fz-font: "Inter", system-ui, sans-serif;
  }
}
```

Then `<html data-theme="my-theme">`. Unset variables inherit from the base
tokens — you never "reset" anything.

## Starter themes

Four built-in demos of how far a few variables go. See the files in
`src/themes/`:

- **Editorial** — serif, paper tones, square corners.
- **Dashboard** — denser controls, blue accent, tighter radii.
- **Playful** — rounded, saturated, bouncier transitions.
- **Forest** — deep greens on warm paper.

They are the marketing proof: *a handful of variables, completely
different product.*

## OS accessibility settings

Tokens also respect OS settings via media queries at the end of
`src/tokens.css`:

- **`prefers-contrast: more`** — forces black-on-white tokens (pure
  `#000`/`#fff`, no `light-dark()` pairs), so high-contrast users get a
  maximally distinct palette even in a themed app.
- **`prefers-reduced-transparency: reduce`** — drops the lifted shadow to
  `none`, removing depth effects.

An **explicit `data-theme` still wins** over both: a theme selector like
`[data-theme="forest"]` outranks the plain `:root` the media queries set,
so choosing a theme (explicit intent) beats OS preference. The manual
`[data-theme="contrast"]` preset sets the same values as the
`prefers-contrast` block, so the two never fight.

## Typed properties (progressive enhancement)

`@property` registers variables as typed colors, so they validate and can
transition. Browsers without `@property` ignore the block and use the plain
custom properties — safe to ship everywhere we ship Barefoot.

## Using your own accent in one line

```css
:root { --fz-primary: #yourcolor; }
```

Everything that is "brand" — buttons, links, focus, selection, form
accents — follows, in both light and dark.
