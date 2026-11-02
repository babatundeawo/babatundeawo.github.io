// Assembles the publishable site into dist/ and stamps the service worker.
// Runs inside GitHub Actions; no packages are needed.
//
//   node scripts/build.mjs
//
// Optional environment variable SITE_URL: the public address of the site
// (the deploy workflow supplies it from GitHub Pages, so a custom domain is
// picked up automatically). Default: https://babatundeawo.github.io
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve, relative } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const DIST = join(ROOT, "dist");
const DEFAULT_ORIGIN = "https://babatundeawo.github.io";

const rawSite = (process.env.SITE_URL || DEFAULT_ORIGIN).trim().replace(/\/+$/, "");
let site;
try {
  site = new URL(rawSite);
} catch {
  fail(`SITE_URL is not a valid address: "${rawSite}"`);
}
if (site.protocol !== "https:") fail(`SITE_URL must start with https:// (got "${rawSite}")`);
const SITE_URL = site.origin + (site.pathname === "/" ? "" : site.pathname.replace(/\/+$/, ""));
const BASE_PATH = site.pathname === "/" ? "" : site.pathname.replace(/\/+$/, "");

const FILES = ["index.html", "projects.html", "404.html", "offline.html", "favicon.ico", "manifest.webmanifest", "robots.txt", "sitemap.xml", "sw.js"];
const DIRS = ["css", "js", "assets"];
const ROOT_ABSOLUTE_PAGES = ["404.html", "offline.html"]; // these load from any folder depth, so their links start with "/"

function fail(message) {
  console.error(`Build failed: ${message}`);
  process.exit(1);
}

// 1. Fresh dist/ with only what the site needs.
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
for (const file of FILES) {
  if (!existsSync(join(ROOT, file))) fail(`required file is missing: ${file}`);
  cpSync(join(ROOT, file), join(DIST, file));
}
for (const dir of DIRS) {
  if (!existsSync(join(ROOT, dir))) fail(`required folder is missing: ${dir}/`);
  cpSync(join(ROOT, dir), join(DIST, dir), { recursive: true });
}

// 2. Point the web addresses inside the site at SITE_URL (only needed when it differs).
const read = (name) => readFileSync(join(DIST, name), "utf8");
const write = (name, text) => writeFileSync(join(DIST, name), text);
const swapOrigin = (text) => text.split(DEFAULT_ORIGIN).join(SITE_URL);

if (SITE_URL !== DEFAULT_ORIGIN) {
  for (const page of readdirSync(DIST).filter((f) => f.endsWith(".html"))) {
    let html = read(page);
    html = html
      .replace(/(<link rel="canonical" href=")[^"]*(")/g, (m) => swapOrigin(m))
      .replace(/(<meta (?:property="og:(?:url|image)"|name="twitter:image") content=")[^"]*(")/g, (m) => swapOrigin(m))
      .replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (_, a, body, c) => a + swapOrigin(body) + c);
    write(page, html);
  }
  write("sitemap.xml", swapOrigin(read("sitemap.xml")));
  write("robots.txt", swapOrigin(read("robots.txt")));
}

// 3. A site served from a sub-folder needs the "/"-style links of the 404 and offline pages moved under it.
if (BASE_PATH) {
  for (const page of ROOT_ABSOLUTE_PAGES) {
    write(page, read(page).replace(/(href|src)="\/(?!\/)/g, `$1="${BASE_PATH}/`));
  }
}

// 4. Stamp the service worker: list of saved files plus a build id that changes with any content change.
const precache = [
  "index.html",
  "projects.html",
  "offline.html",
  "css/style.css",
  "js/main.js",
  "js/pwa.js",
  "manifest.webmanifest",
  ...readdirSync(join(DIST, "assets/fonts")).filter((f) => f.endsWith(".woff2")).sort().map((f) => `assets/fonts/${f}`),
  "assets/icons/favicon.svg",
  "assets/icons/icon-192.png",
];
const hash = createHash("sha256");
for (const file of precache) {
  if (!existsSync(join(DIST, file))) fail(`a file listed for offline use does not exist: ${file}`);
  hash.update(file).update("\0").update(readFileSync(join(DIST, file))).update("\0");
}
const buildId = hash.digest("hex").slice(0, 10);

let sw = read("sw.js");
const idLine = /^const BUILD_ID = .*; \/\/ @build-id$/m;
const listBlock = /^const PRECACHE_URLS = \[[\s\S]*?\]; \/\/ @precache$/m;
if (!idLine.test(sw) || !listBlock.test(sw)) fail("sw.js is missing its @build-id or @precache marker");
sw = sw
  .replace(idLine, `const BUILD_ID = "${buildId}"; // @build-id`)
  .replace(listBlock, `const PRECACHE_URLS = [\n${precache.map((f) => `  "${f}",`).join("\n")}\n]; // @precache`);
write("sw.js", sw);

// 5. Summary.
let files = 0;
let bytes = 0;
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else { files += 1; bytes += statSync(path).size; }
  }
})(DIST);
console.log(`Built ${files} files (${(bytes / 1024).toFixed(0)} KB) into ${relative(ROOT, DIST)}/`);
console.log(`Site address: ${SITE_URL}`);
console.log(`Offline build id: ${buildId} (${precache.length} files saved for offline use)`);
