# Architecture (M0 placeholder)

## Layers

```
┌─────────────────────────────────────────┐
│  dashboard / demo / scripts               │
├─────────────────────────────────────────┤
│  packages/core (containment domain)     │
│    └── depends on AnchorAdapter only    │
├─────────────────────────────────────────┤
│  packages/t3-adapter (T3 port)          │
│    └── implements AnchorAdapter         │
└─────────────────────────────────────────┘
```

## Trust thesis

Containment reduces blast radius. Hashing, attestation, and T3 anchoring prove **release integrity** and **operational bounds** — not inherent model safety under all inputs.

## M0 non-goals

- Policy engine, RAG firewall, audit ledger (future milestones)
- Live LLM calls
- Production T3 contract registration or secrets map writes
