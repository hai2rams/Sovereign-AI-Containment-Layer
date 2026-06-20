"""Sovereign AI Containment Layer — operator dashboard (M0 skeleton)."""

import streamlit as st

st.set_page_config(page_title="Containment Layer", layout="wide")

st.title("Sovereign AI Containment Layer")
st.caption("M0 dashboard skeleton — no live agent execution or payment flows.")

col1, col2, col3, col4 = st.columns(4)
col1.metric("Release hash root", "—")
col2.metric("Policy hash", "—")
col3.metric("Audit state root", "—")
col4.metric("Revocation state root", "—")

st.subheader("Anchor status")
st.info(
    "Connect `@sovereign/t3-adapter` in a future milestone. "
    "M0: local/deferred anchoring only."
)

st.subheader("Scenarios")
st.markdown(
    "- `demo/certified-release/` — certified agent release walkthrough (placeholder)\n"
    "- `demo/policy-block/` — policy denial scenario (placeholder)\n"
    "- `demo/revocation/` — revocation drill (placeholder)"
)
