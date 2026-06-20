import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { emptyRoots, placeholderPolicyDecision, placeholderValidate } from '../src/index.js';

describe('@sovereign/core M0', () => {
  it('exposes empty containment roots', () => {
    const roots = emptyRoots();
    assert.equal(roots.releaseRoot.length, 66);
    assert.equal(roots.policyHash, roots.auditStateRoot);
  });

  it('placeholder validator passes', () => {
    assert.deepEqual(placeholderValidate({}), { ok: true });
  });

  it('placeholder policy defers', () => {
    assert.equal(placeholderPolicyDecision(), 'defer');
  });
});
