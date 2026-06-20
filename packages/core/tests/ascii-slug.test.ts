import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateAsciiSlug } from '../src/validators/ascii-slug.js';

describe('validateAsciiSlug', () => {
  it('1. valid ASCII slug passes', () => {
    const result = validateAsciiSlug('approved-vendor_001');
    assert.equal(result.ok, true);
  });

  it('2. emoji slug rejects', () => {
    const result = validateAsciiSlug('vendor😀');
    assert.equal(result.ok, false);
  });

  it('3. zero-width slug rejects', () => {
    const result = validateAsciiSlug('vendor\u200B001');
    assert.equal(result.ok, false);
  });

  it('4. control character slug rejects', () => {
    const result = validateAsciiSlug('vendor\t001');
    assert.equal(result.ok, false);
  });

  it('5. too-long slug rejects', () => {
    const result = validateAsciiSlug('a'.repeat(65));
    assert.equal(result.ok, false);
  });
});
