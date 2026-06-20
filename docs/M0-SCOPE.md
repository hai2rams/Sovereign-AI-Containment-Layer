# M0 scope — clean rebuild

## Delivered in M0

- [x] Preserve prototype on `prototype/t3-validated` + tag `prototype-t3-validated-v1`
- [x] `clean-main` branch with architecture-aligned skeleton only
- [x] `packages/core` with abstract `AnchorAdapter`
- [x] `packages/t3-adapter` with ported session/config and anchoring stubs
- [x] Docs placeholders
- [x] Streamlit dashboard skeleton
- [x] Demo scenario folders
- [x] Test folders

## Explicit exclusions

- No copying of prototype `apps/api`, agent-passport, policy-engine, etc. into core
- No real payment execution
- No secrets in repository
- No production T3 writes (register contract, seal secrets) on this branch yet

## Next milestones (planned)

See prototype `docs/PROJECT_ROADMAP.md` on branch `prototype/t3-validated` for the full historical plan. Clean rebuild will re-derive milestones against this structure.
