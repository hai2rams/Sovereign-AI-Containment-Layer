# Policy Engine (Milestone 4)

Deterministic evaluation of strict JSON action proposals.

```bash
curl -s -X POST http://localhost:4100/policy/evaluate \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "payment.transfer",
    "parameters": { "amount": 25, "currency": "USD", "destination": "approved-vendor-001" },
    "source_trust_level": 1,
    "session_id": "session-1",
    "release_id": "release-2026-06-23-v1",
    "attestation_id": "attest_demo",
    "evidence_summary": "Approved vendor invoice."
  }' | jq
```
