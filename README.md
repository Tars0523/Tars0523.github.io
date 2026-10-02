# Jiwoo Kim Blog

Personal research blog built with Jekyll and the Chirpy theme.

The site is published at <https://tars0523.github.io> and currently focuses on robotics perception, robust estimation, and optimization notes.

## Stack

- Jekyll + `jekyll-theme-chirpy`
- GitHub Pages via GitHub Actions
- Editorial homepage and research pages styled in `assets/css/research.css`
- Existing Chirpy article, archive, category, and tag functionality retained

## Project Layout

- `_data/research.yml`: research cards, summaries, cover images, and detail links
- `research/`: individual research-interest pages
- `_layouts/research-home.html`: shared homepage and research-page navigation
- `_layouts/research-detail.html`: research detail layout
- `_posts`: blog posts (card metadata in front matter)
- `_tabs`: top-level navigation pages
- `index.html`: custom landing page
- `_config.yml`: site metadata and Jekyll configuration
- `assets/css/jekyll-theme-chirpy.scss`: theme overrides
- `tools/run.sh`: local dev server
- `tools/test.sh`: production build + HTML validation

## Runtime Requirements

- Ruby `>= 3.1`, `< 4.0`
- Bundler

GitHub Actions currently builds the site with Ruby `3.3`, and the helper scripts now fail fast if the local Ruby version is too old.

## Local Development

Install dependencies:

```bash
bundle install
```

Run the dev server:

```bash
bash tools/run.sh
```

Build and validate the production site:

```bash
bash tools/test.sh
```

If you prefer a reproducible setup, use the included devcontainer instead of managing Ruby locally.

## Deployment

Deployment is handled by `.github/workflows/pages-deploy.yml` on pushes to `main`.

## Editing the homepage

The homepage introduces Jiwoo Kim, followed by Research and Paper & Theory
Reviews. Four publication cards link to bilingual research pages. GNC appears as
one review card linking to `reviews/graduated-non-convexity.html`, which lists the
three existing posts in `series_order`. The original post URLs remain unchanged.
Research-interest pages remain reachable from About, but are not listed on the
homepage. Post metadata and the GNC chapter descriptions are in `_posts/`.

The six cover images are original conceptual diagrams generated from synthetic
data; they do not represent experimental results. Regenerate them with
`python3 tools/generate-covers.py` (requires NumPy and Matplotlib). No CV PDF or
personal contact details were copied into the public site.

## Research publications

Edit `_data/publications.yml` for publication cards. Bilingual summaries and paper
figures are in `research/poli.html`, `research/doppler-correspondence.html`,
`research/semantic-gsl.html`, and `research/geometry-reasoning-slam.html`.
The shared layout is `_layouts/publication.html`. Figure provenance is documented
in `assets/img/papers/SOURCES.md`; each figure also has a visible paper citation.

Publication card venue labels and optional award badges are configured in
`_data/publications.yml`. Doppler uses the official RSS Outstanding Student Paper
Award Finalist designation. Semantic-GSL distinguishes its RA-L 2026 journal
record from the public workshop version used for figures and summary.
