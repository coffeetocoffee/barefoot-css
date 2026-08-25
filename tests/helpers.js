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
  demoParallax: "#demo-parallax",
  demoProse: "#demo-prose",
  demoResponsiveImg: "#demo-responsive-img",
  demoScrollProgress: "#demo-scroll-progress",
  demoSegmented: "#demo-segmented",
  demoSidebar: "#demo-sidebar",
  demoSkeletonLine: "#demo-skeleton-line",
  demoSortTable: "#demo-sort-table",
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
