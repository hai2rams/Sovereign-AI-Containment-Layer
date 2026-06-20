import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evaluateRiskModeActionRule } from '../../src/semantic-policy/rules/risk-mode-action-rule.js';
import { baseActionProposal, baseStateEnvelope, DEFAULT_PAYMENT_POLICY } from './fixtures.js';

describe('RISK_MODE_ACTION_RULE', () => {
  it('passes in normal risk mode', () => {
    const result = evaluateRiskModeActionRule({
      proposal: baseActionProposal(),
      envelope: baseStateEnvelope({ risk_mode: 'normal' }),
      policy: DEFAULT_PAYMENT_POLICY,
    });
    assert.equal(result.result, 'passed');
  });

  it('blocks payment in quarantine', () => {
    const result = evaluateRiskModeActionRule({
      proposal: baseActionProposal(),
      envelope: baseStateEnvelope({ risk_mode: 'quarantine' }),
      policy: DEFAULT_PAYMENT_POLICY,
    });
    assert.equal(result.result, 'failed');
    assert.equal(result.reason_code, 'SESSION_QUARANTINED');
  });

  it('requires human approval in degraded mode', () => {
    const result = evaluateRiskModeActionRule({
      proposal: baseActionProposal(),
      envelope: baseStateEnvelope({ risk_mode: 'degraded' }),
      policy: DEFAULT_PAYMENT_POLICY,
    });
    assert.equal(result.result, 'failed');
    assert.equal(result.decision_on_fail, 'requires_human_approval');
  });
});
