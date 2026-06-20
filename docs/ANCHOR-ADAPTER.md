# Anchor adapter boundary

`packages/core` depends on the abstract `AnchorAdapter` interface — never on `@terminal3/t3n-sdk` or contract code directly.

## Anchored roots

| Root | Purpose |
|------|---------|
| `releaseHashRoot` | Certified release / passport bundle commitment |
| `policyHash` | Certified policy rules commitment |
| `auditStateRoot` | Audit ledger hash chain head |
| `revocationStateRoot` | Revocation / quarantine state commitment |

## Implementations

| Package | Role |
|---------|------|
| `@sovereign/core` | Defines `AnchorAdapter`, `LocalAnchorAdapter` (dev stub) |
| `@sovereign/t3-adapter` | `T3AnchorAdapter` — ports T3N session; M0 stubs writes |

M0: `T3AnchorAdapter` supports read/status only. Anchor write methods return `mode: "deferred"` without production T3 mutations.
