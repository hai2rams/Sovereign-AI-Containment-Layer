import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { asAsciiSlug } from '../../src/types/brands.js';
import { baseActionProposal } from './fixtures.js';
import { computeParameterHash } from '../../src/token-broker/parameter-hash.js';

describe('parameter-hash', () => {
  const base = baseActionProposal();

  it('6. parameter hash includes binding to proposal', () => {
    const hash = computeParameterHash(base);
    assert.match(hash, /^sha256:[a-f0-9]{64}$/);
  });

  it('15. hash changes when destination changes', () => {
    const a = computeParameterHash(base);
    const b = computeParameterHash(
      baseActionProposal({ destination: asAsciiSlug('treasury-ops-account') }),
    );
    assert.notEqual(a, b);
  });

  it('16. hash changes when amount changes', () => {
    const a = computeParameterHash(base);
    const b = computeParameterHash(baseActionProposal({ amount_minor_units: 200_000 }));
    assert.notEqual(a, b);
  });

  it('17. hash changes when payment_reference changes', () => {
    const a = computeParameterHash(base);
    const b = computeParameterHash(
      baseActionProposal({ payment_reference: asAsciiSlug('invoice-999') }),
    );
    assert.notEqual(a, b);
  });
});
