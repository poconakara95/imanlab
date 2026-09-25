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
if [ -d functions ]; then cp -R functions "$OUT"/; fi
# Cache-bust CSS/JS: Cloudflare tells browsers to keep them 4 hours, so every deploy gets new URLs
CSSV="$(shasum styles.css | cut -c1-10)"; JSV="$(shasum app.js | cut -c1-10)"
sed -i '' -e "s#href=\"styles.css\"#href=\"styles.css?v=$CSSV\"#" -e "s#src=\"app.js\"#src=\"app.js?v=$JSV\"#" "$OUT/index.html"
sed -i '' -e "s#href=\"/styles.css\"#href=\"/styles.css?v=$CSSV\"#" -e "s#src=\"/app.js\"#src=\"/app.js?v=$JSV\"#" "$OUT/404.html"
grep -q "app.js?v=$JSV" "$OUT/index.html" && grep -q "styles.css?v=$CSSV" "$OUT/404.html" || { echo "cache-bust rewrite failed"; exit 1; }
wrangler pages deploy "$OUT" --project-name imanlab --branch main
rm -rf "$OUT"
