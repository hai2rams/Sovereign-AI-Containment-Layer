# Sovereign AI Containment Layer

Architecture-first platform for sovereign AI containment: policy enforcement, attestation, memory/RAG firewalls, and an audit ledger — anchored on Terminal 3 (T3) for hardware-isolated trust.

## Status

**Phase 0 — foundation.** This repository contains the monorepo scaffold and a reusable `t3-adapter` package extracted from a prior reference project. Containment modules are placeholders until implemented.

## Layout

```
sovereign-ai-containment/
├── apps/           # API and dashboard applications (scaffold)
├── packages/       # Containment modules + shared libraries
├── configs/        # Environment templates and deployment config
├── scenarios/      # Future scenario fixtures (not hackathon logic)
├── tests/          # Cross-package integration tests
└── docs/           # Architecture and reuse documentation
```

## T3 integration

Reusable Terminal 3 client code lives in `packages/t3-adapter/`. See `docs/reuse-map.md` for what was carried over from the reference project and how the legacy trust anchor contract is referenced.

```bash
cp configs/.env.example configs/.env
# Fill T3N_API_KEY and trust-anchor settings, then:
npm install
npm run typecheck -w @sovereign/t3-adapter
```

## Reference project

The prior `t3-compliance-gateway` hackathon project is **read-only reference**. Do not develop new containment features there.
