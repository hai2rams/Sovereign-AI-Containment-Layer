"""Read telemetry JSONL — M0 placeholder."""

from pathlib import Path


def read_telemetry_tail(limit: int = 20) -> list[dict]:
    path = Path(__file__).resolve().parents[2] / "data" / "telemetry" / "telemetry_stream.jsonl"
    if not path.exists():
        return []
    events: list[dict] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            import json

            events.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return events[-limit:]
