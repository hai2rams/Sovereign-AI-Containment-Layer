"""Two-column layout shell — M0 placeholder."""

import streamlit as st

from components.audit_panel import render_audit_panel
from components.blast_radius import render_blast_radius
from components.semantic_rules_panel import render_semantic_rules_panel
from components.timeline import render_timeline
from components.token_panel import render_token_panel
from components.tool_executor_panel import render_tool_executor_panel


def render_split_panels(telemetry_events: list[dict], snapshot: dict | None = None) -> None:
    left, right = st.columns(2)
    with left:
        render_timeline(telemetry_events, snapshot)
        render_semantic_rules_panel(snapshot)
        render_token_panel(snapshot)
    with right:
        render_tool_executor_panel(snapshot)
        render_audit_panel(snapshot)
        render_blast_radius(snapshot)
