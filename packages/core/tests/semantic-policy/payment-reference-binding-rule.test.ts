import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { asAsciiSlug } from '../../src/types/brands.js';
import { evaluatePaymentReferenceBindingRule } from '../../src/semantic-policy/rules/payment-reference-binding-rule.js';
import {
  baseActionProposal,
  baseStateEnvelope,
  DEFAULT_PAYMENT_POLICY,
} from './fixtures.js';

describe('PAYMENT_REFERENCE_BINDING_RULE', () => {
  it('passes for bound invoice reference', () => {
    const result = evaluatePaymentReferenceBindingRule({
      proposal: baseActionProposal(),
      envelope: baseStateEnvelope(),
      policy: DEFAULT_PAYMENT_POLICY,
    });
    assert.equal(result.result, 'passed');
  });

  it('fails for unknown payment reference', () => {
    const result = evaluatePaymentReferenceBindingRule({
      proposal: baseActionProposal({ payment_reference: asAsciiSlug('unknown-ref') }),
      envelope: baseStateEnvelope(),
      policy: DEFAULT_PAYMENT_POLICY,
    });
    assert.equal(result.result, 'failed');
    assert.equal(result.reason_code, 'PAYMENT_REFERENCE_UNKNOWN');
  });

  it('fails on destination mismatch', () => {
    const result = evaluatePaymentReferenceBindingRule({
      proposal: baseActionProposal({
        destination: asAsciiSlug('treasury-ops-account'),
        payment_reference: asAsciiSlug('invoice-123'),
      }),
      envelope: baseStateEnvelope(),
      policy: DEFAULT_PAYMENT_POLICY,
    });
    assert.equal(result.result, 'failed');
    assert.equal(result.reason_code, 'PAYMENT_REFERENCE_DESTINATION_MISMATCH');
  });
});
