import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { emptyRoots } from '../../packages/core/src/index.js';
import { PlaceholderAnchorAdapter } from '../../packages/t3-adapter/src/index.js';

describe('integration M0', () => {
  it('core roots and adapter placeholder compose without T3', async () => {
    const roots = emptyRoots();
    const adapter = new PlaceholderAnchorAdapter();
    const receipt = await adapter.anchorReleaseRoot(roots.releaseRoot);
    assert.equal(receipt.status, 'pending');
  });
});
