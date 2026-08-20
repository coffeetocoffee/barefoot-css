# AGENTS.md — Barefoot CSS

A themeable, JS-free CSS framework. Styles native HTML elements; opt-in
JS only where native elements fall short. Built from `@layer reset,
tokens, base, components, utilities` (declared once in `src/layers.css`),
bundled per-entry-point by Lightning CSS into `dist/`.

## Read first — the state

The project keeps its memory in two files. Read the *snapshots*, not
the whole files, at session start:

- `plan.md` — read the **Snapshot** block at the top (current version,
  next arc, test/build numbers). The roadmap, decisions, and v2.0 plan
  below it are deep-read only when planning or rolling milestones.
- `CHANGELOG.md` — the latest entry at the top is the current release.

For the component or doc you're touching, also read the matching file in
`docs/` (components, theming, accessibility, javascript).

Update `plan.md` (Snapshot + the touched sections) and `CHANGELOG.md`
when you ship something.

## Conventions (cache — not discoverable from the code)

- Native elements first; a class only where no native element exists
  (`.card`, `.badge`, `.fz-*` utilities). Component variants are
  `data-*` attributes: `[data-nav]`, `[data-alert]`, `[data-grid]`,
  `[data-variant]`, `[data-kind]`, `[data-autogrow]`, `[data-striped]`,
  `[data-switch]`, `[data-menu]`.
- Every visual is a `--fz-*` token, `light-dark()` pair, defined and
  `@property`-registered in `src/tokens.css`. Theme modes via
  `data-theme` on `<html>`.
- Base element selectors stay low-specificity: wrap long `:not(...)`
  chains in `:where()` so state rules (`:user-invalid`, `:hover`,
  `:focus-visible`, `[aria-invalid]`) can beat them. (A `(0,5,1)`
  text-input selector once silently shadowed every state rule.)
- Accessibility is inherited from native semantics; take `role` /
  `aria-live` from the consumer's markup — Barefoot never invents one.
- Edit `src/`; `dist/` is gitignored build output, rebuilt at publish.

## Building and testing

```bash
npm run check                 # build → dist/ + size budget + docs:size + stylelint
npm test                      # Chromium: a11y + JS + CSS + visual
npm run test:ff               # Firefox (JS + CSS behavior)
npm run test:webkit           # WebKit (JS + CSS behavior)
npm run test:visual:update    # regenerate baselines — deliberately
```

- New behavior gets a test in `tests/css.spec.js`; a new page state also
  lands in `tests/a11y.spec.js`.
- Visual baselines are OS-specific (`*-win32.png`); regenerating them
  means the demo changed visually.
- The preview server binds `localhost:4173` and suites collide on that
  port — run them one at a time.
- New `src/components/*.css` must be imported into `src/full.css` (the
  full bundle) — only `src/index.css` when it belongs in the core
  (reset/tokens/base).
- New opt-in behavior is a single ES module in `src/js/`, auto-init on
  load, wired into `src/js/barefoot.js`, and listed in
  `docs/javascript.md`.

## Releasing

`RELEASE.md` has the checklist (tag `v*` → `release.yml` builds, runs
tests, `npm publish`es with the `NPM_TOKEN` repo secret).