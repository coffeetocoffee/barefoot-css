# Release checklist

`release.yml` fires on a `v*` tag push: it builds, runs the size budget
and tests, then `npm publish`es using the `NPM_TOKEN` repo secret (a
granular npm token with the "bypass 2FA" scope — missing/invalid tokens
die at the `npm whoami` preflight).

1. Bump `version` in `package.json`.
2. Add the `CHANGELOG.md` entry (Keep a Changelog format); regenerate
   the README size table (`npm run docs:size`); roll `plan.md` (Snapshot
   + the touched milestone sections) and `plan.md` (mark the candidates
   shipped).
3. `npm run check` + the full matrix green — `npm test` (Chromium), then
   `npm run test:ff` and `npm run test:webkit` (run suites one at a time;
   they collide on the `localhost:4173` preview port).
4. Commit in repo style: `feat: v1.7.0 — short description`.
5. Push `main`, create the `v*` tag, push it — the workflow runs, tests,
   and publishes to npm. GitHub Release auto-creates from the tag.
