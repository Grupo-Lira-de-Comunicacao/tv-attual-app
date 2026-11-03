"""Source priority policy for future dual-ingest TV Attual gateway.

Not wired into production. The current gateway still serves the existing
Larix RTMPS -> ErsatzTV flow until WHIP is validated and deployed.
The caller must provide VERIFIED publisher/media health, not HLS availability.
"""

from collections.abc import Mapping

LIVE_PRIORITY = ("larix", "vdo")
FALLBACK = "recorded"
PUBLIC_HLS_PATHS = {
    "larix": "/hls/tvattual-live/index.m3u8",
    "vdo": "/hls/tvattual-vdo/index.m3u8",
}


def choose_source(health: Mapping[str, bool]) -> str:
    """Return the highest-priority verified source, or recorded fallback.

    Unknown and malformed values fail closed. This function is stateless;
    use SourceArbiter to suppress changes on brief signal fluctuations.
    """
    if not isinstance(health, Mapping):
        return FALLBACK
    for source in LIVE_PRIORITY:
        if health.get(source) is True:
            return source
    return FALLBACK


def public_playlist_path(source: str) -> str | None:
    """Only return known public HLS paths; never return ingest URLs."""
    return PUBLIC_HLS_PATHS.get(source)


class SourceArbiter:
    """Choose a stable source using consecutive verified health observations.

    Promote a higher-priority live publisher after `promote_after` healthy
    observations. Retain the current live source through up to
    `drop_after - 1` unhealthy observations. If none is stable, return the
    recorded schedule. Observations must come from real media health checks,
    not the existence of an always-available HLS playlist.

    One arbiter instance is for one channel; its state is not shared across
    processes. Production integration requires separate tests and approval.
    """

    def __init__(self, promote_after: int = 2, drop_after: int = 2):
        for name, value in (("promote_after", promote_after), ("drop_after", drop_after)):
            if isinstance(value, bool) or not isinstance(value, int) or value < 1:
                raise ValueError(f"{name} must be a positive integer")
        self.promote_after = promote_after
        self.drop_after = drop_after
        self.source = FALLBACK
        self._up = {name: 0 for name in LIVE_PRIORITY}
        self._down = {name: 0 for name in LIVE_PRIORITY}

    def update(self, health: Mapping[str, bool]) -> str:
        """Return current source after updating strictly-boolean observations."""
        if not isinstance(health, Mapping):
            health = {}
        for name in LIVE_PRIORITY:
            if health.get(name) is True:
                self._up[name] += 1
                self._down[name] = 0
            else:
                self._up[name] = 0
                self._down[name] += 1

        selected = self.source
        if selected in LIVE_PRIORITY and self._down[selected] >= self.drop_after:
            selected = FALLBACK

        for candidate in LIVE_PRIORITY:
            if self._up[candidate] < self.promote_after:
                continue
            if selected == FALLBACK or LIVE_PRIORITY.index(candidate) < LIVE_PRIORITY.index(selected):
                selected = candidate
            break

        self.source = selected
        return self.source
