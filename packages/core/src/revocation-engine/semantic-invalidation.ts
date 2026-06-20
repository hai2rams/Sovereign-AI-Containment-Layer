import type { StateEnvelope } from '../types/state-envelope.js';
import { killSwitchActive } from './risk-escalation.js';
import type { SemanticRevocationOverride } from './types.js';

export function evaluateRevocationSemanticOverride(
  envelope: StateEnvelope,
): SemanticRevocationOverride {
  if (envelope.revocation_status === 'revoked' || envelope.risk_mode === 'revoked') {
    return {
      override: true,
      final_semantic_result: 'blocked',
      reason_codes: ['SESSION_REVOKED'],
    };
  }

  if (envelope.revocation_status === 'quarantined' || killSwitchActive(envelope.risk_mode)) {
    return {
      override: true,
      final_semantic_result: 'quarantine',
      reason_codes: ['SESSION_QUARANTINED'],
    };
  }

  if (envelope.revocation_status !== 'active') {
    return {
      override: true,
      final_semantic_result: 'blocked',
      reason_codes: ['RELEASE_REVOKED'],
    };
  }

  return {
    override: false,
    final_semantic_result: 'blocked',
    reason_codes: [],
  };
}
