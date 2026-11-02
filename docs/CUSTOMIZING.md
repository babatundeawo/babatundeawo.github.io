# Customizing guide

All edits can be made with the pencil icon on GitHub (see [DEPLOYMENT.md](DEPLOYMENT.md)).

## Colours

Open `css/style.css`. The first block, **1. Design tokens**, holds every colour.

| To change | Edit this |
| --- | --- |
| Main blue (buttons, links) | `--primary` and `--primary-fill` |
| Warm orange glow | `--accent`, `--accent-ink`, `--accent-glow` |
| Page and card backgrounds | `--bg`, `--surface`, `--bg-sunken` |
| Text | `--ink` (headings), `--text` (body), `--muted` (captions) |

Light colours are in `:root { ... }`. Dark colours are in `:root[data-theme="dark"] { ... }` and again, identically, in the `@media (prefers-color-scheme: dark)` block just below it (used when JavaScript is off). Change both. Keep body text at a contrast ratio of at least 4.5:1 against its background. Also update the two `theme-color` lines in each page's `<head>`, `THEME_COLORS` in `js/main.js`, and `theme_color` and `background_color` in `manifest.webmanifest`.

## Text

- Home page: `index.html`. Each section starts with a comment such as `<!-- ===== ABOUT ===== -->`.
- Projects: `projects.html`. Each project is one `<li class="reveal">` block.
- Page titles and search descriptions: the `<title>` and `<meta name="description">` lines at the top of each page.
- Email address: search for `babatundeawoyemi91@gmail.com` (it appears in a few places on `index.html` and `projects.html`).
- The sun-path illustration: its caption and the figure are in the About section of `index.html`; the wording of its readout is in `js/main.js` (section 9).

## Images

- Portrait: replace `assets/images/babatunde.jpg`, then replace the sized copies `babatunde-320`, `-480` and `-646` in `.avif`, `.webp` and `.jpg`. If you only replace the `.jpg` files the AVIF and WebP versions will still show the old photo, so either replace all of them or remove the two `<source>` lines in the portrait block of `index.html`.
- Social preview image (the card shown when the link is shared): `assets/images/og-image.png`, 1200 by 630 pixels.

## Fonts

Fonts live in `assets/fonts/` as `.woff2` files and are declared in the **2. Fonts** block of `css/style.css`. To change typeface, upload new `.woff2` files, point the `src:` lines at them, update `--font-display` or `--font-body` in the tokens, and update the two `<link rel="preload">` lines in each page. Also update the font names in the `PRECACHE_URLS` list in `sw.js` and in `scripts/build.mjs` only if you add or remove files (the build reads every `.woff2` in the folder automatically). Only use fonts whose licence allows web use, and add the licence file next to them.

## App icons, install details and screenshots

- Icons are in `assets/icons/`: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (keep the artwork inside the central 80 per cent), `apple-touch-icon.png` (180 by 180, no transparent corners) and `favicon.svg`, plus `favicon.ico` in the main folder. Replace each with a file of the same name and size.
- The install name, short name, colours and shortcuts are in `manifest.webmanifest`. The short name is also set in the `apple-mobile-web-app-title` and `application-name` lines in each page's `<head>`.
- Screenshots shown in the install dialog are in `assets/screenshots/` and listed in `manifest.webmanifest`. If you retake them, keep the sizes written in the manifest (the build check compares them).

## Offline behaviour

`sw.js` saves the files listed in `PRECACHE_URLS`. When you add a new page that should work offline, add its path there and to the `precache` list in `scripts/build.mjs`, and to `PAGES` in `sw.js`. The build adds a new version number automatically whenever any saved file changes, which is what triggers the update notice.

## Navigation

The menu is repeated at the top of `index.html`, `projects.html`, `404.html` and `offline.html`, and the short footer menu at the bottom of each. Edit all of them if you add or rename a section.

## Icons inside pages

Icons are drawn from a hidden sprite at the top of each page body (`<symbol id="i-...">`). To reuse an existing icon, write `<svg class="icon" aria-hidden="true"><use href="#i-name"/></svg>`. The icon must be defined in the same page.

## Saved settings in the visitor's browser

The theme choice is saved as `ba-theme` and a dismissed install card as `ba-install-dismissed`. Names start with `ba-` because other project sites share this web address.
