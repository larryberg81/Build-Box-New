#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$repo_root"

dist_dir="artifacts/shipping-containers/dist"
rm -rf "$dist_dir"

echo "Building the shipping-container frontend in Vercel mode..."
env -u PORT -u BASE_PATH VERCEL=1 \
  pnpm --filter @workspace/shipping-containers run build

if [ ! -f "$dist_dir/index.html" ]; then
  echo "Vercel build did not produce $dist_dir/index.html" >&2
  exit 1
fi
echo "Vercel output verified: $dist_dir/index.html"

echo "Building the shipping-container frontend in Replit mode..."
env -u VERCEL \
  pnpm --filter @workspace/shipping-containers run build

if [ ! -f "$dist_dir/public/index.html" ]; then
  echo "Replit build did not produce $dist_dir/public/index.html" >&2
  exit 1
fi
echo "Replit output verified: $dist_dir/public/index.html"
