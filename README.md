# Sovereign AI Containment Layer

Clean architecture rebuild of the containment platform. We do **not** claim that an LLM is inherently safe. We claim that an autonomous agent can only operate inside a **certified, hash-locked, attested, policy-bound, auditable, and revocable** containment layer.

## Branches

| Branch / tag | Purpose |
|--------------|---------|
| `prototype/t3-validated` | Preserved working prototype (M0–M5 monorepo) |
| `prototype-t3-validated-v1` | Immutable tag on prototype state |
| `clean-main` | New architecture-aligned implementation (this branch) |
| `main` | Previous integration history |

The old T3/contract work remains on `prototype/t3-validated` for reference. It is **not** copied wholesale into `packages/core`.

## Layout (M0)

```
docs/                 Architecture and milestone docs
packages/core/        Containment domain — depends on AnchorAdapter only
packages/t3-adapter/  T3/T3E anchoring port (no direct use in core)
dashboard/            Streamlit operator UI skeleton
demo/                 Scenario fixtures (no live execution)
tests/                Cross-package tests
data/telemetry/       Local telemetry placeholders (gitignored JSON)
scripts/              Dev and ops scripts
```

## M0 scope

- Clean skeleton and documentation placeholders
- TypeScript `core` package with abstract `AnchorAdapter`
- `t3-adapter` with ported session/config and anchoring interface stubs
- Streamlit dashboard skeleton
- Demo scenario folders and test folders
- **No** real payment execution
- **No** secrets committed
- **No** production T3 writes yet

## Quick start

```bash
npm install
npm run build
npm run test
```

```bash
cd dashboard && pip install -r requirements.txt && streamlit run app.py
```

See `docs/README.md` for architecture notes and prototype reference.
