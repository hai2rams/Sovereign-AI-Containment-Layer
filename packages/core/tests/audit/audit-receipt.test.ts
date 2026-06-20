import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAuditReceipt, EMPTY_AUDIT_ROOT } from '../../src/audit/audit-receipt.js';
import { asSha256Hex } from '../../src/types/brands.js';

describe('audit receipt', () => {
  it('includes state roots and t3_anchor_pending', () => {
    const prev = EMPTY_AUDIT_ROOT;
    const current = asSha256Hex('sha256:' + 'c'.repeat(64));
    const receipt = createAuditReceipt({
      receipt_id: 'rcpt-1',
      session_id: 'session-1',
      action: 'payment.transfer',
      policy_decision: 'deny',
      previous_state_root: prev,
      current_state_root: current,
      event_hash: 'abc123',
      reason_codes: ['DESTINATION_NOT_ALLOWLISTED'],
    });

    assert.equal(receipt.previous_state_root, prev);
    assert.equal(receipt.current_state_root, current);
    assert.equal(receipt.t3_anchor_pending, true);
  });
});
