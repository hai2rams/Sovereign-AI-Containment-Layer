# Sovereign AI Containment Layer

We do **not** claim the LLM is inherently safe. We claim autonomous agents can only operate inside a **certified, hash-locked, attested, policy-bound, auditable, and revocable** containment layer.

## What this repo is

A full architecture implementation — not just a judge demo. The **judge demo** is a curated proof slice (golden path, poisoned invoice, parameter swap, memory poisoning, plus optional revocation/telemetry scenarios). It demonstrates the containment claim visually; it does **not** define the full build scope.

See **`docs/MILESTONE_ROADMAP.md`** for the complete implementation roadmap (M0–M13) and the separate judge-demo track. **`docs/ARCHITECTURE_COVERAGE_MATRIX.md`** maps every locked architecture requirement to milestones so the demo cannot shrink the full product.

## Containment claim (demo narrative)

1. Model receives only a **sanitized task packet** — never private `StateEnvelope` fields.
2. Model emits only a structural **ActionProposal**.
3. **Deterministic semantic policy** decides if the action is meaningfully allowed — no LLM approval.
4. Tokens, tool verification, memory/egress firewalls, T3 anchoring, and revocation complete the control plane.

**Current progress:** M0–M13 complete on `clean-main` (full containment architecture foundation).

## Quick start

```bash
npm install && npm run build && npm test
npm run ci
```

## Dashboard (graphical workflow trace)

```bash
python3 -m venv .venv && .venv/bin/pip install -r dashboard/requirements.txt
.venv/bin/python -m pytest tests/dashboard
streamlit run dashboard/app.py
```

The dashboard includes a **telemetry-driven Graphviz workflow graph** (read-only presentation). Use the sidebar scenario selector to replay judge demo traces from `demo/replays/`. The graph visualizes untrusted model space vs trusted control plane — it does **not** enforce policy.

## Layout

```text
packages/core/        Containment domain (no direct T3 contract deps)
packages/t3-adapter/  Trust-anchor adapter boundary
dashboard/            Streamlit control plane (read-only presentation)
demo/scenarios/       Scenario fixtures (judge + full red-team)
demo/replays/         Dashboard telemetry replays
docs/                 Architecture specs and full roadmap
```

## Branches

| Branch / tag | Purpose |
|--------------|---------|
| `clean-main` | Architecture-aligned rebuild |
| `prototype/t3-validated` | Preserved working prototype |
| `prototype-t3-validated-v1` | Immutable prototype tag |

## Boundaries (always)

- No secrets committed · No production T3 writes without review · No payment execution in skeleton paths
- `packages/core` never imports T3 contract code directly
- Dashboard is read-only — graphical workflow is presentation only
