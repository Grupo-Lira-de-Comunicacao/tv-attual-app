"""Offline security and regression checks. Do not touch production."""
from pathlib import Path
import unittest
ROOT = Path(__file__).resolve().parents[1]

class TestPackage(unittest.TestCase):
    def test_secure_ingest(self):
        text = (ROOT / "infra/mediamtx.yml.template").read_text()
        for expected in ("rtmpEncryption: strict", "authMethod: internal", "overridePublisher: false", "record: false", "api: false", "webrtc: false", "source: publisher", "rtmpServerKey: /certs/privkey.pem"):
            self.assertIn(expected, text)
        self.assertIn("__PASSWORD_SHA256_BASE64__", text)
    def test_network_isolation(self):
        compose = (ROOT / "infra/docker-compose.yml").read_text()
        self.assertIn("tvattual-live-proxy", compose)
        self.assertIn("1936:1936/tcp", compose)
        self.assertNotIn("8888:8888", compose)
        self.assertNotIn("8080:8080", compose)
    def test_player(self):
        html = (ROOT / "web/index.html").read_text()
        for tag in ('lang="pt-BR"', 'id="video"', 'id="start"', 'id="signal"'):
            self.assertIn(tag, html)
        self.assertNotIn("youtube.com", html)
    def test_24h_unified_player(self):
        player = (ROOT / "web/app.js").read_text()
        for required in (
            "https://tv.tvattual.com.br/iptv/channel/1.m3u8",
            "'/hls/tvattual-live/index.m3u8'",
            "fetch('/status.json'",
            "switchTo('recorded')",
            "switchTo('live')",
            "tvattual:source",
        ):
            self.assertIn(required, player)
        home = (ROOT / "integrations/wordpress-home-html-widget.html").read_text()
        self.assertIn('class="attual-live-player"', home)
        self.assertIn('src="https://live.tvattual.com.br/?embed=1"', home)
        self.assertNotIn("hls.js@latest", home)

    def test_status_gateway(self):
        text = (ROOT / "services/status.py").read_text()
        self.assertIn("urlopen", text)
        self.assertNotIn("subprocess", text)
        self.assertIn("Cache-Control", text)

if __name__ == "__main__":
    unittest.main()
