/* Barefoot — the acceptance gate (v8.5, "DX Governance").
   demo/acceptance.html is the monstrous dashboard the roadmap promised:
   500 rows × 15 columns, a wizard mid-flow, German and Arabic text
   expansion, keyboard-only navigation — every surface composed at scale.
   Whatever needs a hack becomes v7.6 scope; these tests are the gates
   that prove no hack is present: the page renders its real size, honors
   every Verify contract at rest, is axe-clean, and ships its own
   interactions (selection, wizard state, i18n swap) without framework JS.

   npm run test:acceptance */
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEMOS, gotoAcceptance } from "./helpers.js";
import { runPack, runRule } from "../verify/pack.mjs";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROWS = 500;
const COLS = 16; // select column + 15 data columns

async function waitForGrid(page) {
  await expect(async () => {
    expect(await page.locator(DEMOS.acceptanceBody).locator("tr").count()).toBe(ROWS);
  }).toPass({ timeout: 8000 });
  await expect(page.locator(DEMOS.acceptanceGridStatus)).toContainText("grid ready");
}

test.describe("the acceptance gate: the grid", () => {
  test("renders the full 500×15 table and its fixed chrome", async ({ page }) => {
    await gotoAcceptance(page);
    await waitForGrid(page);
    await expect(page.locator(DEMOS.acceptanceTable)).toBeVisible();
    // Every row: the select checkbox column + 15 data cells + a header
    // cell for the leading column.
    const cells = await page
      .locator(DEMOS.acceptanceBody)
      .locator("tr")
      .evaluateAll((trs) => Math.round(trs.reduce((n, tr) => n + tr.cells.length, 0) / trs.length));
    expect(cells).toBe(COLS);
    await expect(page.locator(DEMOS.acceptanceTableWrap)).toHaveAttribute("tabindex", "0");
    await expect(page.locator(DEMOS.acceptanceTableWrap)).toHaveAttribute("aria-label", /500 rows/);
    // The compact density is declared on the shell.
    await expect(page.locator(".bf-grid-shell")).toHaveAttribute("data-density", "compact");
    // Print cuts to four columns on paper.
    await expect(page.locator(DEMOS.acceptanceTable)).toHaveAttribute("data-print", "cols-4");
  });

  test("the sort contract holds: one claimed column, with its button and mirror", async ({ page }) => {
    await gotoAcceptance(page);
    await waitForGrid(page);
    const sorted = page.locator("th[aria-sort]");
    await expect(sorted).toHaveCount(1);
    await expect(sorted).toHaveAttribute("data-sort", "asc");
    await expect(sorted.locator("button")).toHaveText("Service");
  });

  test("select-all + the bulk bar: reveal is pure CSS, state is mine", async ({ page }) => {
    await gotoAcceptance(page);
    await waitForGrid(page);
    // Zero-JS reveal: the bar is hidden until :has() sees a selection.
    await expect(page.locator(".bf-bulk-bar")).toBeHidden();
    await page.locator(DEMOS.acceptanceSelectAll).check();
    await expect(page.locator(".bf-bulk-bar")).toBeVisible();
    await expect(page.locator(DEMOS.acceptanceCount)).toHaveText("500 selected");
    await expect(page.locator(DEMOS.acceptanceBody).locator("tr[aria-selected='true']")).toHaveCount(ROWS);
    // Deselect a row; the count and the bar follow the truth.
    await page.locator(DEMOS.acceptanceBody).locator("tr").nth(1).locator("input").uncheck();
    await expect(page.locator(DEMOS.acceptanceCount)).toHaveText("499 selected");
    // Clear all: the bar vanishes again.
    await page.locator(DEMOS.acceptanceSelectAll).uncheck();
    await expect(page.locator(".bf-bulk-bar")).toBeHidden();
  });
});

test.describe("the acceptance gate: the wizard", () => {
  test("sits on step two, and Back/Next own [hidden] without losing panels", async ({ page }) => {
    await gotoAcceptance(page);
    await waitForGrid(page);
    await expect(
      page.locator(`${DEMOS.acceptanceStepper} [aria-current='step']`)
    ).toHaveText("Profile");
    await expect(page.locator(DEMOS.acceptanceStepProfile)).toBeVisible();
    await expect(page.locator(DEMOS.acceptanceStepAccount)).toBeHidden();
    await expect(page.locator(DEMOS.acceptanceStepReview)).toBeHidden();

    // Next → Review, then Back → Profile: the panels are [hidden], never
    // removed, so input and focus survive the round trip.
    await page.locator(DEMOS.acceptanceWizardForm).getByRole("button", { name: "Next" }).click();
    await expect(
      page.locator(`${DEMOS.acceptanceStepper} [aria-current='step']`)
    ).toHaveText("Review");
    await expect(page.locator(DEMOS.acceptanceStepReview)).toBeVisible();
    await expect(page.locator(DEMOS.acceptanceStepProfile)).toBeHidden();

    await page.locator(DEMOS.acceptanceBack).click();
    await expect(
      page.locator(`${DEMOS.acceptanceStepper} [aria-current='step']`)
    ).toHaveText("Profile");
    await expect(page.locator(DEMOS.acceptanceStepProfile)).toBeVisible();
  });
});

test.describe("the acceptance gate: i18n", () => {
  test("the elastic row survives EN → DE → AR without a media query", async ({ page }) => {
    await gotoAcceptance(page);
    await waitForGrid(page);
    const row = page.locator(DEMOS.acceptanceElasticRow);
    await expect(row.locator("button").first()).toHaveText("Save");
    await expect(row).toHaveAttribute("lang", "en");

    await page.locator(DEMOS.acceptanceLangDe).click();
    await expect(row).toHaveAttribute("lang", "de");
    await expect(row.locator("button").first()).toHaveText("Änderungen speichern");

    await page.locator(DEMOS.acceptanceLangAr).click();
    await expect(row).toHaveAttribute("dir", "rtl");
    await expect(row).toHaveAttribute("lang", "ar");
    await expect(page.locator(DEMOS.acceptanceElasticBtn)).toHaveText("المتابعة إلى الخطوة التالية");
  });

  test("the RTL section mirrors through logical properties", async ({ page }) => {
    await gotoAcceptance(page);
    await waitForGrid(page);
    const rtl = page.locator('section[dir="rtl"]');
    await expect(rtl).toHaveAttribute("lang", "ar");
    // The elastic Arabic button does not overflow its clip cell's sibling
    // meaningfully — the elastic clamp keeps it inside the box.
    const overflow = await page.locator(DEMOS.acceptanceElasticBtn).evaluate(
      (el) => el.scrollWidth - el.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

test.describe("the acceptance gate: contracts, axes, and reach", () => {
  test("Verify stays clean at rest with every module armed", async ({ page }) => {
    await gotoAcceptance(page);
    await waitForGrid(page);
    // Wait for the page's own verify pass to have run (it writes the line).
    await expect(page.locator(DEMOS.acceptanceGridStatus)).toContainText("Verify: clean", { timeout: 6000 });
    const violations = await runPack(page);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });

  test("axe stays clean on the full 500-row surface", async ({ page }) => {
    await gotoAcceptance(page);
    await waitForGrid(page);
    const AxeBuilder = (await import("@axe-core/playwright")).default;
    // color-contrast is axe's slowest rule on a 15k-node page (minutes on
    // a cold CI machine), and it is not this page's claim: contrast is
    // the framework's own token gate (AA 4.5:1, enforced by npm run
    // size) and the paint-paper demo's job. What the acceptance gate
    // proves is that 7500 cells and a wizard hold every STRUCTURAL rule —
    // landmarks, tables, names, roles, focus, heading order — at scale.
    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast"])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("the keyboard surfaces are armed and reachable", async ({ page }) => {
    await gotoAcceptance(page);
    await waitForGrid(page);
    // The popover menu is pointer-only without its module; armed, it is
    // the honest keyboard surface the roving-focus rule demands.
    expect(await runRule(page, "roving-focus")).toEqual([]);
    // The tablist holds one tab stop once the tabs module has roved.
    await expect(async () => {
      const stops = await page
        .locator('[role="tablist"] [role="tab"]')
        .evaluateAll((tabs) => tabs.filter((t) => t.tabIndex === 0).length);
      expect(stops).toBe(1);
    }).toPass({ timeout: 4000 });
    // The skip link is the first focusable thing in <body> (contract).
    expect(await runRule(page, "skip-link-first")).toEqual([]);
    // The filter reports bf:filterclear when Escape clears it.
    await page.locator(DEMOS.acceptanceFilter).fill("gateway");
    const gotEvent = page.evaluate(
      () =>
        new Promise((resolve) => {
          const t = document.addEventListener("bf:filterclear", () => {
            clearTimeout(timer);
            resolve(true);
          });
          const timer = setTimeout(() => resolve(false), 3000);
        })
    );
    await page.locator(DEMOS.acceptanceFilter).press("Escape");
    expect(await gotEvent).toBe(true);
  });

  test.describe("the acceptance gate: house rules", () => {
  test("the page loads the barrel and the checker, and no dev-only overlay", () => {
    const src = fs.readFileSync(
      path.join(rootDir, "demo/acceptance.html"),
      "utf8"
    );
    // The keyboard surfaces must be armed (the barrel) and the page must
    // carry its own contract check (verify.js) — that is the whole point.
    expect(src).toContain('import "/dist/js/barefoot.js"');
    expect(src).toContain('from "/dist/js/verify.js"');
    // The debug audit layer is a dev tool: it must never paint on a page
    // that is axe-scanned and Verify-clean (its outlines are not part of
    // the conformance surface).
    expect(src).not.toContain("debug.css");
  });

  test("the page ships beside the conformance demo, not inside it", () => {
    // New demo furniture gets its own page so the conformance demo's
    // visual baselines stay untouched. The conformance demo must not
    // link to or embed the acceptance page.
    const conformance = fs.readFileSync(
      path.join(rootDir, "demo/index.html"),
      "utf8"
    );
    expect(conformance).not.toContain("acceptance.html");
  });
});
});