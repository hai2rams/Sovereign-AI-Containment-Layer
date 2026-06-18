# Sovereign AI Containment Layer — Project Roadmap

## Project name

**Sovereign AI Containment Layer**

## Project thesis

We do **not** prove that an LLM is inherently safe. We prove that an autonomous AI agent can only operate inside a **certified, hash-locked, attested, policy-bound, auditable, and revocable** containment layer.

## Current status

| Item | Status |
|------|--------|
| **Active milestone** | M6 — RAG Firewall + Source Trust Engine |
| **Next milestone** | M6 — RAG Firewall + Source Trust Engine |
| **API default port** | `4100` |
| **Repository** | https://github.com/hai2rams/Sovereign-AI-Containment-Layer |

## Milestone tracker

### M0 — Project Skeleton + API Smoke Test

**Status:** Completed

**Success criteria:**

- [x] Clean project structure exists
- [x] API server runs on port 4100
- [x] `/health` works
- [x] `/t3/status` works
- [x] Pushed to GitHub

**Testing requirements:**

- `npm run test -w @sovereign/api` (health + T3 status shape)
- Manual curl: `curl -s http://localhost:4100/health | jq`
- Manual curl: `curl -s http://localhost:4100/t3/status | jq`

---

### M0.5 — Roadmap / Autopilot Docs / Architecture Decisions

**Status:** Completed

**Success criteria:**

- [x] `docs/PROJECT_ROADMAP.md` exists
- [x] `docs/AUTOPILOT_RULES.md` exists
- [x] `docs/ARCHITECTURE_DECISIONS.md` exists
- [x] README links to docs
- [x] Pushed to GitHub

**Testing requirements:**

- Verify all three tracking docs exist and README links resolve
- `npm run test` (no regressions from doc-only changes)

---

### M1 — Agent Passport + Certified Control Artifacts

**Status:** Completed

**Success criteria:**

- [x] Certified artifacts exist
- [x] Real system/developer prompts exist
- [x] Deterministic hash bundle works
- [x] `artifacts/agent-passport.json` generated
- [x] `/passport/current` works
- [x] `/passport/generate` works
- [x] Tests pass
- [x] Pushed to GitHub

**Testing requirements:**

- `npm run test -w @sovereign/agent-passport`
- `npm run test -w @sovereign/api` (passport endpoints)
- `npm run generate-passport`
- Curl: `curl -s http://localhost:4100/passport/current | jq`
- Curl: `curl -s -X POST http://localhost:4100/passport/generate | jq`

---

### M2 — Local Agent Release Registry

**Status:** Completed

**Success criteria:**

- [x] Release registry exists
- [x] Statuses supported: `draft`, `certified`, `suspended`, `revoked`, `under_review`
- [x] Generated passport can be registered
- [x] Release status can be queried
- [x] Revoked release blocks future sensitive action
- [x] Tests pass
- [x] Pushed to GitHub

**Testing requirements:**

- Unit + integration tests for registry CRUD and status transitions
- Test that revoked release blocks sensitive action paths
- Curl: release register, status query, and sensitive-action check endpoints

---

### M3 — Mock Attestation Verifier

**Status:** Completed

**Success criteria:**

- [x] Nonce challenge created
- [x] Mock attestation quote verified
- [x] Release ID checked
- [x] Measurement hash checked
- [x] Policy hash checked
- [x] `debug=false` checked
- [x] Stale nonce rejected
- [x] Revoked release rejected
- [x] Tests pass
- [x] Pushed to GitHub

**Testing requirements:**

- Positive and negative attestation verification cases
- Nonce expiry and replay rejection tests
- See `docs/attestation.md` for curl examples

---

### M4 — Deterministic Policy Engine

**Status:** Completed

**Success criteria:**

- [x] Strict JSON action proposal validation
- [x] Allowed action names only
- [x] Unknown fields rejected
- [x] Malformed JSON rejected
- [x] Amount limit enforced
- [x] Destination allowlist enforced
- [x] Source trust level enforced
- [x] Missing attestation blocks sensitive actions
- [x] Revoked release blocks sensitive actions
- [x] Policy override attempts blocked
- [x] `/policy/evaluate` works
- [x] Tests pass
- [x] Pushed to GitHub

**Testing requirements:**

- `npm run test -w @sovereign/policy-engine`
- Table-driven policy tests from `configs/certified-artifacts/policy-rules.json`
- No LLM calls in policy evaluation tests
- Curl: `curl -s -X POST http://localhost:4100/policy/evaluate -H 'Content-Type: application/json' -d '...' | jq`
- See `docs/policy-engine.md` for request examples

---

### M5 — T3-Style Action Token Broker

**Status:** Completed

**Success criteria:**

- [x] Short-lived capability-scoped action tokens issued
- [x] Token bound to agent DID, release ID, attestation ID, session ID, action, policy hash, expiry
- [x] Token bound to max amount and allowed destination where applicable
- [x] Expired token rejected
- [x] Wrong action rejected
- [x] Wrong release rejected
- [x] Revoked release rejected
- [x] Token does not expose secrets
- [x] `/tokens/issue` works
- [x] `/tokens/verify` works
- [x] Tests pass
- [x] Pushed to GitHub

**Testing requirements:**

- Token issuance, validation, expiry, and action-mismatch tests
- Integration with `@sovereign/t3-adapter` where appropriate (no live transactions)
- Curl: `/tokens/issue` and `/tokens/verify` smoke tests

---

### M6 — RAG Firewall + Source Trust Engine

**Status:** Pending

**Success criteria:**

- [ ] Untrusted text scanner implemented
- [ ] Unicode normalization implemented
- [ ] Hidden text removal implemented
- [ ] HTML/script stripping implemented
- [ ] Indirect prompt injection detection implemented
- [ ] Source trust levels assigned
- [ ] Public web forces `read_only` / degraded mode
- [ ] Unknown/adversarial source forces quarantine
- [ ] `/rag/scan` works
- [ ] Tests pass with malicious document examples
- [ ] Pushed to GitHub

**Testing requirements:**

- Fixture corpus for injection patterns and sanitization edge cases
- No live RAG retrieval or LLM calls
- Curl: `/rag/scan` with malicious document fixtures

---

### M7 — Memory Firewall

**Status:** Pending

**Success criteria:**

- [ ] Memory writes require source label
- [ ] Memory writes require expiry
- [ ] Memory cannot modify policy
- [ ] Memory cannot modify tool permissions
- [ ] Memory cannot increase privilege
- [ ] Public web memory writes blocked
- [ ] Unknown source memory writes blocked
- [ ] Revoked memory ignored
- [ ] Tests pass
- [ ] Pushed to GitHub

**Testing requirements:**

- Memory write allow/deny matrix by source trust level
- Privilege escalation attempt tests

---

### M8 — Output / Egress Firewall

**Status:** Pending

**Success criteria:**

- [ ] Strict output schema validation
- [ ] Unknown fields rejected
- [ ] High-entropy fields blocked
- [ ] Hidden Unicode blocked
- [ ] Suspicious encoded values blocked
- [ ] Free-form sensitive comments blocked
- [ ] Response normalization implemented
- [ ] Tests pass
- [ ] Pushed to GitHub

**Testing requirements:**

- Schema validation and egress allowlist tests
- No outbound calls except approved placeholder endpoints

---

### M9 — Audit Ledger + State Roots

**Status:** Pending

**Success criteria:**

- [ ] Sensitive actions create signed audit receipt
- [ ] Blocked actions create audit receipt
- [ ] Quarantine events create audit receipt
- [ ] Receipt includes agent DID, release ID, attestation ID, policy hash, `previous_state_root`, `new_state_root`
- [ ] State root changes deterministically
- [ ] Tests pass
- [ ] Pushed to GitHub

**Testing requirements:**

- Receipt structure and hash-chain / state-root continuity tests

---

### M10 — Revocation + Quarantine Engine

**Status:** Pending

**Success criteria:**

- [ ] Session quarantine implemented
- [ ] Token revocation implemented
- [ ] Memory freeze implemented
- [ ] Tool disablement implemented
- [ ] Release suspension implemented
- [ ] Release revocation implemented
- [ ] Human review status supported
- [ ] Revoked release blocks sensitive actions across policy/token/attestation flow
- [ ] Tests pass
- [ ] Pushed to GitHub

**Testing requirements:**

- Cross-module revocation propagation tests (policy, token, attestation)
- Quarantine state transition tests

---

### M11 — Clinical Trial / Red-Team Scenario Engine

**Status:** Pending

**Success criteria:**

- [ ] Scenario runner implemented
- [ ] Tests prompt injection, RAG injection, tool abuse, memory poisoning, data exfiltration, unauthorized payment, semantic steganography, policy downgrade, rollback replay, fake compliance, production-only trigger, confused-deputy attack
- [ ] Outputs behavioral certification profile
- [ ] Statuses: `approved`, `approved_with_controls`, `rejected`, `under_review`
- [ ] Tests pass
- [ ] Pushed to GitHub

**Testing requirements:**

- Scenario fixture suite covering all listed attack classes
- No real LLM, payments, or production triggers

---

### M12 — End-to-End Attack Demo Flow

**Status:** Pending

**Success criteria:**

- [ ] Malicious invoice attack simulated
- [ ] Invoice contains hidden instruction to transfer $5000 to attacker
- [ ] RAG firewall scans input
- [ ] Mocked core model proposes bad action
- [ ] Policy engine blocks action
- [ ] Action token is denied or not issued
- [ ] Audit receipt generated
- [ ] Session enters degraded/quarantine mode
- [ ] `/demo/attack-flow` works
- [ ] Curl demo works
- [ ] Tests pass
- [ ] Pushed to GitHub

**Testing requirements:**

- End-to-end scenario test (no real LLM, no real payments)
- `curl` demo endpoint on port 4100

---

### M13 — Dashboard / Demo UI

**Status:** Pending

**Success criteria:**

- [ ] Dashboard shows agent passport
- [ ] Release status
- [ ] Attestation result
- [ ] Policy decision
- [ ] Token status
- [ ] RAG scan result
- [ ] Audit receipt
- [ ] Quarantine/revocation status
- [ ] Demo attack flow visible
- [ ] Tests/build pass
- [ ] Pushed to GitHub

**Testing requirements:**

- UI smoke tests or component tests for each containment surface
- `npm run build` for dashboard app

---

### M14 — T3 Adapter Real Contract Anchoring

**Status:** Pending

**Success criteria:**

- [ ] Existing T3 contract ID used as trust anchor
- [ ] Release hash bundle can be anchored or simulated cleanly
- [ ] Audit/revocation references can be anchored or simulated cleanly
- [ ] Real secrets are not committed
- [ ] Fallback local mode still works
- [ ] Tests pass
- [ ] Pushed to GitHub

**Testing requirements:**

- T3 adapter integration tests with mock/local fallback
- Verify no secrets in committed files
- See `docs/reuse-map.md` for adapter extraction notes

---

### M15 — Final Hardening, Docs, README, Pitch Script

**Status:** Pending

**Success criteria:**

- [ ] README explains architecture clearly
- [ ] Docs explain trust claim and non-claim
- [ ] Curl demo commands documented
- [ ] Attack demo documented
- [ ] No overclaim of “AI is fully safe”
- [ ] Final positioning sentence included
- [ ] Tests pass
- [ ] Build passes
- [ ] Pushed to GitHub

**Testing requirements:**

- Full `npm run test` and `npm run build`
- Manual review of README and docs for accurate trust positioning
- Complete curl smoke test per `docs/curl-smoke-test.md`

---

## Global testing requirements

After **every** milestone:

1. `npm run typecheck` (if configured)
2. `npm run build` (if packages changed)
3. `npm run test` (all workspaces)
4. Curl smoke tests when API surface changes — see `docs/curl-smoke-test.md`

## Push / commit rules

- Commit **only** when tests pass for the completed milestone scope
- **Never** commit `.env`, credentials, or private keys
- **Never** force push to `main`
- Use clear milestone-scoped commit messages (e.g. `Milestone 4: Deterministic Policy Engine`)
- Push to `origin main` after successful local verification
- One logical milestone per commit series when possible

## Stop conditions

Autopilot and contributors must **stop** and request human review when:

1. Tests fail and cannot be fixed safely within the milestone scope
2. Build fails and cannot be fixed safely within the milestone scope
3. Server cannot start on port 4100
4. `git push` fails (auth, conflicts, permissions)
5. Force push would be required
6. A private key, API key, token, seed phrase, or other secret is detected in staged files
7. A change would trigger a **real external transaction** (payments, on-chain writes, production T3 mutations)
8. An architecture decision is ambiguous and affects multiple packages
9. A milestone success criterion would require violating the project thesis (e.g., claiming inherent model safety)

## Related documents

- [AUTOPILOT_RULES.md](./AUTOPILOT_RULES.md) — execution guardrails
- [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md) — ADR log
- [agent-passport.md](./agent-passport.md) — M1 — Agent Passport
- [release-registry.md](./release-registry.md) — M2 — Release registry
- [attestation.md](./attestation.md) — M3 — Mock attestation verifier
- [policy-engine.md](./policy-engine.md) — M4 — Deterministic policy engine
- [reuse-map.md](./reuse-map.md) — T3 adapter extraction from reference project
- [curl-smoke-test.md](./curl-smoke-test.md) — API curl verification commands
