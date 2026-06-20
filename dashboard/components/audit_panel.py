"""Audit panel — wired from audit and T3 anchor telemetry."""

import streamlit as st

from services.telemetry_reader import latest_control_plane_snapshot


def render_audit_panel() -> None:
    st.subheader("Audit")
    snapshot = latest_control_plane_snapshot()
    audit = snapshot.get("audit")

    if not audit:
        st.caption("No audit or anchor events in telemetry tail.")
        return

    st.write(f"Latest audit telemetry: `{audit.get('event_type', '—')}`")
    if audit.get("entry_count") is not None:
        st.write(f"Ledger entries: `{audit['entry_count']}`")
    if audit.get("audit_state_root"):
        st.write(f"Audit root: `{str(audit['audit_state_root'])[:20]}…`")
    if audit.get("anchor_status"):
        st.write(f"Anchor status: `{audit['anchor_status']}`")
