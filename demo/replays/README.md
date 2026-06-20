# Replay fixtures (dashboard presentation)

Telemetry replay traces for the read-only Streamlit workflow graph. Each file contains `telemetry.v1` events for a scenario:

| File | Scenario |
|------|----------|
| `golden-path.json` | Allowed containment path |
| `poisoned-invoice.json` | Semantic/policy block |
| `parameter-swap.json` | Tool executor `PARAMETER_HASH_MISMATCH` |
| `memory-poisoning.json` | Memory firewall block |
| `revocation-race.json` | Revocation epoch race |
| `telemetry-spoofing.json` | Broken telemetry hash chain |

Regenerate with:

```bash
python3 scripts/generate-dashboard-replays.py
```

These replays are **presentation only** — they do not execute tools or payments.
