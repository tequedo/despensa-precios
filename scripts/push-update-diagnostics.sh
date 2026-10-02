#!/usr/bin/env bash
set -euo pipefail
# Both reports can be tracked and modified after publishing the price snapshot.
# Commit them together so the normal concurrent-commit rebase starts clean.
for report in data/notification-status.json data/price-refresh-smoke-report.json data/price-access-report.json data/price-refresh-history.json data/sepa-update-attempt.json; do
  if [ -f "$report" ]; then
    git add -- "$report"
  fi
done
if ! git diff --cached --quiet; then
  # The normal price-publishing step configures this identity, but is skipped
  # after acquisition failure. Set a local bot identity only when absent.
  if ! git var GIT_AUTHOR_IDENT >/dev/null 2>&1; then
    git config --local user.name "github-actions[bot]"
    git config --local user.email "41898282+github-actions[bot]@users.noreply.github.com"
  fi
  git commit -m "Registrar lectura de precios y estado de notificación"
  bash "$(dirname "${BASH_SOURCE[0]}")/push-generated-data.sh"
fi
