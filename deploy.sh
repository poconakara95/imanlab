#!/bin/sh
# Deploy ONLY the public site files to Cloudflare Pages.
# Never deploy "." : that uploads .claude/, CLAUDE.md and other private files.
# Usage: ./deploy.sh   (token is read from macOS Keychain item "imanlab-cloudflare")
#        CLOUDFLARE_API_TOKEN=<token> ./deploy.sh   also works
set -e
cd "$(dirname "$0")"
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  CLOUDFLARE_API_TOKEN="$(security find-generic-password -a imanlab -s imanlab-cloudflare -w)"
  export CLOUDFLARE_API_TOKEN
fi
OUT="$(mktemp -d)"
cp index.html 404.html styles.css app.js favicon.svg og-image.jpg manifest.webmanifest _headers robots.txt sitemap.xml "$OUT"/
cp -R .well-known "$OUT"/
cp -R fonts icons "$OUT"/
if [ -d images ]; then cp -R images "$OUT"/; fi
wrangler pages deploy "$OUT" --project-name imanlab --branch main
rm -rf "$OUT"
