/* Barefoot — accessibility conformance tests.
   Runs axe-core against the conformance page in its resting state and
   in key interactive states (dialog open, dropdown open, dark theme),
   then proves the visible focus ring and the details/summary keyboard
   contract directly.

   npm run test:a11y */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { DEMOS, gotoDemo, gotoGallery, tokenColor } from "./helpers.js";

test.describe("accessibility conformance (axe-core)", () => {
  test("resting page has no violations", async ({ page }) => {
    await gotoDemo(page);
    const results = await new AxeBuilder({ page }).exclude(DEMOS.stepper).analyze();
    expect(results.violations).toEqual([]);
  });

  test("dark theme has no violations", async ({ page }) => {
    await gotoDemo(page);
    await page.getByRole("button", { name: "Dark" }).click();
    await page.waitForTimeout(400);
    const results = await new AxeBuilder({ page }).exclude(DEMOS.stepper).analyze();
    expect(results.violations).toEqual([]);
  });

  test("contrast theme has no violations", async ({ page }) => {
    await gotoDemo(page);
    await page.getByRole("button", { name: "Contrast" }).click();
    await page.waitForTimeout(400);
    // data-bf-theme="contrast" forces black-on-white (and white-on-black in
    // dark) — the palette must stay axe-clean end to end.
    await expect(page.locator("html")).toHaveAttribute("data-bf-theme", "contrast");
    const results = await new AxeBuilder({ page }).exclude(DEMOS.stepper).analyze();
    expect(results.violations).toEqual([]);
  });

  test("contrast theme: every component section is individually clean", async ({ page }) => {
    await gotoDemo(page);
    await page.getByRole("button", { name: "Contrast" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-bf-theme", "contrast");
    await page.waitForTimeout(400);

    // The page-wide scan above proves the palette; this sweep proves it
    // per component — a violation can never hide inside one section's
    // markup while the rest of the page dilutes a fix. Scoped axe runs,
    // one per section, so a failure names its component directly.
    const sections = await page
      .locator("main > section[id]")
      .evaluateAll((els) => els.map((el) => el.id));
    expect(sections.length, "demo sections discovered for the sweep").toBeGreaterThan(15);

    for (const id of sections) {
      if (id === DEMOS.stepper.slice(1)) continue; // same exclusion as every scan
      const results = await new AxeBuilder({ page }).include(`#${id}`).analyze();
      expect(
        results.violations,
        `section #${id} has axe violations under contrast theme`
      ).toEqual([]);
    }
  });

  test("theme gallery has no violations (six themes rendered at once)", async ({ page }) => {
    await gotoGallery(page);
    // Every starter theme renders live on one page — each card scopes
    // its own data-bf-theme, so this single scan axe-checks all of them.
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("dialog open has no violations", async ({ page }) => {
    await gotoDemo(page);
    await page.getByRole("button", { name: "Open dialog" }).click();
    const results = await new AxeBuilder({ page }).exclude(DEMOS.stepper).analyze();
    expect(results.violations).toEqual([]);
  });

  test("dropdown open has no violations", async ({ page }) => {
    await gotoDemo(page);
    await page.locator('details[data-menu] summary').click();
    const results = await new AxeBuilder({ page }).exclude(DEMOS.stepper).analyze();
    expect(results.violations).toEqual([]);
  });

  test("toast open has no violations", async ({ page }) => {
    await gotoDemo(page);
    await page.locator(DEMOS.toastTrigger).click();
    const results = await new AxeBuilder({ page }).exclude(DEMOS.stepper).analyze();
    expect(results.violations).toEqual([]);
  });

  test("mobile hamburger nav open has no violations", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoDemo(page);
    const toggle = page.locator(`${DEMOS.demoNavBurger} .bf-nav-toggle`);
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.locator(DEMOS.demoNavMenu)).toBeVisible();
    const results = await new AxeBuilder({ page }).exclude(DEMOS.stepper).analyze();
    expect(results.violations).toEqual([]);
  });

  test("invalid form state has no violations", async ({ page }) => {
    await gotoDemo(page);
    // Touch the field with an invalid value so :user-invalid paints the
    // danger border and the whole form draws its invalid ring.
    const email = page.locator(DEMOS.demoEmail);
    await email.fill("not-an-email");
    await email.blur();
    await expect(email).toHaveCSS(
      "border-color",
      await tokenColor(page, "--bf-danger")
    );
    const results = await new AxeBuilder({ page }).exclude(DEMOS.stepper).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("visible focus + keyboard contract", () => {
  test("focused button always shows a focus ring", async ({ page }) => {
    await gotoDemo(page);
    const btn = page.getByRole("button", { name: "Open dialog" });
    await btn.focus();
    const outlineWidth = await btn.evaluate((el) =>
      getComputedStyle(el).outlineWidth
    );
    expect(outlineWidth).not.toBe("0px");
  });

  test("details dropdown: Enter toggles, items focusable", async ({ page }) => {
    await gotoDemo(page);
    const summary = page.locator('details[data-menu] summary');
    const panel = page.locator('details[data-menu] > :not(summary)');

    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(panel).toBeVisible();

    await page.keyboard.press("Tab");
    await expect(page.locator('details[data-menu] a').first()).toBeFocused();

    // NOTE: Esc-to-close on <details> is browser-dependent (Chrome closes
    // only when focus is inside the panel). For guaranteed Esc + click-away,
    // the documented answer is the Popover menu — asserted below.
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(panel).toBeHidden();
  });

  test("popover menu: opens declaratively, Esc closes", async ({ page }) => {
    await gotoDemo(page);
    const pop = page.locator(DEMOS.helpPop);
    await page.getByRole("button", { name: "Popover menu" }).click();
    await expect(pop).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(pop).toBeHidden();
  });

  test("dialog: Esc closes and focus returns to trigger", async ({ page }) => {
    await gotoDemo(page);
    const trigger = page.getByRole("button", { name: "Open dialog" });
    await trigger.click();

    const dialog = page.locator(DEMOS.demoDialog);
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("skip link is clipped until keyboard focus, then revealed", async ({ page }) => {
    await gotoDemo(page);
    const skip = page.locator(".bf-skip-link");
    // First tab stop on the page (it's first in <body>).
    await expect(skip).toHaveCSS("clip-path", "inset(50%)");
    await page.keyboard.press("Tab");
    await expect(skip).toBeFocused();
    await expect(skip).toHaveCSS("clip-path", "none");
  });

  test("nav: links are focusable in order, current page carries aria-current", async ({ page }) => {
    await gotoDemo(page);
    const links = page.locator(`${DEMOS.demoNav} a`);
    await expect(links.first()).toHaveText("Barefoot"); // brand is a link
    await links.nth(0).focus();
    await expect(links.nth(0)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(links.nth(1)).toBeFocused();
    await expect(links.nth(1)).toHaveAttribute("aria-current", "page");
  });

  test("stepper: native ol semantics with aria-current on current step", async ({ page }) => {
    await gotoDemo(page);
    const stepper = page.locator(DEMOS.demoStepperH);
    await expect(stepper.locator("ol")).toHaveCount(1);
    await expect(stepper.locator('[aria-current="step"]')).toHaveCount(1);
    await expect(stepper.locator('[aria-current="step"] [data-step-label]')).toHaveText("Profile");
    await expect(stepper.locator("[data-complete]")).toHaveCount(1);
  });

  test("input groups: leading affix is decorative (aria-hidden)", async ({ page }) => {
    await gotoDemo(page);
    const affixes = page.locator(`${DEMOS.demoInputGroupForm} [data-input-group] > :first-child`);
    for (const affix of await affixes.all()) {
      await expect(affix).toHaveAttribute("aria-hidden", "true");
    }
  });

  test("date/number/email inputs: native validation announced by browser", async ({ page }) => {
    await gotoDemo(page);
    const email = page.locator(DEMOS.polishEmail);
    await expect(email).toHaveAttribute("type", "email");
    await expect(email).toHaveAttribute("required", "");
    const number = page.locator(DEMOS.polishNumber);
    await expect(number).toHaveAttribute("type", "number");
    const date = page.locator(DEMOS.polishDate);
    await expect(date).toHaveAttribute("type", "date");
  });
});
