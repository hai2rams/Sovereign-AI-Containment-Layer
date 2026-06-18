# Sovereign AI Containment Layer — Project Roadmap

## Project name

**Sovereign AI Containment Layer**

## Project thesis

We do **not** prove that an LLM is inherently safe. We prove that an autonomous AI agent can only operate inside a **certified, hash-locked, attested, policy-bound, auditable, and revocable** containment layer.

## Current status

| Item | Status |
|------|--------|
| **Active milestone** | Milestone 4 — Deterministic Policy Engine |
| **Next milestone** | Milestone 4 — Deterministic Policy Engine |
| **API default port** | `4100` |
| **Repository** | https://github.com/hai2rams/Sovereign-AI-Containment-Layer |

## Milestone tracker

### Milestone 0: Project Skeleton + API Smoke Test

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

### Milestone 1: Agent Passport + Certified Control Artifacts

**Status:** Completed

**Success criteria:**

- [x] Certified artifact folder exists
- [x] System/developer prompts exist
- [x] Hash bundle generator works
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

### Milestone 2: Local Agent Release Registry

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
- Test that revoked release blocks sensitive action paths (stub/mock until policy engine wired)

---

### Milestone 3: Mock Attestation Verifier

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

---

### Milestone 4: Deterministic Policy Engine

**Status:** Pending

**Success criteria:**

- [ ] Strict JSON action proposal validation
- [ ] Amount limit enforced
- [ ] Destination allowlist enforced
- [ ] Source trust level enforced
- [ ] Missing attestation blocks sensitive actions
- [ ] Revoked release blocks sensitive actions
- [ ] Tests pass
- [ ] Pushed to GitHub

**Testing requirements:**

- Table-driven policy tests from `configs/certified-artifacts/policy-rules.json`
- No LLM calls in policy evaluation tests

---

### Milestone 5: T3-Style Action Token Broker

**Status:** Pending

**Success criteria:**

- [ ] Short-lived capability tokens issued
- [ ] Token bound to agent DID, release ID, attestation ID, session ID, action, policy hash, expiry
- [ ] Expired token rejected
- [ ] Wrong action rejected
- [ ] Tests pass
- [ ] Pushed to GitHub

**Testing requirements:**

- Token issuance, validation, expiry, and action-mismatch tests
- Integration with `@sovereign/t3-adapter` where appropriate (no live transactions)

---

### Milestone 6: RAG Firewall

**Status:** Pending

**Success criteria:**

- [ ] Untrusted text scanner implemented
- [ ] Unicode normalization
- [ ] Hidden text removal
- [ ] HTML/script stripping
- [ ] Indirect prompt injection detection
- [ ] Source trust level assignment
- [ ] Degraded/quarantine recommendation
- [ ] Tests pass
- [ ] Pushed to GitHub

**Testing requirements:**

- Fixture corpus for injection patterns and sanitization edge cases
- No live RAG retrieval or LLM calls

---

### Milestone 7: Memory Firewall

**Status:** Pending

**Success criteria:**

- [ ] Memory writes require source label
- [ ] Memory writes require expiry
- [ ] Memory cannot modify policy
- [ ] Memory cannot modify tool permissions
- [ ] Public web memory writes blocked
- [ ] Unknown source memory writes blocked
- [ ] Tests pass
- [ ] Pushed to GitHub

**Testing requirements:**

- Memory write allow/deny matrix by source trust level
- Privilege escalation attempt tests

---

### Milestone 8: Output / Egress Firewall

**Status:** Pending

**Success criteria:**

- [ ] Strict output schema validation
- [ ] Unknown fields rejected
- [ ] High-entropy fields blocked
- [ ] Hidden Unicode blocked
- [ ] Free-form sensitive comments blocked
- [ ] Tests pass
- [ ] Pushed to GitHub

**Testing requirements:**

- Schema validation and egress allowlist tests
- No outbound calls except approved placeholder endpoints

---

### Milestone 9: Audit Ledger

**Status:** Pending

**Success criteria:**

- [ ] Sensitive actions create audit receipt
- [ ] Blocked actions create audit receipt
- [ ] Quarantine events create audit receipt
- [ ] Receipt includes release ID, agent DID, policy hash, `previous_state_root`, `new_state_root`
- [ ] Tests pass
- [ ] Pushed to GitHub

**Testing requirements:**

- Receipt structure and hash-chain / state-root continuity tests

---

### Milestone 10: End-to-End Containment Demo

**Status:** Pending

**Success criteria:**

- [ ] Malicious invoice attack simulated
- [ ] RAG firewall scans input
- [ ] Mocked core model proposes bad action
- [ ] Policy engine blocks it
- [ ] Audit receipt generated
- [ ] Session enters degraded/quarantine mode
- [ ] Curl demo endpoint works
- [ ] Tests pass
- [ ] Pushed to GitHub

**Testing requirements:**

- End-to-end scenario test (no real LLM, no real payments)
- `curl` demo endpoint on port 4100

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
- Use clear milestone-scoped commit messages
- Push to `origin main` after successful local verification
- One logical milestone per commit series when possible

## Stop conditions

Autopilot and contributors must **stop** and request human review when:

1. Tests fail and cannot be fixed safely within the milestone scope
2. `git push` fails (auth, conflicts, permissions)
3. A private key, API key, or other secret is detected in staged files
4. A change would trigger a **real external transaction** (payments, on-chain writes, production T3 mutations)
5. An architecture decision is ambiguous and affects multiple packages
6. A milestone success criterion would require violating the project thesis (e.g., claiming inherent model safety)

## Related documents

- [AUTOPILOT_RULES.md](./AUTOPILOT_RULES.md) — execution guardrails
- [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md) — ADR log
- [agent-passport.md](./agent-passport.md) — Milestone 1 — Agent Passport
- [release-registry.md](./release-registry.md) — Milestone 2 — Release registry
- [reuse-map.md](./reuse-map.md) — T3 adapter extraction from reference project
