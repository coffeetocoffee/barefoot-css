# Barefoot — Build your first theme

A step-by-step tutorial. In ~15 minutes you'll go from the default
ink-on-paper look to a shipped, named theme — no build step, no Sass,
no recompile. If it helps to see where you're heading, the starter
themes (`src/themes/`) are exactly the end product of this process,
just with different taste.

You need two files to start:

1. Copy `src/themes/custom.css` to `my-theme.css`. It's a template
   with every knob commented.
2. Load it **after** `index.css`/`full.css` (later import wins), and
   activate it with `<html data-bf-theme="my-theme">`.

That's the whole mechanism. Everything below fills in *what to change*
and *in what order*.

> New to the token system? The full variable reference lives in
> [theming.md](theming.md). This tutorial is the guided tour.

## Step 0 — Understand the one trick

Every color token is a `light-dark()` pair:

```css
--bf-surface: light-dark(#ffffff, #161616);
```

The browser resolves that function from `color-scheme`, which already
follows the user's OS. So your theme gets dark mode **for free** — you
write each color once, as its light and dark value side by side. You
never maintain two palettes.

## Step 1 — Pick an accent

One variable drives everything "brand": links, primary buttons, focus
rings, selection, form accents, slider thumbs, progress bars.

```css
[data-bf-theme="ocean"] {
  --bf-primary: light-dark(#0e7490, #67e8f9);
}
```

Rule of thumb: the light value should be dark enough to carry white
text (`--bf-primary-fg` defaults to white-on-accent); the dark value
should be light enough to carry black text. Check both against
[WCAG contrast ≥ 4.5:1](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
— or just run the demo page under axe-core like our CI does.

## Step 2 — Set the surfaces

Three tokens control almost the whole canvas:

```css
--bf-surface:      light-dark(#f8fafc, #0f172a);  /* page + components */
--bf-surface-alt:  light-dark(#eef2f7, #1e293b);  /* code, hover chips */
--bf-text:         light-dark(#0f172a, #e2e8f0);
```

Keep `surface-alt` close to `surface` — it's a whisper, not a shout.
If you stop here you already have a coherent, dark-mode-capable skin.

## Step 3 — Shape and rhythm

Non-color personality comes from four variables:

```css
--bf-radius: 0.75rem;        /* roomier corners than the 0.375rem default */
--bf-border-width: 1px;      /* strokes everywhere at once */
--bf-control-height: 2.75rem; /* buttons/inputs grow together */
--bf-font: "Sora", system-ui, sans-serif;
```

Change `--bf-radius` alone and cards, inputs, dialogs, menus all
follow. That's the point of the token layer: small cause, visible
effect.

## Step 4 — Let the ramps follow

You generally should **not** override derived tokens like
`--bf-primary-muted` or `--bf-surface-2`. They're computed from the
base tokens with `color-mix()`:

```css
--bf-primary-muted: color-mix(in oklab, var(--bf-primary), transparent 75%);
```

Override the base, the ramp follows. Only touch a derived token when
you want a *different relationship*, not a different color.

## Step 5 — Name it and ship it

Your file now looks roughly like this:

```css
@layer tokens {
  [data-bf-theme="ocean"] {
    color-scheme: light dark;

    /* accent */
    --bf-primary: light-dark(#0e7490, #67e8f9);

    /* surfaces */
    --bf-surface: light-dark(#f8fafc, #0f172a);
    --bf-surface-alt: light-dark(#eef2f7, #1e293b);
    --bf-text: light-dark(#0f172a, #e2e8f0);

    /* shape & rhythm */
    --bf-radius: 0.75rem;
    --bf-font: "Sora", system-ui, sans-serif;
  }
}
```

Wire it up:

```html
<link rel="stylesheet" href="barefoot/full.css">
<link rel="stylesheet" href="themes/ocean.css">
<html data-bf-theme="ocean">
```

Unset variables inherit from the base tokens — you never "reset"
anything, you only override.

## Step 6 — Verify

Before shipping, walk the checklist:

- **Both modes:** force each with `data-bf-theme="light"` /
  `data-bf-theme="dark"` — every `light-dark()` pair should look
  deliberate, not just "not broken".
- **Contrast:** text, muted text, and accent-on-surface pairs ≥ 4.5:1.
- **Focus:** tab through the page; the ring must be visible on every
  surface (it reads `--bf-focus-ring`, which defaults to your ink —
  check it survives your palette).
- **Motion:** `prefers-reduced-motion` still holds — themes change
  colors, never motion safety.
- **Status colors:** if your accent is green/blue/amber-ish, consider
  nudging `--bf-success` / `--bf-info` / `--bf-warning` so alerts stay
  distinguishable from the brand.

## Where to go next

- [theming.md](theming.md) — the complete token reference.
- `src/themes/editorial.css` … `forest.css` — five worked examples,
  each only a handful of overrides.
- [api.md](api.md) — the stability contract: the token names you're
  overriding are frozen API.
