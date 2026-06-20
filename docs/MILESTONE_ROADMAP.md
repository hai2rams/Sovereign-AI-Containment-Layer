# Milestone Roadmap

> **The judge demo is a curated proof slice of the larger Sovereign AI Containment Layer architecture. It does not define or limit the full implementation scope.**

This document maintains **two separate tracks**:

1. **Full Architecture Implementation Roadmap** — complete product build on `clean-main`
2. **Judge Demo / Presentation Workflow** — a small scenario set for visual proof of the containment claim

Do not collapse full-architecture milestones because the judge demo shows fewer workflows.

**Governance:** [`ARCHITECTURE_COVERAGE_MATRIX.md`](./ARCHITECTURE_COVERAGE_MATRIX.md) maps every locked v9/v10 requirement to a milestone, test coverage, and scope (`Full Product` vs `Presentation Slice`). Update the matrix when implementation status changes.

---

## Track 1 — Full Architecture Implementation Roadmap

| Milestone | Layer / focus | Status |
|-----------|---------------|--------|
| **M0** | Clean project skeleton | Complete |
| **M1** | Control-plane boundary, strict JSON intake, StateEnvelope isolation | Complete |
| **M2** | Deterministic semantic policy engine | Complete |
| **M3** | Telemetry and audit pipeline | Complete |
| **M4** | T3 adapter anchoring | Complete |
| **M5** | Parameter-bound token broker | Complete |
| **M6** | Tool executor verification | Complete |
| **M7** | Memory firewall | Complete |
| **M8** | Output / egress firewall | Complete |
| **M9** | Revocation and quarantine engine | Complete |
| **M10** | Red-team scenario engine | Complete |
| **M11** | Streamlit dashboard (full control plane) | Complete |
| **M12** | AppTest and integration validation | Complete |
| **M13** | Final documentation and pitch/demo material | Planned |

### M0 — Clean project skeleton

- [x] Architecture-aligned repo layout (`packages/core`, `packages/t3-adapter`, `dashboard`, `demo`, `tests`, `scripts`)
- [x] Prototype preserved on `prototype/t3-validated` + tag `prototype-t3-validated-v1`
- [x] Baseline build/test commands
- [x] No secrets, no production T3 writes, no payment execution

### M1 — Control-plane boundary

- [x] Branded core types (`AsciiSlug`, `Sha256Hex`, etc.)
- [x] `StateEnvelope` schema (private runtime state)
- [x] `SanitizedModelTaskPacket` schema (model input boundary)
- [x] `ActionProposal` schema (model output boundary)
- [x] Strict JSON intake with duplicate-key rejection
- [x] Recursive forbidden-field rejection
- [x] Boundary validator unit tests

### M2 — Deterministic semantic policy engine

- [x] `SemanticPolicyEngine` (`deterministic_semantic_rules_v1`)
- [x] Eight deterministic rules (destination, amount, invoice binding, trust, role, risk, release, attestation)
- [x] `applySemanticResultToEnvelope` → `policy_decision` + risk escalation
- [x] Golden-path and poisoned-invoice semantic fixtures
- [x] No LLM approval, no tokens, no tools, no T3 writes

### M3 — Telemetry and audit pipeline

- [x] Telemetry event envelope (`telemetry.v1`) with trace/span/sequence/hash chain
- [x] JSONL append-only writer
- [x] Safe preview (UTF-8 truncation, Base64URL demo encoding)
- [x] Demo/production redaction profiles
- [x] Audit receipt model with state roots and `t3_anchor_pending`
- [x] Audit ledger + state root placeholder
- [x] Deterministic poisoned-invoice trace emission
- [ ] Advisory classifier runtime (deferred to M3.5 / integrated with risk escalation)

### M4 — T3 adapter anchoring

- [x] `AnchorAdapter` interface with `AnchorReceipt` (mode, status, adapter kind)
- [x] `PlaceholderAnchorAdapter` — deterministic dry-run (default)
- [x] `T3AnchorAdapter` — env-gated; session bootstrap ported from prototype reference
- [x] Root hash validation (`sha256:<64 lowercase hex>`) before anchor attempts
- [x] `T3_ANCHOR_MODE=dry_run` default; `real_write` fail-closed without secrets
- [x] T3 anchor telemetry payloads (`T3_ANCHOR_ATTEMPTED|CONFIRMED|FAILED`)
- [x] `attachAnchorResultToAuditReceipt` — non-destructive audit integration
- [ ] Production contract execute (explicitly gated — pending future milestone)
- [ ] Dashboard anchor status display (M11)

### M5 — Parameter-bound token broker

- [x] `ParameterBoundActionToken` claims with parameter hash, epochs, JTI, idempotency key
- [x] Deterministic parameter canonicalizer + `sha256:` parameter hash
- [x] `TokenPolicyGate` — issuance only when `final_semantic_result === 'allowed'`
- [x] `MockTokenSigner` — deterministic mock signatures (no real keys)
- [x] Control-plane-only `generateJti` and `generateIdempotencyKey`
- [x] `TOKEN_ISSUANCE_DECISION` telemetry payloads (safe fields only)
- [x] Token verification consumed by Tool Executor (M6)
- [ ] Real asymmetric signing and key rotation (later milestone)

### M6 — Tool executor verification

- [x] `verifyToolExecution` — independent token + payload verification
- [x] Mock signature validation, parameter hash recomputation, epoch matching
- [x] JTI and idempotency key replay placeholders (`used_jtis` / `used_idempotency_keys`)
- [x] Risk mode gate (`quarantine`, `read_only` block state-changing actions)
- [x] Token expiry (TTL) check
- [x] `TOOL_EXECUTOR_VERIFICATION_COMPLETED` telemetry (safe fields only)
- [x] Parameter swap attack blocked (`PARAMETER_HASH_MISMATCH`)
- [ ] Dashboard executor shell wiring (M11)
- [ ] Real downstream tool invocation (later milestone)

### M7 — Memory firewall

- [x] `MemoryEvidenceMetadata` strict schema with forbidden control-plane field rejection
- [x] Inert evidence payload validation (blocks executable patterns)
- [x] `MemoryQuotaState` quota enforcement hooks
- [x] Duplicate and normalized-similarity payload detection
- [x] Memory read trust revalidation and depreciation blocking
- [x] Risk mode gate for memory writes (`quarantine`, `read_only`, `revoked`)
- [x] `MEMORY_FIREWALL_DECISION` telemetry (safe fields only; no raw payload)
- [ ] Persistent memory store (later milestone — M7 verifies only; `payload_stored: false`)

### M8 — Output / egress firewall

- [x] Certified egress destination allowlist enforcement
- [x] Fixed-schema contracted output validation (`ACTION_PROPOSAL_V1`, `TEXT_EGRESS_V1`)
- [x] Exfil pattern + high-entropy output blocking
- [x] Hash-locked egress policy artifact binding (`envelope_policy_hash`)
- [x] Streaming disabled in `quarantine` / `revoked`
- [x] Fixed-interval timing pad (side-channel mitigation placeholder)
- [x] `EGRESS_CONTRACTION_APPLIED` telemetry (safe fields only)
- [ ] Live egress transmission wiring (later milestone — `egress_transmitted: false` in M8)

### M9 — Revocation and quarantine engine

- [x] Revocation state root transitions
- [x] In-flight action race handling
- [x] Escalate `risk_mode` to `quarantine` / `revoked` without downgrade
- [x] Wire revocation signals to semantic + token invalidation
- [x] Nonce-bound heartbeat with replay rejection and renewal ceilings

### M10 — Red-team scenario engine

- [x] Runnable scenario harness (`scripts/run-demo.ts` production path)
- [x] Fixtures for all architecture demo scenarios (not judge-only subset)
- [x] Expected outputs under `demo/expected/`
- [x] Replay support under `demo/replays/`

### M11 — Streamlit dashboard (full control plane)

- [x] Wire all component panels to live telemetry + policy state
- [x] Header matrix shows anchored roots when M4 available
- [x] Timeline, semantic rules, tokens, audit, blast radius — read-mostly
- [x] Preserve M4.5 boundary: dashboard never weakens policy for UI convenience

### M12 — AppTest and integration validation

- [x] Cross-package integration tests (core + adapter + scripts)
- [x] Dashboard pytest suite expanded for wired panels
- [x] CI script: `npm test`, `npm run build`, `pytest tests/dashboard`
- [x] Scenario regression against `demo/expected/`

### M13 — Final documentation and pitch/demo material

- [ ] Complete `MASTER_ARCHITECTURE_SPEC.md`
- [ ] Operator runbooks and ADRs
- [ ] Architecture diagrams and pitch deck source
- [ ] Judge demo script (see Track 2) as one deliverable — not the whole product

---

## Track 2 — Judge Demo / Presentation Workflow

**Purpose:** Visually demonstrate the core containment claim in a short session:

> *We do not claim the LLM is safe. We prove the agent operates inside a certified, hash-locked, attested, policy-bound, auditable, and revocable layer.*

This track is a **presentation slice**. Implementation progress follows **Track 1**.

### Judge demo scenarios

| Priority | Scenario | Containment claim demonstrated |
|----------|----------|--------------------------------|
| Required | **Golden path** | Certified release + policy allow + clean audit |
| Required | **Poisoned invoice** | Structurally valid proposal blocked by semantic rules |
| Required | **Parameter swap attack** | Tool argument tampering caught at verification boundary |
| Required | **Memory poisoning replay** | Long-context / memory abuse contained |
| Optional | **Revocation race** | Revocation vs in-flight action |
| Optional | **Telemetry spoofing** | Invalid / replayed telemetry rejected |

### Judge demo deliverables (subset of full architecture)

- Curated fixtures in `demo/scenarios/` + `demo/expected/`
- Streamlit dashboard walkthrough (`streamlit run dashboard/app.py`)
- Short scripted narrative — not full M3–M13 scope
- Uses only layers that are **implemented** at demo time (M2+ semantic blocking available today)

### What the judge demo is not

- Not a replacement for the token broker, memory firewall, egress firewall, or T3 anchoring milestones
- Not permission to skip integration tests, red-team harness, or production hardening
- Not the sole definition of “done” for this repository

---

## Working mode

| Phase | Mode |
|-------|------|
| M0 | Manual / controlled |
| M1+ on `clean-main` | Autopilot against this roadmap |

Prototype reference: `prototype/t3-validated` / `prototype-t3-validated-v1`.

See also: [`ARCHITECTURE_COVERAGE_MATRIX.md`](./ARCHITECTURE_COVERAGE_MATRIX.md) for locked-spec alignment tracking.
