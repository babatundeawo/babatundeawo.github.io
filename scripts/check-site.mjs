// Build check: fails only when the site would ship broken.
// Usage (run by the workflows): node scripts/check-site.mjs dist
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, extname } from "node:path";
import { createHash } from "node:crypto";

const root = resolve(process.argv[2] || "dist");
// When the site is published below a folder (https://example.org/portfolio), links start with that folder.
const basePath = process.env.SITE_URL ? new URL(process.env.SITE_URL).pathname.replace(/\/+$/, "") : "";
const underRoot = (path) => (basePath && path.startsWith(basePath + "/") ? path.slice(basePath.length) : path);
const problems = [];
const problem = (text) => problems.push(text);

const cache = new Map();
const read = (file) => {
  if (!cache.has(file)) cache.set(file, readFileSync(file, "utf8"));
  return cache.get(file);
};
const idsOf = (html) => [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const pages = readdirSync(root).filter((f) => f.endsWith(".html"));

/* ---------- Pages: links, anchors, head, accessibility basics, security ---------- */
for (const page of pages) {
  const file = join(root, page);
  const html = read(file);

  for (const match of html.matchAll(/\s(?:href|src|srcset)="([^"]+)"/g)) {
    const values = match[0].includes("srcset=") ? match[1].split(",").map((s) => s.trim().split(/\s+/)[0]) : [match[1]];
    for (const value of values) {
      if (/^(https?:|mailto:|tel:|data:|#$)/.test(value)) continue;
      const [path, hash] = value.split("#");
      const target = path ? (path.startsWith("/") ? join(root, underRoot(path)) : join(dirname(file), path)) : file;
      if (!existsSync(target) || (statSync(target).isDirectory() && !existsSync(join(target, "index.html")))) {
        problem(`${page}: missing file for "${value}"`);
        continue;
      }
      if (hash && target.endsWith(".html") && !idsOf(read(target)).includes(hash)) {
        problem(`${page}: no element with id "${hash}" in ${path || page}`);
      }
    }
  }

  for (const required of ["<title>", 'name="description"', 'rel="icon"', 'name="viewport"', 'rel="manifest"', 'lang="en"']) {
    if (!html.includes(required)) problem(`${page}: missing ${required}`);
  }
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) problem(`${page}: expected exactly one <h1>, found ${h1}`);

  const ids = idsOf(html);
  const seen = new Set();
  for (const id of ids) { if (seen.has(id)) problem(`${page}: duplicate id "${id}"`); seen.add(id); }
  for (const m of html.matchAll(/\saria-(?:controls|labelledby|describedby)="([^"]+)"/g)) {
    for (const ref of m[1].split(/\s+/)) if (!seen.has(ref)) problem(`${page}: aria reference to missing id "${ref}"`);
  }
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="/.test(m[0])) problem(`${page}: image without alt text`);
    if (!/\swidth="/.test(m[0]) || !/\sheight="/.test(m[0])) problem(`${page}: image without width and height (causes layout shift)`);
  }
  for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    if (!/rel="[^"]*noopener/.test(m[0])) problem(`${page}: external link opens a tab without rel="noopener"`);
  }

  // Content Security Policy: the single inline script must match its hash; nothing else inline.
  const csp = (html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/) || [])[1];
  if (!csp) problem(`${page}: missing Content-Security-Policy`);
  const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  for (const body of inline) {
    const digest = "sha256-" + createHash("sha256").update(body).digest("base64");
    if (csp && !csp.includes(digest)) problem(`${page}: inline script hash is not in the Content-Security-Policy (expected ${digest})`);
  }
  if (/\sstyle="/.test(html)) problem(`${page}: inline style attribute (blocked by the Content-Security-Policy)`);
  if (/\son[a-z]+="/.test(html)) problem(`${page}: inline event handler (blocked by the Content-Security-Policy)`);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch { problem(`${page}: structured data is not valid JSON`); }
  }
}

/* ---------- Stylesheet and scripts ---------- */
for (const css of readdirSync(join(root, "css")).filter((f) => f.endsWith(".css"))) {
  const text = read(join(root, "css", css));
  for (const m of text.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    if (/^(data:|#)/.test(m[1])) continue;
    if (!existsSync(resolve(root, "css", m[1]))) problem(`css/${css}: missing file for url(${m[1]})`);
  }
}
for (const js of readdirSync(join(root, "js")).filter((f) => f.endsWith(".js"))) {
  const text = read(join(root, "js", js));
  if (/\bconsole\.(log|debug)\b|\bdebugger\b/.test(text)) problem(`js/${js}: leftover debug statement`);
}

/* ---------- Image size helper (PNG and WebP) ---------- */
function imageSize(file) {
  const b = readFileSync(file);
  if (b.slice(1, 4).toString() === "PNG") return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b.slice(0, 4).toString() === "RIFF" && b.slice(8, 12).toString() === "WEBP") {
    const kind = b.slice(12, 16).toString();
    if (kind === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (kind === "VP8L") { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1]; }
    if (kind === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  }
  return null;
}

/* ---------- Web app manifest ---------- */
let manifest = null;
try { manifest = JSON.parse(read(join(root, "manifest.webmanifest"))); } catch { problem("manifest.webmanifest is not valid JSON"); }
if (manifest) {
  for (const key of ["id", "name", "short_name", "description", "lang", "start_url", "scope", "display", "background_color", "theme_color", "icons"]) {
    if (!manifest[key]) problem(`manifest: missing "${key}"`);
  }
  const fromManifest = (p) => resolve(root, p.split("#")[0]);
  const needs = [["192x192", "any"], ["512x512", "any"], ["512x512", "maskable"]];
  for (const [size, purpose] of needs) {
    if (!(manifest.icons || []).some((i) => i.sizes === size && (i.purpose || "any") === purpose)) problem(`manifest: missing ${size} ${purpose} icon`);
  }
  const listed = [...(manifest.icons || []), ...(manifest.screenshots || []), ...(manifest.shortcuts || []).flatMap((s) => s.icons || [])];
  for (const item of listed) {
    const file = fromManifest(item.src);
    if (!existsSync(file)) { problem(`manifest: missing file ${item.src}`); continue; }
    const size = imageSize(file);
    if (size && item.sizes && item.sizes !== `${size[0]}x${size[1]}`) problem(`manifest: ${item.src} is ${size[0]}x${size[1]} but declared ${item.sizes}`);
  }
  for (const s of manifest.shortcuts || []) {
    const [path, hash] = s.url.split("#");
    const target = fromManifest(path);
    if (!existsSync(target)) problem(`manifest: shortcut "${s.name}" points at a missing page (${s.url})`);
    else if (hash && !idsOf(read(target)).includes(hash)) problem(`manifest: shortcut "${s.name}" points at a missing section (#${hash})`);
  }
  const forms = new Set((manifest.screenshots || []).map((s) => s.form_factor));
  if (!forms.has("wide") || !forms.has("narrow")) problem('manifest: add at least one "wide" and one "narrow" screenshot for the install dialog');
  if (!existsSync(fromManifest(manifest.start_url))) problem("manifest: start_url does not exist");
}

/* ---------- Service worker ---------- */
const swFile = join(root, "sw.js");
if (!existsSync(swFile)) problem("sw.js is missing");
else {
  const sw = read(swFile);
  const id = (sw.match(/^const BUILD_ID = "([^"]*)"; \/\/ @build-id$/m) || [])[1];
  if (!id || id === "dev") problem("sw.js: build id was not stamped (run scripts/build.mjs)");
  const list = (sw.match(/^const PRECACHE_URLS = \[([\s\S]*?)\]; \/\/ @precache$/m) || [])[1];
  if (!list) problem("sw.js: precache list not found");
  else {
    for (const m of list.matchAll(/"([^"]+)"/g)) if (!existsSync(join(root, m[1]))) problem(`sw.js: saved file does not exist: ${m[1]}`);
    for (const must of ["index.html", "projects.html", "offline.html"]) if (!list.includes(`"${must}"`)) problem(`sw.js: ${must} is not saved for offline use`);
  }
  if (/\bskipWaiting\(\)/.test(sw) && !/SKIP_WAITING/.test(sw)) problem("sw.js: skipWaiting must only run when the page asks for it");
}

/* ---------- Search engines ---------- */
const robots = read(join(root, "robots.txt"));
if (!/^Sitemap:\s*https:\/\//m.test(robots)) problem("robots.txt: missing Sitemap line");
for (const m of read(join(root, "sitemap.xml")).matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const path = underRoot(new URL(m[1]).pathname);
  const file = join(root, path.endsWith("/") ? path + "index.html" : path);
  if (!existsSync(file)) problem(`sitemap.xml: ${m[1]} does not match a file`);
}

if (problems.length) {
  console.error("Site check found problems:\n - " + problems.join("\n - "));
  process.exit(1);
}
console.log(`Site check passed (${pages.length} pages, manifest, service worker, security rules).`);
