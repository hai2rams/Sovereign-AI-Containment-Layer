import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { emptyRoots } from '../../packages/core/src/index.js';

const VALID_ROOT = 'sha256:' + '0'.repeat(64);

describe('integration M4 boundary', () => {
  it('core remains independent of T3 adapter implementation', async () => {
    const core = await import('../../packages/core/src/index.js');
    assert.equal('T3AnchorAdapter' in core, false);
    assert.ok(emptyRoots());
  });

  it('t3-adapter can use core validators only', async () => {
    const { validateRootHash, PlaceholderAnchorAdapter } = await import('@sovereign/t3-adapter');
    assert.doesNotThrow(() => validateRootHash(VALID_ROOT));
    const receipt = await new PlaceholderAnchorAdapter().anchorReleaseRoot(VALID_ROOT);
    assert.equal(receipt.status, 'confirmed');
  });
});
