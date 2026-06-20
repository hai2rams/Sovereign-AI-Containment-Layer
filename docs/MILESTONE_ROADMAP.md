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
| **M3** | Telemetry and audit pipeline | Planned |
| **M4** | T3 adapter anchoring | Planned |
| **M5** | Parameter-bound token broker | Planned |
| **M6** | Tool executor verification | Planned |
| **M7** | Memory firewall | Planned |
| **M8** | Output / egress firewall | Planned |
| **M9** | Revocation and quarantine engine | Planned |
| **M10** | Red-team scenario engine | Planned |
| **M11** | Streamlit dashboard (full control plane) | Planned |
| **M12** | AppTest and integration validation | Planned |
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

- [ ] Structured telemetry event schema in `packages/core`
- [ ] Audit record chaining / hash-linked ledger scaffold
- [ ] Emit on semantic evaluation, policy denial, and state transitions
- [ ] Append-only `data/telemetry/telemetry_stream.jsonl` writer
- [ ] Dashboard telemetry reader wired to validated events

### M4 — T3 adapter anchoring

- [ ] Port vetted session/bootstrap from prototype reference only
- [ ] Implement `AnchorAdapter` write path (deferred → production gated)
- [ ] Anchor release root, policy hash, audit state root, revocation state root
- [ ] Read/status endpoints for dashboard display
- [ ] No secrets in repo; no unreviewed contract mutations

### M5 — Parameter-bound token broker

- [ ] HMAC or hash-bound action tokens scoped to proposal + envelope epoch
- [ ] Token issuance only after semantic `allowed` (or explicit human-approval path)
- [ ] Token verification API for tool executor gate
- [ ] No token bypass of semantic or structural validation

### M6 — Tool executor verification

- [ ] Verify action token + proposal hash + envelope epoch before execution
- [ ] Reject stale tokens, wrong destination, amount drift
- [ ] Read-only executor shell in dashboard; no live payment in dev without explicit flag

### M7 — Memory firewall

- [ ] Enforce `MemoryQuotaState` limits from StateEnvelope
- [ ] Similarity / duplicate payload detection hooks
- [ ] Block or quarantine on quota exceeded

### M8 — Output / egress firewall

- [ ] Certified egress allowlist enforcement
- [ ] Block exfiltration patterns in tool/RAG outputs
- [ ] Hash-lock egress policy artifacts

### M9 — Revocation and quarantine engine

- [ ] Revocation state root transitions
- [ ] In-flight action race handling
- [ ] Escalate `risk_mode` to `quarantine` / `revoked` without downgrade
- [ ] Wire revocation signals to semantic + token invalidation

### M10 — Red-team scenario engine

- [ ] Runnable scenario harness (`scripts/run-demo.ts` production path)
- [ ] Fixtures for all architecture demo scenarios (not judge-only subset)
- [ ] Expected outputs under `demo/expected/`
- [ ] Replay support under `demo/replays/`

### M11 — Streamlit dashboard (full control plane)

- [ ] Wire all component panels to live telemetry + policy state
- [ ] Header matrix shows anchored roots when M4 available
- [ ] Timeline, semantic rules, tokens, audit, blast radius — read-mostly
- [ ] Preserve M4.5 boundary: dashboard never weakens policy for UI convenience

### M12 — AppTest and integration validation

- [ ] Cross-package integration tests (core + adapter + scripts)
- [ ] Dashboard pytest suite expanded for wired panels
- [ ] CI script: `npm test`, `npm run build`, `pytest tests/dashboard`
- [ ] Scenario regression against `demo/expected/`

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
