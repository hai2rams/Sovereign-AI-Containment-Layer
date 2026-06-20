import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LocalAnchorAdapter } from './local-adapter.js';

describe('LocalAnchorAdapter', () => {
  it('anchors release hash root locally', async () => {
    const adapter = new LocalAnchorAdapter();
    const root = '0x' + 'ab'.repeat(32);

    const result = await adapter.anchorReleaseHashRoot(root);

    assert.equal(result.mode, 'local-only');
    assert.equal(result.roots.releaseHashRoot, root);

    const roots = await adapter.getRoots();
    assert.equal(roots.releaseHashRoot, root);
  });

  it('exposes four root fields', async () => {
    const adapter = new LocalAnchorAdapter();
    const roots = await adapter.getRoots();

    assert.ok('releaseHashRoot' in roots);
    assert.ok('policyHash' in roots);
    assert.ok('auditStateRoot' in roots);
    assert.ok('revocationStateRoot' in roots);
  });
});
