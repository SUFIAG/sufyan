# Sufyan Abdul Ghani — portfolio

Static personal site: `public/` is the whole site.

Live at **https://sufiag.github.io/sufyan/**. Every push to `main` deploys `public/` to GitHub Pages
via `.github/workflows/static.yml`. All asset paths in `index.html` are relative, so the site works
under the `/sufyan/` subpath and on a root domain. `404.html` uses `/sufyan/` absolute paths because
GitHub Pages serves it for any missing URL depth; change them if you move to a root domain.

The fly.io setup below is an optional alternative host.

```
public/
  index.html                 page
  404.html                   not-found page
  assets/site.css            styles (light + dark theme)
  assets/site.js             interactions and motion
  assets/theme.js            applies saved theme before first paint
  og.png, favicon.svg, apple-touch-icon.png, robots.txt, sitemap.xml
  Sufyan-Abdul-Ghani-Resume.pdf
Dockerfile, nginx.conf, security-headers.conf, fly.toml
```

## Preview locally

```bash
cd public
python -m http.server 8000      # open http://localhost:8000
```

## Deploy to fly.io (first time)

1. Install flyctl: `pwsh -c "iwr https://fly.io/install.ps1 -useb | iex"` (Windows) and sign in with `fly auth login`.
2. From this folder: `fly launch --no-deploy --copy-config`. Keep the existing `fly.toml`; change `app` if the name is taken.
3. `fly deploy`
4. Open it: `fly open` (served at `https://<app>.fly.dev`).

## Custom domain

```bash
fly certs add sufyanghani.com
fly certs add www.sufyanghani.com
fly ips list                     # use these for DNS
```

At your DNS provider, add an `A` record to the IPv4 and an `AAAA` record to the IPv6 shown by `fly ips list`
(for `www`, a `CNAME` to `<app>.fly.dev`). `fly certs show sufyanghani.com` confirms when TLS is ready.

If you use a different domain, update `canonical`, `og:url`, `og:image`, `twitter:image` and the JSON-LD
`url` in `index.html`, plus `robots.txt` and `sitemap.xml`.

## Updating content

- Products: each card in `index.html` under `<section id="products">`. The hidden `.p-details` block
  holds the text shown in the details dialog (`data-k="repo"` empty hides the "View source" button).
- Filter counts in the chips are written by hand; update them when adding a product.
- Résumé: replace `public/Sufyan-Abdul-Ghani-Resume.pdf`.
- Redeploy: `fly deploy`.

## Cost

`fly.toml` uses one `shared-cpu-1x` 256 MB machine that stops when idle and starts on the next request,
so a low-traffic site costs very little. Set `min_machines_running = 1` to avoid the cold start of
roughly a second after idle periods.
