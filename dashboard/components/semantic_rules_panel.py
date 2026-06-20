"""Semantic policy panel — wired from SEMANTIC_VALIDATION_COMPLETED telemetry."""

import streamlit as st

from services.telemetry_reader import latest_control_plane_snapshot


def render_semantic_rules_panel() -> None:
    st.subheader("Semantic rules")
    snapshot = latest_control_plane_snapshot()
    semantic = snapshot.get("semantic")

    if not semantic:
        st.caption("No semantic validation events in telemetry tail.")
        return

    st.write(f"Engine: `{semantic.get('engine', '—')}`")
    st.write(f"Result: `{semantic.get('final_semantic_result', '—')}`")
    reason_codes = semantic.get("reason_codes") or []
    if reason_codes:
        st.write("Reason codes:")
        for code in reason_codes:
            st.code(code)
    else:
        st.success("No semantic denial reason codes.")
