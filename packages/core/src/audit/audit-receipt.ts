import type { Sha256Hex } from '../types/brands.js';
import { asSha256Hex } from '../types/brands.js';

export type AuditReceipt = {
  receipt_id: string;
  emitted_at: string;
  session_id: string;
  action: string;
  policy_decision: string;
  previous_state_root: Sha256Hex;
  current_state_root: Sha256Hex;
  event_hash: string;
  t3_anchor_pending: true;
  reason_codes: string[];
};

export function createAuditReceipt(input: {
  receipt_id: string;
  session_id: string;
  action: string;
  policy_decision: string;
  previous_state_root: Sha256Hex;
  current_state_root: Sha256Hex;
  event_hash: string;
  reason_codes?: string[];
  emitted_at?: string;
}): AuditReceipt {
  return {
    receipt_id: input.receipt_id,
    emitted_at: input.emitted_at ?? new Date().toISOString(),
    session_id: input.session_id,
    action: input.action,
    policy_decision: input.policy_decision,
    previous_state_root: input.previous_state_root,
    current_state_root: input.current_state_root,
    event_hash: input.event_hash,
    t3_anchor_pending: true,
    reason_codes: input.reason_codes ?? [],
  };
}

export const EMPTY_AUDIT_ROOT = asSha256Hex('sha256:' + '0'.repeat(64));
