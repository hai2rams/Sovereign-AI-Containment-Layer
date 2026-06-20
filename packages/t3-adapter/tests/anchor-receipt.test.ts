import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAnchorReceipt } from '../src/anchor-receipt.js';

const ROOT = 'sha256:' + 'b'.repeat(64);

describe('anchor-receipt', () => {
  it('8. anchor receipt contains required fields', () => {
    const receipt = createAnchorReceipt({
      anchor_id: 'anchor-1',
      root_hash: ROOT,
      anchor_type: 'audit',
      status: 'confirmed',
      mode: 'dry_run',
      adapter: 'placeholder',
    });

    assert.equal(receipt.anchor_id, 'anchor-1');
    assert.equal(receipt.root_hash, ROOT);
    assert.equal(receipt.anchor_type, 'audit');
    assert.equal(receipt.status, 'confirmed');
    assert.equal(receipt.mode, 'dry_run');
    assert.equal(receipt.adapter, 'placeholder');
    assert.ok(receipt.anchored_at);
  });

  it('12. anchor success can produce confirmed receipt', () => {
    const receipt = createAnchorReceipt({
      anchor_id: 'ok',
      root_hash: ROOT,
      anchor_type: 'release',
      status: 'confirmed',
      mode: 'dry_run',
      adapter: 't3',
      transaction_ref: 'dry-run-release',
    });
    assert.equal(receipt.status, 'confirmed');
  });
});
