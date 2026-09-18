/* Barefoot — recipe fixtures (v8.5, "DX Governance").
   docs/recipes.md is prose with code blocks; prose drifts. Every markup
   recipe is pinned here by a fixture whose marked region must equal the
   doc's block verbatim (whitespace-normalized), and each fixture must
   actually render, be axe-clean, and honor the Verify contracts — so a
   recipe that stops working fails a test, not a user.

   npm run test:recipes */
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPack } from "../verify/pack.mjs";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/* The doc's recipe block, extracted by section heading. */
function recipeBlock(heading) {
  const docs = fs.readFileSync(path.join(rootDir, "docs/recipes.md"), "utf8");
  const start = docs.indexOf(`## ${heading}`);
  expect(start, `recipes.md has no "## ${heading}" section`).toBeGreaterThanOrEqual(0);
  const end = docs.indexOf("\n## ", start + 1);
  const section = docs.slice(start, end === -1 ? undefined : end);
  const m = section.match(/```html\n([\s\S]*?)```/);
  expect(m, `"${heading}" has no html code block`).toBeTruthy();
  return m[1];
}

const norm = (s) => s.replace(/\s+/g, " ").trim();

/* The fixture's marked region — the part that must match the doc. */
function recipeRegion(file) {
  const src = fs.readFileSync(path.join(rootDir, "tests/fixtures", file), "utf8");
  const m = src.match(/<!-- recipe:start -->([\s\S]*?)<!-- recipe:end -->/);
  expect(m, `${file} has no recipe:start/end region`).toBeTruthy();
  return m[1];
}

/* Every fixture: its imports (what the recipe says to import), what to
   wait for as proof it rendered, and the doc section it pins. */
const RECIPES = [
  {
    file: "recipe-sidebar-table.html",
    heading: "Sidebar + table + filter bar",
    proof: async (page) => {
      await expect(page.locator(".bf-sidebar")).toBeVisible();
      await expect(page.locator(".bf-table-sticky table caption")).toHaveText("Recent deployments");
      // The scroll region contract the recipe's own docs sentence names.
      await expect(page.locator(".bf-table-sticky")).toHaveAttribute("tabindex", "0");
    },
  },
  {
    file: "recipe-data-view.html",
    heading: "Filter bar + table + empty state + pagination",
    proof: async (page) => {
      await expect(page.locator(".bf-grid-shell")).toBeVisible();
      await expect(page.locator("table[data-bf-sort]")).toBeVisible();
      // The bulk bar is revealed by :has() only while a row is selected —
      // zero-JS, and correctly absent at rest.
      await expect(page.locator(".bf-bulk-bar")).toBeHidden();
      // The empty state is the table's partner, hidden until a filter
      // matches nothing — present but not shown at rest.
      await expect(page.locator(".bf-empty-state")).toBeHidden();
      await expect(page.locator("[data-pagination] [aria-current='page']")).toHaveText("1");
    },
  },
  {
    file: "recipe-settings-form.html",
    heading: "Settings form + save state",
    proof: async (page) => {
      await expect(page.locator("form.bf-stack")).toBeVisible();
      await expect(page.locator("button[type='submit']")).toHaveText("Save changes");
      // The two state surfaces exist and start hidden — the app owns them.
      await expect(page.locator(".bf-state[data-state='loading']")).toBeHidden();
      await expect(page.locator(".bf-state[data-state='error']")).toBeHidden();
    },
  },
  {
    file: "recipe-empty-dashboard.html",
    heading: "Empty dashboard",
    proof: async (page) => {
      await expect(page.locator(".empty-state")).toBeVisible();
      await expect(page.locator(".empty-state h2")).toHaveText("No projects yet");
      await expect(page.locator(".empty-state a")).toHaveAttribute("href", "/projects/new");
    },
  },
];

test.describe("Recipe fixtures: the prose cannot drift", () => {
  for (const r of RECIPES) {
    test(`docs/recipes.md "${r.heading}" matches the fixture region verbatim`, () => {
      expect(norm(recipeRegion(r.file))).toBe(norm(recipeBlock(r.heading)));
    });
  }
});

test.describe("Recipe fixtures: they render, and are clean", () => {
  for (const r of RECIPES) {
    test(`"${r.heading}" renders and honors every Verify contract`, async ({ page }) => {
      await page.goto(`/tests/fixtures/${r.file}`);
      await r.proof(page);
      const violations = await runPack(page);
      expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
    });

    test(`"${r.heading}" is axe-clean`, async ({ page }) => {
      await page.goto(`/tests/fixtures/${r.file}`);
      const AxeBuilder = (await import("@axe-core/playwright")).default;
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("the primitives fixture renders and is clean", async ({ page }) => {
    await page.goto("/tests/fixtures/recipe-primitives.html");
    await expect(page.locator(".bf-key-value")).toBeVisible();
    await expect(page.locator(".bf-stat-value")).toHaveText("12");
    await expect(page.locator("ol[data-timeline]")).toBeVisible();
    await expect(page.locator("progress")).toHaveAttribute("value", "7");
    await expect(page.locator(".bf-prose")).toBeVisible();
    expect(await runPack(page), JSON.stringify(await runPack(page))).toEqual([]);
    const AxeBuilder = (await import("@axe-core/playwright")).default;
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("Recipe fixtures: governance", () => {
  test("every fixture loads the core first, then only its recipe's files", () => {
    for (const r of RECIPES) {
      const src = fs.readFileSync(path.join(rootDir, "tests/fixtures", r.file), "utf8");
      const links = [...src.matchAll(/<link[^>]*href="([^"]+)"/g)].map((m) => m[1]);
      expect(links[0], `${r.file} must load the core first`).toBe("/dist/index.css");
      // A recipe fixture never loads the kitchen sink — the recipe's
      // whole point is "import only what the recipe names".
      expect(links, `${r.file} loads full.css`).not.toContain("/dist/full.css");
    }
  });
});
