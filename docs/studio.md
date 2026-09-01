# Barefoot — Studio

The visual home of generative theming. Open **[`demo/studio.html`](../demo/studio.html)**
to design a whole system from one colour.

## What it does

- **Colour picker + hex field** set `--bf-primary`. The chroma engine
  instantly derives hover / subtle / border / focus for the live preview.
- **Radius / font / density** selectors re-skin the preview `<iframe>` of the
  full demo.
- **Generate — hue + chroma** sliders turn `--bf-seed-h` / `--bf-seed-c`, which
  regenerate the 12-step OKLCH tonal ramp (the swatch strip) live.
- **Container-adaptive reflow** — drag the resize handle and the table stacks to
  cards as its *container* narrows, not the viewport.
- **Export** — copy a pasteable `:root` theme (primary, radius, font, density,
  and the generative seed so the ramp reproduces) or the same overrides as a
  `tokens.json` map for design pipelines.

## v5.2: the design system that writes itself

Importing `themes/seed-system.css` (loaded in the Studio) makes the generative
seed the master accent: turning the hue/chroma dials drives *both* the 12-step
ramp **and** `--bf-primary`, so the entire colour system follows two knobs (see
[theming.md → v5.2](../docs/theming.md#the-design-system-that-writes-itself-v52-opt-in)).

The export now includes the **full derived token set** — the resolved 12-step
`--bf-tone-*` ramp is read from the live preview and emitted into `tokens.json`,
so a designer can paste a complete, seed-derived system into a project, not just
six lines.

## AA is checked, not asserted

`npm run check` measures every text-on-background pair and fails below 4.5:1 with
a suggested `l` fix. The Studio is a playground; the guarantee lives in CI.
