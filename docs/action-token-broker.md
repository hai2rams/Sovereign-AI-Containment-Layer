# Action Token Broker (Milestone 5)

```bash
curl -s -X POST http://localhost:4100/tokens/issue \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "payment.transfer",
    "parameters": { "amount": 25, "currency": "USD", "destination": "approved-vendor-001" },
    "source_trust_level": 1,
    "session_id": "session-1",
    "release_id": "release-2026-06-23-v1",
    "attestation_id": "attest_demo",
    "evidence_summary": "Vendor payment."
  }' | jq

curl -s -X POST http://localhost:4100/tokens/verify \
  -H 'Content-Type: application/json' \
  -d '{"token":"<token>","expected_action":"payment.transfer"}' | jq
```
