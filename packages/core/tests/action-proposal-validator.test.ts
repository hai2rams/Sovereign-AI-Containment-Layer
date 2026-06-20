import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateActionProposal } from '../src/validators/action-proposal-validator.js';

const VALID = {
  action: 'payment.transfer',
  amount_minor_units: 5000,
  currency: 'USD',
  destination: 'approved-vendor-001',
  reason_code: 'invoice-123',
  payment_reference: 'ref-abc',
};

describe('validateActionProposal', () => {
  it('9. valid ActionProposal passes', () => {
    const result = validateActionProposal(VALID);
    assert.equal(result.ok, true);
  });

  it('10. additional_parameters rejects', () => {
    const result = validateActionProposal({ ...VALID, additional_parameters: { x: 1 } });
    assert.equal(result.ok, false);
  });

  it('11. unknown field rejects', () => {
    const result = validateActionProposal({ ...VALID, extra_field: true });
    assert.equal(result.ok, false);
  });

  it('18. top-level array rejects', () => {
    const result = validateActionProposal([VALID]);
    assert.equal(result.ok, false);
  });
});
