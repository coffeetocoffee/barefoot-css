# ADR-0007: CSS recipe de-duplication (scan arc C7)

**Status:** Accepted (2026-08-22)

## Context

The architecture scan's last candidate flagged seven CSS-side
duplication claims across components. Verification against source
confirmed some, corrected others:

- `dropdown.css` and `popover.css` carried verbatim menu-item rules —
  and the copies had **already drifted visibly**: base.css styles `a`
  without resetting it, so popover-menu links rendered underlined and
  accent-colored while dropdown-menu links were clean.
- Alert and toast encoded the same four-status edge-tint recipe in
  eight separate blocks.
- Disabled controls hard-coded `opacity: 0.5` twice — a violation of
  the tokens-only rule.
- forms.css repeated its input/select/textarea triple in eight state
  chains, carried a comment-only selector list ("documentation"),
  and re-declared range-input focus styles identical to base.css.
- Three components carried `prefers-reduced-motion` guards past the
  global kill switch in base.css.
- The `:where()` low-specificity convention existed in only a handful
  of places despite being anti-pattern #1 in AGENTS.md.

## Decision

1. **Menu items live in one file.** New
   `src/components/menu-items.css` owns the item + hover recipe for
   both `details[data-menu]` and `[popover][data-kind="menu"]`
   (union selectors); the component files keep only their panel
   chrome and point at the shared file. Source-parse tests pin the
   recipe's uniqueness; a behavior test pins what menu items paint.
2. **Disabled dimming is a token.** `--fz-disabled-opacity: 0.5`
   (tokens.css), consumed by buttons.css and forms.css. Not mirrored
   in the contrast/print palettes — those override colors only, and
   disabled controls are WCAG-exempt from contrast requirements.
3. **forms.css state chains compress to `:is()`.**
   `:is(input, select, textarea):hover…` replaces each triple;
   specificity is unchanged (`:is()` takes its arguments' max, plain
   elements here). The redundant checkbox/radio disabled arms folded
   into `input:disabled` — with one dedicated exception: a
   `input[type="checkbox"][data-switch]:disabled` arm keeps `(0,2,1)`
   so `cursor: not-allowed` still beats the switch's
   `cursor: pointer` (the `:is()` arm alone is `(0,1,1)` and loses
   that tiebreak; pinned by its own test). The comment-only type list
   became a plain comment. The range-input focus rule was deleted:
   its values matched base.css's ring byte-for-byte but base could
   never apply it — the components layer zeroes `outline` first — so
   all it ever did was stack a second indicator on top of the shared
   halo. Range now focuses like every other input (halo + border
   color only), the arc's one deliberate visual delta.
4. **Status tints stay per-component.** Alert and toast keep their
   own four blocks each; badge keeps full-paint variants. The status
   *tokens* are the shared seam — merging selectors would couple two
   component files for ~10 lines while breaking the one-file-per-
   component ownership model.
5. **Reduced-motion guards stay — revised during verification.** The
   initial plan removed spinner/skeleton guards as redundant past the
   global kill switch; the suite immediately failed: it pins
   name-level removal (`animationName === "none"`), which duration-
   clamping does not provide. Infinite decorative animations go away
   entirely by design; view-transition pseudo-elements need their own
   guard regardless (`*` cannot reach them). base.css documents both
   exception classes so nobody "simplifies" them away again.
6. **`:where()` audit found one real fix.** Table striping
   (`table[data-striped] tbody tr:nth-child(odd)`, ≈(0,2,3))
   out-specified row hover ((0,1,2)) — harmless today only because
   both use `--fz-surface-alt`; precedence now rests on `:where()`
   wraps instead of that coincidence. Stepper's `(0,3,0)` triples are
   attribute-state-vs-attribute-state at equal specificity where
   source order *is* the intended precedence — left alone.

## Rejected

- **Merging alert/toast tint blocks into dual-selector rules**:
  couples component files, saves ~10 lines, and muddles ownership
  (see decision 4).
- **A stylelint specificity ceiling** for the `:where()` convention:
  state rules legitimately need specificity; expressing "long chain,
  but only when it shadows states" in lint config invites constant
  churn. The light audit + documented findings won.
- **Removing the per-component motion guards** (initial direction):
  overruled by the pinned contract — see decision 5.

## Consequences

- Menu-item styling cannot drift again; popover menus gain the
  dropdowns' clean link treatment (user-visible fix).
- One new public token; overriding disabled dimming is now themable
  like everything else.
- forms.css loses ~40 lines of repetition with zero computed-style
  change (verified by the suite).
- The motion-safety story is now written down at the kill switch:
  clamp globally, remove decorative-infinite locally, guard
  view-transitions separately.
