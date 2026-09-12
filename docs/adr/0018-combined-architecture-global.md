# ADR-0018: Combined Architecture & Global Surface

## Status

Accepted for v6.7.0.

## Decision

Combine the v6.7 Architecture & Audit and v6.8 Global & Seamless roadmap into
one release. Ship the declarative form state and script-aware typography as
opt-in CSS files. Extend Verify with focused semantic usage audits. Keep
cross-document View Transitions opt-in and document Speculation Rules rather
than adding a JavaScript or CSS imitation.

## Rationale

These surfaces share a boundary-first contract: the framework can style an
author-declared state and audit its own semantic recipes, while the browser
owns navigation prediction and document transitions. Combining them avoids a
large architecture release followed by a disconnected platform release.

## Constraints

- `full.css` and `index.css` gain no imports.
- State mapping never mutates markup, focus, or form validity.
- Verify never replaces axe and never audits unrelated application markup.
- Unsupported View Transitions and Speculation Rules degrade by omission.
