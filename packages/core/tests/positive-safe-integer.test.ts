import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validatePositiveSafeInteger } from '../src/validators/positive-safe-integer.js';

describe('validatePositiveSafeInteger', () => {
  it('12. float amount rejects', () => {
    const result = validatePositiveSafeInteger(10.5);
    assert.equal(result.ok, false);
  });

  it('13. negative amount rejects', () => {
    const result = validatePositiveSafeInteger(-1);
    assert.equal(result.ok, false);
  });

  it('14. unsafe integer amount rejects', () => {
    const result = validatePositiveSafeInteger(Number.MAX_SAFE_INTEGER + 1);
    assert.equal(result.ok, false);
  });
});
