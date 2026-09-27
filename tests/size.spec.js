/* Barefoot — byte budget tests (v8.6.1).
   `build/size.mjs` is the gate; this suite pins it from the test side so
   it cannot silently lose enforcement, and proves the RATCHET detector
   works — a ceiling that has never warned is an assumption. The registry
   budget has grown 4KB → 5KB → 6.6KB → 8KB → 10KB across releases; the
   near-ceiling notice is what makes the next bump a deliberate decision
   instead of a surprise.

   npm run test:size */
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  GZIP_BUDGET,
  DEFAULT_JS_BUDGET,
  HEADROOM_WARN_THRESHOLD,
  JS_BUDGETS,
  checkSizeReport,
} from "../build/size.mjs";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

test.describe("size budget: the script is the check", () => {
  test("build/size.mjs is import-safe and exports the pure pieces", () => {
    expect(typeof checkSizeReport).toBe("function");
    expect(GZIP_BUDGET).toBe(10 * 1024);
    expect(DEFAULT_JS_BUDGET).toBe(2048);
  });

  test("npm run size exits zero and names the budget", () => {
    const res = spawnSync(process.execPath, ["build/size.mjs"], {
      cwd: rootDir,
      encoding: "utf8",
      shell: false,
    });
    expect(res.status, res.stderr).toBe(0);
    expect(res.stdout).toContain("js budget");
    expect(res.stdout).toContain("index.css");
    expect(res.stdout).toContain("PASS");
  });
});

test.describe("size budget: the detector actually detects", () => {
  const mk = (indexGzip, js = {}) => {
    const report = { "index.css": { raw: indexGzip * 2, gzip: indexGzip } };
    for (const [id, gzip] of Object.entries(js)) {
      report[`js/${id}.js`] = { raw: gzip * 2, gzip };
    }
    return report;
  };

  test("an over-budget module fails with its percentage", () => {
    const { ok, failures } = checkSizeReport(
      mk(1000, { "verify-contracts": JS_BUDGETS["js/verify-contracts.js"] + 1 })
    );
    expect(ok).toBe(false);
    expect(failures.join("\n")).toContain("js/verify-contracts.js");
    expect(failures.join("\n")).toContain("budget");
  });

  test("a near-ceiling module warns but still passes", () => {
    const limit = JS_BUDGETS["js/verify-contracts.js"];
    const gzip = Math.ceil(limit * HEADROOM_WARN_THRESHOLD);
    const { ok, warnings } = checkSizeReport(mk(1000, { "verify-contracts": gzip }));
    expect(ok).toBe(true);
    expect(warnings.join("\n")).toContain("near budget ceiling");
  });

  test("a comfortable module neither fails nor warns", () => {
    const { ok, failures, warnings } = checkSizeReport(
      mk(1000, { toast: Math.floor(DEFAULT_JS_BUDGET * 0.5) })
    );
    expect(ok).toBe(true);
    expect(failures).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  test("index.css over budget is a failure, not a warning", () => {
    const { ok, failures } = checkSizeReport(mk(GZIP_BUDGET + 1));
    expect(ok).toBe(false);
    expect(failures.join("\n")).toContain("index.css");
  });
});

test.describe("size budget: the ratchet ceiling is live", () => {
  test("the shipped registry is budgeted and near its ceiling", () => {
    let report;
    try {
      report = JSON.parse(
        fs.readFileSync(path.join(rootDir, "dist", "sizes.json"), "utf8")
      );
    } catch {
      throw new Error("dist/sizes.json not found — run `npm run build` first");
    }
    const key = "js/verify-contracts.js";
    expect(JS_BUDGETS[key], `${key} must carry a deliberate budget`).toBeGreaterThan(0);

    const measured = report[key].gzip;
    const limit = JS_BUDGETS[key];
    const ratio = measured / limit;
    expect(ratio, `${key} over budget — trim or bump deliberately`).toBeLessThanOrEqual(1);
    expect(
      ratio,
      `${key} is no longer near its ceiling — lower the budget to lock in the win`
    ).toBeGreaterThanOrEqual(HEADROOM_WARN_THRESHOLD);
  });

  test("the near-ceiling notice reaches the size script output", () => {
    const res = spawnSync(process.execPath, ["build/size.mjs"], {
      cwd: rootDir,
      encoding: "utf8",
      shell: false,
    });
    expect(res.status, res.stderr).toBe(0);
    expect(res.stdout).toContain("near budget ceiling");
  });

  test("the ceiling threshold is a sane fraction, not zero or one", () => {
    expect(HEADROOM_WARN_THRESHOLD).toBeGreaterThan(0);
    expect(HEADROOM_WARN_THRESHOLD).toBeLessThan(1);
  });
});
