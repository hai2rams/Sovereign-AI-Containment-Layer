import type { AnchorType } from './anchor-types.js';
import type { AnchorMode, AnchorStatus } from './anchor-types.js';
import { createAnchorReceipt, type AnchorReceipt } from './anchor-receipt.js';
import type { AnchorAdapter } from './anchor-adapter.js';
import { validateRootHash } from './root-hash.js';
import {
  assertRealWriteReady,
  loadAnchorConfig,
  type AnchorConfig,
} from './anchor-config.js';
import { PlaceholderAnchorAdapter } from './placeholder-anchor-adapter.js';

let t3AnchorCounter = 0;

function nextT3AnchorId(anchor_type: AnchorType): string {
  t3AnchorCounter += 1;
  return `t3-${anchor_type}-${t3AnchorCounter}`;
}

export type T3AnchorAdapterOptions = {
  config?: AnchorConfig;
  /** Inject for tests — avoids live network in real_write readiness checks. */
  sessionProbe?: (config: AnchorConfig) => Promise<{ ok: boolean; tenantDid?: string; error?: string }>;
};

/**
 * T3/T3E anchor boundary. Default dry_run. real_write is env-gated and contract-write stubbed in M4.
 */
export class T3AnchorAdapter implements AnchorAdapter {
  private readonly config: AnchorConfig;
  private readonly sessionProbe: NonNullable<T3AnchorAdapterOptions['sessionProbe']>;

  constructor(options: T3AnchorAdapterOptions = {}) {
    this.config = options.config ?? loadAnchorConfig();
    this.sessionProbe =
      options.sessionProbe ??
      (async (config) => {
        if (config.mode !== 'real_write') {
          return { ok: true };
        }
        try {
          const { getT3SessionForAnchoring } = await import('./t3-session.js');
          const session = await getT3SessionForAnchoring(config.apiKey, config.environment);
          return { ok: true, tenantDid: session.tenantDid };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : 'session bootstrap failed',
          };
        }
      });
  }

  getConfig(): AnchorConfig {
    return { ...this.config };
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

    if (this.config.mode === 'dry_run') {
      const placeholder = new PlaceholderAnchorAdapter({
        mode: 'dry_run',
        defaultStatus: 'confirmed',
      });
      const receipt = await this.delegatePlaceholder(placeholder, root, anchor_type);
      return {
        ...receipt,
        adapter: 't3',
        mode: 'dry_run',
        transaction_ref: `dry-run-t3-${anchor_type}`,
      };
    }

    try {
      assertRealWriteReady(this.config);
    } catch (error) {
      return createAnchorReceipt({
        anchor_id: nextT3AnchorId(anchor_type),
        root_hash: root,
        anchor_type,
        status: 'failed',
        mode: 'real_write',
        adapter: 't3',
        error_reason: error instanceof Error ? error.message : 'configuration error',
      });
    }

    const probe = await this.sessionProbe(this.config);
    if (!probe.ok) {
      return createAnchorReceipt({
        anchor_id: nextT3AnchorId(anchor_type),
        root_hash: root,
        anchor_type,
        status: 'failed',
        mode: 'real_write',
        adapter: 't3',
        error_reason: probe.error ?? 'T3 session unavailable',
      });
    }

    // M4 guarded stub — contract execute not enabled; no production write.
    return createAnchorReceipt({
      anchor_id: nextT3AnchorId(anchor_type),
      root_hash: root,
      anchor_type,
      status: 'pending',
      mode: 'real_write',
      adapter: 't3',
      transaction_ref: `pending-contract-${this.config.contractId}`,
      error_reason: 'M4: contract anchor write path gated — session ready, execute deferred',
    });
  }

  private async delegatePlaceholder(
    placeholder: PlaceholderAnchorAdapter,
    root: string,
    anchor_type: AnchorType,
  ): Promise<AnchorReceipt> {
    switch (anchor_type) {
      case 'release':
        return placeholder.anchorReleaseRoot(root);
      case 'policy':
        return placeholder.anchorPolicyRoot(root);
      case 'audit':
        return placeholder.anchorAuditRoot(root);
      case 'revocation':
        return placeholder.anchorRevocationRoot(root);
      default:
        throw new Error(`unsupported anchor type: ${anchor_type satisfies never}`);
    }
  }
}
