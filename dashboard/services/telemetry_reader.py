"""Read telemetry JSONL for dashboard (telemetry.v1 + legacy M0 lines)."""

from __future__ import annotations

import json
from pathlib import Path


def _telemetry_paths() -> list[Path]:
    root = Path(__file__).resolve().parents[2]
    return [
        root / "data" / "telemetry" / "telemetry_stream.jsonl",
        Path(__file__).resolve().parents[1] / "fixtures" / "sample_telemetry.jsonl",
    ]


def read_telemetry_tail(limit: int = 50) -> list[dict]:
    for path in _telemetry_paths():
        if not path.exists():
            continue
        events: list[dict] = []
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError:
                continue
        if events:
            return events[-limit:]
    return []


def latest_control_plane_snapshot(limit: int = 50) -> dict:
    from services.control_plane_state import build_control_plane_snapshot

    return build_control_plane_snapshot(read_telemetry_tail(limit=limit))
