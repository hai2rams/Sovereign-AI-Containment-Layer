import type { AnchorAdapter } from './adapter.js';
import type { AnchorRoots, AnchorRootsUpdate, AnchorStatus, AnchorWriteResult } from './types.js';

const EMPTY_ROOT = '0x' + '0'.repeat(64);

function mergeRoots(current: AnchorRoots, update: AnchorRootsUpdate): AnchorRoots {
  return {
    releaseHashRoot: update.releaseHashRoot ?? current.releaseHashRoot,
    policyHash: update.policyHash ?? current.policyHash,
    auditStateRoot: update.auditStateRoot ?? current.auditStateRoot,
    revocationStateRoot: update.revocationStateRoot ?? current.revocationStateRoot,
  };
}

/** In-memory anchor for tests and offline demos. Never writes to T3. */
export class LocalAnchorAdapter implements AnchorAdapter {
  readonly provider = 'local';

  private roots: AnchorRoots = {
    releaseHashRoot: EMPTY_ROOT,
    policyHash: EMPTY_ROOT,
    auditStateRoot: EMPTY_ROOT,
    revocationStateRoot: EMPTY_ROOT,
  };

  async getStatus(): Promise<AnchorStatus> {
    return {
      configured: true,
      writable: true,
      provider: this.provider,
    };
  }

  async getRoots(): Promise<AnchorRoots> {
    return { ...this.roots };
  }

  async anchorReleaseHashRoot(root: string): Promise<AnchorWriteResult> {
    return this.write({ releaseHashRoot: root });
  }

  async anchorPolicyHash(hash: string): Promise<AnchorWriteResult> {
    return this.write({ policyHash: hash });
  }

  async anchorAuditStateRoot(root: string): Promise<AnchorWriteResult> {
    return this.write({ auditStateRoot: root });
  }

  async anchorRevocationStateRoot(root: string): Promise<AnchorWriteResult> {
    return this.write({ revocationStateRoot: root });
  }

  async anchorRoots(update: AnchorRootsUpdate): Promise<AnchorWriteResult> {
    return this.write(update);
  }

  private async write(update: AnchorRootsUpdate): Promise<AnchorWriteResult> {
    this.roots = mergeRoots(this.roots, update);
    return {
      mode: 'local-only',
      roots: { ...this.roots },
      message: 'Stored in local adapter only (no external trust anchor).',
    };
  }
}
