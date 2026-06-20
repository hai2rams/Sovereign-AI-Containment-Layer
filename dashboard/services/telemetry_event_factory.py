"""Build telemetry.v1 event dicts for dashboard replay traces (presentation only)."""

from __future__ import annotations

from typing import Any


def _event(
    sequence: int,
    event_type: str,
    payload: dict[str, Any],
    *,
    previous_hash: str | None,
    event_hash: str,
    session_id: str = "session-001",
) -> dict[str, Any]:
    return {
        "schema_version": "telemetry.v1",
        "event_id": f"replay-evt-{sequence:03d}",
        "event_type": event_type,
        "event_status": "recorded",
        "emitted_at": f"2030-01-01T00:00:{sequence:02d}.000Z",
        "session_id": session_id,
        "trace_id": "trace-replay",
        "span_id": f"span-{sequence}",
        "parent_span_id": None,
        "event_sequence": sequence,
        "event_hash": event_hash,
        "previous_event_hash": previous_hash,
        "payload": payload,
    }


def _chain(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    prev: str | None = None
    chained: list[dict[str, Any]] = []
    for idx, event in enumerate(events, start=1):
        event_hash = f"replay-hash-{idx:03d}"
        chained.append(
            _event(
                idx,
                str(event["event_type"]),
                dict(event.get("payload", {})),
                previous_hash=prev,
                event_hash=event_hash,
            ),
        )
        prev = event_hash
    return chained


def golden_path_events() -> list[dict[str, Any]]:
    return _chain(
        [
            {"event_type": "SESSION_STARTED", "payload": {"risk_mode": "normal"}},
            {
                "event_type": "INPUT_SOURCE_CLASSIFIED",
                "payload": {"source_trust_level": 1, "classification": "certified_input"},
            },
            {
                "event_type": "SANITIZED_TASK_PACKET_CREATED",
                "payload": {"output_contract_id": "ACTION_PROPOSAL_V1"},
            },
            {
                "event_type": "INFERENCE_PROPOSAL_INGESTED",
                "payload": {
                    "action": "payment.transfer",
                    "amount_minor_units": 100000,
                    "destination": "approved-vendor-001",
                    "preview_hash": "sha256:" + "a" * 64,
                    "untrusted": True,
                },
            },
            {
                "event_type": "STRICT_JSON_INTAKE_COMPLETED",
                "payload": {"decision": "passed", "duplicate_keys_rejected": True},
            },
            {
                "event_type": "STRUCTURAL_VALIDATION_COMPLETED",
                "payload": {"decision": "passed", "schema": "ActionProposal"},
            },
            {
                "event_type": "SEMANTIC_VALIDATION_COMPLETED",
                "payload": {
                    "engine": "deterministic_semantic_rules_v1",
                    "accepted": True,
                    "final_semantic_result": "allowed",
                    "reason_codes": [],
                },
            },
            {
                "event_type": "POLICY_DECISION_ISSUED",
                "payload": {"policy_decision": "allow"},
            },
            {
                "event_type": "TOKEN_ISSUANCE_DECISION",
                "payload": {
                    "token_broker": {
                        "token_issued": True,
                        "parameter_hash": "sha256:" + "b" * 64,
                        "signing_key_id": "session_key_001",
                        "single_use": True,
                    },
                },
            },
            {
                "event_type": "TOOL_EXECUTOR_VERIFICATION_COMPLETED",
                "payload": {
                    "tool_executor_verification": {
                        "verification_result": "allowed",
                        "downstream_tool_called": False,
                        "transaction_executed": False,
                    },
                },
            },
            {
                "event_type": "EGRESS_CONTRACTION_APPLIED",
                "payload": {
                    "egress_firewall": {
                        "decision": "allowed",
                        "egress_transmitted": False,
                    },
                },
            },
            {
                "event_type": "AUDIT_RECEIPT_WRITTEN",
                "payload": {"entry_count": 1, "audit_state_root": "sha256:" + "c" * 64},
            },
            {
                "event_type": "T3_ANCHOR_CONFIRMED",
                "payload": {
                    "anchor_type": "audit",
                    "root_hash": "sha256:" + "d" * 64,
                    "mode": "dry_run",
                    "status": "confirmed",
                },
            },
        ],
    )


def poisoned_invoice_events() -> list[dict[str, Any]]:
    return _chain(
        [
            {"event_type": "SESSION_STARTED", "payload": {}},
            {
                "event_type": "INPUT_SOURCE_CLASSIFIED",
                "payload": {"source_trust_level": 3},
            },
            {"event_type": "SANITIZED_TASK_PACKET_CREATED", "payload": {}},
            {
                "event_type": "INFERENCE_PROPOSAL_INGESTED",
                "payload": {
                    "action": "payment.transfer",
                    "amount_minor_units": 9000000,
                    "destination": "attacker-wallet",
                    "preview_hash": "sha256:" + "e" * 64,
                    "untrusted": True,
                },
            },
            {
                "event_type": "STRICT_JSON_INTAKE_COMPLETED",
                "payload": {"decision": "passed"},
            },
            {
                "event_type": "STRUCTURAL_VALIDATION_COMPLETED",
                "payload": {"decision": "passed"},
            },
            {
                "event_type": "SEMANTIC_VALIDATION_COMPLETED",
                "payload": {
                    "engine": "deterministic_semantic_rules_v1",
                    "accepted": False,
                    "final_semantic_result": "blocked",
                    "reason_codes": [
                        "DESTINATION_NOT_ALLOWLISTED",
                        "AMOUNT_EXCEEDS_LIMIT",
                        "LOW_SOURCE_TRUST_FOR_STATE_CHANGE",
                    ],
                },
            },
            {
                "event_type": "POLICY_DECISION_ISSUED",
                "payload": {"policy_decision": "deny"},
            },
        ],
    )


def parameter_swap_events() -> list[dict[str, Any]]:
    import copy

    events = copy.deepcopy(golden_path_events())
    for event in events:
        if event["event_type"] == "TOOL_EXECUTOR_VERIFICATION_COMPLETED":
            event["payload"] = {
                "tool_executor_verification": {
                    "verification_result": "blocked",
                    "reason_code": "PARAMETER_HASH_MISMATCH",
                    "downstream_tool_called": False,
                    "transaction_executed": False,
                },
            }
        if event["event_type"] == "INFERENCE_PROPOSAL_INGESTED":
            event["payload"]["destination"] = "approved_vendor_001"
        if event["event_type"] == "EGRESS_CONTRACTION_APPLIED":
            event["payload"]["egress_firewall"] = {"decision": "skipped"}
    return events


def memory_poisoning_events() -> list[dict[str, Any]]:
    return _chain(
        [
            {"event_type": "SESSION_STARTED", "payload": {}},
            {"event_type": "INPUT_SOURCE_CLASSIFIED", "payload": {"source_trust_level": 2}},
            {"event_type": "SANITIZED_TASK_PACKET_CREATED", "payload": {}},
            {
                "event_type": "INFERENCE_PROPOSAL_INGESTED",
                "payload": {
                    "action": "memory.write",
                    "preview_hash": "sha256:" + "f" * 64,
                    "untrusted": True,
                },
            },
            {"event_type": "STRICT_JSON_INTAKE_COMPLETED", "payload": {"decision": "passed"}},
            {"event_type": "STRUCTURAL_VALIDATION_COMPLETED", "payload": {"decision": "passed"}},
            {
                "event_type": "MEMORY_FIREWALL_DECISION",
                "payload": {
                    "memory_firewall": {
                        "decision": "blocked",
                        "reason_codes": ["MEMORY_PAYLOAD_NOT_INERT"],
                        "quarantine_recommended": True,
                    },
                },
            },
        ],
    )


def revocation_race_events() -> list[dict[str, Any]]:
    import copy

    events = copy.deepcopy(golden_path_events())
    insert_at = next(
        i for i, event in enumerate(events) if event["event_type"] == "TOOL_EXECUTOR_VERIFICATION_COMPLETED"
    )
    risk_event = _event(
        insert_at + 1,
        "SESSION_RISK_STATE_UPDATED",
        {
            "revocation_engine": {
                "transition_applied": True,
                "risk_mode": "quarantine",
                "signal": "quarantine",
            },
        },
        previous_hash=events[insert_at]["event_hash"],
        event_hash="replay-hash-risk",
    )
    events.insert(insert_at, risk_event)
    for idx, event in enumerate(events, start=1):
        event["event_sequence"] = idx
        event["event_id"] = f"replay-evt-{idx:03d}"
        event["event_hash"] = f"replay-hash-{idx:03d}"
        event["previous_event_hash"] = None if idx == 1 else f"replay-hash-{idx - 1:03d}"

    for event in events:
        if event["event_type"] == "TOOL_EXECUTOR_VERIFICATION_COMPLETED":
            event["payload"] = {
                "tool_executor_verification": {
                    "verification_result": "blocked",
                    "reason_code": "REVOCATION_EPOCH_MISMATCH",
                    "downstream_tool_called": False,
                    "transaction_executed": False,
                },
            }
    return events


def telemetry_spoofing_events() -> list[dict[str, Any]]:
    base = golden_path_events()[:3]
    broken = _event(
        4,
        "SEMANTIC_VALIDATION_COMPLETED",
        {"final_semantic_result": "allowed"},
        previous_hash="deadbeef",
        event_hash="replay-hash-004",
    )
    return base + [broken]


REPLAY_BUILDERS = {
    "golden-path": golden_path_events,
    "poisoned-invoice": poisoned_invoice_events,
    "parameter-swap": parameter_swap_events,
    "memory-poisoning": memory_poisoning_events,
    "revocation-race": revocation_race_events,
    "telemetry-spoofing": telemetry_spoofing_events,
}
