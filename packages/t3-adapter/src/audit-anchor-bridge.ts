import type { AuditReceipt } from '@sovereign/core';
import type { AnchorReceipt } from './anchor-receipt.js';

export type AuditReceiptWithAnchor = AuditReceipt & {
  t3_anchor_status?: 'pending' | 'confirmed' | 'failed';
  t3_transaction_ref?: string;
  t3_anchor_error?: string;
};

/**
 * Attach T3 anchor outcome to a local audit receipt without mutating the original.
 * Anchoring failure does not delete or invalidate the local audit record.
 */
export function attachAnchorResultToAuditReceipt(
  receipt: AuditReceipt,
  anchor: AnchorReceipt,
): AuditReceiptWithAnchor {
  const t3_anchor_pending = anchor.status !== 'confirmed';

  return {
    ...receipt,
    t3_anchor_pending,
    t3_anchor_status: anchor.status,
    ...(anchor.transaction_ref ? { t3_transaction_ref: anchor.transaction_ref } : {}),
    ...(anchor.error_reason ? { t3_anchor_error: anchor.error_reason } : {}),
  };
}
