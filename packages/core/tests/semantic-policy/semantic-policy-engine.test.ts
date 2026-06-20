import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { asAsciiSlug } from '../../src/types/brands.js';
import {
  applySemanticResultToEnvelope,
  evaluateSemanticPolicy,
  mapSemanticResultToPolicyDecision,
} from '../../src/semantic-policy/index.js';
import {
  baseActionProposal,
  baseStateEnvelope,
  DEFAULT_PAYMENT_POLICY,
} from './fixtures.js';

describe('SemanticPolicyEngine', () => {
  it('golden path allows certified payment', () => {
    const semantic = evaluateSemanticPolicy({
      proposal: baseActionProposal(),
      envelope: baseStateEnvelope({ source_trust_level: 1 }),
      policy: DEFAULT_PAYMENT_POLICY,
    });

    assert.equal(semantic.final_semantic_result, 'allowed');
    assert.equal(semantic.accepted, true);
    assert.equal(semantic.engine, 'deterministic_semantic_rules_v1');
    assert.equal(semantic.reason_codes.length, 0);

    const updated = applySemanticResultToEnvelope(baseStateEnvelope(), semantic);
    assert.equal(updated.policy_decision, 'allow');
    assert.equal(mapSemanticResultToPolicyDecision(semantic.final_semantic_result), 'allow');
  });

  it('poisoned invoice blocks with expected reason codes', () => {
    const semantic = evaluateSemanticPolicy({
      proposal: baseActionProposal({
        destination: asAsciiSlug('attacker-wallet'),
        amount_minor_units: 9_000_000,
        payment_reference: asAsciiSlug('fake-invoice'),
      }),
      envelope: baseStateEnvelope({ source_trust_level: 3 }),
      policy: DEFAULT_PAYMENT_POLICY,
    });

    assert.ok(['blocked', 'quarantine', 'requires_human_approval'].includes(semantic.final_semantic_result));
    assert.ok(semantic.reason_codes.includes('DESTINATION_NOT_ALLOWLISTED'));
    assert.ok(semantic.reason_codes.includes('AMOUNT_EXCEEDS_LIMIT'));
    assert.ok(semantic.reason_codes.includes('LOW_SOURCE_TRUST_FOR_STATE_CHANGE'));

    const updated = applySemanticResultToEnvelope(
      baseStateEnvelope({ source_trust_level: 3 }),
      semantic,
    );
    assert.notEqual(updated.policy_decision, 'allow');
  });

  it('escalates risk_mode to quarantine without lowering severity', () => {
    const envelope = baseStateEnvelope({ risk_mode: 'normal', source_trust_level: 5 });
    const semantic = evaluateSemanticPolicy({
      proposal: baseActionProposal(),
      envelope,
      policy: DEFAULT_PAYMENT_POLICY,
    });

    const updated = applySemanticResultToEnvelope(envelope, semantic);
    assert.equal(updated.risk_mode, 'quarantine');
  });

  it('does not lower risk_mode when semantic suggests read_only from lower severity', () => {
    const envelope = baseStateEnvelope({ risk_mode: 'quarantine', source_trust_level: 4 });
    const semantic = evaluateSemanticPolicy({
      proposal: baseActionProposal(),
      envelope,
      policy: DEFAULT_PAYMENT_POLICY,
    });

    const updated = applySemanticResultToEnvelope(envelope, semantic);
    assert.equal(updated.risk_mode, 'quarantine');
  });
});
