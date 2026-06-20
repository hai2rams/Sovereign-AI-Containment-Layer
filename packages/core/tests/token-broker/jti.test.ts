import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { asAsciiSlug } from '../../src/types/brands.js';
import { generateJti, resetJtiSequenceForTests } from '../../src/token-broker/jti.js';

describe('jti', () => {
  it('12. generates jti for control plane', () => {
    resetJtiSequenceForTests();
    const jti = generateJti(asAsciiSlug('session-001'), 0);
    assert.match(jti, /^jti-[a-f0-9]{32}$/);
  });

  it('successive jti values differ', () => {
    resetJtiSequenceForTests();
    const a = generateJti(asAsciiSlug('session-001'), 0);
    const b = generateJti(asAsciiSlug('session-001'), 1);
    assert.notEqual(a, b);
  });
});
