import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { baseActionProposal } from './fixtures.js';
import {
  canonicalizeActionProposal,
  ParameterCanonicalizerError,
} from '../../src/token-broker/parameter-canonicalizer.js';

describe('parameter-canonicalizer', () => {
  it('18. JSON key reorder does not change canonical hash', () => {
    const proposal = baseActionProposal();
    const reordered = {
      payment_reference: proposal.payment_reference,
      reason_code: proposal.reason_code,
      destination: proposal.destination,
      currency: proposal.currency,
      amount_minor_units: proposal.amount_minor_units,
      action: proposal.action,
    };
    assert.equal(canonicalizeActionProposal(proposal), canonicalizeActionProposal(reordered));
  });

  it('rejects float amount in canonicalization path', () => {
    const bad = {
      action: 'payment.transfer',
      amount_minor_units: 1.5,
      currency: 'USD',
      destination: 'approved-vendor-001',
      reason_code: 'invoice-123',
      payment_reference: 'invoice-123',
    };
    assert.throws(() => canonicalizeActionProposal(bad as never), ParameterCanonicalizerError);
  });
});
