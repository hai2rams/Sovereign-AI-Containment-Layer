"""Workflow node status derivation from telemetry (presentation layer only)."""

from __future__ import annotations

from typing import Any, Literal

WorkflowStatus = Literal[
    "passed",
    "blocked",
    "escalated",
    "skipped",
    "pending",
    "warning",
    "confirmed",
]

NODE_LABELS: dict[str, str] = {
    "user_input": "User Input / Uploaded Evidence",
    "sanitized_task_packet": "Sanitized Task Packet",
    "untrusted_model_output": "Untrusted Model Output",
    "strict_json_intake": "Strict JSON Intake",
    "structural_validation": "Structural Validation",
    "semantic_validation": "Semantic Validation",
    "policy_decision": "Policy Decision",
    "token_broker": "Token Broker",
    "tool_executor_verification": "Tool Executor Verification",
    "egress_firewall": "Egress Firewall",
    "audit_ledger": "Audit Ledger",
    "t3_anchoring": "T3 Anchoring",
    "final_output": "Final Output",
}

NODE_ORDER: list[str] = list(NODE_LABELS.keys())

EVENT_TO_NODE: dict[str, str] = {
    "INPUT_SOURCE_CLASSIFIED": "user_input",
    "SANITIZED_TASK_PACKET_CREATED": "sanitized_task_packet",
    "INFERENCE_PROPOSAL_INGESTED": "untrusted_model_output",
    "STRICT_JSON_INTAKE_COMPLETED": "strict_json_intake",
    "STRUCTURAL_VALIDATION_COMPLETED": "structural_validation",
    "SEMANTIC_VALIDATION_COMPLETED": "semantic_validation",
    "POLICY_DECISION_ISSUED": "policy_decision",
    "TOKEN_ISSUANCE_DECISION": "token_broker",
    "TOOL_EXECUTOR_VERIFICATION_COMPLETED": "tool_executor_verification",
    "EGRESS_CONTRACTION_APPLIED": "egress_firewall",
    "AUDIT_RECEIPT_WRITTEN": "audit_ledger",
    "T3_ANCHOR_CONFIRMED": "t3_anchoring",
    "T3_ANCHOR_ATTEMPTED": "t3_anchoring",
    "MEMORY_FIREWALL_DECISION": "structural_validation",  # side-path; narrative handles memory
}

UNTRUSTED_NODES = {"user_input", "sanitized_task_packet", "untrusted_model_output"}
CONTROL_PLANE_NODES = {
    "strict_json_intake",
    "structural_validation",
    "semantic_validation",
    "policy_decision",
    "token_broker",
    "tool_executor_verification",
    "egress_firewall",
    "audit_ledger",
}
EXTERNAL_NODES = {"t3_anchoring", "final_output"}


def _payload(event: dict[str, Any]) -> dict[str, Any]:
    payload = event.get("payload")
    return payload if isinstance(payload, dict) else {}


def _status_from_event(event_type: str, payload: dict[str, Any]) -> WorkflowStatus:
    if event_type == "INPUT_SOURCE_CLASSIFIED":
        trust = payload.get("source_trust_level", 0)
        return "warning" if isinstance(trust, int) and trust >= 3 else "passed"

    if event_type in {"STRICT_JSON_INTAKE_COMPLETED", "STRUCTURAL_VALIDATION_COMPLETED"}:
        decision = str(payload.get("decision", "passed")).lower()
        return "blocked" if decision in {"blocked", "failed", "rejected"} else "passed"

    if event_type == "SEMANTIC_VALIDATION_COMPLETED":
        result = str(payload.get("final_semantic_result", "")).lower()
        if result == "allowed":
            return "passed"
        if result == "quarantine":
            return "escalated"
        return "blocked"

    if event_type == "POLICY_DECISION_ISSUED":
        decision = str(payload.get("policy_decision", "")).lower()
        return "passed" if decision == "allow" else "blocked"

    if event_type == "TOKEN_ISSUANCE_DECISION":
        broker = payload.get("token_broker", payload)
        return "passed" if broker.get("token_issued") else "blocked"

    if event_type == "TOOL_EXECUTOR_VERIFICATION_COMPLETED":
        verification = payload.get("tool_executor_verification", payload)
        result = str(verification.get("verification_result", "")).lower()
        return "passed" if result == "allowed" else "blocked"

    if event_type == "EGRESS_CONTRACTION_APPLIED":
        egress = payload.get("egress_firewall", payload)
        decision = str(egress.get("decision", "")).lower()
        return "passed" if decision == "allowed" else "blocked"

    if event_type == "AUDIT_RECEIPT_WRITTEN":
        return "passed"

    if event_type in {"T3_ANCHOR_CONFIRMED", "T3_ANCHOR_ATTEMPTED"}:
        status = str(payload.get("status", "confirmed")).lower()
        return "confirmed" if status in {"confirmed", "success"} else "warning"

    if event_type == "MEMORY_FIREWALL_DECISION":
        memory = payload.get("memory_firewall", payload)
        return "passed" if memory.get("decision") == "allowed" else "blocked"

    if event_type == "INFERENCE_PROPOSAL_INGESTED":
        return "warning"

    return "passed"


def build_workflow_state(events: list[dict[str, Any]]) -> dict[str, Any]:
    node_status: dict[str, WorkflowStatus] = {node: "pending" for node in NODE_ORDER}
    seen_events: list[str] = []
    memory_firewall: dict[str, Any] | None = None
    block_after: str | None = None

    for event in events:
        event_type = str(event.get("event_type") or event.get("kind") or "")
        payload = _payload(event)
        seen_events.append(event_type)

        if event_type == "MEMORY_FIREWALL_DECISION":
            memory_firewall = payload.get("memory_firewall", payload)
            status = _status_from_event(event_type, payload)
            node_status["structural_validation"] = status
            block_after = "structural_validation"
            continue

        node_id = EVENT_TO_NODE.get(event_type)
        if not node_id:
            continue

        status = _status_from_event(event_type, payload)
        node_status[node_id] = status

        if status in {"blocked", "escalated"} and block_after is None:
            block_after = node_id

    if block_after:
        start_skipping = False
        for node in NODE_ORDER:
            if node == block_after:
                start_skipping = True
                continue
            if start_skipping and node_status[node] == "pending":
                node_status[node] = "skipped"

    # Final output follows egress or last reached gate
    if node_status["egress_firewall"] == "passed":
        node_status["final_output"] = "passed"
    elif node_status["egress_firewall"] == "blocked":
        node_status["final_output"] = "blocked"
    elif block_after:
        node_status["final_output"] = "skipped"
    elif node_status["t3_anchoring"] in {"confirmed", "passed"}:
        node_status["final_output"] = "passed"

    narrative = _build_narrative(events, memory_firewall)

    return {
        "node_status": node_status,
        "node_labels": NODE_LABELS,
        "seen_events": seen_events,
        "narrative": narrative,
        "memory_firewall": memory_firewall,
    }


def _build_narrative(
    events: list[dict[str, Any]],
    memory_firewall: dict[str, Any] | None,
) -> dict[str, Any]:
    model_attempted: dict[str, Any] = {
        "action": "—",
        "amount": "—",
        "destination": "—",
        "preview_hash": "—",
        "untrusted_label": "UNTRUSTED MODEL OUTPUT",
    }
    control_plane: dict[str, Any] = {
        "structural_result": "pending",
        "semantic_result": "pending",
        "policy_decision": "pending",
        "token_decision": "not_called",
        "tool_executor_decision": "not_called",
        "audit_receipt": "not_written",
        "memory_firewall_decision": None,
    }

    for event in events:
        event_type = str(event.get("event_type") or "")
        payload = _payload(event)

        if event_type == "INFERENCE_PROPOSAL_INGESTED":
            model_attempted["action"] = payload.get("action", "—")
            amount = payload.get("amount_minor_units")
            model_attempted["amount"] = str(amount) if amount is not None else "—"
            model_attempted["destination"] = payload.get("destination", "—")
            model_attempted["preview_hash"] = payload.get("preview_hash", "—")

        if event_type == "STRUCTURAL_VALIDATION_COMPLETED":
            control_plane["structural_result"] = payload.get("decision", "passed")

        if event_type == "SEMANTIC_VALIDATION_COMPLETED":
            control_plane["semantic_result"] = payload.get("final_semantic_result", "unknown")

        if event_type == "POLICY_DECISION_ISSUED":
            control_plane["policy_decision"] = payload.get("policy_decision", "—")

        if event_type == "TOKEN_ISSUANCE_DECISION":
            broker = payload.get("token_broker", payload)
            control_plane["token_decision"] = (
                "issued" if broker.get("token_issued") else f"blocked:{broker.get('reason_code', 'unknown')}"
            )

        if event_type == "TOOL_EXECUTOR_VERIFICATION_COMPLETED":
            verification = payload.get("tool_executor_verification", payload)
            result = verification.get("verification_result", "unknown")
            reason = verification.get("reason_code")
            control_plane["tool_executor_decision"] = (
                str(result) if not reason else f"{result} ({reason})"
            )

        if event_type == "AUDIT_RECEIPT_WRITTEN":
            control_plane["audit_receipt"] = "written"

    if memory_firewall:
        control_plane["memory_firewall_decision"] = memory_firewall.get("decision", "blocked")
        reasons = memory_firewall.get("reason_codes", [])
        if reasons:
            control_plane["memory_firewall_decision"] = (
                f"{memory_firewall.get('decision')} ({reasons[0]})"
            )

    return {
        "model_attempted": model_attempted,
        "control_plane": control_plane,
    }
