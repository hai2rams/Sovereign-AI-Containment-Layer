"""Event timeline — M0 placeholder."""

import streamlit as st


def render_timeline(events: list[dict]) -> None:
    st.subheader("Timeline")
    if not events:
        st.info("No telemetry events (M0 placeholder).")
        return
    for event in events[-5:]:
        st.write(f"`{event.get('ts', '?')}` — {event.get('kind', 'event')}")
