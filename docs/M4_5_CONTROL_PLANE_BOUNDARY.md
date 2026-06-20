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
- **Full Tool Executor verification** is M6 — token verification API not wired yet.
