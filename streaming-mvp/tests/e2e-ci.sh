#!/usr/bin/env bash
# Isolated integration test. NEVER connects to production nor uses production credentials.
set -Eeuo pipefail
umask 077
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INFRA="$ROOT/streaming-mvp/infra"
cd "$ROOT"
test ! -e "$INFRA/secrets"
test ! -e "$INFRA/ci-override.yml"
command -v ffmpeg >/dev/null
command -v docker >/dev/null
mkdir -p "$INFRA/secrets/certs"
openssl req -x509 -nodes -newkey rsa:2048 -days 1 -keyout "$INFRA/secrets/certs/privkey.pem" -out "$INFRA/secrets/certs/fullchain.pem" -subj '/CN=ingest.tvattual.com.br' -addext 'subjectAltName=DNS:ingest.tvattual.com.br,DNS:live.tvattual.com.br' >/dev/null 2>&1
export TVATTUAL_PUBLISH_PASSWORD="$(openssl rand -hex 32)"
python3 "$INFRA/prepare_config.py"
cat > "$INFRA/ci-override.yml" <<'YAML'
services:
  web:
    ports:
      - "127.0.0.1:18080:8080"
YAML
docker network create tvattual-live-proxy >/dev/null
docker compose -f "$INFRA/docker-compose.yml" -f "$INFRA/ci-override.yml" up -d --no-build
for i in $(seq 1 30); do
  if curl -fsS --max-time 2 http://127.0.0.1:18080/health >/dev/null 2>&1; then break; fi
  sleep 1
done
curl -fsS http://127.0.0.1:18080/status.json | grep -q '"live":false'
URL="rtmps://127.0.0.1:1936/tvattual-live?user=tvattual-publisher&pass=$TVATTUAL_PUBLISH_PASSWORD"
ffmpeg -nostdin -hide_banner -nostats -loglevel error -re -f lavfi -i 'testsrc2=size=320x180:rate=10' -re -f lavfi -i 'sine=frequency=440:sample_rate=44100' -t 22 -shortest -c:v libx264 -preset ultrafast -tune zerolatency -pix_fmt yuv420p -b:v 450k -g 20 -c:a aac -b:a 64k -f flv "$URL" > "$INFRA/secrets/ci-publisher.log" 2>&1 &
PID=$!
unset URL TVATTUAL_PUBLISH_PASSWORD
sleep 8
echo 'Checking video publication state'
curl -fsS http://127.0.0.1:18080/status.json | grep -q '"live":true'
echo 'Checking correct public HTTPS redirect'
curl -sS --max-time 5 -D "$INFRA/secrets/ci-headers.txt" -o /dev/null 'http://127.0.0.1:18080/hls/tvattual-live/index.m3u8'
grep -q -i '^location: https://live.tvattual.com.br/hls/tvattual-live/index.m3u8?cookieCheck=1' "$INFRA/secrets/ci-headers.txt"
echo 'Checking HLS manifest behind reverse proxy with cookie check'
curl -fsS --max-time 8 -H 'Cookie: cookieCheck=1' 'http://127.0.0.1:18080/hls/tvattual-live/index.m3u8?cookieCheck=1' -o "$INFRA/secrets/ci-playlist.m3u8"
head -n 1 "$INFRA/secrets/ci-playlist.m3u8" | grep -q '#EXTM3U'
echo 'HLS_MANIFEST_VALID'
wait "$PID"
sleep 3
curl -fsS http://127.0.0.1:18080/status.json | grep -q '"live":false'
echo 'E2E_SYNTHETIC_PASS'
