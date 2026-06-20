# M4.5 Control Plane Boundary

## Principle

The Streamlit dashboard is a **read-mostly control plane**. It must not weaken containment boundaries for UI convenience.

## M1 implementation notes

- **StateEnvelope is private** to the containment runtime. It is never sent to the model.
- The model receives only **SanitizedModelTaskPacket** (sanitized, forbidden-field-scrubbed context).
- Model output is validated as **ActionProposal** only — six allowed fields, integer minor units.
- **Strict JSON intake** (`StrictJsonIntake.parseRejectingDuplicateKeys`) runs **before** schema validation. Normal `JSON.parse` is not sufficient for duplicate-key rejection.
- **Recursive forbidden-field rejection** blocks model attempts to inject control-plane fields (`risk_mode`, `policy_decision`, `action_token_id`, etc.) at any nesting depth.
- **Money uses integer minor units** (`amount_minor_units`) — no floats, strings, or unsafe integers.
- **`output_contract_id` is fixed** to `ACTION_PROPOSAL_V1`. The legacy `output_contract` string field is rejected.

## Rules

1. Dashboard reads telemetry and validated traces — it does not execute tools or payments.
2. All writes go through backend services with policy + token gates (future milestones).
3. `safe_render` redacts secrets before display.
4. No token broker, tool executor, or T3 writes in M1.

## Strict JSON intake limitations (M1)

Custom parser rejects duplicate keys, trailing commas, comments, `NaN`/`Infinity`, excessive depth, and oversized bodies. Unicode escapes in strings are supported per JSON. For production hardening, consider formal fuzzing and a dedicated JSON lexer audit in a later milestone.
