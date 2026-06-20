import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PlaceholderAnchorAdapter } from '../src/index.js';

describe('@sovereign/t3-adapter M0', () => {
  it('returns pending receipts without network', async () => {
    const adapter = new PlaceholderAnchorAdapter();
    const root = '0x' + 'ab'.repeat(32);

    const receipt = await adapter.anchorReleaseRoot(root);
    assert.equal(receipt.status, 'pending');
    assert.equal(receipt.root_hash, root);
    assert.equal(receipt.anchor_type, 'release');
  });

  it('implements all four anchor methods', async () => {
    const adapter = new PlaceholderAnchorAdapter();
    const root = '0x' + 'cd'.repeat(32);

    const policy = await adapter.anchorPolicyRoot(root);
    const audit = await adapter.anchorAuditRoot(root);
    const revocation = await adapter.anchorRevocationRoot(root);

    assert.equal(policy.anchor_type, 'policy');
    assert.equal(audit.anchor_type, 'audit');
    assert.equal(revocation.anchor_type, 'revocation');
  });
});
