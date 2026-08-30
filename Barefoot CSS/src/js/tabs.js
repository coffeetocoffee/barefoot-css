/* Barefoot — opt-in: WAI-ARIA tabs.
   Roving tabindex, automatic activation, Arrow/Home/End navigation.
   Zero dependencies, ~1KB.

   Markup (progressive enhancement — without JS every panel shows):
   <div data-bf-tabs>
     <div role="tablist" aria-label="…">
       <button id="tab-1" role="tab" aria-controls="panel-1" aria-selected="true">One</button>
       <button id="tab-2" role="tab" aria-controls="panel-2" aria-selected="false">Two</button>
     </div>
     <div id="panel-1" role="tabpanel" aria-labelledby="tab-1" tabindex="0">…</div>
     <div id="panel-2" role="tabpanel" aria-labelledby="tab-2" tabindex="0">…</div>
   </div>

   import "barefoot/js/tabs.js"    → auto-init on load
   import { initTabs } from "…"     → manual init for dynamic content
*/

import { onDomReady, bindOnce } from "./lifecycle.js";
import { createRover } from "./roving-index.js";

export function initTabs(root = document) {
  const groups = root.querySelectorAll("[data-bf-tabs]");

  for (const group of groups) {
    const tabs = [...group.querySelectorAll('[role="tab"]')];
    const panels = [...group.querySelectorAll('[role="tabpanel"]')];

    // A mismatch means the markup can't work — say so instead of
    // silently skipping.
    if (tabs.length > 0 && tabs.length !== panels.length) {
      console.warn(
        `[barefoot] tabs: ${tabs.length} tab(s) vs ${panels.length} panel(s) — group skipped`
      );
      continue;
    }
    if (tabs.length === 0) continue;
    if (!bindOnce(group, "tabs")) continue;

    // Mark the group as JS-driven so CSS hooks (data-bf-tabs-js) can react
    // and so the no-JS default (every panel visible, nothing lost) is
    // unambiguous once the module has taken over.
    group.setAttribute("data-bf-tabs-js", "");

    const select = (tab) => {
      tabs.forEach((t, i) => {
        const active = t === tab;
        t.setAttribute("aria-selected", String(active));
        t.tabIndex = active ? 0 : -1;
        panels[i].hidden = !active;
      });
    };

    const rove = createRover(
      () => tabs,
      {
        axis: "horizontal",
        activate(tab) {
          select(tab);
          tab.focus();
        },
      }
    );

    for (const tab of tabs) {
      tab.addEventListener("click", () => select(tab));

      tab.addEventListener("keydown", rove);
    }

    // Normalize initial state from the markup's aria-selected.
    const first = tabs.find((t) => t.getAttribute("aria-selected") === "true");
    select(first ?? tabs[0]);
  }
}

onDomReady(() => initTabs());
