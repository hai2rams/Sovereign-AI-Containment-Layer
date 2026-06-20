# Master Architecture Specification

> **Status:** M13 — full architecture foundation complete (M0–M13 on `clean-main`).

## Thesis

Autonomous agents operate inside a certified, hash-locked, attested, policy-bound, auditable, and revocable containment layer. We do not claim inherent LLM safety.

The **judge demo** is a curated presentation slice (golden path, poisoned invoice, parameter swap, memory poisoning, plus optional revocation/telemetry scenarios). It demonstrates the containment claim visually; it does **not** define the full build scope.

## Layer model

| Layer | Package / path | Status |
|-------|----------------|--------|
| Domain core | `packages/core` | M1–M10 (policy, telemetry, audit, token broker, tool executor, memory/egress firewalls, revocation, scenario engine) |
| Trust anchor port | `packages/t3-adapter` | M4 anchoring boundary |
| Control plane UI | `dashboard/` | M11 telemetry-driven read-only dashboard |
| Demo & replay | `demo/` | M10 scenario harness + expected outputs |
| Telemetry | `data/telemetry/` | JSONL append-only |

## Containment pipeline (control plane)

```
Model output → Strict JSON intake → ActionProposal validation
  → Semantic policy engine → Token broker (if allowed)
  → Tool executor verification → Memory / egress firewalls
  → Audit + telemetry → T3 root anchoring (optional integrity)
```

Revocation signals can invalidate in-flight tokens at any stage via epoch bumps and kill-switch risk modes.

## Boundary rules

- `packages/core` must **not** import T3 contract code or `@terminal3/t3n-sdk`.
- Root objects (release, policy, audit, revocation) are defined in core `types/`.
- Anchoring is implemented only in `packages/t3-adapter` behind `AnchorAdapter`.
- **T3 anchors root hashes only** — never raw prompts, documents, tokens, or private `StateEnvelope`.
- **T3 is not the policy authority** — local deterministic control plane remains authoritative.
- **`T3_ANCHOR_MODE=dry_run`** is default for local/demo; **`real_write`** requires explicit env gating.
- **StateEnvelope is private** — model receives only `SanitizedModelTaskPacket`.
- **Token Broker** issues parameter-bound capabilities after semantic `allowed` only.
- **Model cannot mint tokens** — JTI, idempotency key, and signing are control-plane only.
- **Tool Executor** independently verifies token + execution payload before any tool call.
- **Memory Firewall** enforces quota, inert payloads, similarity hooks (no persistent store in M7).
- **Egress Firewall** validates contracted output and exfil patterns (no live transmission in M8).
- **Revocation Engine** applies quarantine/revoke signals, bumps epochs, invalidates stale tokens.
- **Scenario Engine** runs architecture red-team scenarios against golden expected outputs.
- **Dashboard** is read-only — no payment execution or tool calls from UI.
- No payment execution or ungated production T3 writes in this foundation.

## Module map (`packages/core`)

| Module | Responsibility |
|--------|----------------|
| `validators/` + `strict-json/` | Structural intake, forbidden fields |
| `semantic-policy/` | Deterministic semantic rules (8 rules) |
| `token-broker/` | Parameter-bound capability issuance |
| `tool-executor/` | Pre-execution verification |
| `memory-firewall/` | Memory write/read gating |
| `egress-firewall/` | Output contraction |
| `revocation-engine/` | Kill switch, heartbeat, in-flight races |
| `telemetry/` + `audit/` | Append-only observability |
| `scenario-engine/` | Runnable demo scenarios |

## Deferred / later milestones

- Live egress transmission (`egress_transmitted: true`)
- Real asymmetric token signing (M5 uses `mock_sig_v1:`)
- Persistent memory store
- Production T3 `real_write` with live network
- Advisory LLM classifier (M3 foundation only)

## Prototype reference

Preserved on branch `prototype/t3-validated` and tag `prototype-t3-validated-v1`.

## Validation

```bash
npm run ci          # test + build + lint + demo:all + dashboard pytest
npm run demo:all    # scenario regression only
streamlit run dashboard/app.py
```
