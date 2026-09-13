#!/usr/bin/env bash
set -euo pipefail
# Preserve concurrent commits. Rebase failures stop for review; never force push.
for attempt in 1 2 3; do
  git pull --rebase origin main
  if git push origin HEAD:main; then
    exit 0
  fi
  echo "Otro cambio pudo avanzar la rama. Reintento ${attempt}/3." >&2
done
echo "No se pudo guardar el resultado tras tres intentos." >&2
exit 1
