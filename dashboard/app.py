"""Sovereign AI Containment Layer — read-only control plane dashboard."""

import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

import streamlit as st

from components.demo_banner import render_demo_banner
from components.header_matrix import render_header_matrix
from components.split_panels import render_split_panels
from components.workflow_graph import render_workflow_graph
from components.workflow_narrative import render_workflow_narrative
from services.control_plane_state import build_control_plane_snapshot
from services.replay_catalog import (
    DEFAULT_SCENARIO_ID,
    export_trace_json,
    label_from_scenario_id,
    load_replay_events,
    scenario_id_from_label,
    scenario_labels,
)
from services.telemetry_reader import read_telemetry_tail
from services.workflow_state import build_workflow_state

st.set_page_config(page_title="Containment Layer", layout="wide", initial_sidebar_state="expanded")

if "selected_scenario_id" not in st.session_state:
    st.session_state.selected_scenario_id = DEFAULT_SCENARIO_ID
if "telemetry_events" not in st.session_state:
    st.session_state.telemetry_events = load_replay_events(DEFAULT_SCENARIO_ID)


def _load_scenario(scenario_id: str) -> None:
    st.session_state.selected_scenario_id = scenario_id
    st.session_state.telemetry_events = load_replay_events(scenario_id)


with st.sidebar:
    st.header("Scenario replay")
    labels = scenario_labels()
    current_label = label_from_scenario_id(st.session_state.selected_scenario_id)
    selected_label = st.selectbox("Scenario", labels, index=labels.index(current_label))
    selected_id = scenario_id_from_label(selected_label)

    col1, col2 = st.columns(2)
    if col1.button("Run Demo Replay", use_container_width=True):
        _load_scenario(selected_id)
        st.rerun()
    if col2.button("Reset View", use_container_width=True):
        _load_scenario(DEFAULT_SCENARIO_ID)
        st.rerun()

    export_payload = export_trace_json(
        st.session_state.telemetry_events,
        st.session_state.selected_scenario_id,
    )
    st.download_button(
        "Export Current Trace",
        data=export_payload,
        file_name=f"{st.session_state.selected_scenario_id}-trace.json",
        mime="application/json",
        use_container_width=True,
    )

    st.caption("Presentation only — replays telemetry JSON; no tool or payment execution.")

if selected_id != st.session_state.selected_scenario_id:
    _load_scenario(selected_id)

events = st.session_state.telemetry_events or read_telemetry_tail()
workflow_state = build_workflow_state(events)
snapshot = build_control_plane_snapshot(events)

st.title("Sovereign AI Containment Layer")
render_demo_banner()

st.caption(
    f"Graphical workflow trace — scenario: **{label_from_scenario_id(st.session_state.selected_scenario_id)}** "
    "(telemetry-driven, read-only presentation)"
)

render_workflow_graph(workflow_state)
render_workflow_narrative(workflow_state)

st.divider()
render_header_matrix(snapshot)
render_split_panels(events, snapshot)
