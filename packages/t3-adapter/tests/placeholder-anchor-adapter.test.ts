import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PlaceholderAnchorAdapter } from '../src/placeholder-anchor-adapter.js';
import { InvalidRootHashError } from '../src/root-hash.js';

const ROOT = 'sha256:' + 'c'.repeat(64);

describe('PlaceholderAnchorAdapter', () => {
  const adapter = new PlaceholderAnchorAdapter({ mode: 'dry_run', defaultStatus: 'confirmed' });

  it('1. anchors release root in dry-run', async () => {
    const receipt = await adapter.anchorReleaseRoot(ROOT);
    assert.equal(receipt.anchor_type, 'release');
    assert.equal(receipt.mode, 'dry_run');
    assert.equal(receipt.adapter, 'placeholder');
  });

  it('2. anchors policy root in dry-run', async () => {
    const receipt = await adapter.anchorPolicyRoot(ROOT);
    assert.equal(receipt.anchor_type, 'policy');
    assert.equal(receipt.status, 'confirmed');
  });

  it('3. anchors audit root in dry-run', async () => {
    const receipt = await adapter.anchorAuditRoot(ROOT);
    assert.equal(receipt.anchor_type, 'audit');
  });

  it('4. anchors revocation root in dry-run', async () => {
    const receipt = await adapter.anchorRevocationRoot(ROOT);
    assert.equal(receipt.anchor_type, 'revocation');
  });

  it('5. invalid root hash rejects', async () => {
    await assert.rejects(() => adapter.anchorReleaseRoot('not-a-hash'), InvalidRootHashError);
  });
});
