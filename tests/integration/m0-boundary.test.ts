import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { emptyRoots } from '../../packages/core/src/index.js';
import { PlaceholderAnchorAdapter } from '../../packages/t3-adapter/src/index.js';

const VALID_ROOT = 'sha256:' + '0'.repeat(64);

describe('integration M0', () => {
  it('core roots and adapter placeholder compose without T3', async () => {
    const roots = emptyRoots();
    assert.ok(roots.releaseRoot);
    const adapter = new PlaceholderAnchorAdapter();
    const receipt = await adapter.anchorReleaseRoot(VALID_ROOT);
    assert.equal(receipt.status, 'confirmed');
    assert.equal(receipt.mode, 'dry_run');
  });
});
