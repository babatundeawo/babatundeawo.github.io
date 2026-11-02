# Scripts

Run automatically by the GitHub Actions workflows. Nothing here needs to be run by hand.

- `build.mjs`: copies the site into `dist/`, switches web addresses to the real public address (so a custom domain just works) and stamps the service worker with a version that changes whenever any saved file changes.
- `check-site.mjs`: fails the build when something would ship broken: a missing file or page section, a manifest or icon problem, an unsaved offline page, a Content-Security-Policy mismatch, an inline style or event handler, or leftover debug code.
