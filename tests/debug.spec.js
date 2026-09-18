/* Barefoot — `.bf-debug` audit mode (v8.5, "DX Governance").
   The overlay is dev-only and opt-in; these tests pin what it paints and
   the governance around it: it stays out of the frozen bundles, its
   contract-attribute list stays in parity with docs/api.md in both
   directions, and the audit it paints is axe-clean.

   npm run test:debug (or the full `npm test` — this file is part of it) */
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mountFixture } from "./helpers.js";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/* The overlay's own fixtures load the core + the layer: a real page always
   imports the core first, and the outlines resolve tokens, so a tokenless
   fixture would read invalid-at-computed-value-time noise instead of the
   audit. mountFixture navigates to /demo/ first so /dist/ resolves. */
async function mountDebug(page, body) {
  await mountFixture(
    page,
    `<link rel="stylesheet" href="/dist/index.css">
     <link rel="stylesheet" href="/dist/components/debug.css">${body}`
  );
}

/* The static fixture page — a full document (lang/title so axe has nothing
   structural to report) used by the a11y pass. */
const DEBUG_FIXTURE = "/tests/fixtures/debug.html";

/* Computed outline as "width style" — color is asserted where it carries
   meaning (the flag). */
async function outline(page, selector) {
  return page.locator(selector).first().evaluate((el) => {
    const cs = getComputedStyle(el);
    return `${cs.outlineWidth} ${cs.outlineStyle}`;
  });
}

test.describe("bf-debug: layer boundaries paint by role", () => {
  test("base elements get the quiet dotted outline", async ({ page }) => {
    await mountDebug(page, `<main class="bf-debug"><p>plain</p></main>`);
    expect(await outline(page, "p")).toBe("1px dotted");
  });

  test("layout primitives and utilities get the dashed outline", async ({ page }) => {
    await mountDebug(
      page,
      `<main class="bf-debug">
         <div class="bf-flow"><p>in flow</p></div>
         <div class="bf-container"><div class="bf-stack"><p>in stack</p></div></div>
         <div class="bf-grid bf-gap-3"><p>in grid</p></div>
       </main>`
    );
    expect(await outline(page, ".bf-flow")).toBe("1px dashed");
    expect(await outline(page, ".bf-container")).toBe("1px dashed");
    expect(await outline(page, ".bf-stack")).toBe("1px dashed");
    expect(await outline(page, ".bf-grid")).toBe("1px dashed");
    // The spacing utilities are matched by prefix, so a new one is visible.
    expect(await outline(page, ".bf-gap-3")).toBe("1px dashed");
  });

  test("opt-in surfaces get the solid outline, and beat the layout role", async ({ page }) => {
    await mountDebug(
      page,
      `<main class="bf-debug">
         <div class="bf-flow"><div class="card">card inside flow</div></div>
         <button type="button" data-variant="primary">component button</button>
         <section class="bf-state" data-state="empty" role="status">a state</section>
       </main>`
    );
    expect(await outline(page, ".card")).toBe("2px solid");
    expect(await outline(page, "[data-variant]")).toBe("2px solid");
    expect(await outline(page, ".bf-state")).toBe("2px solid");
    // The container stays layout — the child carries the component contract.
    expect(await outline(page, ".bf-flow")).toBe("1px dashed");
  });

  test("the audit is scoped: a .bf-debug subtree does not paint the page around it", async ({ page }) => {
    await mountDebug(
      page,
      `<main class="bf-debug"><p>audited</p></main>
       <aside><p>not audited</p></aside>`
    );
    // No rule matches, so the style falls back to the UA initial — a width
    // of "medium" (3px) with style none. The style is the signal.
    const unscoped = await page.locator("aside p").first().evaluate(
      (el) => getComputedStyle(el).outlineStyle
    );
    expect(unscoped).toBe("none");
  });
});

test.describe("bf-debug: the orphan data-state flag", () => {
  test("an attribute with no hook is flagged red and labelled", async ({ page }) => {
    await mountDebug(
      page,
      `<main class="bf-debug">
         <section data-state="loading">orphan — nothing paints this</section>
       </main>`
    );
    const flag = page.locator("[data-state]").first();
    expect(await outline(page, "[data-state]")).toBe("2px solid");
    const color = await flag.evaluate((el) => getComputedStyle(el).outlineColor);
    // Danger red, not the primary/component color — the flag must read as a
    // problem, and it does so by hue AND by label.
    const primary = await page.locator("main").evaluate((el) => {
      const probe = document.createElement("span");
      document.body.append(probe);
      probe.style.color = "var(--bf-primary)";
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    });
    expect(color).not.toBe(primary);
    const label = await flag.evaluate((el) => getComputedStyle(el, "::after").content);
    expect(label).toContain("data-state");
    expect(label).toContain(".bf-state");
  });

  test("the two real hooks stay silent — .bf-state and a <form>", async ({ page }) => {
    await mountDebug(
      page,
      `<main class="bf-debug">
         <section class="bf-state" data-state="loading" role="status" aria-busy="true">hooked</section>
         <form data-state="invalid"><input type="text" required></form>
       </main>`
    );
    const hooked = await page.locator(".bf-state").first().evaluate(
      (el) => getComputedStyle(el, "::after").content
    );
    expect(hooked).toBe("none");
    const form = await page.locator("form").first().evaluate(
      (el) => getComputedStyle(el, "::after").content
    );
    expect(form).toBe("none");
  });
});

test.describe("bf-debug: the legend", () => {
  test("the scope element opens with the legend", async ({ page }) => {
    await mountDebug(page, `<main class="bf-debug"><p>content</p></main>`);
    const legend = await page.locator(".bf-debug").evaluate(
      (el) => getComputedStyle(el, "::before").content
    );
    expect(legend).toContain("bf-debug audit");
    expect(legend).toContain("base");
    expect(legend).toContain("layout");
    expect(legend).toContain("component");
    expect(legend).toContain("data-state");
  });
});

test.describe("bf-debug: the overlay is accessible and non-intrusive", () => {
  test("axe stays clean on an audited page — outlines and a pseudo label add no issues", async ({ page }) => {
    await page.goto(DEBUG_FIXTURE);
    const AxeBuilder = (await import("@axe-core/playwright")).default;
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("the static fixture: boundaries and the flag all paint together", async ({ page }) => {
    await page.goto(DEBUG_FIXTURE);
    expect(await outline(page, "main > p")).toBe("1px dotted");
    expect(await outline(page, ".bf-flow")).toBe("1px dashed");
    expect(await outline(page, ".card")).toBe("2px solid");
    expect(await outline(page, ".bf-state")).toBe("2px solid");
    // The orphan is the last section; the hooked one before it is silent.
    const labels = await page.locator("[data-state]").evaluateAll((els) =>
      els.map((el) => getComputedStyle(el, "::after").content)
    );
    expect(labels[0]).toBe("none");
    expect(labels[1]).toContain("data-state");
  });
});

test.describe("bf-debug: governance (ADR-0008 and the api.md parity)", () => {
  test("debug.css stays opt-in: out of full.css and index.css", () => {
    const full = fs.readFileSync(path.join(rootDir, "src/full.css"), "utf8");
    const index = fs.readFileSync(path.join(rootDir, "src/index.css"), "utf8");
    expect(full, "full.css gained debug.css").not.toContain("debug.css");
    expect(index, "index.css gained debug.css").not.toContain("debug.css");
  });

  test("no demo page loads the audit layer (conformance baselines stay untouched)", () => {
    const demoDir = path.join(rootDir, "demo");
    for (const f of fs.readdirSync(demoDir).filter((f) => f.endsWith(".html"))) {
      const src = fs.readFileSync(path.join(demoDir, f), "utf8");
      expect(src, `demo/${f} loads the dev-only debug layer`).not.toContain("debug.css");
    }
  });

  test("every contract attribute outlined is documented in api.md (both directions)", () => {
    const api = fs.readFileSync(path.join(rootDir, "docs/api.md"), "utf8");
    const table = api.slice(api.indexOf("## data-* attribute reference"));
    const documented = new Set(
      [...table.matchAll(/^\|\s*`(data-[a-z0-9-]+)`/gm)].map((m) => m[1])
    );
    const css = fs.readFileSync(
      path.join(rootDir, "src/components/debug.css"),
      "utf8"
    );
    const outlined = new Set(
      [...css.matchAll(/\[(data-[a-z0-9-]+)\]/g)].map((m) => m[1])
    );
    // The api table has intentional duplicate rows (an attribute gaining a
    // value in a later version); dedupe before comparing.
    expect(documented.size).toBeGreaterThan(0);
    const missing = [...documented].filter((a) => !outlined.has(a));
    expect(
      missing,
      "api.md documents an attribute the audit does not outline"
    ).toEqual([]);
    // The reverse direction: nothing outlined exists outside the contract.
    // data-state is outlined as a flag as well as a surface, and it is
    // documented — so it appears here only via the documented set.
    const undocumented = [...outlined].filter((a) => !documented.has(a));
    expect(undocumented, "the audit outlines an undocumented attribute").toEqual([]);
  });
});
