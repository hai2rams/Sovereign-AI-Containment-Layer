# Architecture Decision Records

Log of significant architecture decisions for the **Sovereign AI Containment Layer**.

Format: **ADR-NNN** — short title, status, context, decision, consequences.

---

## ADR-001: New clean project instead of mutating old repo

**Status:** Accepted

**Context:** A prior hackathon project (`t3-compliance-gateway`) mixed reusable T3 integration with demo agents, prompts, sponsor adapters, and scenario logic.

**Decision:** Use a new clean repository (`sovereign-ai-containment`) and copy **only** reusable T3 adapter logic from the previous project. Treat the old repo as read-only reference.

**Consequences:**

- Clear separation between containment architecture and hackathon demos
- Documented reuse map in `docs/reuse-map.md`
- No risk of dragging old naming or assumptions into the new system

---

## ADR-002: Claim containment, not inherent AI safety

**Status:** Accepted

**Context:** Marketing and safety claims for autonomous agents are often overstated. TEE hashing and passports can be misread as “the model is safe.”

**Decision:** The project does **not** claim the LLM is inherently safe. It claims **verifiable containment** — certified releases, policy bounds, attestation, audit, and revocation reduce blast radius.

**Consequences:**

- Agent Passport includes explicit `trust_claim` and `non_claim` fields
- System/developer prompts must refuse “fully safe model” claims
- Demo and docs language must align with containment framing

---

## ADR-003: LLM cannot execute tools directly

**Status:** Accepted

**Context:** Tool execution by an LLM without deterministic gates creates unbounded risk.

**Decision:** The model can only emit **structured JSON action proposals**. A **deterministic policy engine** (Milestone 4) authorizes or blocks actions. Tools are declared in the certified tool manifest but not invoked by the model.

**Consequences:**

- Action schema validation is a hard gate
- Policy engine is separate from any LLM adapter
- Action token broker (Milestone 5) binds approved capabilities

---

## ADR-004: T3 adapter is trust anchor interface

**Status:** Accepted

**Context:** Terminal 3 (T3N) provides hardware-isolated secrets maps and TEE contract execution. A legacy testnet contract exists from the reference project.

**Decision:** Reuse existing T3 contract/integration as a **trust anchor interface** through `packages/t3-adapter`. Every **certified release** still gets its own `release_id` and hash bundle (Agent Passport). T3 does not replace release-level identity.

**Consequences:**

- `T3N_CONTRACT_ID` references the trust anchor; release hashes are independent
- Sensitive actions eventually require attestation + action tokens
- Legacy contract id documented in `configs/trust-anchor.reference.json`

---

## ADR-005: Port 4100

**Status:** Accepted

**Context:** Port 3000 is occupied on the local development machine. Port 4000 was used by the legacy reference API.

**Decision:** The Sovereign AI Containment Layer API defaults to port **4100**. `PORT` in `configs/.env` overrides the default.

**Consequences:**

- `runtime-config.json` certified artifact records `default_port: 4100`
- Curl examples and smoke tests use `http://localhost:4100`
- `apps/api/src/port.ts` implements `DEFAULT_API_PORT = 4100`

---

## Template for future ADRs

```markdown
## ADR-NNN: Title

**Status:** Proposed | Accepted | Superseded

**Context:** …

**Decision:** …

**Consequences:** …
```
