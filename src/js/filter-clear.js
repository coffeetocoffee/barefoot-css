/* Barefoot — opt-in: Escape clears a filter input.
   Find-in-page bars, search boxes, list filters: Escape means "reset".
   No native primitive clears an input on Escape — the platform gives
   you a text field and a keyboard event, nothing more — so this is the
   tabs tier of opt-in JS: a page can do it in one line of its own code,
   and this module is that line, shared.
   Zero dependencies, <0.5KB.

   Markup:
   <input type="search" data-bf-filter aria-label="Filter tasks">

   Behavior: Escape clears the value and reports it as a bf:* event so a
   page's filter logic can re-run. Empty input + Escape is a no-op —
   there is nothing to report.

     import "barefoot-css/js/filter-clear.js"      → auto-init on load
     import { initFilterClear } from "…"            → manual init for dynamic content

   Event (v7.0 contract):
     bf:filterclear  on the input, bubbles — detail { value: "" }
*/

import { onDomReady, bindOnce, emit } from "./lifecycle.js";

export function initFilterClear(root = document) {
  const inputs = root.querySelectorAll("input[data-bf-filter], textarea[data-bf-filter]");

  for (const input of inputs) {
    if (!bindOnce(input, "filter-clear")) continue;

    input.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || input.value === "") return;
      e.preventDefault();
      input.value = "";
      // Report the clear (v7.0 event contract): the value is always ""
      // — the event means "the filter reset, re-run it". A listener
      // correlates by the input it arrived on, not by a payload.
      emit(input, "bf:filterclear", { value: "" });
    });
  }
}

onDomReady(() => initFilterClear());
