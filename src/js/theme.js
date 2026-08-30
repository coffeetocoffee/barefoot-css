/* Barefoot — opt-in: theme toggle + persistence.
   Wires [data-bf-theme-btn] buttons to the [data-bf-theme] attribute on
   <html> and remembers the choice in localStorage, re-applying it on the
   next load. Any theme name works — the built-ins ("light", "dark",
   "contrast", "auto") or a starter/custom theme the page's CSS defines.
   The OS preference itself never needs JS: with no stored choice (or an
   explicit "auto"), light-dark() follows the system natively.

   <button type="button" data-bf-theme-btn="dark">Dark</button>
   <button type="button" data-bf-theme-btn="auto">Auto</button>

   No-JS first: without this module the buttons are inert and the page
   follows the OS. Clicks crossfade through startViewTransition where
   supported (skipped under prefers-reduced-motion). The stored choice is
   re-applied at init — load the module in <head> (or before your
   content) so it runs before first paint and there's no flash of the
   wrong theme; pages that want zero flash independent of module timing
   can set the attribute from an inline snippet instead
   (see docs/javascript.md).

   import "barefoot/js/theme.js"           → auto-init on load
   import { initTheme, setTheme } from "…" → manual init / programmatic
*/

import { onDomReady, bindOnce } from "./lifecycle.js";

const STORAGE_KEY = "barefoot-theme";

/* Theme names follow the variant-naming rule: lowercase words,
   kebab-case. Everything else is warned about and ignored — a stored
   value never reaches the document unchecked. */
const VALID_THEME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && VALID_THEME.test(stored) ? stored : null;
  } catch {
    return null;
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* persistence is best-effort; the attribute still applies */
  }
}

export function setTheme(theme) {
  if (!VALID_THEME.test(theme)) {
    console.warn(`[barefoot-css] theme: ignored invalid theme "${theme}"`);
    return;
  }
  const apply = () => {
    document.documentElement.dataset.bfTheme = theme;
  };
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (!reduceMotion && typeof document.startViewTransition === "function") {
    document.startViewTransition(apply);
  } else {
    apply();
  }
  storeTheme(theme);
}

export function initTheme(root = document) {
  const stored = readStoredTheme();
  if (stored && root === document) {
    document.documentElement.dataset.bfTheme = stored;
  }
  for (const btn of root.querySelectorAll("[data-bf-theme-btn]")) {
    if (!bindOnce(btn, "theme")) continue;
    btn.addEventListener("click", () => setTheme(btn.dataset.bfThemeBtn));
  }
}

onDomReady(() => initTheme());
