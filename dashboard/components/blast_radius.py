"""Blast radius visualization — containment layer status from telemetry."""

import streamlit as st

from services.telemetry_reader import latest_control_plane_snapshot


def render_blast_radius(snapshot: dict | None = None) -> None:
    st.subheader("Blast radius")
    if snapshot is None:
        snapshot = latest_control_plane_snapshot()
    blast = snapshot.get("blast_radius", {})
    status = blast.get("containment_status", "unknown")
    layers = blast.get("layers_active", [])

    if status == "nominal":
        st.success("Containment status: nominal")
    elif status == "contained":
        st.error("Containment status: kill switch / quarantine active")
    elif status == "policy_blocked":
        st.warning("Containment status: semantic policy blocked action")
    elif status == "execution_blocked":
        st.warning("Containment status: tool executor blocked action")
    else:
        st.info(f"Containment status: {status}")

    if layers:
        st.write("Active containment layers in recent telemetry:")
        for layer in layers:
            st.write(f"- `{layer}`")
    else:
        st.caption("No layer contraction events in telemetry tail.")
