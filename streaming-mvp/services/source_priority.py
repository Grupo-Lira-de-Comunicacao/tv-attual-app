"""Source priority policy for a future dual-ingest TV Attual gateway.

Not wired into production. The current gateway still serves the existing
Larix RTMPS -> ErsatzTV flow until WHIP is validated and deployed.
"""

from collections.abc import Mapping

# A live source must be explicitly healthy, never inferred from a string.
LIVE_PRIORITY = ("larix", "vdo")
FALLBACK = "recorded"
PUBLIC_HLS_PATHS = {
    "larix": "/hls/tvattual-live/index.m3u8",
    "vdo": "/hls/tvattual-vdo/index.m3u8",
}


def choose_source(health: Mapping[str, bool]) -> str:
    """Return the highest-priority verified source, or recorded fallback.

    Both WHIP and RTMPS may be connected simultaneously, but only the chosen
    path should be shown to viewers. Unknown/malformed values fail closed.
    """
    for source in LIVE_PRIORITY:
        if health.get(source) is True:
            return source
    return FALLBACK


def public_playlist_path(source: str) -> str | None:
    """Only return known public HLS paths; never return ingest URLs."""
    return PUBLIC_HLS_PATHS.get(source)
