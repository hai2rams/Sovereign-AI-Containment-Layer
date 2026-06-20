import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  auditStateRootFromLedgerHash,
  placeholderAuditStateRoot,
} from '../../src/audit/audit-state-root.js';

describe('audit state root', () => {
  it('placeholder has t3_anchor_pending', () => {
    const root = placeholderAuditStateRoot(0);
    assert.equal(root.t3_anchor_pending, true);
    assert.equal(root.entry_count, 0);
  });

  it('derives root from ledger hash', () => {
    const root = auditStateRootFromLedgerHash('abcd', 3);
    assert.equal(root.entry_count, 3);
    assert.equal(root.t3_anchor_pending, true);
    assert.match(root.root, /^sha256:[a-f0-9]{64}$/);
  });
});
