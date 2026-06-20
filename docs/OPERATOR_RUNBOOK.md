# Operator Runbook

## Prerequisites

- Node.js ≥ 20
- Python 3.11+ (dashboard)
- No secrets in repository — use `.env` locally (gitignored)

## Quick validation

```bash
npm install
npm run ci
```

## Run containment scenarios

```bash
# Single scenario
npm run demo -- --scenario=poisoned-invoice --compare-expected

# All architecture scenarios
npm run demo:all
```

Scenarios live in `demo/scenarios/`; golden outputs in `demo/expected/`.

## Dashboard (read-only)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r dashboard/requirements.txt
streamlit run dashboard/app.py
```

Telemetry source: `data/telemetry/telemetry_stream.jsonl` (falls back to `dashboard/fixtures/sample_telemetry.jsonl`).

## T3 anchoring

- Default: `T3_ANCHOR_MODE=dry_run` — no secrets required
- `real_write` requires explicit env vars; fails closed without them
- Adapter anchors **root hashes only** — never tokens, prompts, or envelopes

## Governance locks (do not violate)

1. Locked v9/v10 architecture is source of truth
2. Judge demo is presentation slice only
3. Dashboard is read-only
4. No real payment execution unless explicitly planned
5. No secrets committed
6. T3 adapter anchors roots only
7. Core control plane remains authoritative

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Scenario mismatch | `npm run demo -- --scenario=<id> --compare-expected` |
| Dashboard empty panels | Ensure `data/telemetry/telemetry_stream.jsonl` has `telemetry.v1` events |
| Token blocked unexpectedly | Check envelope `revocation_status` and `risk_mode` |
| Tool verification fails | Compare `revocation_epoch` / `parameter_hash` at execution time |
