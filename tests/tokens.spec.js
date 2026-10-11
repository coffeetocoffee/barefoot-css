/* Barefoot — dangling token gate.
   `build/tokens.mjs` is the gate; this suite pins it from the test side
   so it cannot silently lose enforcement, and proves the DETECTOR
   detects — a check that has never failed is an assumption.

   The case that motivated it: breaking --bf-primary-fg in buttons.css
   repaints 0.14% of the conformance demo, against a 2% visual tolerance.
   Every other gate stayed green. This suite is why that class of bug
   dies here instead of in a user's dark mode.

   npm run test:tokens */
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import pkg from "../package.json" with { type: "json" };
import {
  blankComments,
  findDanglingTokens,
  checkTokens,
} from "../build/tokens.mjs";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

test.describe("token references: the script is the check", () => {
  test("build/tokens.mjs is import-safe and exports the pure pieces", () => {
    expect(typeof findDanglingTokens).toBe("function");
    expect(typeof checkTokens).toBe("function");
    expect(typeof blankComments).toBe("function");
  });

  test("npm run tokens exits zero on the real tree", () => {
    const res = spawnSync(process.execPath, ["build/tokens.mjs"], {
      cwd: rootDir,
      encoding: "utf8",
      shell: false,
    });
    expect(res.status, res.stderr).toBe(0);
    expect(res.stdout).toContain("dangling references");
    expect(res.stdout).toContain("PASS");
  });

  test("npm run check runs it, so the gate cannot be skipped", () => {
    expect(pkg.scripts.check).toContain("npm run tokens");
    expect(pkg.scripts.tokens).toBe("node build/tokens.mjs");
  });

  test("src/ is clean — no dangling --bf-* today", () => {
    const { ok, dangling } = checkTokens(readSrc());
    expect(dangling.map((d) => `${d.file}:${d.line} ${d.token}`).join("\n")).toBe("");
    expect(ok).toBe(true);
  });
});

test.describe("token references: the detector actually detects", () => {
  test("a typo'd token with no fallback is caught", () => {
    const dangling = findDanglingTokens({
      "src/components/buttons.css": `:root { --bf-primary: #0a5; }
        input[type="submit"] { color: var(--bf-primary-fg-broken); }`,
    });
    expect(dangling).toHaveLength(1);
    expect(dangling[0].token).toBe("--bf-primary-fg-broken");
    expect(dangling[0].file).toBe("src/components/buttons.css");
    expect(dangling[0].line).toBe(2);
  });

  test("the failure names the token that was probably meant", () => {
    const { suggestion } = findDanglingTokens({
      "a.css": `:root { --bf-primary-fg: #fff; } b { color: var(--bf-primary-fgg); }`,
    })[0];
    expect(suggestion).toBe("--bf-primary-fg");
  });

  test("the exact break from the review, over the real tree", () => {
    // End-to-end: the real src/** with --bf-primary-fg broken at all
    // three call sites. Reproduces the original finding — a total color
    // failure that left every other gate green.
    const sources = readSrc();
    sources["src/components/buttons.css"] = sources["src/components/buttons.css"].replace(
      /--bf-primary-fg\)/g,
      "--bf-primary-fg-broken)"
    );

    const dangling = findDanglingTokens(sources);
    expect(dangling.map((d) => `${d.file}:${d.line}`)).toEqual([
      "src/components/buttons.css:38",
      "src/components/buttons.css:56",
      "src/components/buttons.css:70",
    ]);
  });
});

test.describe("token references: no false positives", () => {
  test("a var() WITH a fallback is safe whatever the token name", () => {
    const { ok, dangling } = checkTokens({
      "a.css": `b { animation-delay: calc(var(--bf-reveal-index, 0) * 1s);
                  background-size: var(--bf-toast-progress, 100%) 100%; }`,
    });
    expect(dangling).toEqual([]);
    expect(ok).toBe(true);
  });

  test("a defined token used across files resolves", () => {
    expect(
      findDanglingTokens({
        "src/tokens.css": `:root { --bf-primary-fg: light-dark(#fff, #000); }`,
        "src/components/buttons.css": `b { color: var(--bf-primary-fg); }`,
      })
    ).toEqual([]);
  });

  test("author-owned custom properties are none of this gate's business", () => {
    expect(
      findDanglingTokens({
        "a.css": `b { color: var(--my-brand); width: var(--el, 1px); }`,
      })
    ).toEqual([]);
  });

  test("a token name inside a comment is prose, not a use site", () => {
    expect(
      findDanglingTokens({
        "a.css": `:root { --bf-primary: #0a5; }
                  /* once referenced an undefined token — var(--bf-gone) */
                  /* documented: use var(--bf-primary) for the accent */
                  b { color: var(--bf-primary); }`,
      })
    ).toEqual([]);
  });

  test("blanking comments preserves offsets so line numbers stay true", () => {
    const css = `/* one\ntwo\nthree */\nb { color: red; }`;
    const blanked = blankComments(css);
    expect(blanked).toHaveLength(css.length);
    expect(blanked.split("\n")).toHaveLength(css.split("\n").length);
    expect(blanked).toContain("b { color: red; }");
  });

  test("a JS-set property consumed WITHOUT a fallback is caught", () => {
    // The case the allowlist would have waved through. Neither in-tree
    // JS-set property looks like this today, but a future one might.
    const dangling = findDanglingTokens({
      "a.css": `b { animation-delay: var(--bf-reveal-index); }`,
    });
    expect(dangling).toHaveLength(1);
    expect(dangling[0].suggestion).toBeNull();
  });
});

function readSrc() {
  const out = {};
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".css")) {
        out[path.relative(rootDir, full).replace(/\\/g, "/")] = fs.readFileSync(full, "utf8");
      }
    }
  };
  walk(path.join(rootDir, "src"));
  return out;
}