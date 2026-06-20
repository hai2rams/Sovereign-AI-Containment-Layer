# Master Architecture Specification

> **Status:** M4 — T3 adapter anchoring boundary implemented; core remains independent of T3 contract code.

## Thesis

Autonomous agents operate inside a certified, hash-locked, attested, policy-bound, auditable, and revocable containment layer. We do not claim inherent LLM safety.

## Layer model

| Layer | Package / path | Status |
|-------|----------------|--------|
| Domain core | `packages/core` | M1–M3 complete |
| Trust anchor port | `packages/t3-adapter` | M4 anchoring boundary |
| Control plane UI | `dashboard/` | Streamlit shell (read-only) |
| Demo & replay | `demo/` | Scenario fixtures |
| Telemetry | `data/telemetry/` | JSONL append-only |

## Boundary rules

- `packages/core` must **not** import T3 contract code or `@terminal3/t3n-sdk`.
- Root objects (release, policy, audit, revocation) are defined in core `types/`.
- Anchoring is implemented only in `packages/t3-adapter` behind `AnchorAdapter`.
- **T3 anchors root hashes only** — never raw prompts, documents, tokens, or private `StateEnvelope`.
- **T3 is not the policy authority** — local deterministic control plane remains authoritative.
- **`T3_ANCHOR_MODE=dry_run`** is default for local/demo; **`real_write`** requires explicit env gating.
- No payment execution or ungated production T3 writes.

## Prototype reference

Preserved on branch `prototype/t3-validated` and tag `prototype-t3-validated-v1`.
