# Sovereign AI Containment Layer

**M0 skeleton only** — clean architecture rebuild. No payment execution, no secrets, no production T3 writes.

We do **not** claim that an LLM is inherently safe. We claim that an autonomous agent can only operate inside a **certified, hash-locked, attested, policy-bound, auditable, and revocable** containment layer.

## Repository strategy

| Branch / tag | Purpose |
|--------------|---------|
| `prototype/t3-validated` | Preserved working prototype (reference) |
| `prototype-t3-validated-v1` | Immutable tag on prototype state |
| `clean-main` | Architecture-aligned rebuild (**this branch**) |
| `main` | Prior integration history |

Old T3/contract code is **not** deleted — it remains on the prototype branch for reference. Only useful anchoring logic will be ported later into `packages/t3-adapter`.

## Layout (M0)

```text
docs/                    Locked architecture & roadmap placeholders
packages/core/           Containment domain (no T3 contract deps)
packages/t3-adapter/     AnchorAdapter interface placeholder
dashboard/               Streamlit control-plane shell
demo/scenarios/          Scenario fixture placeholders
data/telemetry/          Telemetry JSONL placeholder
tests/                   Integration + dashboard tests
scripts/                 Demo script stubs
```

## Quick start

```bash
npm install
npm run build
npm test
```

```bash
pip install -r dashboard/requirements.txt
# or: python3 -m venv .venv && .venv/bin/pip install -r dashboard/requirements.txt
python -m pytest tests/dashboard
streamlit run dashboard/app.py
```

## M0 boundaries

- `packages/core` defines abstract root objects — no `@terminal3/t3n-sdk`
- `packages/t3-adapter` defines `AnchorAdapter` / `AnchorReceipt` placeholder
- Dashboard components are shells — no weakened policy paths for UI convenience

See `docs/MASTER_ARCHITECTURE_SPEC.md` and `docs/MILESTONE_ROADMAP.md`.

**Do not proceed to M1 until M0 is reviewed.**
