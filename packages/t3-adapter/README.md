# @sovereign/t3-adapter

Reusable Terminal 3 (T3N) integration for the Sovereign AI Containment Layer.

Extracted and generalized from the reference `t3-compliance-gateway` project. Contains only SDK session bootstrap, secrets-map management, and contract registration/execution — no hackathon business logic.

## Capabilities

| Module | Purpose |
|--------|---------|
| `client.ts` | T3N handshake, SIWE auth, cached `TenantClient` session |
| `config.ts` | Environment-based adapter configuration |
| `secretsMap.ts` | Create `z::<tenant>:secrets` map and seal entries for contract-only ACL |
| `mapEntry.ts` | Optional control-plane map reads (returns null when unavailable) |
| `contractExecute.ts` | Invoke registered TEE contract functions |
| `registerContract.ts` | Register WASM contract → numeric `T3N_CONTRACT_ID` |

## Environment

Copy `configs/.env.example` to `configs/.env` and set:

- `T3N_API_KEY` — developer key from Terminal 3 ADK
- `T3N_ENVIRONMENT` — `testnet` or `production`
- `T3N_CONTRACT_ID` — numeric trust-anchor contract id after registration
- `T3N_CONTRACT_TAIL` / `T3N_CONTRACT_VERSION` — registration metadata
- `T3N_CONTRACT_WASM_PATH` — path to compiled WASM when registering a new contract
- `T3N_SECRETS_ENTRIES_JSON` — optional JSON object for `init:secrets-map`

## Scripts

```bash
npm run register:contract -w @sovereign/t3-adapter   # after WASM is built
npm run init:secrets-map -w @sovereign/t3-adapter    # after contract id is set
```

## Trust anchor

The legacy reference deployment (testnet) used contract id **15** with tail `compliance-gateway-v1`. This package does not ship that WASM contract; future containment modules will register their own trust-anchor contract and reference its id via `T3N_CONTRACT_ID`.

See `docs/reuse-map.md` and `configs/trust-anchor.reference.json`.
