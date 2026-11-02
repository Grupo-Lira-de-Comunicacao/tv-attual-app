#!/usr/bin/env bash
# TV Attual Streaming: additive staging in the Host Agent writable state directory.
# Run ONLY inside a valid, approved ATLAS N4_ROOT objective. Does not deploy services.
set -Eeuo pipefail
umask 027
export GIT_TERMINAL_PROMPT=0

ROOT="/var/lib/atlas-host-agent"
DEST="$ROOT/tvattual-live"
REPOSITORY="https://github.com/Grupo-Lira-de-Comunicacao/tv-attual-app.git"
BRANCH="feature/tvattual-streaming-mvp-20261101"
EXPECTED_SHA="${1:-}"

if ! [[ "$EXPECTED_SHA" =~ ^[0-9a-fA-F]{40}$ ]]; then
  printf '%s\n' 'ERRO: informe o SHA de commit exato aprovado (40 caracteres hexadecimais).' >&2
  exit 2
fi
if [[ ! -d "$ROOT" || -L "$ROOT" || ! -w "$ROOT" ]]; then
  printf '%s\n' 'ERRO: diretorio de estado do Host Agent ausente, protegido ou nao gravavel.' >&2
  exit 3
fi
if [[ -e "$DEST" || -L "$DEST" ]]; then
  printf '%s\n' 'ERRO: destino ja existe. Nenhum arquivo sera substituido ou removido.' >&2
  exit 4
fi
if ! command -v git >/dev/null 2>&1; then
  printf '%s\n' 'ERRO: git nao esta disponivel no ambiente autorizado.' >&2
  exit 5
fi
# git clone creates only the new destination. On error, leave any partial
# directory for explicit review; do not auto-remove it.
git clone --quiet --depth 1 --single-branch --branch "$BRANCH" "$REPOSITORY" "$DEST"
ACTUAL_SHA="$(git -C "$DEST" rev-parse HEAD)"
if [[ "${ACTUAL_SHA,,}" != "${EXPECTED_SHA,,}" ]]; then
  printf 'ERRO: SHA recebido nao confere. Esperado %s, atual %s. Staging NAO homologado.\n' "$EXPECTED_SHA" "$ACTUAL_SHA" >&2
  exit 6
fi
chmod 0750 "$DEST"
printf 'STAGING_VALIDADO: %s\nSHA: %s\n' "$DEST" "$ACTUAL_SHA"
printf '%s\n' 'Nao foram alterados containers, redes, portas, servicos, DNS, certificados nem paginas.'
