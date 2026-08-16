# babatundeawo.github.io

Personal portfolio site for **Babatunde Ayoola Awoyemi** — atmospheric physicist, STEM educator, EdTech consultant, and climate researcher. Live at **[babatundeawo.github.io](https://babatundeawo.github.io/)**.

A static, two-page site (no build step, no framework — vanilla HTML/CSS/JS) with light/dark theme support (auto-detects system preference, remembers your choice via `localStorage`).

## What's here

```
babatundeawo.github.io/
├── index.html          Home page — about, education, research, experience, credentials, contact
├── projects.html        Full portfolio: 32 live, open-source builds across three GitHub accounts
├── css/style.css        Design system for both pages
├── js/script.js          Theme toggle, nav, and page interactions
└── assets/images/        Profile photo
```

## Home page (`index.html`)

Single-page layout with the following sections:

- **About** — atmospheric physics, climate research, and STEM education intersection
- **Education** — from Ronk New Age Nursery/Primary and Federal Government College Ogbomoso through B.Sc. Physics and M.Sc. Atmospheric Physics (University of Ibadan)
- **Research** — solar irradiance modelling, atmospheric radiation, and wind-energy statistics, including the "Parametric Estimation of Direct Irradiance under All-Sky Conditions" and Weibull wind-speed distribution work
- **Experience** — TESCOM teaching post, Techbase and Knowledge Base International School consultancies, Techbridge Consulting, NTeach, IITA, and NYSC
- **Projects teaser** — links out to the full portfolio
- **Credentials** — leadership, design thinking, ICT, and community-impact certifications
- **Contact**

## Projects page (`projects.html`)

Catalogues all 32 live, open-source builds spanning:

- Personal tools and sites (`babatundeawo/*`)
- AI project guides (exam/lesson generators, career and content tools)
- Knowledge Base International Schools portal (`kbischool/*`)
- Techbase STEM Academy curriculum (`techbaseng/*`)

Every entry links directly to its GitHub repo.

## Run locally

No build tools required — just open `index.html` in a browser, or serve the folder with any static file server:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy

This repo is already configured for GitHub Pages (repo name `babatundeawo.github.io` — GitHub serves it automatically at the root domain on push to `main`). No extra configuration needed.
