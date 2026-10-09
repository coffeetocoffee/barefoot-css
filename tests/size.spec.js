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
  REGISTRY_FAMILY,
  REGISTRY_FAMILY_BUDGET,
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

  test("the registry family aggregate fails when the slices together do", () => {
    // The split gives each slice its own budget, which can hide family
    // growth: three files at 60% each read calmer than one at 90%. The
    // aggregate ceiling is the pre-split question kept alive.
    const js = Object.fromEntries(
      REGISTRY_FAMILY.map((file) => [
        file.replace("js/", "").replace(/\.js$/, ""),
        Math.floor(JS_BUDGETS[file] * 0.5),
      ])
    );
    const ok = checkSizeReport(mk(1000, js));
    expect(ok.ok).toBe(true);

    // Push every slice to just under its own budget: individually fine,
    // collectively over the family ceiling.
    const stuffed = Object.fromEntries(
      REGISTRY_FAMILY.map((file) => [
        file.replace("js/", "").replace(/\.js$/, ""),
        JS_BUDGETS[file] - 1,
      ])
    );
    const over = checkSizeReport(mk(1000, stuffed));
    expect(over.ok).toBe(false);
    expect(over.failures.join("\n")).toContain("verify registry family");
  });

  test("an incomplete family report is skipped, not mismeasured", () => {
    // A slice missing from sizes.json must not produce a family FAIL for
    // bytes that were never measured.
    const partial = Object.fromEntries(
      REGISTRY_FAMILY.slice(1).map((file) => [
        file.replace("js/", "").replace(/\.js$/, ""),
        10,
      ])
    );
    const { ok, failures } = checkSizeReport(mk(1000, partial));
    expect(ok).toBe(true);
    expect(failures.join("\n")).not.toContain("family");
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
    // Every registry slice carries its own deliberate budget, and the
    // densest one still sits near its ceiling — otherwise the split
    // would leave the ratchet with nothing to detect.
    for (const key of Object.keys(JS_BUDGETS).filter((k) =>
      k.startsWith("js/verify-contracts")
    )) {
      expect(JS_BUDGETS[key], `${key} must carry a deliberate budget`).toBeGreaterThan(0);
      expect(report[key], `${key} missing from dist/sizes.json`).toBeTruthy();
      const ratio = report[key].gzip / JS_BUDGETS[key];
      expect(ratio, `${key} over budget — trim or bump deliberately`).toBeLessThanOrEqual(1);
    }

    // The core slice is the one carrying the coexistence CSSOM walk, so
    // it is the slice that must remain visibly close to its ceiling.
    const key = "js/verify-contracts-core.js";
    const ratio = report[key].gzip / JS_BUDGETS[key];
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
