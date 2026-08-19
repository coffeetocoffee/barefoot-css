/* Barefoot — visual regression.
   Full-page screenshots in light and dark. Baselines live in
   tests/visual.spec.js-snapshots/.

   The demo bundles its own webfonts (demo/fonts/) so glyph metrics are
   identical on every machine — never fall back to system font stacks in
   the demo, or baselines drift per-OS. Regenerate deliberately with:
   npx playwright test --project=chromium tests/visual.spec.js --update-snapshots

   npm run test:visual */
import { test, expect } from "@playwright/test";

test.describe("visual regression", () => {
  test("bundled webfonts load (keeps baselines deterministic)", async ({ page }) => {
    await page.goto("/demo/");
    const loaded = await page.evaluate(() => ({
      inter: document.fonts.check('16px "Inter"'),
      mono: document.fonts.check('16px "JetBrains Mono"'),
    }));
    expect(loaded.inter, "Inter woff2 failed to load").toBe(true);
    expect(loaded.mono, "JetBrains Mono woff2 failed to load").toBe(true);
  });

  test("light theme", async ({ page }) => {
    await page.goto("/demo/");
    await page.getByRole("button", { name: "Light" }).click();
    await page.waitForTimeout(350); // let entrance transitions settle
    // The theme swap runs inside startViewTransition(); force-finish it
    // so the full-page capture can never catch a mid-fade frame. Infinite
    // animations (the skeleton shimmer) can't be finished — cancel them;
    // the base placeholder still renders, so the frame stays deterministic.
    await page.evaluate(() => {
      for (const a of document.getAnimations()) {
        try {
          a.finish();
        } catch {
          a.cancel();
        }
      }
    });
    // Rarely, Chromium's full-page capture reports a ±1px height on the
    // first frame; toPass retries so a transient frame self-heals. A real
    // layout regression still fails after the retries.
    await expect(async () => {
      await expect(page).toHaveScreenshot("light.png", {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      });
    }).toPass({ timeout: 15000 });
  });

  test("dark theme", async ({ page }) => {
    await page.goto("/demo/");
    await page.getByRole("button", { name: "Dark" }).click();
    await page.waitForTimeout(350);
    await page.evaluate(() => {
      for (const a of document.getAnimations()) {
        try {
          a.finish();
        } catch {
          a.cancel();
        }
      }
    });
    await expect(async () => {
      await expect(page).toHaveScreenshot("dark.png", {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      });
    }).toPass({ timeout: 15000 });
  });
});
