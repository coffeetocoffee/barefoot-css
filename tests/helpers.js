/* Barefoot — test harness: the seam between the suites and what they
   assert (ADR-0003). The only place that knows how to reach /demo/,
   which ids the demo uses, and how to resolve a token to its live
   color. Suites import from here; outside deliberate value-freeze
   pins, raw "/demo/" strings, #demo-* literals, and frozen rgb()
   values never appear in a spec file.

   Migration rule: helpers change how tests speak, not what they check —
   test/expect counts per file are a refactor contract. */

export const DEMOS = Object.freeze({
  // Keys mirror the demo's id attributes verbatim (camelCased), so a
  // selector and its constant map by inspection — no lookup table.
  amount: "#amount",
  amountOut: "#amount-out",
  bio: "#bio",
  country: "#country",
  demoAlertDanger: "#demo-alert-danger",
  demoAlertInfo: "#demo-alert-info",
  demoAlertSuccess: "#demo-alert-success",
  demoAlertWarning: "#demo-alert-warning",
  demoAppShell: "#demo-app-shell",
  demoAvatar: "#demo-avatar",
   demoAvatarGroup: "#demo-avatar-group",
  demoChroma: "#demo-chroma",
  demoCommand: "#demo-command",
  demoDataGrid: "#demo-data-grid",
  demoIcons: "#demo-icons",
  demoAvatarSm: "#demo-avatar-sm",
  demoCarousel: "#demo-carousel",
  demoChips: "#demo-chips",
  demoDialog: "#demo-dialog",
  demoDivider: "#demo-divider",
  demoEmail: "#demo-email",
  demoEmptyState: "#demo-empty-state",
  demoForm: "#demo-form",
  demoGridAuto: "#demo-grid-auto",
  demoGridGap: "#demo-grid-gap",
  demoInputGroupForm: "#demo-input-group-form",
  demoMedia16: "#demo-media-16",
  demoMediaCard: "#demo-media-card",
  demoNav: "#demo-nav",
  demoNavBurger: "#demo-nav-burger",
  demoNavMenu: "#demo-nav-menu",
  demoNavVt: "#demo-nav-vt",
  demoParallax: "#demo-parallax",
  demoProse: "#demo-prose",
  demoResponsiveImg: "#demo-responsive-img",
  demoScrollProgress: "#demo-scroll-progress",
  demoSegmented: "#demo-segmented",
  demoSidebar: "#demo-sidebar",
  demoSkeletonLine: "#demo-skeleton-line",
  demoSortTable: "#demo-sort-table",
  demoTableAdaptive: "#demo-table-adaptive",
  demoTableAdaptiveWrap: "#demo-table-adaptive-wrap",
  demoSegmentedAdaptive: "#demo-segmented-adaptive",
  demoFormAdaptive: "#demo-form-adaptive",
  demoCardAdaptive: "#demo-card-adaptive",
  demoCardAdaptiveWrap: "#demo-card-adaptive-wrap",
  demoTabsAdaptive: "#demo-tabs-adaptive",
  demoTabsAdaptiveWrap: "#demo-tabs-adaptive-wrap",
  demoNavDrawer: "#demo-nav-drawer",
  demoTableAdaptiveAutowrap: "#demo-table-adaptive-autowrap",
  demoTableAdaptiveAutowrapWrap: "#demo-table-adaptive-autowrap-wrap",
  demoSpinner: "#demo-spinner",
  demoStagger: "#demo-stagger",
  demoStepperH: "#demo-stepper-h",
  demoStepperV: "#demo-stepper-v",
  demoSticky: "#demo-sticky",
  demoStickyTable: "#demo-sticky-table",
  demoTimeline: "#demo-timeline",
  demoToast: "#demo-toast",
  demoToastError: "#demo-toast-error",
  demoToastStack: "#demo-toast-stack",
  demoToastUpload: "#demo-toast-upload",
  demoUser: "#demo-user",
  email: "#email",
  favcolor: "#favcolor",
  file: "#file",
  framework: "#framework",
  helpPop: "#help-pop",
  helpTrigger: "#help-trigger",
  media: "#media",
  polishDate: "#polish-date",
  polishEmail: "#polish-email",
  polishNumber: "#polish-number",
   prog: "#prog",
   revealSection: "#reveal",
   spacingProbe: "#spacing-probe",
  spinner: "#spinner",
  stepper: "#stepper",
   storage: "#storage",
   tipPop: "#tip-pop",
   tipTrigger: "#tip-trigger",
  toastErrorTrigger: "#toast-error-trigger",
  toastTrigger: "#toast-trigger",
  toastUploadTrigger: "#toast-upload-trigger",
   typography: "#typography",
   studioReflow: "#studio-reflow",
   studioHue: "#studio-hue",
   studioChroma: "#studio-chroma",
   studioScale: "#studio-scale",
});

/* Navigate to the demo page. Every suite starts here; nothing else
   hard-codes the URL. */
export async function gotoDemo(page) {
  await page.goto("/demo/");
}

/* Navigate to the theme gallery. Same seam as gotoDemo — the helper,
   not the specs, knows where pages live. */
export async function gotoGallery(page) {
  await page.goto("/demo/gallery.html");
}

/* Navigate to the generative Studio (v5.0 Phase 4) — the theming editor. */
export async function gotoStudio(page) {
  await page.goto("/demo/studio.html");
}

/* Relative luminance of a computed color string (e.g. "rgb(255 255 255)").
   WCAG 2.1 linearization; the monotonic-ordering proxy for the generative
   tonal scale (contrast-vs-black is too flat at the dark end to order by). */
export function luminance(color) {
  const m = (color.match(/[\d.]+/g) || [0, 0, 0]).map(Number);
  const srgb = m.slice(0, 3).map((v) => {
    v = v / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/* WCAG 2.1 contrast ratio between two computed color strings
   (e.g. "rgb(255 255 255)" / "rgba(0 0 0 / 0.5)"). Pure math — no engine
   involved — so a spec can assert a derived token's contrast floor without
   spinning up axe. Used by the generative-theming contrast gate (Phase 4). */
export function wcagContrast(fg, bg) {
  const lf = luminance(fg);
  const lb = luminance(bg);
  const lighter = Math.max(lf, lb);
  const darker = Math.min(lf, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/* Navigate to the navigation-transitions pair page (the other
   document of the cross-document view-transition pair). */
export async function gotoVtPair(page) {
  await page.goto("/demo/vt.html");
}

/* Mount standalone fixture markup. setContent alone bases URLs at
   about:blank — fixture <link>/import references under /dist/ would
   not resolve — so navigate first, then swap the document. Caveat:
   autoloaded demo modules' listeners therefore survive setContent;
   safe while every module binds per-element (no-JS-first fixtures
   pass), but a future document-level delegated module would act
   inside "no-JS" fixtures undetected. */
export async function mountFixture(page, html) {
  await gotoDemo(page);
  await page.setContent(html);
}

/* Resolve a --bf-* custom property to its used color under the theme
    currently active in the page: append a throwaway probe whose
    style.color is var(<name>), read the computed color, remove it.
    light-dark() and scheme selection are resolved by the engine, so
    comparisons read "element uses token X" truthfully in any theme.
    Valid because tokens are only ever re-declared at :root/html level —
    a component-scoped token override would resolve differently on the
    element under test and break the comparison silently. */
export async function tokenColor(page, name) {
  return page.evaluate((token) => {
    const probe = document.createElement("span");
    document.body.append(probe);
    probe.style.color = `var(${token})`;
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved;
  }, name);
}

/* Drive a component's container query by pinning the container's inline
    size. Barefoot adapts to the *container*, not the viewport — so tests
    assert behavior by resizing the container, never the window (ADR-0009 /
    v5.0 Phase 1). Pass the container element's selector; width is any CSS
    length (e.g. "14rem", "60rem"). */
export async function setContainerWidth(page, selector, width) {
  await page.locator(selector).first().evaluate((el, w) => {
    el.style.width = w;
  }, width);
}

/* Count the resolved grid tracks of an element (used to assert a container
    query flipped the column count). */
export async function gridColumnCount(page, selector) {
  return page.locator(selector).first().evaluate((el) =>
    getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length
  );
}

/* Read a --bf-* custom property's raw declared value at :root (not the
    color-resolved form tokenColor returns). Used to assert adaptive tokens
    are present and spelled correctly. */
export async function tokenValue(page, name) {
  return page.evaluate((token) => {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(token)
      .trim();
    return v;
  }, name);
}
