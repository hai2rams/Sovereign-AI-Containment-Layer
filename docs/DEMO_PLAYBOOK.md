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

## M7 — memory poisoning containment

Memory writes pass through `evaluateMemoryWrite` in `packages/core/src/memory-firewall`:

- Non-inert payloads (e.g. embedded scripts) are **blocked** with `MEMORY_PAYLOAD_NOT_INERT`.
- Duplicate and normalized-similar payloads are **blocked** (`DUPLICATE_PAYLOAD_DETECTED`, `SIMILAR_PAYLOAD_DETECTED`).
- Quota exceeded recommends quarantine escalation.

Covered by `packages/core/tests/memory-firewall/memory-firewall.test.ts`.

## Commands

```bash
# Run one scenario (JSON output)
npm run demo -- --scenario=golden-path

# Compare against golden expected output
npm run demo -- --scenario=poisoned-invoice --compare-expected

# Run all architecture scenarios
npm run demo:all
```

## Dashboard walkthrough

```bash
streamlit run dashboard/app.py
```

Panels derive state from `telemetry.v1` JSONL — semantic, tokens, tool executor, audit, blast radius, anchored roots.

## Scenario coverage

All six architecture scenarios are runnable via `scripts/run-demo.ts` and validated in CI (`npm run ci`).
