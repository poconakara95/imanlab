#!/bin/sh
# Deploy ONLY the public site files to Cloudflare Pages.
# Never deploy "." : that uploads .claude/, CLAUDE.md and other private files.
# Usage: CLOUDFLARE_API_TOKEN=<token> ./deploy.sh
set -e
cd "$(dirname "$0")"
OUT="$(mktemp -d)"
cp index.html styles.css app.js favicon.svg _headers robots.txt sitemap.xml "$OUT"/
cp -R .well-known "$OUT"/
if [ -d images ]; then cp -R images "$OUT"/; fi
wrangler pages deploy "$OUT" --project-name imanlab --branch main
rm -rf "$OUT"
