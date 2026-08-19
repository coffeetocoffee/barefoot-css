/* Barefoot — accessibility conformance tests.
   Runs axe-core against the conformance page in its resting state and
   in key interactive states (dialog open, dropdown open, dark theme),
   then proves the visible focus ring and the details/summary keyboard
   contract directly.

   npm run test:a11y */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("accessibility conformance (axe-core)", () => {
  test("resting page has no violations", async ({ page }) => {
    await page.goto("/demo/");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("dark theme has no violations", async ({ page }) => {
    await page.goto("/demo/");
    await page.getByRole("button", { name: "Dark" }).click();
    // The theme switches through a view transition (view-transition.css);
    // wait for it to settle so axe audits the final colors, not a mid-fade.
    await page.waitForTimeout(400);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("dialog open has no violations", async ({ page }) => {
    await page.goto("/demo/");
    await page.getByRole("button", { name: "Open dialog" }).click();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("dropdown open has no violations", async ({ page }) => {
    await page.goto("/demo/");
    await page.locator('details[data-menu] summary').click();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("visible focus + keyboard contract", () => {
  test("focused button always shows a focus ring", async ({ page }) => {
    await page.goto("/demo/");
    const btn = page.getByRole("button", { name: "Open dialog" });
    await btn.focus();
    const outlineWidth = await btn.evaluate((el) =>
      getComputedStyle(el).outlineWidth
    );
    expect(outlineWidth).not.toBe("0px");
  });

  test("details dropdown: Enter toggles, items focusable", async ({ page }) => {
    await page.goto("/demo/");
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
    await page.goto("/demo/");
    const pop = page.locator("#help-pop");
    await page.getByRole("button", { name: "Popover menu" }).click();
    await expect(pop).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(pop).toBeHidden();
  });

  test("dialog: Esc closes and focus returns to trigger", async ({ page }) => {
    await page.goto("/demo/");
    const trigger = page.getByRole("button", { name: "Open dialog" });
    await trigger.click();

    const dialog = page.locator("#demo-dialog");
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("skip link is clipped until keyboard focus, then revealed", async ({ page }) => {
    await page.goto("/demo/");
    const skip = page.locator(".fz-skip-link");
    // First tab stop on the page (it's first in <body>).
    await expect(skip).toHaveCSS("clip-path", "inset(50%)");
    await page.keyboard.press("Tab");
    await expect(skip).toBeFocused();
    await expect(skip).toHaveCSS("clip-path", "none");
  });
});
