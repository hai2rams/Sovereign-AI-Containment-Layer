"""Root hash matrix header — M0 placeholder."""

import streamlit as st


def render_header_matrix() -> None:
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Release root", "—")
    col2.metric("Policy hash", "—")
    col3.metric("Audit state root", "—")
    col4.metric("Revocation root", "—")
