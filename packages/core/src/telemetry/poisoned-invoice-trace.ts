import { randomUUID } from 'node:crypto';
import { AuditLedger } from '../audit/audit-ledger.js';
import type { SemanticValidationResult } from '../semantic-policy/types.js';
import type { ActionProposal } from '../types/action-proposal.js';
import { evaluateSemanticPolicy } from '../semantic-policy/semantic-policy-engine.js';
import type { PaymentPolicyContext } from '../semantic-policy/types.js';
import type { StateEnvelope } from '../types/state-envelope.js';
import { TelemetryEmitter } from './telemetry-emitter.js';
import { TelemetryJsonlWriter } from './telemetry-jsonl-writer.js';
import type { TelemetryEventEnvelope } from './types.js';

export type PoisonedInvoiceTraceInput = {
  session_id: string;
  proposal: ActionProposal;
  envelope: StateEnvelope;
  policy: PaymentPolicyContext;
  writer_path: string;
};

/**
 * Deterministic poisoned-invoice containment trace — observes policy path only.
 * Does not emit StateEnvelope, idempotency_key, or token secrets.
 */
export function emitPoisonedInvoiceTrace(input: PoisonedInvoiceTraceInput): {
  events: TelemetryEventEnvelope[];
  semantic: SemanticValidationResult;
} {
  const writer = new TelemetryJsonlWriter(input.writer_path);
  const emitter = new TelemetryEmitter({
    session_id: input.session_id,
    trace_id: `trace-poisoned-invoice-${input.session_id}`,
    writer,
    redaction_profile: 'demo',
  });

  const rootSpan = randomUUID();

  emitter.emit('SESSION_STARTED', {
    release_id: input.envelope.release_id,
    risk_mode: input.envelope.risk_mode,
  });

  emitter.emit(
    'INPUT_SOURCE_CLASSIFIED',
    { source_trust_level: input.envelope.source_trust_level },
    randomUUID(),
    rootSpan,
  );

  emitter.emit(
    'SANITIZED_TASK_PACKET_CREATED',
    { task_id: 'poisoned-invoice-task', output_contract_id: 'ACTION_PROPOSAL_V1' },
    randomUUID(),
    rootSpan,
  );

  emitter.emit(
    'INFERENCE_PROPOSAL_INGESTED',
    {
      action: input.proposal.action,
      destination: input.proposal.destination,
      amount_minor_units: input.proposal.amount_minor_units,
    },
    randomUUID(),
    rootSpan,
  );

  emitter.emit('STRICT_JSON_INTAKE_COMPLETED', { duplicate_keys_rejected: true }, randomUUID(), rootSpan);
  emitter.emit('STRUCTURAL_VALIDATION_COMPLETED', { valid: true }, randomUUID(), rootSpan);

  const semantic = evaluateSemanticPolicy({
    proposal: input.proposal,
    envelope: input.envelope,
    policy: input.policy,
  });

  emitter.emit(
    'SEMANTIC_VALIDATION_COMPLETED',
    {
      final_semantic_result: semantic.final_semantic_result,
      reason_codes: semantic.reason_codes,
      accepted: semantic.accepted,
    },
    randomUUID(),
    rootSpan,
  );

  emitter.emitSkipped('ADVISORY_CLASSIFIER_COMPLETED', 'M3 placeholder — classifier not wired');
  emitter.emitSkipped('TOKEN_ISSUANCE_DECISION', 'M3 placeholder — token broker not wired');
  emitter.emitSkipped('TOOL_EXECUTOR_VERIFICATION_COMPLETED', 'M3 placeholder');
  emitter.emitSkipped('TOOL_EXECUTION_DECISION', 'M3 placeholder');

  emitter.emit(
    'POLICY_DECISION_ISSUED',
    {
      policy_decision: semantic.final_semantic_result === 'allowed' ? 'allow' : 'deny',
      engine: semantic.engine,
    },
    randomUUID(),
    rootSpan,
  );

  const ledger = new AuditLedger();
  const auditEntry = ledger.appendReceipt({
    receipt_id: `audit-${input.session_id}`,
    session_id: input.session_id,
    action: input.proposal.action,
    policy_decision: semantic.final_semantic_result === 'allowed' ? 'allow' : 'deny',
    event_hash: emitter.getEvents().at(-1)?.event_hash ?? '0'.repeat(64),
    reason_codes: semantic.reason_codes,
  });

  emitter.emit(
    'AUDIT_RECEIPT_WRITTEN',
    {
      receipt_id: auditEntry.receipt.receipt_id,
      previous_state_root: auditEntry.receipt.previous_state_root,
      current_state_root: auditEntry.receipt.current_state_root,
      t3_anchor_pending: auditEntry.receipt.t3_anchor_pending,
    },
    randomUUID(),
    rootSpan,
  );

  emitter.emit(
    'SESSION_RISK_STATE_UPDATED',
    { risk_mode: input.envelope.risk_mode },
    randomUUID(),
    rootSpan,
  );

  return {
    events: [...emitter.getEvents()],
    semantic,
  };
}
