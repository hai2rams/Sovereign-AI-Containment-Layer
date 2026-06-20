# Prototype reference

The working prototype (API on port 4100, agent passport, release registry, attestation, policy engine, action tokens) is preserved for reference.

| Reference | Location |
|-----------|----------|
| Branch | `prototype/t3-validated` |
| Tag | `prototype-t3-validated-v1` |
| Legacy T3 trust anchor (testnet contract id 15) | Documented in prototype `configs/trust-anchor.reference.json` |

```bash
git fetch origin
git checkout prototype/t3-validated
# or
git checkout prototype-t3-validated-v1
```

Do **not** merge prototype wholesale into `clean-main`. Port only vetted anchoring logic into `packages/t3-adapter`.
