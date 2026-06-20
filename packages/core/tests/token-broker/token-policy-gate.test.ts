import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  blockedSemantic,
  humanApprovalSemantic,
  quarantineSemantic,
  readOnlySemantic,
} from './fixtures.js';
import { evaluateTokenPolicyGate } from '../../src/token-broker/token-policy-gate.js';

describe('token-policy-gate', () => {
  it('1. blocks when semantic result is blocked', () => {
    const gate = evaluateTokenPolicyGate(blockedSemantic().final_semantic_result);
    assert.equal(gate.allowed, false);
    if (!gate.allowed) {
      assert.equal(gate.reason_code, 'POLICY_DECISION_BLOCKED');
    }
  });

  it('2. blocks when semantic result is quarantine', () => {
    const gate = evaluateTokenPolicyGate(quarantineSemantic().final_semantic_result);
    assert.equal(gate.allowed, false);
    if (!gate.allowed) {
      assert.equal(gate.reason_code, 'RISK_MODE_BLOCKS_TOKEN');
    }
  });

  it('3. blocks when semantic result is read_only', () => {
    const gate = evaluateTokenPolicyGate(readOnlySemantic().final_semantic_result);
    assert.equal(gate.allowed, false);
    if (!gate.allowed) {
      assert.equal(gate.reason_code, 'RISK_MODE_BLOCKS_TOKEN');
    }
  });

  it('4. blocks when semantic result requires_human_approval', () => {
    const gate = evaluateTokenPolicyGate(humanApprovalSemantic().final_semantic_result);
    assert.equal(gate.allowed, false);
    if (!gate.allowed) {
      assert.equal(gate.reason_code, 'POLICY_REQUIRES_HUMAN_APPROVAL');
    }
  });

  it('allows when semantic result is allowed', () => {
    const gate = evaluateTokenPolicyGate('allowed');
    assert.equal(gate.allowed, true);
  });
});
