import type { AnchorType } from './anchor-types.js';
import type { AnchorMode, AnchorStatus } from './anchor-types.js';
import { createAnchorReceipt, type AnchorReceipt } from './anchor-receipt.js';
import type { AnchorAdapter } from './anchor-adapter.js';
import { validateRootHash } from './root-hash.js';
import { loadAnchorConfig } from './anchor-config.js';

export type PlaceholderAnchorAdapterOptions = {
  mode?: AnchorMode;
  defaultStatus?: Extract<AnchorStatus, 'pending' | 'confirmed'>;
};

let anchorCounter = 0;

function nextAnchorId(anchor_type: AnchorType): string {
  anchorCounter += 1;
  return `placeholder-${anchor_type}-${anchorCounter}`;
}

/**
 * Deterministic dry-run anchoring — no network, no secrets.
 */
export class PlaceholderAnchorAdapter implements AnchorAdapter {
  private readonly mode: AnchorMode;
  private readonly defaultStatus: Extract<AnchorStatus, 'pending' | 'confirmed'>;

  constructor(options: PlaceholderAnchorAdapterOptions = {}) {
    const config = loadAnchorConfig();
    this.mode = options.mode ?? config.mode;
    this.defaultStatus = options.defaultStatus ?? 'confirmed';
  }

  async anchorReleaseRoot(root: string): Promise<AnchorReceipt> {
    return this.anchor(root, 'release');
  }

  async anchorPolicyRoot(root: string): Promise<AnchorReceipt> {
    return this.anchor(root, 'policy');
  }

  async anchorAuditRoot(root: string): Promise<AnchorReceipt> {
    return this.anchor(root, 'audit');
  }

  async anchorRevocationRoot(root: string): Promise<AnchorReceipt> {
    return this.anchor(root, 'revocation');
  }

  private async anchor(root: string, anchor_type: AnchorType): Promise<AnchorReceipt> {
    validateRootHash(root);
    const mode: AnchorMode = this.mode === 'real_write' ? 'dry_run' : this.mode;

    return createAnchorReceipt({
      anchor_id: nextAnchorId(anchor_type),
      root_hash: root,
      anchor_type,
      status: this.defaultStatus,
      mode,
      adapter: 'placeholder',
      transaction_ref: mode === 'dry_run' ? `dry-run-${anchor_type}` : undefined,
    });
  }
}
