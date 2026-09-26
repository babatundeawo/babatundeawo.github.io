# What changed — privacy pass + premium design upgrade

Two things happened here, on both `babatundeawo.github.io` (the site) and
`babatundeawo` (the GitHub profile README): a privacy/staleness cleanup,
and a senior-polish visual upgrade. The site's structure and your actual
history/credentials are untouched — this is redaction + polish, not a
rewrite.

## Privacy — removed or generalized

- **Phone number** — the WhatsApp number (`wa.me/2348126909498` and the
  plain-text `+234 812 690 9498`) is gone from the site (hero icons,
  contact page, footer) and the profile README (badge + Connect table).
  Email, LinkedIn, X, Facebook, Instagram, Threads remain as contact
  channels.
- **Addresses** — dropped down to state level everywhere, keeping the
  real institution/employer names as you asked:
  - Anglican Grammar School: was "Agbirigidi, Akinyele, Ibadan" → now
    "Oyo State"
  - Knowledge Base International Schools: was "Apapa, Moniya, Ibadan" →
    now "Oyo State"
  - Your primary school: was "Akobo, Ibadan" → now "Oyo State"
  - Contact section: was "Ibadan, Nigeria" → now "Nigeria"
  - NYSC posting: dropped the specific town (Ikot-Ekpene), kept "Akwa
    Ibom State"
  - University of Ibadan, Federal Government College Ogbomoso — left as
    they are; those are the institutions' actual names, not your address.
- **Two contradictions I found and fixed**: the School Fee Payment Portal
  and the ISCGS Records Dashboard both said "kept private, not linked
  publicly" in their own description, but still had a live "Visit" link
  right next to that text (in both the site and the profile README).
  Removed those live links — repo link only now, consistent with how
  KBIS Records was already handled. Also added the same "Private" /
  real-data-warning treatment to the new Attendance Register card, since
  it collects the same kind of student/guardian data.

## Numbers that go stale — replaced with plain language

Repo counts, live-demo counts, lesson/project counts per course, prompt
counts, categories, steps, pages, rounds, word-bank size — anywhere a
specific number would need updating every time you ship something, it's
now a description instead ("a growing project portfolio", "free CSS
course", "curated AI prompts across multiple categories", etc.). This
covers the homepage stat cards, the projects page header/stat bar, every
group heading's repo count, and the equivalent numbers in the profile
README's repository tables.

The homepage "stats" section specifically: the three animated counters
(Live Projects / Publications / Free STEM Lessons) are now three
qualitative badges (Growing / Published / Free) — same visual weight,
nothing to keep updating. The counting-animation code was removed from
`js/script.js` since it's no longer needed.

## Content fixes (from your repo list)

Your list surfaced a few things the site and README had gotten out of
sync on:
- **Bible Family Feud** was listed under your personal account in the
  profile README; it's actually under `rccgkd`. Moved it there, and
  added a new "RCCG Kingdom Diplomats" section with both `bible-trivia-game`
  and `bible-family-feud` (the profile README didn't have this org
  section at all, and the site's projects page already had it correct).
- **Missing repos** — added cards/rows for `attendance` (new, private —
  I fetched the live page to write an accurate description) and
  `techbase-practical-robotics` (Stage 2 of the robotics path — fetched
  its README for an accurate, number-free description) to both the site
  and the profile README.
- **`kbis-records` → `kbis-records-v2`** — the profile README still
  pointed at the old repo name.

## Premium design upgrade (site only — READMEs don't carry CSS/JS)

Same treatment as the last upgrade: additive, nothing existing rewritten.
- **`css/style.css`** — appended a premium layer: gradient-mesh hero with
  floating orbs, edge-glow + lift on cards, a button sheen sweep with
  ripple, a cursor-following glow on desktop, magnetic tilt on cards,
  broader scroll reveal with stagger, a richer focus ring, premium
  scrollbar.
- **`js/premium.js`** — new, loaded after `js/script.js`. Handles the
  tilt, ripple, cursor glow, and the extra scroll reveal. Auto-detects
  existing markup, so no HTML restructuring was needed for it.
- Respects `prefers-reduced-motion` and disables tilt/cursor-glow on
  touch devices automatically.

## Notes

- Both zips are working trees only (no `.git`), so you can drop them
  over your existing clones and diff/commit as usual.
- I didn't touch anything about the actual live hosting of Attendance,
  School Fee Portal, or KBIS Records (they may still be reachable if
  someone has the exact URL) — I only removed them as *linked* items
  from your public-facing pages. If you want those pages themselves
  gated (e.g. with auth), that's a separate change to the tools
  themselves, not something I can do from here.
