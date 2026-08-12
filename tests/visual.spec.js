/* Barefoot — visual regression.
   Full-page screenshots in light and dark. Baselines live in
   tests/visual.spec.js-snapshots/.

   NOTE: screenshots are font- and OS-sensitive. Generate baselines on
   the same OS as CI (Linux). Regenerate deliberately with:
   npx playwright test --update-snapshots

   npm run test:visual */
import { test, expect } from "@playwright/test";

test.describe("visual regression", () => {
  test("light theme", async ({ page }) => {
    await page.goto("/demo/");
    await page.getByRole("button", { name: "Light" }).click();
    await page.waitForTimeout(350); // let entrance transitions settle
    await expect(page).toHaveScreenshot("light.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("dark theme", async ({ page }) => {
    await page.goto("/demo/");
    await page.getByRole("button", { name: "Dark" }).click();
    await page.waitForTimeout(350);
    await expect(page).toHaveScreenshot("dark.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});
