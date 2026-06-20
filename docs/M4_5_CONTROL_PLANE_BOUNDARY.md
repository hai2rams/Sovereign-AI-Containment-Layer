# M4.5 Control Plane Boundary

## Principle

The Streamlit dashboard is a **read-mostly control plane**. It must not weaken containment boundaries for UI convenience.

## M1 implementation notes

- **StateEnvelope is private** to the containment runtime. It is never sent to the model.
- The model receives only **SanitizedModelTaskPacket** (sanitized, forbidden-field-scrubbed context).
- Model output is validated as **ActionProposal** only — six allowed fields, integer minor units.
- **Strict JSON intake** (`StrictJsonIntake.parseRejectingDuplicateKeys`) runs **before** schema validation.
- **Recursive forbidden-field rejection** blocks model control-plane injection at any depth.
- **Money uses integer minor units** (`amount_minor_units`).
- **`output_contract_id` is fixed** to `ACTION_PROPOSAL_V1`.

## M2 implementation notes

- **Semantic validation is deterministic** — engine id `deterministic_semantic_rules_v1`.
- It validates **meaning**, not just JSON shape: allowlists, invoice binding, trust tiers, risk mode, release status.
- It is the layer that blocks **structurally valid but unsafe** ActionProposals.
- It **never approves using the LLM** — no natural language authority, only rule IDs and reason codes.
- It **does not issue tokens**, call tools, execute payments, or write to T3.
- `SemanticPolicyEngine` consumes validated `ActionProposal` + private `StateEnvelope` + `PaymentPolicyContext`.
- `applySemanticResultToEnvelope` maps `final_semantic_result` → `policy_decision` and may escalate `risk_mode` (never lowers severity).

### Semantic severity order

`quarantine` > `blocked` > `read_only` > `requires_human_approval` > `allowed`

## Rules

1. Dashboard reads telemetry and validated traces — it does not execute tools or payments.
2. All writes go through backend services with policy + token gates (future milestones).
3. `safe_render` redacts secrets before display.
4. No token broker, tool executor, or T3 writes in M2.

## M4 implementation notes

- **T3 adapter anchors roots only** — release, policy, audit, and revocation state roots (`sha256:<64 hex>`).
- **T3 is not the policy authority** — local deterministic control plane and semantic engine remain authoritative.
- **Anchoring is external integrity support** — `attachAnchorResultToAuditReceipt` never deletes or mutates local audit records on failure.
- **`T3_ANCHOR_MODE=dry_run` is default** — works without secrets; `PlaceholderAnchorAdapter` returns deterministic receipts.
- **`T3_ANCHOR_MODE=real_write` is explicitly gated** — fail-closed without required env vars; no private keys in repo.
- **Forbidden anchor content** — raw prompts, documents, action tokens, private `StateEnvelope`, secrets, idempotency keys, full attestation quotes.
- **`packages/core` does not import** `@terminal3/t3n-sdk` or concrete T3 adapter implementations.

## M5 implementation notes

- **Token Broker issues scoped capability tokens** — `parameter_bound_action_capability` only after semantic `allowed`.
- **Tokens are parameter-bound** — `parameter_hash = sha256(canonicalize(ActionProposal))`; not general tool permissions.
- **Token issuance follows deterministic policy only** — blocked, quarantine, read_only, and requires_human_approval do not issue.
- **Model cannot authorize or mint tokens** — JTI and idempotency key are control-plane generated; forbidden fields rejected at intake.
- **Mock signing in M5** — `MockTokenSigner` with `mock_sig_v1:` prefix; no real private keys.
- **Real asymmetric key rotation** comes in a later milestone.
- **Full Tool Executor verification** is implemented in M6 — `verifyToolExecution` in `packages/core/src/tool-executor`.

## M7 implementation notes

- **Memory Firewall** gates memory writes and reads before any store access.
- **Inert evidence only** — executable patterns (`<script>`, `eval(`, etc.) are rejected.
- **Quota enforcement** uses `MemoryQuotaState` counters from `StateEnvelope`.
- **Similarity hooks** detect duplicate hashes and normalized-similar payloads (memory poisoning defense).
- **Read trust revalidation** blocks reads when stored evidence trust is worse than session trust.
- **M7 does not persist memory** — `payload_stored` and `payload_returned` remain `false`.

## M8 implementation notes

- **Egress Firewall** gates all outbound output before transmission.
- **Contracted output only** — `ACTION_PROPOSAL_V1` (strict JSON) and `TEXT_EGRESS_V1` (bounded plain text).
- **Certified destination allowlist** — egress blocked for unknown sinks.
- **Exfil defense** — private key / token patterns and high-entropy blobs blocked.
- **Streaming disabled** in `quarantine` and `revoked` risk modes.
- **Hash-locked egress policy** — `envelope_policy_hash` must match policy artifact.
- **M8 does not transmit** — `egress_transmitted` remains `false`.

## M9 implementation notes

- **Revocation Engine** applies `quarantine`, `revoke`, and `security_escalation` signals to private `StateEnvelope`.
- **Epoch monotonicity** — `revocation_epoch` and `containment_epoch` bump on each revocation transition; stale tokens fail verification.
- **Kill switch** — `quarantine` and `revoked` risk modes block token issuance, heartbeat renewal, and in-flight actions.
- **Revocation state root** — deterministic `sha256:` root derived from session revocation snapshot (anchorable via T3 in M4).
- **In-flight race** — tokens issued before epoch bump lose races against updated envelope state.
- **Heartbeat** — nonce-bound renewal with replay rejection, renewal ceilings, and containment epoch binding.
- **Token Broker wired** — `evaluateEnvelopeRevocationGate` blocks issuance when revocation state or kill switch is active.

## M11 implementation notes

- **Dashboard reads telemetry JSONL** — `data/telemetry/telemetry_stream.jsonl` with fallback to `dashboard/fixtures/sample_telemetry.jsonl`.
- **Control-plane snapshot** — `control_plane_state.py` derives roots, semantic, token, executor, audit, and blast-radius from `telemetry.v1` events.
- **Read-only boundary preserved** — tool executor panel displays verification only; no payment or tool execution from UI.
