# Autopilot Rules — Sovereign AI Containment Layer

These rules govern automated and semi-automated development (autopilot mode). Follow them to preserve architecture control milestone by milestone.

## Execution order

1. **Implement one milestone at a time** — do not start the next milestone until the current milestone's success criteria are met.
2. Read `docs/PROJECT_ROADMAP.md` for the active milestone and success criteria before writing code.
3. Read `docs/ARCHITECTURE_DECISIONS.md` before making structural changes.

## Verification after each milestone

| Step | When |
|------|------|
| `npm run test` | **Always** — after each milestone |
| `npm run build` | When build scripts exist for changed packages |
| `npm run typecheck` | When TypeScript packages were modified |
| Curl verification | When API routes or response shapes changed — port **4100** |

Example curl checks:

```bash
curl -s http://localhost:4100/health | jq
curl -s http://localhost:4100/t3/status | jq
```

See `docs/curl-smoke-test.md` for the full list.

## Git rules

- **Commit and push only if tests pass** for the milestone scope
- **Never commit** `.env`, `.env.local`, or any file containing secrets
- **Never force push** (`git push --force`)
- Use milestone-focused commit messages
- Push to `origin main` after local verification

## Stop conditions — do not proceed

Stop immediately and escalate to a human when:

| Condition | Action |
|-----------|--------|
| Tests fail and cannot be fixed safely | Stop; document failure; do not commit |
| `git push` fails | Stop; do not retry with force push |
| Private key or secret detected in working tree / staged files | Stop; remove secret; never commit |
| Real external transaction would be triggered | Stop (payments, production contract registration, live token issuance) |
| Architecture decision is ambiguous | Stop; add ADR draft or ask for clarification |

## Scope boundaries (default)

Unless the active milestone explicitly requires it:

- **No real LLM API calls**
- **No RAG execution against live corpora**
- **No policy engine execution** (until Milestone 4)
- **No real TEE attestation** (until Milestone 3 mock verifier)
- **No mutating the old reference repo** (`t3-compliance-gateway`)

## Package boundaries

- T3 network integration stays in `packages/t3-adapter/`
- Agent Passport / release identity stays in `packages/agent-passport/` (Milestone 1+)
- API routes live in `apps/api/`
- Certified artifacts live in `configs/certified-artifacts/`
- Generated outputs (e.g. `artifacts/agent-passport.json`) stay gitignored

## Completion checklist

Before marking a milestone done in `PROJECT_ROADMAP.md`:

- [ ] All success criteria checked
- [ ] Tests pass
- [ ] Docs updated if behavior changed
- [ ] No secrets in `git diff`
- [ ] Committed and pushed to GitHub
