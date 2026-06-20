"""Ensure dashboard modules import and M11 wiring works."""

import sys
from pathlib import Path

DASHBOARD = Path(__file__).resolve().parents[2] / "dashboard"
if str(DASHBOARD) not in sys.path:
    sys.path.insert(0, str(DASHBOARD))


def test_header_matrix_import():
    from components.header_matrix import render_header_matrix  # noqa: F401


def test_redaction():
    from components.redaction import redact

    assert redact("secret-api-key-value") == "se***ue"


def test_telemetry_reader_reads_v1_events():
    from services.telemetry_reader import read_telemetry_tail

    events = read_telemetry_tail()
    assert isinstance(events, list)
    assert len(events) > 0
    assert events[0].get("schema_version") == "telemetry.v1"
    assert "event_type" in events[0]


def test_control_plane_snapshot_from_telemetry():
    from services.telemetry_reader import latest_control_plane_snapshot

    snapshot = latest_control_plane_snapshot()
    assert snapshot["roots"]["release_root"] != "—"
    assert snapshot["semantic"]["final_semantic_result"] == "allowed"
    assert snapshot["token"]["token_issued"] is True
    assert snapshot["tool_executor"]["verification_result"] == "allowed"
    assert snapshot["risk_mode"] == "normal"
    assert "tool_executor" in snapshot["blast_radius"]["layers_active"]


def test_backend_client_read_only_anchor_status():
    from services.backend_client import get_anchor_status

    status = get_anchor_status()
    assert status["writable"] is False
    assert status["status"] in {"anchored", "pending"}
    assert "roots" in status
