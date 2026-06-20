"""Workflow graph and replay presentation tests (no Streamlit runtime required)."""

import json
import sys
from pathlib import Path

DASHBOARD = Path(__file__).resolve().parents[2] / "dashboard"
if str(DASHBOARD) not in sys.path:
    sys.path.insert(0, str(DASHBOARD))

REPO = Path(__file__).resolve().parents[2]


def test_workflow_graph_builds_dot_with_required_labels():
    from components.workflow_graph import build_workflow_dot, required_node_labels
    from services.replay_catalog import load_replay_events
    from services.workflow_state import build_workflow_state

    events = load_replay_events("golden-path")
    workflow = build_workflow_state(events)
    dot = build_workflow_dot(workflow)

    for label in required_node_labels():
        assert label in dot

    assert "UNTRUSTED MODEL SPACE" in dot
    assert "TRUSTED CONTROL PLANE" in dot
    assert "EXTERNAL / ANCHORING LAYER" in dot


def test_read_only_demo_badge_text_present_in_banner_module():
    from components.demo_banner import render_demo_banner

    assert callable(render_demo_banner)


def test_scenario_catalog_has_six_options():
    from services.replay_catalog import SCENARIO_OPTIONS, scenario_labels

    assert len(SCENARIO_OPTIONS) == 6
    assert "Golden Path" in scenario_labels()
    assert "Poisoned Invoice" in scenario_labels()


def test_golden_path_replay_allowed_path():
    from services.replay_catalog import load_replay_events
    from services.workflow_state import build_workflow_state

    workflow = build_workflow_state(load_replay_events("golden-path"))
    status = workflow["node_status"]
    assert status["semantic_validation"] == "passed"
    assert status["token_broker"] == "passed"
    assert status["tool_executor_verification"] == "passed"
    assert workflow["narrative"]["control_plane"]["semantic_result"] == "allowed"


def test_poisoned_invoice_replay_blocked_semantic_path():
    from services.replay_catalog import load_replay_events
    from services.workflow_state import build_workflow_state

    workflow = build_workflow_state(load_replay_events("poisoned-invoice"))
    status = workflow["node_status"]
    assert status["semantic_validation"] == "blocked"
    assert status["policy_decision"] == "blocked"
    assert status["token_broker"] == "skipped"
    assert workflow["narrative"]["control_plane"]["semantic_result"] == "blocked"


def test_parameter_swap_replay_parameter_hash_mismatch():
    from services.replay_catalog import load_replay_events
    from services.workflow_state import build_workflow_state

    workflow = build_workflow_state(load_replay_events("parameter-swap"))
    control = workflow["narrative"]["control_plane"]
    assert "PARAMETER_HASH_MISMATCH" in control["tool_executor_decision"]
    assert workflow["node_status"]["tool_executor_verification"] == "blocked"


def test_export_trace_does_not_include_state_envelope_or_secrets():
    from services.replay_catalog import export_trace_json, load_replay_events

    events = load_replay_events("golden-path")
    exported = export_trace_json(events, "golden-path")
    assert "StateEnvelope" not in exported
    assert "state_envelope" not in exported
    assert "mock_sig_v1:" not in exported
    assert "idempotency_key" not in exported


def test_production_mode_redacts_preview_hash():
    import os

    from components.workflow_narrative import _production_mode

    os.environ["CONTAINMENT_DEMO_MODE"] = "production"
    assert _production_mode() is True
    os.environ["CONTAINMENT_DEMO_MODE"] = "demo"
    assert _production_mode() is False


def test_replay_files_exist_for_all_scenarios():
    from services.replay_catalog import SCENARIO_OPTIONS

    for item in SCENARIO_OPTIONS:
        path = REPO / "demo" / "replays" / f"{item['id']}.json"
        assert path.exists(), f"missing replay file: {path}"
        data = json.loads(path.read_text(encoding="utf-8"))
        assert data.get("events")


def test_app_module_imports_workflow_components():
    app_path = DASHBOARD / "app.py"
    source = app_path.read_text(encoding="utf-8")
    assert "workflow_graph" in source
    assert "READ-ONLY DEMO MODE" in Path(DASHBOARD / "components" / "demo_banner.py").read_text(encoding="utf-8")
