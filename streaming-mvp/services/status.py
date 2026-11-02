"""Read-only status gateway for TV Attual live video."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from threading import Lock
from time import monotonic
from urllib.request import Request, urlopen

URL = os.environ.get("MEDIAMTX_HLS_URL", "http://origin:8888/tvattual-live/index.m3u8")
_cached = {"at": -100.0, "live": False}
_lock = Lock()

def get_live():
    now = monotonic()
    with _lock:
        if now - _cached["at"] < 5:
            return _cached["live"]
        try:
            request = Request(URL, headers={"User-Agent": "TVAttual-Status/1"})
            with urlopen(request, timeout=2) as response:
                prefix = response.read(128)
                live = response.status == 200 and prefix.startswith(b"#EXTM3U")
        except (OSError, ValueError):
            live = False
        _cached.update(at=monotonic(), live=live)
        return live

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path not in ("/status", "/health"):
            self.send_error(404)
            return
        if self.path == "/health":
            payload = b"ok"
            content_type = "text/plain; charset=utf-8"
        else:
            payload = json.dumps({"live": get_live()}, separators=(",", ":")).encode()
            content_type = "application/json; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, fmt, *args):
        return

if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", 8090), Handler).serve_forever()
