# Architecture Coverage Matrix

> **The judge demo is a curated proof slice. The coverage matrix preserves the full locked architecture scope.**

This matrix maps every **locked v9/v10 architecture requirement** to an implementation milestone, test coverage, and scope classification. It exists so the judge demo cannot shrink or redefine the full product.

**Scope legend**

| Scope | Meaning |
|-------|---------|
| **Full Product** | Required for complete architecture implementation |
| **Presentation Slice** | Surfaced in judge demo only; full implementation still tracked separately |

**Status legend:** `Planned` · `In Progress` · `Complete` · `Deferred` · `Blocked`

---

## 1. Project thesis

| Architecture Requirement | Locked Rule | Implementation Milestone | Status | Test Coverage | Notes |
|--------------------------|-------------|--------------------------|--------|---------------|-------|
| LLM is untrusted compute | Model is never an authority for authorization | M0, M13 | Complete | `docs/`, README | Thesis stated in README and architecture docs |
| Model can propose but cannot authorize | Only structural `ActionProposal` from model; policy decides | M1, M2 | Complete | `action-proposal-validator.test.ts`, `semantic-policy-engine.test.ts` | Semantic engine is non-LLM |
| Corruption must be non-catastrophic | Blast radius bounded by containment layers | M0–M13 | In Progress | Partial (M1–M2) | Full layering completes M3–M9 |

---

## 2. StateEnvelope isolation

| Architecture Requirement | Locked Rule | Implementation Milestone | Status | Test Coverage | Notes |
|--------------------------|-------------|--------------------------|--------|---------------|-------|
| Private control-plane state | `StateEnvelope` never exposed to model | M1 | Complete | `state-envelope-validator.ts`, forbidden-fields tests | Schema in `types/state-envelope.ts` |
| Never sent to model | Runtime enforces packet boundary | M1, M11 | Complete / Planned | M1 validators | Dashboard wiring in M11 |
| Redacted summary only for dashboard | `safe_render` + redaction profiles | M11 | Planned | `tests/dashboard/test_dashboard_shell.py` (stub) | `dashboard/components/redaction.py` exists |

**Scope:** Full Product

---

## 3. SanitizedModelTaskPacket

| Architecture Requirement | Locked Rule | Implementation Milestone | Status | Test Coverage | Notes |
|--------------------------|-------------|--------------------------|--------|---------------|-------|
| Evidence only | No control-plane fields in packet | M1 | Complete | `sanitized-task-packet-validator.test.ts` | |
| Fixed `output_contract_id` | Must be `ACTION_PROPOSAL_V1` | M1 | Complete | `sanitized-task-packet-validator.test.ts` | Rejects `output_contract` string |
| No risk/revocation/token/key/state fields | Recursive forbidden-field rejection | M1 | Complete | `forbidden-fields.test.ts` | Shared with ActionProposal |

**Scope:** Full Product

---

## 4. Strict JSON intake

| Architecture Requirement | Locked Rule | Implementation Milestone | Status | Test Coverage | Notes |
|--------------------------|-------------|--------------------------|--------|---------------|-------|
| Duplicate key rejection | Custom parser; not `JSON.parse` alone | M1 | Complete | `strict-json-intake.test.ts` | `StrictJsonIntake.parseRejectingDuplicateKeys` |
| Parser differential prevention | Single canonical parse path before validation | M1 | Complete | `strict-json-intake.test.ts` | Parse-once at boundary |
| Malformed JSON rejection | Trailing commas, comments, NaN, Infinity rejected | M1 | Complete | `strict-json-intake.test.ts` | |
| Parse-once boundary | No re-parse after validation | M1 | In Progress | Unit tests | Runtime wiring in M6+ |

**Scope:** Full Product

---

## 5. Control-plane validators

| Architecture Requirement | Locked Rule | Implementation Milestone | Status | Test Coverage | Notes |
|--------------------------|-------------|--------------------------|--------|---------------|-------|
| Branded `AsciiSlug` | `^[A-Za-z0-9_.:-]{1,64}$`, no Unicode homoglyphs | M1 | Complete | `ascii-slug.test.ts` | |
| SHA-256 hash validation | `sha256:<64 lowercase hex>` | M1 | Complete | `sha256.test.ts` | |
| Positive safe integer minor units | `Number.isSafeInteger`, positive, not float/string | M1 | Complete | `positive-safe-integer.test.ts`, `action-proposal-validator.test.ts` | |
| Recursive forbidden-field rejection | 24+ forbidden control-plane field names | M1 | Complete | `forbidden-fields.test.ts` | `FORBIDDEN_CONTROL_PLANE_FIELDS` |

**Scope:** Full Product

---

## 6. Deterministic semantic policy engine

| Architecture Requirement | Locked Rule | Implementation Milestone | Status | Test Coverage | Notes |
|--------------------------|-------------|--------------------------|--------|---------------|-------|
| Destination allowlist | `DESTINATION_ALLOWLIST_RULE` | M2 | Complete | `destination-allowlist-rule.test.ts` | |
| Amount limit | `AMOUNT_LIMIT_RULE` | M2 | Complete | `amount-limit-rule.test.ts` | |
| Payment reference binding | `PAYMENT_REFERENCE_BINDING_RULE` | M2 | Complete | `payment-reference-binding-rule.test.ts` | |
| Source trust rules | `SOURCE_TRUST_ACTION_RULE` (tiers 0–5) | M2 | Complete | `source-trust-action-rule.test.ts` | |
| User role rules | `USER_ROLE_PERMISSION_RULE` | M2 | Complete | `semantic-policy-engine.test.ts` | Dedicated rule test via engine |
| Risk mode rules | `RISK_MODE_ACTION_RULE` | M2 | Complete | `risk-mode-action-rule.test.ts` | |
| Release status rules | `POLICY_RELEASE_STATUS_RULE` | M2 | Complete | `semantic-policy-engine.test.ts` | |
| Attestation required rules | `ATTESTATION_REQUIRED_RULE` | M2 | Complete | `semantic-policy-engine.test.ts` | |
| No LLM approval | `deterministic_semantic_rules_v1` only | M2 | Complete | `semantic-policy-engine.test.ts` | |

**Scope:** Full Product · Poisoned-invoice demo uses subset (**Presentation Slice** for narrative only)

---

## 7. Advisory classifier

| Architecture Requirement | Locked Rule | Implementation Milestone | Status | Test Coverage | Notes |
|--------------------------|-------------|--------------------------|--------|---------------|-------|
| One-way tripwire only | Classifier output cannot grant `allow` | M3 (planned module) | Planned | — | Not conflated with semantic engine |
| Can escalate risk | May raise `risk_mode` severity | M3, M9 | Planned | — | Never lowers risk |
| Cannot approve action | No bypass of semantic policy | M3 | Planned | — | Separate from M2 engine |

**Scope:** Full Product

---

## 8. Telemetry pipeline

| Architecture Requirement | Locked Rule | Implementation Milestone | Status | Test Coverage | Notes |
|--------------------------|-------------|--------------------------|--------|---------------|-------|
| Event envelope | Typed telemetry events | M3 | Planned | Placeholder in `telemetry/index.ts` | |
| Trace/span/event sequence | Ordered observability model | M3 | Planned | — | |
| Event hash chain | Tamper-evident sequence | M3 | Planned | — | |
| JSONL append-only stream | `data/telemetry/telemetry_stream.jsonl` | M3 | Planned | `telemetry_reader` (read stub) | Writer not yet implemented |
| Safe preview | Truncated fields for UI | M3, M11 | Planned | Dashboard tests | |
| Redaction profiles | Profile-driven field masking | M3, M11 | Planned | `redaction.py` stub | |

**Scope:** Full Product · Timeline panel is **Presentation Slice** in judge demo

---

## 9. Audit ledger

| Architecture Requirement | Locked Rule | Implementation Milestone | Status | Test Coverage | Notes |
|--------------------------|-------------|--------------------------|--------|---------------|-------|
| Audit receipts | `audit_receipt_id` in StateEnvelope | M3 | Planned | `audit/index.ts` placeholder | |
| State roots | `previous_state_root` / `current_state_root` | M1, M3, M4 | Partial | StateEnvelope schema | Anchoring in M4 |
| `t3_anchor_pending` | Pending anchor status before confirm | M4 | Planned | — | |
| No raw secrets | Redacted audit payloads | M3, M11 | Planned | — | |

**Scope:** Full Product

---

## 10. T3 adapter

| Architecture Requirement | Locked Rule | Implementation Milestone | Status | Test Coverage | Notes |
|--------------------------|-------------|--------------------------|--------|---------------|-------|
| Adapter boundary only | `packages/t3-adapter`; core has no SDK import | M0, M4 | Partial | `t3-adapter` placeholder tests | M0 interface only |
| Root anchoring only | release, policy, audit, revocation roots | M4 | Planned | — | No payment execution |
| No core dependency on contract | `AnchorAdapter` interface at boundary | M0, M4 | Partial | `m0-boundary.test.ts` | Port from prototype reference only |

**Scope:** Full Product · Header matrix roots are **Presentation Slice** until M4

---

## 11. Parameter-bound token broker

| Architecture Requirement | Locked Rule | Implementation Milestone | Status | Test Coverage | Notes |
|--------------------------|-------------|--------------------------|--------|---------------|-------|
| Parameter hash | Token bound to proposal digest | M5 | Planned | — | |
| Single-use token | JTI / consumption tracking | M5, M6 | Planned | — | |
| Short TTL | Expiring capability | M5 | Planned | — | |
| Signed capability | HMAC or asymmetric sign | M5 | Planned | — | |
| No token if policy blocks | Issuance gated on semantic `allowed` | M5 | Planned | — | `token_panel` is UI shell only |

**Scope:** Full Product

---

## 12. Key rotation and attested key registration

| Architecture Requirement | Locked Rule | Implementation Milestone | Status | Test Coverage | Notes |
|--------------------------|-------------|--------------------------|--------|---------------|-------|
| Key epoch | `key_epoch`, `current_key_epoch`, `previous_key_epoch` in envelope | M1, M12 | Partial | StateEnvelope schema | Runtime in M6+ |
| Signing key ID | Key identity in attestations | M6, M12 | Planned | — | |
| Key rotation certificate | Attested rotation artifact | M12 | Planned | — | |
| Planned dual-key window | `previous_key_valid_until_tick` | M1, M12 | Partial | Schema only | |
| Security-triggered old-key invalidation | Invalidate on escalation | M9, M12 | Planned | — | |

**Scope:** Full Product

---

## 13. Heartbeat renewal

| Architecture Requirement | Locked Rule | Implementation Milestone | Status | Test Coverage | Notes |
|--------------------------|-------------|--------------------------|--------|---------------|-------|
| Nonce-bound heartbeat | Replay-resistant renewal | M9, M12 | Planned | — | |
| Renewal ceilings | Max renewals per session | M9 | Planned | — | `renewal_in_flight` in envelope |
| Replay rejection | Duplicate nonce rejected | M9, M10 | Planned | — | Red-team: heartbeat replay |
| Epoch consistency | Heartbeat tied to containment epoch | M9 | Planned | — | |

**Scope:** Full Product

---

## 14. Tool executor verification

| Architecture Requirement | Locked Rule | Implementation Milestone | Status | Test Coverage | Notes |
|--------------------------|-------------|--------------------------|--------|---------------|-------|
| Independent verification | Executor separate from model path | M6 | Planned | — | |
| Signature check | Token/signature validation | M6 | Planned | — | |
| Parameter hash match | Proposal drift detection | M6 | Planned | — | Judge: parameter swap |
| Revocation epoch | Check against envelope | M6, M9 | Planned | — | |
| Containment epoch | Session epoch match | M6, M9 | Planned | — | |
| Key epoch | Signing epoch match | M6, M12 | Planned | — | |
| Idempotency | `idempotency_key` enforcement | M6 | Planned | — | In envelope schema |
| JTI | Single-use token ID | M5, M6 | Planned | — | |
| Freshness | TTL / tick window | M6 | Planned | — | |

**Scope:** Full Product · Parameter swap scenario is **Presentation Slice**

---

## 15. Memory firewall

| Architecture Requirement | Locked Rule | Implementation Milestone | Status | Test Coverage | Notes |
|--------------------------|-------------|--------------------------|--------|---------------|-------|
| Memory write validation | Quota counters enforced | M7 | Planned | `MemoryQuotaState` in schema | |
| Strict metadata schema | Typed memory metadata | M7 | Planned | — | |
| Inert evidence payload | No executable content in memory store | M7 | Planned | — | |
| Memory read revalidation | Re-check trust on read | M7 | Planned | — | |
| Trust depreciation | Decay on suspicious reads | M7 | Planned | — | |
| Quota and similarity throttling | Similarity violation counters | M7 | Planned | — | Fields in envelope |

**Scope:** Full Product · Memory poisoning replay is **Presentation Slice**

---

## 16. Output / egress firewall

| Architecture Requirement | Locked Rule | Implementation Milestone | Status | Test Coverage | Notes |
|--------------------------|-------------|--------------------------|--------|---------------|-------|
| Fixed-schema contracted output | Only allowed output shapes | M8 | Planned | — | |
| High-entropy output blocking | Exfil pattern detection | M8 | Planned | — | |
| Streaming disabled in quarantine | No stream egress when quarantined | M8, M9 | Planned | — | |
| Fixed-interval timing padding | Timing side-channel mitigation | M8 | Planned | — | |

**Scope:** Full Product

---

## 17. Revocation and quarantine engine

| Architecture Requirement | Locked Rule | Implementation Milestone | Status | Test Coverage | Notes |
|--------------------------|-------------|--------------------------|--------|---------------|-------|
| Session containment epoch | `containment_epoch` monotonic | M9 | Planned | Envelope schema | |
| Global/release revocation epoch | `revocation_epoch` + status | M9, M4 | Planned | — | T3 root in M4 |
| Risk escalation | Semantic → envelope `risk_mode` | M2, M9 | Partial | `semantic-policy-engine.test.ts` | Full kill switch in M9 |
| Kill switch behavior | Hard stop on revoke/quarantine | M9 | Planned | — | |

**Scope:** Full Product · Revocation race is **Presentation Slice** (optional judge scenario)

---

## 18. Red-team scenario engine

| Architecture Requirement | Locked Rule | Implementation Milestone | Status | Test Coverage | Notes |
|--------------------------|-------------|--------------------------|--------|---------------|-------|
| Poisoned invoice | Semantic block demonstration | M2, M10 | Partial | `semantic-policy-engine.test.ts`, fixtures | **Presentation Slice** + full harness M10 |
| Parameter swap | Executor verification failure | M6, M10 | Planned | `demo/scenarios/parameter-swap.json` | **Presentation Slice** |
| Memory poisoning | Memory firewall containment | M7, M10 | Planned | `demo/scenarios/memory-poisoning.json` | **Presentation Slice** |
| Duplicate JSON key | Strict JSON rejection | M1, M10 | Complete | `strict-json-intake.test.ts` | Full + demo |
| Revocation race | Epoch race handling | M9, M10 | Planned | `demo/scenarios/revocation-race.json` | Optional **Presentation Slice** |
| Heartbeat replay | Nonce replay rejection | M9, M10 | Planned | — | Full product |
| Telemetry spoofing | Hash chain / validation reject | M3, M10 | Planned | `demo/scenarios/telemetry-spoofing.json` | Optional **Presentation Slice** |

**Scope:** M10 = Full Product harness; individual scenarios marked above where demo-only narrative applies

---

## 19. Streamlit dashboard

| Architecture Requirement | Locked Rule | Implementation Milestone | Status | Test Coverage | Notes |
|--------------------------|-------------|--------------------------|--------|---------------|-------|
| Read-only visualization | No tool/payment execution from UI | M0, M11 | Partial | `tool_executor_panel` warning | |
| Split-screen model/control-plane view | `split_panels` layout | M0, M11 | Partial | `tests/dashboard` | Shell complete |
| Redaction mode | `redaction.py`, `safe_render.py` | M11 | Planned | `test_redaction` | |
| Timeline | Telemetry-driven timeline | M3, M11 | Planned | `test_telemetry_reader` | **Presentation Slice** |
| Telemetry chain status | Hash chain health display | M3, M11 | Planned | — | |
| Safe rendering only | No secret leakage | M11 | Planned | `safe_render.py` stub | |

**Scope:** Full Product (M11) · Judge walkthrough = **Presentation Slice**

---

## 20. AppTest and integration validation

| Architecture Requirement | Locked Rule | Implementation Milestone | Status | Test Coverage | Notes |
|--------------------------|-------------|--------------------------|--------|---------------|-------|
| Backend unit tests | Per-module validators and rules | M1, M2, M12 | Complete / Planned | 42 core tests (M1–M2) | |
| Integration tests | Cross-package boundary | M12 | Partial | `m0-boundary.test.ts` | Expand in M12 |
| Dashboard tests | Streamlit module imports | M12 | Partial | `tests/dashboard` (4 tests) | |
| Scenario replay tests | Golden vs `demo/expected/` | M10, M12 | Planned | Expected JSON stubs exist | |

**Scope:** Full Product

---

## Coverage summary (by milestone)

| Milestone | Architecture areas primarily covered | Overall status |
|-----------|--------------------------------------|----------------|
| M0 | Thesis docs, T3 boundary shell, dashboard shell | Complete |
| M1 | StateEnvelope, SanitizedPacket, Strict JSON, validators | Complete |
| M2 | Semantic policy (all 8 rules) | Complete |
| M3 | Advisory classifier, telemetry, audit (partial) | Planned |
| M4 | T3 adapter anchoring | Planned |
| M5 | Token broker | Planned |
| M6 | Tool executor verification | Planned |
| M7 | Memory firewall | Planned |
| M8 | Egress firewall | Planned |
| M9 | Revocation, quarantine, heartbeat | Planned |
| M10 | Red-team scenario engine | Planned |
| M11 | Full dashboard | Planned |
| M12 | AppTest / integration | In Progress |
| M13 | Thesis packaging, pitch material | Planned |

---

## Governance rule

When implementing or demoing:

1. **Never** mark a locked requirement `Deferred` solely because it is omitted from the judge demo.
2. **Always** update this matrix when a requirement changes status or gains test coverage.
3. **Judge demo** scenarios must reference matrix row IDs — they do not create new architecture scope.

**Related documents:** `docs/MILESTONE_ROADMAP.md`, `docs/M4_5_CONTROL_PLANE_BOUNDARY.md`, `docs/MASTER_ARCHITECTURE_SPEC.md`
