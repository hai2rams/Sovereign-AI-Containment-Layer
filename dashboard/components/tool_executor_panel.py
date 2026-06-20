"""Tool executor panel — M0 placeholder (read-only)."""

import streamlit as st


def render_tool_executor_panel() -> None:
    st.subheader("Tool executor")
    st.warning("M0: execution disabled — control plane is read-only.")
