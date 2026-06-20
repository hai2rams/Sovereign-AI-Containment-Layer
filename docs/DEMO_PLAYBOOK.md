# Demo Playbook

## Scenarios (`demo/scenarios/`)

| File | Intent |
|------|--------|
| `golden-path.json` | Certified release, policy allow, clean audit |
| `poisoned-invoice.json` | RAG / document injection attempt |
| `parameter-swap.json` | Tool argument tampering |
| `memory-poisoning.json` | Long-context memory abuse |
| `revocation-race.json` | Revocation vs in-flight action |
| `telemetry-spoofing.json` | Invalid / replayed telemetry |

## M6 — parameter swap containment proof

The Tool Executor **independently verifies** that an execution payload matches the parameter-bound token. Token Broker approval alone is not sufficient.

**Attack pattern:** token issued for `approved_vendor_001`, execution payload swaps `destination` to `attacker_account`.

**Expected outcome:** `decision: blocked`, `reason_codes: [PARAMETER_HASH_MISMATCH]`, no downstream tool call, no transaction.

Covered by `packages/core/tests/tool-executor/tool-executor-verifier.test.ts` (parameter swap test).

## Commands (future)

```bash
npx tsx scripts/run-demo.ts --scenario golden-path
npx tsx scripts/reset-demo.ts
npx tsx scripts/export-trace.ts
```

Scripts remain stubs until demo wiring milestones.
