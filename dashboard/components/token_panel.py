"""Action token panel — wired from TOKEN_ISSUANCE_DECISION telemetry."""

import streamlit as st

from components.redaction import redact
from services.telemetry_reader import latest_control_plane_snapshot


def render_token_panel(snapshot: dict | None = None) -> None:
    st.subheader("Action tokens")
    if snapshot is None:
        snapshot = latest_control_plane_snapshot()
    token = snapshot.get("token")

    if not token:
        st.caption("No token issuance events in telemetry tail.")
        return

    if token.get("token_issued"):
        st.success("Token issued (parameter-bound capability)")
        parameter_hash = token.get("parameter_hash")
        if parameter_hash:
            st.write(f"Parameter hash: `{redact(str(parameter_hash))}`")
        signing_key_id = token.get("signing_key_id")
        if signing_key_id:
            st.write(f"Signing key: `{signing_key_id}`")
    else:
        st.warning(f"Token blocked: `{token.get('reason_code', 'unknown')}`")
