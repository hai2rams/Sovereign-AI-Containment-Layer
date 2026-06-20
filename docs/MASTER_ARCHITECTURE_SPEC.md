# Master Architecture Specification (M0 placeholder)

> **Status:** M0 skeleton — locked spec to be completed before M1 autopilot.

## Thesis

Autonomous agents operate inside a certified, hash-locked, attested, policy-bound, auditable, and revocable containment layer. We do not claim inherent LLM safety.

## Layer model

| Layer | Package / path | M0 status |
|-------|----------------|-----------|
| Domain core | `packages/core` | Scaffold |
| Trust anchor port | `packages/t3-adapter` | Interface placeholder |
| Control plane UI | `dashboard/` | Streamlit shell |
| Demo & replay | `demo/` | Fixture placeholders |
| Telemetry | `data/telemetry/` | JSONL placeholder |

## Boundary rules

- `packages/core` must **not** import T3 contract code or `@terminal3/t3n-sdk`.
- Root objects (release, policy, audit, revocation) are defined in core `types/`.
- Anchoring is implemented only in `packages/t3-adapter` behind `AnchorAdapter`.
- No payment execution or production T3 writes in M0.

## Prototype reference

Preserved on branch `prototype/t3-validated` and tag `prototype-t3-validated-v1`.
