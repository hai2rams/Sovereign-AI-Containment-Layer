export {
  REVOCATION_BLOCKED_REASONS,
  riskModeForRevocationStatus,
  type RevocationSignal,
  type RevocationBlockedReason,
  type RevocationTransitionRequest,
  type RevocationTransitionResult,
  type InFlightRaceRequest,
  type InFlightRaceResult,
  type HeartbeatRequest,
  type HeartbeatDecision,
  type HeartbeatResult,
  type RevocationStateRootInput,
  type EnvelopeRevocationGateResult,
  type SemanticRevocationOverride,
} from './types.js';

export { escalateRiskMode, riskModeForRevocationSignal, killSwitchActive } from './risk-escalation.js';
export { computeRevocationStateRoot } from './revocation-state-root.js';
export {
  applyRevocationSignal,
  revocationTransitionTelemetryId,
} from './revocation-transition.js';
export { resolveInFlightActionRace } from './in-flight-race.js';
export { isTokenInvalidatedByRevocation } from './token-invalidation.js';
export { evaluateEnvelopeRevocationGate } from './envelope-revocation-gate.js';
export { evaluateRevocationSemanticOverride } from './semantic-invalidation.js';
export {
  evaluateHeartbeat,
  DEFAULT_MAX_RENEWALS_PER_SESSION,
} from './heartbeat.js';
export {
  buildRevocationTransitionTelemetryPayload,
  buildHeartbeatTelemetryPayload,
  assertRevocationTelemetrySafe,
  type RevocationTelemetryPayload,
} from './revocation-telemetry.js';
