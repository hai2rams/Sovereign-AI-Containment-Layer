import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AuditLedger } from '../../src/audit/audit-ledger.js';

describe('AuditLedger', () => {
  it('appends receipts with chained state roots', () => {
    const ledger = new AuditLedger();
    const entry = ledger.appendReceipt({
      receipt_id: 'r1',
      session_id: 's1',
      action: 'payment.transfer',
      policy_decision: 'deny',
      event_hash: 'evt-1',
      reason_codes: ['AMOUNT_EXCEEDS_LIMIT'],
    });

    assert.equal(entry.receipt.t3_anchor_pending, true);
    assert.notEqual(entry.receipt.previous_state_root, entry.receipt.current_state_root);
    assert.equal(ledger.getEntries().length, 1);
  });
});
