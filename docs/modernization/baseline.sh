#!/usr/bin/env bash
# Usage: docs/modernization/baseline.sh  (run from the repo root, after `pnpm install`)
# Writes one log per step to .audit/baseline/ and a summary table to .audit/baseline/SUMMARY.tsv
set -uo pipefail

out=".audit/baseline"
mkdir -p "$out"
summary="$out/SUMMARY.tsv"
printf 'step\texit\tseconds\tlog\n' > "$summary"

step() {
  local name="$1"
  shift
  local start=$SECONDS
  "$@" > "$out/$name.log" 2>&1
  local code=$?
  printf '%s\t%s\t%s\t%s\n' "$name" "$code" "$((SECONDS - start))" "$out/$name.log" >> "$summary"
}

step prisma-generate bash -c 'cd apps/api && pnpm prisma generate && pnpm --filter=@codeimage/prisma-models build'
step libs-build pnpm libs:build
step typecheck pnpm typecheck
step lint pnpm lint
step format-check pnpm format:check
step test pnpm -r --if-present --no-bail test
step app-build pnpm --filter=@codeimage/app build
step outdated pnpm outdated -r --format json
step knip pnpm dlx knip --no-progress --reporter compact
step audit pnpm audit
step patches bash -c 'wc -l patches/*'
step bundle-sizes bash -c 'find apps/codeimage/dist -type f \( -name "*.js" -o -name "*.css" \) -exec du -k {} + | sort -rn | head -40; echo; du -sk apps/codeimage/dist'

cat "$summary"
