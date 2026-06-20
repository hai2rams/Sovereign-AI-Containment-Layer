"""Read-only demo banner and judge explanation."""

import streamlit as st


def render_demo_banner() -> None:
    st.error("READ-ONLY DEMO MODE — NO REAL PAYMENT OR TOOL EXECUTION")
    st.info(
        "The left side shows what the untrusted model attempted. "
        "The right side shows the deterministic containment gates. "
        "The model can propose, but only the control plane can authorize."
    )
