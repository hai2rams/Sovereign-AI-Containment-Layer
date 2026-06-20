# @sovereign/t3-adapter

T3/T3E trust-anchor port implementing `@sovereign/core`'s `AnchorAdapter`.

## M0

- Ported: `client.ts` (T3N session bootstrap), `config.ts` (env loading)
- Stubbed: contract execute, secrets map, register contract
- Anchor writes return `mode: "deferred"` — no production T3 mutations

## Environment (not committed)

```
T3N_API_KEY=
T3N_ENVIRONMENT=testnet
T3N_CONTRACT_ID=
T3N_CONTRACT_TAIL=containment-trust-anchor-v1
T3N_CONTRACT_VERSION=0.1.0
```

See prototype branch `prototype/t3-validated` for legacy contract reference.
