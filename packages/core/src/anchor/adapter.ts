import type {
  AnchorRoots,
  AnchorRootsUpdate,
  AnchorStatus,
  AnchorWriteResult,
} from './types.js';

/**
 * Abstract trust-anchor port. Core containment logic depends on this interface only —
 * never on T3 SDK or contract implementations.
 */
export interface AnchorAdapter {
  readonly provider: string;

  getStatus(): Promise<AnchorStatus>;

  /** Read current anchored roots (may be local placeholders in M0). */
  getRoots(): Promise<AnchorRoots>;

  anchorReleaseHashRoot(root: string): Promise<AnchorWriteResult>;
  anchorPolicyHash(hash: string): Promise<AnchorWriteResult>;
  anchorAuditStateRoot(root: string): Promise<AnchorWriteResult>;
  anchorRevocationStateRoot(root: string): Promise<AnchorWriteResult>;

  /** Batch anchor when the trust layer supports atomic multi-root commits. */
  anchorRoots?(update: AnchorRootsUpdate): Promise<AnchorWriteResult>;
}
