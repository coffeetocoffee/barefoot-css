import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],

  use: {
    baseURL: "http://localhost:4173",
    browserName: "chromium",
    viewport: { width: 1280, height: 900 },
    trace: "on-first-retry",
  },

  webServer: {
    command: "node build/serve.mjs",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
  },

  // chromium runs the full suite (a11y + axe-core, JS, CSS, visual).
  // firefox/webkit re-run the behavior specs (JS + CSS) as a cross-engine
  // check — pick them explicitly with --project, or npm run test:ff /
  // test:webkit.
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    {
      name: "firefox",
      use: { browserName: "firefox" },
      testMatch: /(css|js)\.spec\.js/,
    },
    {
      name: "webkit",
      use: { browserName: "webkit" },
      testMatch: /(css|js)\.spec\.js/,
    },
  ],
});
