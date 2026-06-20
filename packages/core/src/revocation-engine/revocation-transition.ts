import { asAsciiSlug } from '../types/brands.js';
import type { RevocationStatus } from '../types/risk.js';
import type { StateEnvelope } from '../types/state-envelope.js';
import { computeRevocationStateRoot } from './revocation-state-root.js';
import { riskModeForRevocationSignal } from './risk-escalation.js';
import type { RevocationTransitionRequest, RevocationTransitionResult } from './types.js';

function revocationStatusForSignal(signal: RevocationTransitionRequest['signal']): RevocationStatus {
  if (signal === 'revoke') {
    return 'revoked';
  }
  return 'quarantined';
}

export function applyRevocationSignal(
  request: RevocationTransitionRequest,
): RevocationTransitionResult {
  const { envelope, signal, monotonic_tick } = request;
  const previous_revocation_epoch = envelope.revocation_epoch;
  const previous_containment_epoch = envelope.containment_epoch;
  const previous_revocation_state_root = computeRevocationStateRoot({
    session_id: envelope.session_id,
    revocation_status: envelope.revocation_status,
    revocation_epoch: envelope.revocation_epoch,
    containment_epoch: envelope.containment_epoch,
    security_escalation: envelope.security_escalation,
  });

  const revocation_status = revocationStatusForSignal(signal);
  const revocation_epoch = envelope.revocation_epoch + 1;
  const containment_epoch = envelope.containment_epoch + 1;
  const risk_mode = riskModeForRevocationSignal(signal, envelope.risk_mode);
  const security_escalation = envelope.security_escalation || signal === 'security_escalation';

  let key_epoch = envelope.key_epoch;
  let current_key_epoch = envelope.current_key_epoch;
  let previous_key_epoch = envelope.previous_key_epoch;
  let previous_key_valid_until_tick = envelope.previous_key_valid_until_tick;

  if (signal === 'security_escalation') {
    previous_key_epoch = envelope.current_key_epoch;
    previous_key_valid_until_tick = monotonic_tick;
    key_epoch = envelope.key_epoch + 1;
    current_key_epoch = key_epoch;
  }

  const release_status = signal === 'revoke' ? 'revoked' : envelope.release_status;

  const updated_envelope: StateEnvelope = {
    ...envelope,
    revocation_status,
    revocation_epoch,
    containment_epoch,
    risk_mode,
    security_escalation,
    release_status,
    policy_decision: 'deny',
    action_token_id: null,
    renewal_in_flight: false,
    key_epoch,
    current_key_epoch,
    previous_key_epoch,
    previous_key_valid_until_tick,
    transaction_sequence_counter: envelope.transaction_sequence_counter + 1,
  };

  const revocation_state_root = computeRevocationStateRoot({
    session_id: updated_envelope.session_id,
    revocation_status: updated_envelope.revocation_status,
    revocation_epoch: updated_envelope.revocation_epoch,
    containment_epoch: updated_envelope.containment_epoch,
    security_escalation: updated_envelope.security_escalation,
  });

  return {
    applied: true,
    reason_codes: [],
    previous_revocation_epoch,
    previous_containment_epoch,
    previous_revocation_state_root,
    updated_envelope,
    revocation_state_root,
    tokens_invalidated: true,
  };
}

export function revocationTransitionTelemetryId(session_id: string, epoch: number): string {
  return asAsciiSlug(`revocation-transition-${session_id}-${epoch}`);
}
