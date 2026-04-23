# Jiwoo Kim Blog

Personal research blog built with Jekyll and the Chirpy theme.

The site is published at <https://tars0523.github.io> and currently focuses on robotics perception, robust estimation, and optimization notes.

## Stack

- Jekyll + `jekyll-theme-chirpy`
- GitHub Pages via GitHub Actions
- Custom landing/about styling in `assets/css/jekyll-theme-chirpy.scss`

## Project Layout

- `_posts`: blog posts
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
