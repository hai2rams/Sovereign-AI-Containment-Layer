"""Judge-facing narrative columns (read-only)."""

from __future__ import annotations

import os
from typing import Any

import streamlit as st

from components.redaction import redact
from services.safe_render import safe_text


def _production_mode() -> bool:
    return os.environ.get("CONTAINMENT_DEMO_MODE", "demo").lower() == "production"


def render_workflow_narrative(workflow_state: dict[str, Any]) -> None:
    narrative = workflow_state.get("narrative", {})
    model = narrative.get("model_attempted", {})
    control = narrative.get("control_plane", {})

    left, right = st.columns(2)

    with left:
        st.markdown("#### Model attempted")
        st.markdown(f"**Action:** `{model.get('action', '—')}`")
        st.markdown(f"**Amount (minor units):** `{model.get('amount', '—')}`")
        st.markdown(f"**Destination:** `{model.get('destination', '—')}`")
        preview = str(model.get("preview_hash", "—"))
        if _production_mode():
            preview = safe_text(preview) if preview != "—" else "—"
        st.markdown(f"**Raw preview hash:** `{preview}`")
        st.error(model.get("untrusted_label", "UNTRUSTED MODEL OUTPUT"))

    with right:
        st.markdown("#### Control plane decided")
        st.markdown(f"**Structural result:** `{control.get('structural_result', '—')}`")
        st.markdown(f"**Semantic result:** `{control.get('semantic_result', '—')}`")
        st.markdown(f"**Policy decision:** `{control.get('policy_decision', '—')}`")
        token_decision = str(control.get("token_decision", "—"))
        if "mock_sig" in token_decision or "signature" in token_decision.lower():
            token_decision = redact(token_decision)
        st.markdown(f"**Token decision:** `{token_decision}`")
        st.markdown(f"**Tool executor decision:** `{control.get('tool_executor_decision', '—')}`")
        st.markdown(f"**Audit receipt:** `{control.get('audit_receipt', '—')}`")
        memory_decision = control.get("memory_firewall_decision")
        if memory_decision:
            st.markdown(f"**Memory firewall:** `{memory_decision}`")
