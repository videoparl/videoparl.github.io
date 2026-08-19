# ALPATAI project site

Source for [videoparl.github.io](https://videoparl.github.io/) — the landing page for the
DFG-funded ALPATAI project ("Analysis of Parliamentary Debates Using Multimodal Data").

Plain hand-authored HTML/CSS, no build step, no framework. GitHub Pages serves this
repo's `main` branch root directly.

## Structure

- `index.html` — landing page (bilingual DE/EN, project info, team, blog/studies list)
- `papers.html` — Working Papers tab (embeds OSF/SocArXiv preprints)
- `style.css` — shared stylesheet for all pages
- `script.js` — language toggle + lazy-loaded paper embeds
- `posts/_template.html` — starting point for a new blog post
- `assets/` — favicon etc.
- `.nojekyll` — disables GitHub Pages' default Jekyll processing

## Adding a new blog post

1. Copy `posts/_template.html` to `posts/YYYY-MM-topic-slug.html`.
2. Fill in the bilingual title, date, and body — every piece of text is duplicated as
   a `data-lang="de"` and a `data-lang="en"` element; keep both in sync.
3. Add one new `<li class="card">` entry to `#posts-list` in `index.html` with the
   post's title, date, a 1–2 sentence bilingual summary, and a "Read more →" link to
   the new file. Remove the "coming soon" placeholder card once the first post exists.
4. Commit and push to `main` — the site updates automatically via GitHub Pages.

## Adding a new working paper (papers.html)

Each paper card embeds its PDF via OSF's public "Modular File Renderer"
(`mfr.osf.io`), the same service OSF's own preprint pages use to show a PDF inline.
The embed is lazy-loaded — it only loads when a visitor clicks "Show preprint" — so
adding more papers doesn't slow the page down.

To add a paper hosted on OSF/SocArXiv (or any OSF-backed preprint server):

1. Open the paper's OSF preprint page in a browser.
2. Open devtools → Elements (or Network), and find the PDF viewer's `<iframe>` `src`.
   It follows the pattern:
   ```
   https://mfr.osf.io/render?url=https%3A%2F%2Fosf.io%2Fdownload%2F<fileId>%2F%3Fdirect%26mode%3Drender
   ```
3. Copy a new `<li class="card">` block in `papers.html` (use the existing entry as a
   template), and update:
   - `paper-title` and `paper-meta` (authors, venue, date)
   - the abstract text inside `<details class="abstract-toggle">`
   - `data-target` / `data-embed-url` / `data-embed-title` on the "Show preprint"
     button, and the matching `id` on the empty `<div class="embed-wrap">` below it
   - the "View on OSF" link (the paper's DOI, e.g. `https://doi.org/10.31235/osf.io/<id>`)
   - the "Download PDF" link (the direct OSF download URL, e.g.
     `https://osf.io/download/<fileId>/?direct`)
4. If the paper isn't hosted on OSF, drop the "Show preprint" embed button and just
   keep title/authors/abstract/DOI + a link to wherever it's hosted.

## Local preview

No build step — just open `index.html` in a browser, or serve the folder locally:

```bash
python3 -m http.server 8000
```

then visit `http://localhost:8000/`.
