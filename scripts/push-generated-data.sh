#!/usr/bin/env bash
set -euo pipefail
# Preserve concurrent commits. Rebase failures stop for review; never force push.
for attempt in 1 2 3; do
  # Failed acquisition can leave a local provenance report modified. Preserve it
  # while rebasing; only the files explicitly committed by the caller are pushed.
  if ! git -c rebase.autoStash=true pull --rebase origin main; then
    # A human or another writer outside the shared Actions group can still
    # conflict. Preserve both commits and local reports, without leaving a
    # half-rebased worktree for the diagnostic steps that run after failure.
    if [ -d "$(git rev-parse --git-path rebase-merge)" ] || [ -d "$(git rev-parse --git-path rebase-apply)" ]; then
      git rebase --abort
    fi
    echo "No se publicó: la sincronización falló. Se conservaron los cambios sin forzar la rama." >&2
    exit 1
  fi
  if git push origin HEAD:main; then
    exit 0
  fi
  echo "Otro cambio pudo avanzar la rama. Reintento ${attempt}/3." >&2
done
echo "No se pudo guardar el resultado tras tres intentos." >&2
exit 1
