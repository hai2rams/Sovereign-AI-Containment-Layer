#!/usr/bin/env python3
"""Materialize dashboard replay JSON files under demo/replays/."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DASHBOARD = ROOT / "dashboard"
if str(DASHBOARD) not in sys.path:
    sys.path.insert(0, str(DASHBOARD))

from services.replay_catalog import REPLAY_BUILDERS, materialize_replay_file  # noqa: E402


def main() -> None:
    for scenario_id in REPLAY_BUILDERS:
        materialize_replay_file(scenario_id)
        print(f"wrote demo/replays/{scenario_id}.json")


if __name__ == "__main__":
    main()
