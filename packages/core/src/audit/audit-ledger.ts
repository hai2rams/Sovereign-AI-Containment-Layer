import { createHash } from 'node:crypto';
import type { AuditReceipt } from './audit-receipt.js';
import { createAuditReceipt, EMPTY_AUDIT_ROOT } from './audit-receipt.js';
import type { Sha256Hex } from '../types/brands.js';
import { asSha256Hex } from '../types/brands.js';

export type AuditLedgerEntry = {
  sequence: number;
  receipt: AuditReceipt;
  ledger_hash: string;
  previous_ledger_hash: string | null;
};

function toStateRoot(hexDigest: string): Sha256Hex {
  return asSha256Hex(`sha256:${hexDigest}`);
}

function hashLedgerEntry(input: {
  sequence: number;
  receipt: AuditReceipt;
  previous_ledger_hash: string | null;
}): string {
  const canonical = JSON.stringify({
    sequence: input.sequence,
    receipt: input.receipt,
    previous_ledger_hash: input.previous_ledger_hash,
  });
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export class AuditLedger {
  private sequence = 0;
  private previous_ledger_hash: string | null = null;
  private current_state_root: Sha256Hex = EMPTY_AUDIT_ROOT;
  private readonly entries: AuditLedgerEntry[] = [];

  appendReceipt(
    partial: Omit<
      Parameters<typeof createAuditReceipt>[0],
      'previous_state_root' | 'current_state_root'
    >,
  ): AuditLedgerEntry {
    const previous_state_root = this.current_state_root;

    const provisional = createAuditReceipt({
      ...partial,
      previous_state_root,
      current_state_root: previous_state_root,
    });

    this.sequence += 1;
    const ledger_hash = hashLedgerEntry({
      sequence: this.sequence,
      receipt: provisional,
      previous_ledger_hash: this.previous_ledger_hash,
    });

    this.current_state_root = toStateRoot(ledger_hash);
    const receipt = createAuditReceipt({
      ...partial,
      previous_state_root,
      current_state_root: this.current_state_root,
    });

    const entry: AuditLedgerEntry = {
      sequence: this.sequence,
      receipt,
      ledger_hash,
      previous_ledger_hash: this.previous_ledger_hash,
    };

    this.entries.push(entry);
    this.previous_ledger_hash = ledger_hash;
    return entry;
  }

  getEntries(): readonly AuditLedgerEntry[] {
    return this.entries;
  }

  getCurrentStateRoot(): Sha256Hex {
    return this.current_state_root;
  }
}
