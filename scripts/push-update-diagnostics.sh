#!/usr/bin/env bash
set -euo pipefail
# Both reports can be tracked and modified after publishing the price snapshot.
# Commit them together so the normal concurrent-commit rebase starts clean.
for report in data/notification-status.json data/price-refresh-smoke-report.json; do
  if [ -f "$report" ]; then
    git add -- "$report"
  fi
done
if ! git diff --cached --quiet; then
  git commit -m "Registrar lectura de precios y estado de notificación"
  bash "$(dirname "${BASH_SOURCE[0]}")/push-generated-data.sh"
fi
