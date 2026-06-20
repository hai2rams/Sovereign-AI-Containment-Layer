import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { applyRevocationSignal } from '../../src/revocation-engine/revocation-transition.js';
import { computeRevocationStateRoot } from '../../src/revocation-engine/revocation-state-root.js';
import { baseStateEnvelope } from './fixtures.js';

describe('revocation-transition', () => {
  it('applies quarantine signal with epoch bump and token invalidation', () => {
    const envelope = baseStateEnvelope({
      revocation_epoch: 42,
      containment_epoch: 7,
      risk_mode: 'normal',
      action_token_id: null,
    });

    const result = applyRevocationSignal({
      envelope,
      signal: 'quarantine',
      monotonic_tick: 100,
    });

    assert.equal(result.applied, true);
    assert.equal(result.updated_envelope.revocation_status, 'quarantined');
    assert.equal(result.updated_envelope.risk_mode, 'quarantine');
    assert.equal(result.updated_envelope.revocation_epoch, 43);
    assert.equal(result.updated_envelope.containment_epoch, 8);
    assert.equal(result.updated_envelope.policy_decision, 'deny');
    assert.equal(result.updated_envelope.action_token_id, null);
    assert.equal(result.tokens_invalidated, true);
    assert.notEqual(result.previous_revocation_state_root, result.revocation_state_root);
  });

  it('applies revoke signal without lowering from quarantine', () => {
    const envelope = baseStateEnvelope({
      risk_mode: 'quarantine',
      revocation_status: 'quarantined',
      revocation_epoch: 43,
      containment_epoch: 8,
    });

    const result = applyRevocationSignal({
      envelope,
      signal: 'revoke',
      monotonic_tick: 200,
    });

    assert.equal(result.updated_envelope.risk_mode, 'quarantine');
    assert.equal(result.updated_envelope.revocation_status, 'revoked');
    assert.equal(result.updated_envelope.release_status, 'revoked');
    assert.equal(result.updated_envelope.revocation_epoch, 44);
  });

  it('security escalation bumps key epoch', () => {
    const envelope = baseStateEnvelope({
      key_epoch: 3,
      current_key_epoch: 3,
      previous_key_epoch: 2,
    });

    const result = applyRevocationSignal({
      envelope,
      signal: 'security_escalation',
      monotonic_tick: 300,
    });

    assert.equal(result.updated_envelope.key_epoch, 4);
    assert.equal(result.updated_envelope.current_key_epoch, 4);
    assert.equal(result.updated_envelope.previous_key_epoch, 3);
    assert.equal(result.updated_envelope.security_escalation, true);
    assert.equal(result.updated_envelope.risk_mode, 'quarantine');
  });

  it('revocation state root is stable for same inputs', () => {
    const envelope = baseStateEnvelope();
    const direct = computeRevocationStateRoot({
      session_id: envelope.session_id,
      revocation_status: envelope.revocation_status,
      revocation_epoch: envelope.revocation_epoch,
      containment_epoch: envelope.containment_epoch,
      security_escalation: envelope.security_escalation,
    });
    const result = applyRevocationSignal({
      envelope,
      signal: 'quarantine',
      monotonic_tick: 1,
    });
    assert.notEqual(direct, result.revocation_state_root);
  });
});
