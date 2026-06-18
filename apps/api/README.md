# API application

HTTP surface for the Sovereign AI Containment Layer.

## Default port

**4100** — set `PORT` in `configs/.env` to override.

## Run

```bash
npm run dev          # from repo root
npm run dev -w @sovereign/api
```

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness |
| GET | `/t3/status` | T3N configuration and session status |
| GET | `/t3/contract` | Trust-anchor contract metadata and snapshot invocation |

See `docs/curl-smoke-test.md` for curl examples.

## Tests

```bash
npm run test -w @sovereign/api
```

Tests bind an injected Express instance to a dynamic port (no hardcoded 3000/4100).
