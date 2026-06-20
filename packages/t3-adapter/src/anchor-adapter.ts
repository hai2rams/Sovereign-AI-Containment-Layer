export interface AnchorReceipt {
  anchor_id: string;
  root_hash: string;
  anchor_type: 'release' | 'policy' | 'audit' | 'revocation';
  anchored_at: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface AnchorAdapter {
  anchorReleaseRoot(root: string): Promise<AnchorReceipt>;
  anchorPolicyRoot(root: string): Promise<AnchorReceipt>;
  anchorAuditRoot(root: string): Promise<AnchorReceipt>;
  anchorRevocationRoot(root: string): Promise<AnchorReceipt>;
}
