/* Barefoot — internal: close-and-refocus seam.
   One definition of "a disclosure closed, hand focus back to its
   opener": only when focus still lives inside the thing that closed —
   a popover dismissed by outside click must never yank focus from
   wherever the user went next. Opener may be an element or a getter,
   because openers are found at different times (the summary of each
   details is per-instance).

    import { refocusOpener } from "./return-focus.js"
*/

export function refocusOpener(container, opener) {
  const el = typeof opener === "function" ? opener() : opener;
  if (el && container.contains(document.activeElement)) el.focus();
}
