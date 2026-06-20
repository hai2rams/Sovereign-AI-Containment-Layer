import type { AsciiSlug, Sha256Hex } from '../types/brands.js';
import type { RevocationStatus, RiskMode } from '../types/risk.js';
import type { StateEnvelope } from '../types/state-envelope.js';
import type { ParameterBoundActionToken } from '../token-broker/types.js';

export type RevocationSignal = 'quarantine' | 'revoke' | 'security_escalation';

export const REVOCATION_BLOCKED_REASONS = [
  'REVOCATION_STATE_INVALID',
  'IN_FLIGHT_REVOCATION_RACE',
  'IN_FLIGHT_CONTAINMENT_EPOCH_RACE',
  'KILL_SWITCH_ACTIVE',
  'HEARTBEAT_NONCE_REPLAY',
  'HEARTBEAT_RENEWAL_CEILING_EXCEEDED',
  'HEARTBEAT_CONTAINMENT_EPOCH_MISMATCH',
  'HEARTBEAT_REVOCATION_BLOCKS_RENEWAL',
  'HEARTBEAT_RENEWAL_IN_FLIGHT',
] as const;

export type RevocationBlockedReason = (typeof REVOCATION_BLOCKED_REASONS)[number];

export type RevocationTransitionRequest = {
  envelope: StateEnvelope;
  signal: RevocationSignal;
  monotonic_tick: number;
};

export type RevocationTransitionResult = {
  applied: boolean;
  reason_codes: RevocationBlockedReason[];
  previous_revocation_epoch: number;
  previous_containment_epoch: number;
  previous_revocation_state_root: Sha256Hex;
  updated_envelope: StateEnvelope;
  revocation_state_root: Sha256Hex;
  tokens_invalidated: boolean;
};

export type InFlightRaceRequest = {
  envelope: StateEnvelope;
  token: Pick<ParameterBoundActionToken, 'revocation_epoch' | 'containment_epoch' | 'risk_mode'>;
};

export type InFlightRaceResult = {
  race_lost: boolean;
  reason_codes: RevocationBlockedReason[];
  action_permitted: boolean;
};

export type HeartbeatRequest = {
  envelope: StateEnvelope;
  nonce: AsciiSlug;
  containment_epoch: number;
  renewal_count: number;
  seen_nonces: ReadonlySet<string>;
  max_renewals_per_session: number;
};

export type HeartbeatDecision = 'allowed' | 'blocked';

export type HeartbeatResult = {
  decision: HeartbeatDecision;
  reason_codes: RevocationBlockedReason[];
  renewal_permitted: boolean;
  containment_epoch_matches: boolean;
};

export type RevocationStateRootInput = {
  session_id: AsciiSlug;
  revocation_status: RevocationStatus;
  revocation_epoch: number;
  containment_epoch: number;
  security_escalation: boolean;
};

export type EnvelopeRevocationGateResult =
  | { allowed: true }
  | { allowed: false; reason_code: 'REVOCATION_STATE_INVALID' | 'KILL_SWITCH_ACTIVE' };

export type SemanticRevocationOverride = {
  override: boolean;
  final_semantic_result: 'blocked' | 'quarantine';
  reason_codes: string[];
};

export function riskModeForRevocationStatus(status: RevocationStatus): RiskMode {
  if (status === 'revoked') {
    return 'revoked';
  }
  if (status === 'quarantined') {
    return 'quarantine';
  }
  return 'normal';
}
