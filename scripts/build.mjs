// Builds the site into dist/ (run by the deploy workflow; never by hand).
//  1. Writes the project cards from data/projects.json into projects.html
//  2. Copies the site into dist/
//  3. Writes sitemap.xml and a service worker (sw.js) with a content-based version
// Usage: node scripts/build.mjs
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";

const SITE = "https://babatundeawo.github.io";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const arrow = '<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-arrow-up-right"/></svg><span class="sr-only">(opens in new tab)</span>';

const data = JSON.parse(readFileSync("data/projects.json", "utf8"));

/* ---- 1. Project cards ---- */
const link = (l) =>
  `<a class="link-pill${l.primary ? " link-pill--primary" : ""}" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ${arrow}</a>`;
const card = (p) => `          <li class="reveal">
            <article class="card project">
              <div class="project__top"><span class="project__icon"><svg class="icon" aria-hidden="true" focusable="false"><use href="#i-${esc(p.icon)}"/></svg></span><span class="badge badge--${esc(p.statusClass)}">${esc(p.status)}</span></div>
              <h3>${esc(p.title)}</h3>
              <p>${esc(p.summary)}</p>
              <ul class="tags" aria-label="Technologies">${p.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
              <div class="project__links">${p.links.map(link).join("")}</div>
            </article>
          </li>`;
const group = (g) => `        <section class="group" id="${esc(g.id)}" data-group="${esc(g.id)}" aria-labelledby="g-${esc(g.id)}">
          <div class="group__head">
            <h2 id="g-${esc(g.id)}">${esc(g.title)}</h2>
            <a class="group__src" href="${esc(g.source)}" target="_blank" rel="noopener noreferrer">${esc(g.source.replace("https://", ""))} ${arrow}</a>
          </div>
          <ul class="cards" data-stagger>
${g.projects.map(card).join("\n")}
          </ul>
        </section>`;
const filters = [`          <button class="filter" type="button" data-filter="all" aria-pressed="true">All projects</button>`]
  .concat(data.groups.map((g) => `          <button class="filter" type="button" data-filter="${esc(g.id)}" aria-pressed="false">${esc(g.short)}</button>`))
  .join("\n");

let page = readFileSync("projects.html", "utf8");
const swap = (src, name, body) => {
  const a = `<!-- ${name}:START -->`, b = `<!-- ${name}:END -->`;
  const i = src.indexOf(a), j = src.indexOf(b);
  if (i < 0 || j < 0) throw new Error(`projects.html is missing the ${name} markers`);
  return src.slice(0, i + a.length) + "\n" + body + "\n" + src.slice(j);
};
page = swap(page, "FILTERS", filters);
page = swap(page, "PROJECTS", data.groups.map(group).join("\n"));
writeFileSync("projects.html", page);

/* ---- 2. Copy into dist/ ---- */
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
for (const f of ["index.html", "projects.html", "404.html", "offline.html", "favicon.ico", "manifest.webmanifest", "robots.txt"]) cpSync(f, join("dist", f));
for (const d of ["css", "js", "assets"]) cpSync(d, join("dist", d), { recursive: true });
writeFileSync("dist/.nojekyll", "");

/* ---- 3. Sitemap and service worker ---- */
const today = new Date().toISOString().slice(0, 10);
writeFileSync("dist/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc><lastmod>${today}</lastmod></url>
  <url><loc>${SITE}/projects.html</loc><lastmod>${today}</lastmod></url>
</urlset>
`);

const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const files = walk("dist").map((p) => relative("dist", p).split("\\").join("/")).filter((p) => p !== "sw.js" && p !== ".nojekyll");
// The app shell is stored on install. Photos and the social image are stored the first time they are used.
const precache = ["./", ...files.filter((p) => !p.startsWith("assets/images/") && !p.endsWith(".xml") && p !== "robots.txt")];
const hash = createHash("sha256");
for (const f of files.sort()) hash.update(f).update(readFileSync(join("dist", f)));
const version = hash.digest("hex").slice(0, 12);
const sw = readFileSync("sw.template.js", "utf8").replaceAll("__VERSION__", version).replaceAll("__PRECACHE__", JSON.stringify(precache, null, 2));
writeFileSync("dist/sw.js", sw);
console.log(`Built ${files.length} files, ${data.groups.reduce((n, g) => n + g.projects.length, 0)} projects, service worker ${version}.`);
