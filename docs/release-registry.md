# Release Registry

Local registry for Agent Passport releases and lifecycle status.

## Statuses

| Status | Sensitive actions |
|--------|-------------------|
| `draft` | Blocked |
| `certified` | Allowed |
| `suspended` | Blocked |
| `revoked` | Blocked |
| `under_review` | Blocked |

Storage: `artifacts/release-registry.json` (generated, gitignored).

## API (port 4100)

```bash
# Register current passport (generates passport if missing)
curl -s -X POST http://localhost:4100/releases/register \
  -H 'Content-Type: application/json' \
  -d '{"status":"draft"}' | jq

# Query release
curl -s http://localhost:4100/releases/release-2026-06-23-v1 | jq

# List releases
curl -s http://localhost:4100/releases | jq

# Update status
curl -s -X PATCH http://localhost:4100/releases/release-2026-06-23-v1/status \
  -H 'Content-Type: application/json' \
  -d '{"status":"revoked"}' | jq

# Check sensitive action gate
curl -s -X POST http://localhost:4100/releases/release-2026-06-23-v1/check-sensitive-action | jq
```

## Package API

See `@sovereign/agent-passport` exports: `registerRelease`, `getRelease`, `checkSensitiveActionAllowed`.
