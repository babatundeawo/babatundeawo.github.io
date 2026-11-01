// Build check: fails only when something the site itself links to is missing.
// Usage (run by the deploy workflow): node scripts/check-site.mjs dist
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

const root = resolve(process.argv[2] || "dist");
const pages = readdirSync(root).filter((f) => f.endsWith(".html"));
const problems = [];

const idsOf = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const cache = new Map();
const read = (file) => {
  if (!cache.has(file)) cache.set(file, readFileSync(file, "utf8"));
  return cache.get(file);
};

for (const page of pages) {
  const file = join(root, page);
  const html = read(file);
  for (const match of html.matchAll(/\s(?:href|src|srcset)="([^"]+)"/g)) {
    // srcset holds "url width" pairs separated by commas
    const values = match[0].includes("srcset=")
      ? match[1].split(",").map((s) => s.trim().split(/\s+/)[0])
      : [match[1]];
    for (const value of values) {
      if (/^(https?:|mailto:|tel:|data:|#$)/.test(value)) continue;
      const [path, hash] = value.split("#");
      const target = path ? (path.startsWith("/") ? join(root, path) : join(dirname(file), path)) : file;
      if (!existsSync(target) || (statSync(target).isDirectory() && !existsSync(join(target, "index.html")))) {
        problems.push(`${page}: missing file for "${value}"`);
        continue;
      }
      if (hash && target.endsWith(".html") && !idsOf(read(target)).has(hash)) {
        problems.push(`${page}: no element with id "${hash}" in ${path || page}`);
      }
    }
  }
  for (const required of ["<title>", 'name="description"', 'rel="icon"']) {
    if (!html.includes(required)) problems.push(`${page}: missing ${required}`);
  }
}

// Installable-app checks: manifest, icons, screenshots, offline page and service worker.
try {
  const manifest = JSON.parse(readFileSync(join(root, "manifest.webmanifest"), "utf8"));
  for (const key of ["name", "short_name", "start_url", "scope", "display", "icons"]) {
    if (!manifest[key]) problems.push(`manifest.webmanifest: missing "${key}"`);
  }
  const sizes = new Set((manifest.icons || []).map((i) => i.sizes));
  for (const need of ["192x192", "512x512"]) if (!sizes.has(need)) problems.push(`manifest.webmanifest: no ${need} icon`);
  if (!(manifest.icons || []).some((i) => (i.purpose || "").includes("maskable"))) problems.push("manifest.webmanifest: no maskable icon");
  for (const item of [...(manifest.icons || []), ...(manifest.screenshots || []), ...(manifest.shortcuts || []).flatMap((s) => s.icons || [])]) {
    if (!existsSync(join(root, item.src))) problems.push(`manifest.webmanifest: missing file "${item.src}"`);
  }
} catch (error) {
  problems.push("manifest.webmanifest: cannot be read (" + error.message + ")");
}
for (const needed of ["offline.html", "sw.js", "404.html", "sitemap.xml"]) {
  if (!existsSync(join(root, needed))) problems.push(`missing ${needed}`);
}
if (existsSync(join(root, "sw.js")) && /__(VERSION|PRECACHE)__/.test(readFileSync(join(root, "sw.js"), "utf8").replace(/^\/\*[\s\S]*?\*\//, ""))) {
  problems.push("sw.js: the build did not fill in the version or file list");
}

if (problems.length) {
  console.error("Site check found problems:\n - " + problems.join("\n - "));
  process.exit(1);
}
console.log(`Site check passed (${pages.length} pages).`);
