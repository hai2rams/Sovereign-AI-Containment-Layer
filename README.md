# Sovereign AI Containment Layer

Architecture-first platform for sovereign AI containment: policy enforcement, attestation, memory/RAG firewalls, and an audit ledger — anchored on Terminal 3 (T3) for hardware-isolated trust.

## Status

**Phase 0 — foundation complete.** Milestone tracking and architecture docs are in place. See [PROJECT_ROADMAP.md](docs/PROJECT_ROADMAP.md) for the full milestone plan.

## Project tracking

| Document | Purpose |
|----------|---------|
| [docs/PROJECT_ROADMAP.md](docs/PROJECT_ROADMAP.md) | Milestones, success criteria, stop conditions |
| [docs/AUTOPILOT_RULES.md](docs/AUTOPILOT_RULES.md) | Autopilot execution and git guardrails |
| [docs/ARCHITECTURE_DECISIONS.md](docs/ARCHITECTURE_DECISIONS.md) | ADR log |

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

## API

The API runs on port **4100** by default (`PORT` in `configs/.env` overrides).

```bash
cp configs/.env.example configs/.env
npm install
npm run dev
```

```bash
curl -s http://localhost:4100/health | jq
curl -s http://localhost:4100/t3/status | jq
curl -s http://localhost:4100/t3/contract | jq
curl -s http://localhost:4100/passport/current | jq
```

See `docs/curl-smoke-test.md` for expected responses. Agent Passport details: `docs/agent-passport.md`.

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
