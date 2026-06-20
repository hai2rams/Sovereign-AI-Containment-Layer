"""Event timeline — telemetry.v1 driven."""

import streamlit as st

from services.telemetry_reader import latest_control_plane_snapshot


def render_timeline(events: list[dict], snapshot: dict | None = None) -> None:
    st.subheader("Timeline")
    if snapshot is None:
        snapshot = latest_control_plane_snapshot()
    timeline = snapshot.get("timeline") or []

    if not timeline and not events:
        st.info("No telemetry events.")
        return

    rows = timeline if timeline else [
        {
            "timestamp": event.get("emitted_at") or event.get("ts", "?"),
            "event_type": event.get("event_type") or event.get("kind", "event"),
            "sequence": event.get("event_sequence"),
        }
        for event in events[-8:]
    ]

    for row in rows:
        seq = row.get("sequence")
        prefix = f"#{seq} " if seq is not None else ""
        st.write(f"`{row['timestamp']}` — {prefix}`{row['event_type']}`")
