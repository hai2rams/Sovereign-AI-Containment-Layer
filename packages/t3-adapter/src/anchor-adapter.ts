import type { AnchorReceipt } from './anchor-receipt.js';

export interface AnchorAdapter {
  anchorReleaseRoot(root: string): Promise<AnchorReceipt>;
  anchorPolicyRoot(root: string): Promise<AnchorReceipt>;
  anchorAuditRoot(root: string): Promise<AnchorReceipt>;
  anchorRevocationRoot(root: string): Promise<AnchorReceipt>;
}
