"""Tool executor panel — read-only verification state from telemetry."""

import streamlit as st

from services.telemetry_reader import latest_control_plane_snapshot


def render_tool_executor_panel() -> None:
    st.subheader("Tool executor")
    snapshot = latest_control_plane_snapshot()
    tool_executor = snapshot.get("tool_executor")

    st.warning("Execution disabled — control plane is read-only.")

    if not tool_executor:
        st.caption("No tool executor verification events in telemetry tail.")
        return

    result = tool_executor.get("verification_result", "unknown")
    if result == "allowed":
        st.success("Last verification: allowed (no downstream tool call)")
    else:
        st.error(f"Last verification: {result}")
        reason = tool_executor.get("reason_code")
        if reason:
            st.write(f"Reason: `{reason}`")

    if tool_executor.get("downstream_tool_called"):
        st.error("Unexpected downstream tool call flag in telemetry.")
