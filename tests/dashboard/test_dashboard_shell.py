"""Ensure dashboard modules import under M0."""

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


def test_telemetry_reader_reads_repo_file():
    from services.telemetry_reader import read_telemetry_tail

    events = read_telemetry_tail()
    assert isinstance(events, list)
    if events:
        assert "kind" in events[0]


def test_backend_client_placeholder():
    from services.backend_client import get_anchor_status

    status = get_anchor_status()
    assert status["status"] == "m0-placeholder"
    assert status["writable"] is False
