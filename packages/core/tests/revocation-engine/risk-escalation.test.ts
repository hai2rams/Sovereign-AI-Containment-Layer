import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { escalateRiskMode, killSwitchActive } from '../../src/revocation-engine/risk-escalation.js';

describe('risk-escalation', () => {
  it('escalates risk without downgrade', () => {
    assert.equal(escalateRiskMode('normal', 'quarantine'), 'quarantine');
    assert.equal(escalateRiskMode('quarantine', 'read_only'), 'quarantine');
    assert.equal(escalateRiskMode('revoked', 'quarantine'), 'quarantine');
    assert.equal(escalateRiskMode('quarantine', 'revoked'), 'quarantine');
  });

  it('detects kill switch modes', () => {
    assert.equal(killSwitchActive('quarantine'), true);
    assert.equal(killSwitchActive('revoked'), true);
    assert.equal(killSwitchActive('normal'), false);
  });
});
