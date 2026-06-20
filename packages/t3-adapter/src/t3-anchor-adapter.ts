import type {
  AnchorAdapter,
  AnchorRoots,
  AnchorRootsUpdate,
  AnchorStatus,
  AnchorWriteResult,
} from '@sovereign/core';
import { getT3Session, resetT3Session } from './client.js';
import { isT3Configured, isT3ContractReady, loadT3Config } from './config.js';
import type { T3AdapterConfig } from './types.js';

const EMPTY_ROOT = '0x' + '0'.repeat(64);

const M0_DEFERRED_MESSAGE =
  'M0: anchor write deferred — no production T3 contract mutations yet.';

function mergeRoots(current: AnchorRoots, update: AnchorRootsUpdate): AnchorRoots {
  return {
    releaseHashRoot: update.releaseHashRoot ?? current.releaseHashRoot,
    policyHash: update.policyHash ?? current.policyHash,
    auditStateRoot: update.auditStateRoot ?? current.auditStateRoot,
    revocationStateRoot: update.revocationStateRoot ?? current.revocationStateRoot,
  };
}

/**
 * T3/T3E implementation of `AnchorAdapter`.
 * M0: session bootstrap ported; anchor writes return `deferred` without contract execute.
 */
export class T3AnchorAdapter implements AnchorAdapter {
  readonly provider = 't3';

  private readonly config: T3AdapterConfig;
  private roots: AnchorRoots;
  private tenantDid: string | undefined;

  constructor(config: T3AdapterConfig = loadT3Config()) {
    this.config = config;
    this.roots = {
      releaseHashRoot: EMPTY_ROOT,
      policyHash: EMPTY_ROOT,
      auditStateRoot: EMPTY_ROOT,
      revocationStateRoot: EMPTY_ROOT,
    };
  }

  async getStatus(): Promise<AnchorStatus> {
    const configured = isT3Configured(this.config);
    const writable = isT3ContractReady(this.config);

    if (configured && !this.tenantDid) {
      try {
        const session = await getT3Session(this.config.apiKey, this.config.environment);
        this.tenantDid = session.tenantDid;
      } catch {
        return {
          configured: false,
          writable: false,
          provider: this.provider,
          contractId: Number.isInteger(this.config.contractId) ? this.config.contractId : undefined,
          contractTail: this.config.contractTail,
        };
      }
    }

    return {
      configured,
      writable,
      provider: this.provider,
      tenantDid: this.tenantDid,
      contractId: Number.isInteger(this.config.contractId) ? this.config.contractId : undefined,
      contractTail: this.config.contractTail,
    };
  }

  async getRoots(): Promise<AnchorRoots> {
    return { ...this.roots };
  }

  async anchorReleaseHashRoot(root: string): Promise<AnchorWriteResult> {
    return this.deferredWrite({ releaseHashRoot: root });
  }

  async anchorPolicyHash(hash: string): Promise<AnchorWriteResult> {
    return this.deferredWrite({ policyHash: hash });
  }

  async anchorAuditStateRoot(root: string): Promise<AnchorWriteResult> {
    return this.deferredWrite({ auditStateRoot: root });
  }

  async anchorRevocationStateRoot(root: string): Promise<AnchorWriteResult> {
    return this.deferredWrite({ revocationStateRoot: root });
  }

  async anchorRoots(update: AnchorRootsUpdate): Promise<AnchorWriteResult> {
    return this.deferredWrite(update);
  }

  /** M0 placeholder — future milestone will call trust-anchor contract execute. */
  private async deferredWrite(update: AnchorRootsUpdate): Promise<AnchorWriteResult> {
    this.roots = mergeRoots(this.roots, update);
    return {
      mode: 'deferred',
      roots: { ...this.roots },
      message: M0_DEFERRED_MESSAGE,
      externalRef: isT3ContractReady(this.config)
        ? `contract:${this.config.contractId}`
        : undefined,
    };
  }

  /** Test helper — clears cached T3 session. */
  resetSession(): void {
    resetT3Session();
    this.tenantDid = undefined;
  }
}
