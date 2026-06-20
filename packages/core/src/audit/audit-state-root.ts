import type { Sha256Hex } from '../types/brands.js';
import { asSha256Hex } from '../types/brands.js';
import { EMPTY_AUDIT_ROOT } from './audit-receipt.js';

export type AuditStateRoot = {
  root: Sha256Hex;
  entry_count: number;
  t3_anchor_pending: boolean;
};

export function placeholderAuditStateRoot(entry_count = 0): AuditStateRoot {
  return {
    root: entry_count === 0 ? EMPTY_AUDIT_ROOT : asSha256Hex(`sha256:${'b'.repeat(64)}`),
    entry_count,
    t3_anchor_pending: true,
  };
}

export function auditStateRootFromLedgerHash(ledger_hash: string, entry_count: number): AuditStateRoot {
  return {
    root: asSha256Hex(`sha256:${ledger_hash.padStart(64, '0').slice(0, 64)}`),
    entry_count,
    t3_anchor_pending: true,
  };
}
