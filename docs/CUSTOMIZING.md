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

Light colours are in `:root { ... }`. Dark colours are in `:root[data-theme="dark"] { ... }` and again, identically, in the `@media (prefers-color-scheme: dark)` block just below it (used when JavaScript is off). Change both. Keep body text at a contrast ratio of at least 4.5:1 against its background.

## Text

- Home page: `index.html`. Each section starts with a comment such as `<!-- ===== ABOUT ===== -->`.
- Projects: `data/projects.json`. Each project is one entry; the build writes the cards into `projects.html`. Group names and the filter buttons come from the same file.
- Page titles and search descriptions: the `<title>` and `<meta name="description">` lines at the top of each page.
- Email address: search for `babatundeawoyemi91@gmail.com` (it appears in a few places on `index.html` and `projects.html`).

## Images

- Portrait: replace `assets/images/babatunde.jpg`, then replace the sized copies `babatunde-320`, `-480` and `-646` in `.avif`, `.webp` and `.jpg`. If you only replace the `.jpg` files the AVIF and WebP versions will still show the old photo, so either replace all of them or remove the two `<source>` lines in the portrait block of `index.html`.
- Social preview image (the card shown when the link is shared): `assets/images/og-image.png`, 1200 by 630 pixels.
- Favicon and app icons: `assets/icons/` and `favicon.ico`. The install screenshots shown by Android are `assets/images/shot-wide.png` (1280 by 720) and `shot-narrow.png` (720 by 1280); replace them with real screenshots of the site when the design changes.

## Fonts

Fonts live in `assets/fonts/` and are declared in the **2. Fonts** block of `css/style.css`. To change typeface, upload new `.woff2` files, point the `src:` lines at them, and update `--font-display` or `--font-body` in the tokens. Only use fonts whose licence allows web use, and add their licence file next to them.

## Navigation

The menu is repeated at the top of `index.html`, `projects.html` and `404.html`, and the short footer menu at the bottom of each. Edit all three if you add or rename a section.

## Icons

Icons are drawn from a hidden sprite at the top of each page body (`<symbol id="i-...">`). To reuse an existing icon, write `<svg class="icon" aria-hidden="true"><use href="#i-name"/></svg>`. The icon must be defined in the same page.
