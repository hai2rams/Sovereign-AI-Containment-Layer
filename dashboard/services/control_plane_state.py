"""Derive read-only control-plane snapshot from telemetry events."""

from __future__ import annotations

from typing import Any


def _event_type(event: dict[str, Any]) -> str:
    return str(event.get("event_type") or event.get("kind") or "unknown")


def _payload(event: dict[str, Any]) -> dict[str, Any]:
    payload = event.get("payload")
    return payload if isinstance(payload, dict) else {}


def _timestamp(event: dict[str, Any]) -> str:
    return str(event.get("emitted_at") or event.get("ts") or "?")


def build_control_plane_snapshot(events: list[dict[str, Any]]) -> dict[str, Any]:
    roots = {
        "release_root": "—",
        "policy_hash": "—",
        "audit_state_root": "—",
        "revocation_state_root": "—",
    }
    semantic: dict[str, Any] | None = None
    token: dict[str, Any] | None = None
    tool_executor: dict[str, Any] | None = None
    audit: dict[str, Any] | None = None
    risk_mode = "normal"
    blast_radius = {
        "layers_active": [],
        "containment_status": "unknown",
    }

    for event in events:
        event_type = _event_type(event)
        payload = _payload(event)

        if event_type == "T3_ANCHOR_CONFIRMED":
            anchor_type = payload.get("anchor_type")
            root_hash = payload.get("root_hash") or payload.get("anchored_root")
            if anchor_type == "release" and root_hash:
                roots["release_root"] = str(root_hash)[:18] + "…"
            elif anchor_type == "policy" and root_hash:
                roots["policy_hash"] = str(root_hash)[:18] + "…"
            elif anchor_type == "audit" and root_hash:
                roots["audit_state_root"] = str(root_hash)[:18] + "…"
            elif anchor_type == "revocation" and root_hash:
                roots["revocation_state_root"] = str(root_hash)[:18] + "…"

        if event_type == "SEMANTIC_VALIDATION_COMPLETED":
            semantic = {
                "engine": payload.get("engine", "deterministic_semantic_rules_v1"),
                "final_semantic_result": payload.get("final_semantic_result", "unknown"),
                "reason_codes": payload.get("reason_codes", []),
                "accepted": payload.get("accepted"),
            }

        if event_type == "TOKEN_ISSUANCE_DECISION":
            token_broker = payload.get("token_broker", payload)
            token = {
                "token_issued": token_broker.get("token_issued", False),
                "reason_code": token_broker.get("reason_code"),
                "parameter_hash": token_broker.get("parameter_hash"),
                "signing_key_id": token_broker.get("signing_key_id"),
            }

        if event_type == "TOOL_EXECUTOR_VERIFICATION_COMPLETED":
            verification = payload.get("tool_executor_verification", payload)
            tool_executor = {
                "verification_result": verification.get("verification_result", "unknown"),
                "reason_code": verification.get("reason_code"),
                "downstream_tool_called": verification.get("downstream_tool_called", False),
            }

        if event_type in {"AUDIT_RECEIPT_WRITTEN", "T3_ANCHOR_ATTEMPTED", "T3_ANCHOR_FAILED"}:
            audit = {
                "event_type": event_type,
                "audit_state_root": payload.get("audit_state_root"),
                "anchor_status": payload.get("anchor_status") or payload.get("status"),
                "entry_count": payload.get("entry_count"),
            }

        if event_type == "SESSION_RISK_STATE_UPDATED":
            revocation_engine = payload.get("revocation_engine", {})
            if revocation_engine.get("risk_mode"):
                risk_mode = str(revocation_engine["risk_mode"])
            elif payload.get("risk_mode"):
                risk_mode = str(payload["risk_mode"])

        for layer_key, layer_name in (
            ("memory_firewall", "memory"),
            ("egress_firewall", "egress"),
            ("tool_executor_verification", "tool_executor"),
        ):
            if layer_key in payload or event_type in {
                "MEMORY_FIREWALL_DECISION",
                "EGRESS_CONTRACTION_APPLIED",
                "TOOL_EXECUTOR_VERIFICATION_COMPLETED",
            }:
                name = layer_name
                if name not in blast_radius["layers_active"]:
                    blast_radius["layers_active"].append(name)

    if risk_mode in {"quarantine", "revoked"}:
        blast_radius["containment_status"] = "contained"
    elif semantic and semantic.get("final_semantic_result") not in {None, "allowed"}:
        blast_radius["containment_status"] = "policy_blocked"
    elif tool_executor and tool_executor.get("verification_result") == "blocked":
        blast_radius["containment_status"] = "execution_blocked"
    else:
        blast_radius["containment_status"] = "nominal"

    return {
        "roots": roots,
        "semantic": semantic,
        "token": token,
        "tool_executor": tool_executor,
        "audit": audit,
        "risk_mode": risk_mode,
        "blast_radius": blast_radius,
        "timeline": [
            {
                "timestamp": _timestamp(event),
                "event_type": _event_type(event),
                "sequence": event.get("event_sequence"),
            }
            for event in events[-12:]
        ],
    }
