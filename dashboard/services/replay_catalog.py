"""Scenario replay catalog for dashboard (read-only presentation)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from services.telemetry_event_factory import REPLAY_BUILDERS

REPO_ROOT = Path(__file__).resolve().parents[2]
REPLAYS_DIR = REPO_ROOT / "demo" / "replays"

SCENARIO_OPTIONS: list[dict[str, str]] = [
    {"id": "golden-path", "label": "Golden Path"},
    {"id": "poisoned-invoice", "label": "Poisoned Invoice"},
    {"id": "parameter-swap", "label": "Parameter Swap"},
    {"id": "memory-poisoning", "label": "Memory Poisoning"},
    {"id": "revocation-race", "label": "Revocation Race"},
    {"id": "telemetry-spoofing", "label": "Telemetry Spoofing"},
]

DEFAULT_SCENARIO_ID = "golden-path"


def scenario_labels() -> list[str]:
    return [item["label"] for item in SCENARIO_OPTIONS]


def scenario_id_from_label(label: str) -> str:
    for item in SCENARIO_OPTIONS:
        if item["label"] == label:
            return item["id"]
    return DEFAULT_SCENARIO_ID


def label_from_scenario_id(scenario_id: str) -> str:
    for item in SCENARIO_OPTIONS:
        if item["id"] == scenario_id:
            return item["label"]
    return "Golden Path"


def _replay_path(scenario_id: str) -> Path:
    return REPLAYS_DIR / f"{scenario_id}.json"


def materialize_replay_file(scenario_id: str) -> None:
    builder = REPLAY_BUILDERS.get(scenario_id)
    if not builder:
        return
    REPLAYS_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "scenario_id": scenario_id,
        "title": label_from_scenario_id(scenario_id),
        "events": builder(),
    }
    _replay_path(scenario_id).write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def load_replay_events(scenario_id: str) -> list[dict[str, Any]]:
    path = _replay_path(scenario_id)
    if path.exists():
        data = json.loads(path.read_text(encoding="utf-8"))
        events = data.get("events", [])
        if isinstance(events, list) and events:
            return events

    builder = REPLAY_BUILDERS.get(scenario_id)
    if builder:
        return builder()

    return []


def export_trace_json(events: list[dict[str, Any]], scenario_id: str) -> str:
    return json.dumps(
        {
            "scenario_id": scenario_id,
            "presentation_only": True,
            "read_only": True,
            "events": events,
        },
        indent=2,
    )
