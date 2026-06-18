# curl smoke test

Quick checks for the Sovereign AI Containment Layer API. Default port is **4100** (override with `PORT` in `configs/.env`).

## Start the server

```bash
npm install
cp configs/.env.example configs/.env
# Optional: set T3N_API_KEY and T3N_CONTRACT_ID for live T3 endpoints
npm run dev
```

The API listens at `http://localhost:4100` unless `PORT` is set.

## Smoke tests

```bash
curl -s http://localhost:4100/health | jq
curl -s http://localhost:4100/t3/status | jq
curl -s http://localhost:4100/t3/contract | jq
curl -s http://localhost:4100/passport/current | jq
curl -s -X POST http://localhost:4100/passport/generate | jq
curl -s -X POST http://localhost:4100/releases/register -H 'Content-Type: application/json' -d '{"status":"draft"}' | jq
curl -s -X POST http://localhost:4100/releases/release-2026-06-23-v1/check-sensitive-action | jq
```

## Expected output (health)

```json
{
  "status": "ok",
  "service": "sovereign-ai-containment-api",
  "timestamp": "2026-06-18T12:00:00.000Z"
}
```

## Expected output (t3/status — not configured)

When `T3N_API_KEY` or `T3N_CONTRACT_ID` is missing:

```json
{
  "configured": false,
  "environment": "testnet",
  "contractId": null,
  "contractTail": "containment-trust-anchor-v1",
  "contractVersion": "0.1.0",
  "hasApiKey": false,
  "session": {
    "status": "not_configured",
    "tenantDid": null,
    "message": "Set T3N_API_KEY and T3N_CONTRACT_ID in configs/.env for live T3."
  }
}
```

## Expected output (t3/status — configured)

When credentials are present and T3N is reachable:

```json
{
  "configured": true,
  "environment": "testnet",
  "contractId": 15,
  "contractTail": "compliance-gateway-v1",
  "contractVersion": "0.1.0",
  "hasApiKey": true,
  "session": {
    "status": "connected",
    "tenantDid": "did:t3n:…",
    "message": "T3N session established."
  }
}
```

## Expected output (t3/contract)

Returns trust-anchor metadata and, when configured, invokes `get-compliance-snapshot` on the registered TEE contract.

```json
{
  "configured": true,
  "environment": "testnet",
  "contractId": 15,
  "contractTail": "compliance-gateway-v1",
  "contractVersion": "0.1.0",
  "invocation": {
    "contractTail": "compliance-gateway-v1",
    "contractVersion": "0.1.0",
    "result": {}
  },
  "message": "Trust-anchor contract invoked."
}
```

If T3 is not configured, `invocation` is `null` and `message` explains what to set in `configs/.env`.
