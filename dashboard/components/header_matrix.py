"""Root hash matrix header — wired from telemetry anchor events."""

import streamlit as st

from services.telemetry_reader import latest_control_plane_snapshot


def render_header_matrix() -> None:
    snapshot = latest_control_plane_snapshot()
    roots = snapshot["roots"]
    risk_mode = snapshot.get("risk_mode", "normal")

    col1, col2, col3, col4, col5 = st.columns(5)
    col1.metric("Release root", roots["release_root"])
    col2.metric("Policy hash", roots["policy_hash"])
    col3.metric("Audit state root", roots["audit_state_root"])
    col4.metric("Revocation root", roots["revocation_state_root"])
    col5.metric("Risk mode", risk_mode)
