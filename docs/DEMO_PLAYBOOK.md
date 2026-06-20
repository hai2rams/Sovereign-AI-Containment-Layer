# Demo Playbook (M0 placeholder)

## Scenarios (`demo/scenarios/`)

| File | Intent |
|------|--------|
| `golden-path.json` | Certified release, policy allow, clean audit |
| `poisoned-invoice.json` | RAG / document injection attempt |
| `parameter-swap.json` | Tool argument tampering |
| `memory-poisoning.json` | Long-context memory abuse |
| `revocation-race.json` | Revocation vs in-flight action |
| `telemetry-spoofing.json` | Invalid / replayed telemetry |

## M0

Fixtures describe scenario metadata only. `demo/expected/` and `demo/replays/` hold placeholders for future golden outputs.

## Commands (future)

```bash
npx tsx scripts/run-demo.ts --scenario golden-path
npx tsx scripts/reset-demo.ts
npx tsx scripts/export-trace.ts
```

M0: scripts exit 0 with stub messages only.
