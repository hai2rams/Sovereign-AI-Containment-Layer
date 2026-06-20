import type { AnchorAdapter, AnchorReceipt } from './anchor-adapter.js';

function pendingReceipt(
  root: string,
  anchor_type: AnchorReceipt['anchor_type'],
): AnchorReceipt {
  return {
    anchor_id: `m0-${anchor_type}-pending`,
    root_hash: root,
    anchor_type,
    anchored_at: new Date().toISOString(),
    status: 'pending',
  };
}

/**
 * M0 placeholder — no T3 network calls, no contract writes.
 * Real T3 anchoring will replace this in a later milestone.
 */
export class PlaceholderAnchorAdapter implements AnchorAdapter {
  async anchorReleaseRoot(root: string): Promise<AnchorReceipt> {
    return pendingReceipt(root, 'release');
  }

  async anchorPolicyRoot(root: string): Promise<AnchorReceipt> {
    return pendingReceipt(root, 'policy');
  }

  async anchorAuditRoot(root: string): Promise<AnchorReceipt> {
    return pendingReceipt(root, 'audit');
  }

  async anchorRevocationRoot(root: string): Promise<AnchorReceipt> {
    return pendingReceipt(root, 'revocation');
  }
}

export type { AnchorAdapter, AnchorReceipt } from './anchor-adapter.js';
