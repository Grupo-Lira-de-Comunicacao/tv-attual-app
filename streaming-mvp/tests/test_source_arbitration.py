"""Isolated source arbitration tests. No production or internet access."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "services"))
from source_priority import SourceArbiter, choose_source, public_playlist_path


class TestSourceArbitration(unittest.TestCase):
    def test_existing_public_contract(self):
        self.assertEqual(choose_source({"larix": True, "vdo": True}), "larix")
        self.assertEqual(choose_source({"larix": False, "vdo": True}), "vdo")
        self.assertEqual(choose_source({"larix": False, "vdo": False}), "recorded")
        self.assertEqual(choose_source({"larix": "true", "vdo": 1}), "recorded")
        self.assertEqual(choose_source(None), "recorded")
        self.assertIsNone(public_playlist_path("recorded"))

    def test_waits_for_stable_vdo_and_larix_preempts(self):
        s = SourceArbiter()
        self.assertEqual(s.update({"larix": False, "vdo": True}), "recorded")
        self.assertEqual(s.update({"larix": False, "vdo": True}), "vdo")
        self.assertEqual(s.update({"larix": True, "vdo": True}), "vdo")
        self.assertEqual(s.update({"larix": True, "vdo": True}), "larix")

    def test_brief_loss_retains_live_then_falls_back_to_vdo(self):
        s = SourceArbiter()
        s.update({"larix": True, "vdo": True})
        self.assertEqual(s.update({"larix": True, "vdo": True}), "larix")
        self.assertEqual(s.update({"larix": False, "vdo": True}), "larix")
        self.assertEqual(s.update({"larix": False, "vdo": True}), "vdo")

    def test_all_sources_down_returns_recorded_after_two_misses(self):
        s = SourceArbiter()
        s.update({"vdo": True})
        self.assertEqual(s.update({"vdo": True}), "vdo")
        self.assertEqual(s.update({"vdo": False}), "vdo")
        self.assertEqual(s.update({"vdo": False}), "recorded")

    def test_flapping_does_not_promote(self):
        s = SourceArbiter()
        for value in (True, False, True, False, True):
            self.assertEqual(s.update({"larix": value}), "recorded")

    def test_invalid_values_fail_closed(self):
        s = SourceArbiter()
        self.assertEqual(s.update({"larix": "true", "vdo": 1}), "recorded")
        self.assertEqual(s.update(None), "recorded")
        with self.assertRaises(ValueError):
            SourceArbiter(promote_after=0)
        with self.assertRaises(ValueError):
            SourceArbiter(drop_after=True)


if __name__ == "__main__":
    unittest.main()
