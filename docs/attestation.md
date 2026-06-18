# Mock Attestation (Milestone 3)

Challenge-response mock attestation for certified releases. No real TEE quotes.

## API (port 4100)

```bash
curl -s -X POST http://localhost:4100/attestation/challenge \
  -H 'Content-Type: application/json' \
  -d '{"release_id":"release-2026-06-23-v1"}' | jq

curl -s -X POST http://localhost:4100/attestation/verify \
  -H 'Content-Type: application/json' \
  -d '{
    "release_id": "release-2026-06-23-v1",
    "measurement_hash": "<bundle_root_hash>",
    "policy_hash": "<policy_rules_hash>",
    "debug": false,
    "nonce": "<nonce from challenge>",
    "issued_at": "2026-06-18T12:00:00.000Z"
  }' | jq
```

Verification checks: nonce freshness, release registration, non-revoked release, measurement hash, policy hash, `debug=false`.
