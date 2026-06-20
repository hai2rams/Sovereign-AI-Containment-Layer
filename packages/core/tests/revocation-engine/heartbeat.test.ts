import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_MAX_RENEWALS_PER_SESSION,
  evaluateHeartbeat,
} from '../../src/revocation-engine/heartbeat.js';
import {
  assertRevocationTelemetrySafe,
  buildHeartbeatTelemetryPayload,
  buildRevocationTransitionTelemetryPayload,
} from '../../src/revocation-engine/revocation-telemetry.js';
import { applyRevocationSignal } from '../../src/revocation-engine/revocation-transition.js';
import { baseStateEnvelope, HEARTBEAT_NONCE, quarantinedEnvelope } from './fixtures.js';

describe('heartbeat', () => {
  it('allows nonce-bound heartbeat when epochs match', () => {
    const envelope = baseStateEnvelope({ containment_epoch: 7, renewal_in_flight: false });
    const result = evaluateHeartbeat({
      envelope,
      nonce: HEARTBEAT_NONCE,
      containment_epoch: 7,
      renewal_count: 1,
      seen_nonces: new Set(),
      max_renewals_per_session: DEFAULT_MAX_RENEWALS_PER_SESSION,
    });

    assert.equal(result.decision, 'allowed');
    assert.equal(result.renewal_permitted, true);
    assert.equal(result.containment_epoch_matches, true);
  });

  it('rejects heartbeat nonce replay', () => {
    const envelope = baseStateEnvelope({ containment_epoch: 7 });
    const seen = new Set<string>([HEARTBEAT_NONCE]);
    const result = evaluateHeartbeat({
      envelope,
      nonce: HEARTBEAT_NONCE,
      containment_epoch: 7,
      renewal_count: 1,
      seen_nonces: seen,
      max_renewals_per_session: DEFAULT_MAX_RENEWALS_PER_SESSION,
    });

    assert.equal(result.decision, 'blocked');
    assert.ok(result.reason_codes.includes('HEARTBEAT_NONCE_REPLAY'));
  });

  it('rejects heartbeat when renewal ceiling exceeded', () => {
    const envelope = baseStateEnvelope({ containment_epoch: 7 });
    const result = evaluateHeartbeat({
      envelope,
      nonce: HEARTBEAT_NONCE,
      containment_epoch: 7,
      renewal_count: DEFAULT_MAX_RENEWALS_PER_SESSION,
      seen_nonces: new Set(),
      max_renewals_per_session: DEFAULT_MAX_RENEWALS_PER_SESSION,
    });

    assert.equal(result.decision, 'blocked');
    assert.ok(result.reason_codes.includes('HEARTBEAT_RENEWAL_CEILING_EXCEEDED'));
  });

  it('rejects heartbeat on containment epoch mismatch', () => {
    const envelope = baseStateEnvelope({ containment_epoch: 8 });
    const result = evaluateHeartbeat({
      envelope,
      nonce: HEARTBEAT_NONCE,
      containment_epoch: 7,
      renewal_count: 0,
      seen_nonces: new Set(),
      max_renewals_per_session: DEFAULT_MAX_RENEWALS_PER_SESSION,
    });

    assert.equal(result.decision, 'blocked');
    assert.ok(result.reason_codes.includes('HEARTBEAT_CONTAINMENT_EPOCH_MISMATCH'));
  });

  it('rejects heartbeat when revocation blocks renewal', () => {
    const result = evaluateHeartbeat({
      envelope: quarantinedEnvelope({ containment_epoch: 8 }),
      nonce: HEARTBEAT_NONCE,
      containment_epoch: 8,
      renewal_count: 0,
      seen_nonces: new Set(),
      max_renewals_per_session: DEFAULT_MAX_RENEWALS_PER_SESSION,
    });

    assert.equal(result.decision, 'blocked');
    assert.ok(result.reason_codes.includes('HEARTBEAT_REVOCATION_BLOCKS_RENEWAL'));
  });
});

describe('revocation telemetry', () => {
  it('emits safe SESSION_RISK_STATE_UPDATED payloads', () => {
    const transition = applyRevocationSignal({
      envelope: baseStateEnvelope(),
      signal: 'quarantine',
      monotonic_tick: 10,
    });
    const transitionPayload = buildRevocationTransitionTelemetryPayload(transition, 'quarantine');
    assertRevocationTelemetrySafe(transitionPayload);
    assert.equal(transitionPayload.telemetry_event, 'SESSION_RISK_STATE_UPDATED');

    const heartbeatPayload = buildHeartbeatTelemetryPayload({
      decision: 'allowed',
      reason_codes: [],
      renewal_permitted: true,
      containment_epoch_matches: true,
    });
    assertRevocationTelemetrySafe(heartbeatPayload);
  });
});
