"""Offline tests for the future Larix / VDO.Ninja / ErsatzTV arbitration."""
import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "services"))
from source_priority import choose_source, public_playlist_path  # noqa: E402


class TestDualPublisherPriority(unittest.TestCase):
    def test_no_publisher_returns_ersatztv(self):
        self.assertEqual(choose_source({"larix": False, "vdo": False}), "recorded")

    def test_vdo_is_default_mobile_live_source(self):
        self.assertEqual(choose_source({"larix": False, "vdo": True}), "vdo")

    def test_larix_can_take_over_for_emergency(self):
        self.assertEqual(choose_source({"larix": True, "vdo": False}), "larix")
        self.assertEqual(choose_source({"larix": True, "vdo": True}), "larix")

    def test_unknown_or_untrusted_status_fails_closed(self):
        self.assertEqual(choose_source({}), "recorded")
        self.assertEqual(choose_source({"larix": "true", "vdo": 1}), "recorded")
        self.assertEqual(choose_source({"larix": None, "vdo": False}), "recorded")

    def test_public_paths_do_not_contain_publish_tokens(self):
        self.assertEqual(public_playlist_path("larix"), "/hls/tvattual-live/index.m3u8")
        self.assertEqual(public_playlist_path("vdo"), "/hls/tvattual-vdo/index.m3u8")
        self.assertIsNone(public_playlist_path("recorded"))
        self.assertIsNone(public_playlist_path("unknown"))


if __name__ == "__main__":
    unittest.main()
