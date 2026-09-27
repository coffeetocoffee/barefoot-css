/* Barefoot — docs drift tests (v8.6.1).
   The repo rule is "docs generate from source where drift hurts"; the
   size table and token tables regenerate in `npm run check`. This suite
   pins the one high-visibility spot a generator can't reach: the CDN
   version in the copy-paste snippets. A new user's first `<link>` is the
   last place a stale major should live, and nothing else caught @6 in a
   repo shipping @8 — so the pin is a test, per house style.

   Migration guides intentionally pin the major they migrate *from*
   (`@3` / `@4` / `@5` in docs/migration-*.md) — those are contextual,
   not drift, and stay out of scope here. */
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
const major = Number(pkg.version.split(".")[0]);

/* The pages whose CDN version must track package.json. Add a file here
   only if its snippet means "install this release" rather than "install
   that release to migrate from it". */
const LIVE_DOCS = ["README.md", "docs/verify.md"];

// jsDelivr major pins, e.g. barefoot-css@8 — the form every quick-start uses.
const CDN_VERSION = /cdn\.jsdelivr\.net\/npm\/barefoot-css@(\d+)\//g;

test.describe("docs version: the CDN snippets track the release", () => {
  test("package.json exposes a parseable semver major", () => {
    expect(Number.isInteger(major), `package.json version is "${pkg.version}"`).toBe(true);
    expect(major).toBeGreaterThan(0);
  });

  for (const rel of LIVE_DOCS) {
    test(`${rel} pins the CDN to the current major (@${major})`, () => {
      const text = fs.readFileSync(path.join(rootDir, rel), "utf8");
      const found = [...text.matchAll(CDN_VERSION)].map((m) => Number(m[1]));
      // An unpinned or bare URL is not a violation — only a stale major is.
      expect(found.length, `${rel} has no jsDelivr major pin to check`).toBeGreaterThan(0);
      for (const v of found) {
        expect(
          v,
          `${rel} pins barefoot-css@${v} but package.json is ${pkg.version} — bump the snippet`
        ).toBe(major);
      }
    });
  }

  test("the only other @major pins are the migration guides", () => {
    // Drift has a direction: a *new* doc quoting an old major silently
    // downgrades whatever the reader copies. Every live pin must be in
    // LIVE_DOCS or a migration doc — anything else is a new surface that
    // forgot which release it documents.
    const docsDir = path.join(rootDir, "docs");
    for (const f of fs.readdirSync(docsDir).filter((f) => f.endsWith(".md"))) {
      const text = fs.readFileSync(path.join(docsDir, f), "utf8");
      const majors = [...text.matchAll(CDN_VERSION)].map((m) => Number(m[1]));
      if (majors.length === 0) continue;
      const isMigration = f.startsWith("migration-");
      expect(
        isMigration || majors.every((v) => v === major),
        `${f} pins barefoot-css@${[...new Set(majors)].join("/")} outside a migration guide`
      ).toBe(true);
    }
  });
});
