# Barefoot — Coexistence (v8.0)

Barefoot shares a document with other stylesheets: Tailwind's preflight,
Bootstrap's Reboot, a legacy theme, or your own pre-2010 reset. It is
designed for that — the namespace is `--bf-*`, the element styles live in
[cascade layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer),
and nothing ships unlayered. This page is the contract for what happens
when those worlds meet, and the one silent failure mode worth auditing.
Contract: [ADR-0022](adr/0022-resilience-coexistence.md).

## The one rule that matters

**Layered styles lose to unlayered ones.** Cascade layers sit *below*
unlayered author styles in the cascade, so a stylesheet that is not
wrapped in `@layer` beats every layered style at the same specificity —
import order cannot save you. This has one casualty that is both silent
and total:

Only an unlayered rule can defeat Barefoot's layered `:focus-visible` ring: a co-loaded reset that sets `outline: none` on a broad `:focus` selector wins every layered style at once and the ring disappears — layer the reset, or drop the declaration.

The classic offenders are the global focus resets every framework used
to ship:

```css
/* ✗ unlayered — defeats Barefoot's ring on every element */
*:focus { outline: none }
a:focus, button:focus { outline: none }
button:focus:not(:focus-visible) { outline: 0 }

/* ✓ layered — the cascade keeps its order, the ring survives */
@layer reset {
  *:focus { outline: none }
}
```

Barefoot's own form controls *do* replace the outline with a box-shadow
ring (`:is(input, select, textarea):focus-visible` in `forms-base.css`) —
that rule lives in the components layer, so it wins by layer order, not
by being unlayered, and a layered reset stays beneath it.

Verify's `coexistence-clean` rule audits this: it walks the page's
same-origin stylesheets for an **unlayered** rule that sets `outline:
none`/`0` on a broad `:focus` selector (element-level only — a rule
scoped to a class like `.btn:focus` is a deliberate choice and stays
silent). Cross-origin sheets — a CDN-served stylesheet — throw on
`cssRules` access, so the rule audits inline and same-origin styles
only. Import `js/verify.js` to hear about it in your console, or
[pin it in CI](verify.md#ci-contract-packs).

## Pin the layer order

Opt into `components/coexistence.css` — one line, no rules of its own:

```html
<link rel="stylesheet" href="barefoot-css/components/coexistence.css">
```

```css
@import "barefoot-css";
@import "barefoot-css/components/coexistence.css";
```

It declares `@layer reset, tokens, base, components, utilities, user;`.
Layer order is fixed by the **first appearance of each layer name** in
the document, so importing this file appends `user` last — no matter
which other Barefoot files you import or in what order. Then your
overrides always win, and never need `!important`:

```css
@layer user {
  /* beats every Barefoot component rule for the same selector */
  .card { border-radius: 0 }
}
```

Import it anywhere; the name-list is idempotent for names already seen.

## The three setups

**1. Barefoot + a layered framework (Tailwind v4, modern Bootstrap).**
Both of you use layers, so the merge is by name. Declare the order you
want *first*, then import both:

```css
@layer theme, base, components, utilities, user;
@import "tailwindcss";
@import "barefoot";
```

Layer names are document-global and shared — a name collision (`base`,
`components`) *merges* the two frameworks' rules into one layer, and
source order decides inside it. That is usually what you want; if it
isn't, rename your side: `@layer barefoot-base, …`.

**2. Barefoot + an unlayered reset (Tailwind v3, Bootstrap ≤ 5.2, legacy
stylesheets).** Their rules are unlayered, so they beat all of
Barefoot's layers regardless of import order. You have two honest
options: wrap the reset yourself (`@layer reset { … }` around the file
or the `@import`), or accept that it wins and write your overrides
unlayered too. There is no third, magic option — the cascade has an
opinion here and it is documented.

To layer an `@import`, the spec supports `@import "x" layer(reset);` —
browsers honor it, and the reset lands where you put it.

**3. CDN + npm hybrid.** The same sheet linked twice (a `<link>` to the
CDN and an npm `@import`) is harmless: layer statements are no-ops for
names already declared, and the duplicated rules merge into the same
layers — you pay bytes, not correctness. Keep one, is the advice;
keeping both costs a second download for nothing.

## `@import` vs `<link>`

Both work; the difference is where you can put the layer statement.

- `<link>` in `<head>`: the layer declaration must come from a linked
  file (that is what `coexistence.css` is for) or an inline `<style>`
  before the links. `@layer` inside an inline `<style>` counts.
- `@import` in CSS: put your `@layer name-list;` statement at the top of
  the importing file, before any `@import`. Statements after an
  `@import` are still honored for new names, but leading with the list
  is the readable order.

A `<style>` element's own unlayered rules beat all layers — that is how
the demos on this site do their page chrome (`demo/keyboard.html` and
its siblings). It is a fine pattern for one page's chrome; it is a poor
one for a design system.

## Degrade by omission

No polyfill, no JS imitation, no fallback markup anywhere in this
contract. Engines without cascade-layer support ignore `@layer` entirely
and fall back to plain source-order cascade — Barefoot's element styles
still apply, the ring still shows, and the layer-order escape hatch is
simply absent rather than broken.

## Try it live

`demo/resilience.html` proves the whole release: elastic boxes under a
German label expansion, the focus ring defeated and restored live (with
Verify naming the offender), and the print column selection in print
preview.
