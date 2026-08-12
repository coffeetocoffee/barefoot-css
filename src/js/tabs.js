/* Barefoot — opt-in: WAI-ARIA tabs.
   Roving tabindex, automatic activation, Arrow/Home/End navigation.
   Zero dependencies, ~1KB.

   Markup (progressive enhancement — without JS every panel shows):
   <div data-fz-tabs>
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

export function initTabs(root = document) {
  const groups = root.querySelectorAll("[data-fz-tabs]");

  for (const group of groups) {
    const tabs = [...group.querySelectorAll('[role="tab"]')];
    const panels = [...group.querySelectorAll('[role="tabpanel"]')];
    if (tabs.length === 0 || tabs.length !== panels.length) continue;

    // Mark the group as JS-driven so CSS hooks (data-fz-tabs-js) can react
    // and so the no-JS default (every panel visible, nothing lost) is
    // unambiguous once the module has taken over.
    group.setAttribute("data-fz-tabs-js", "");

    const select = (tab) => {
      tabs.forEach((t, i) => {
        const active = t === tab;
        t.setAttribute("aria-selected", String(active));
        t.tabIndex = active ? 0 : -1;
        panels[i].hidden = !active;
      });
    };

    const selectIndex = (i) => {
      const next = tabs[Math.max(0, Math.min(tabs.length - 1, i))];
      select(next);
      next.focus();
    };

    for (const tab of tabs) {
      tab.addEventListener("click", () => select(tab));

      tab.addEventListener("keydown", (e) => {
        const idx = tabs.indexOf(tab);
        if (e.key === "ArrowRight") {
          e.preventDefault();
          selectIndex(idx + 1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          selectIndex(idx - 1);
        } else if (e.key === "Home") {
          e.preventDefault();
          selectIndex(0);
        } else if (e.key === "End") {
          e.preventDefault();
          selectIndex(tabs.length - 1);
        }
      });
    }

    // Normalize initial state from the markup's aria-selected.
    const first = tabs.find((t) => t.getAttribute("aria-selected") === "true");
    select(first ?? tabs[0]);
  }
}

function autoInit() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initTabs());
  } else {
    initTabs();
  }
}

export default autoInit;
autoInit();
