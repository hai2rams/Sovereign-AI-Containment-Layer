import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateSha256Hex } from '../src/validators/sha256.js';

const VALID = 'sha256:' + 'a'.repeat(64);

describe('validateSha256Hex', () => {
  it('6. valid sha256 hash passes', () => {
    const result = validateSha256Hex(VALID);
    assert.equal(result.ok, true);
  });

  it('7. uppercase hash rejects', () => {
    const result = validateSha256Hex('sha256:' + 'A'.repeat(64));
    assert.equal(result.ok, false);
  });

  it('8. missing sha256 prefix rejects', () => {
    const result = validateSha256Hex('a'.repeat(64));
    assert.equal(result.ok, false);
  });
});
