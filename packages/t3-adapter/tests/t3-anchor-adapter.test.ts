import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAuditReceipt, EMPTY_AUDIT_ROOT } from '@sovereign/core';
import { asSha256Hex } from '../../core/src/types/brands.js';
import { T3AnchorAdapter } from '../src/t3-anchor-adapter.js';
import { PlaceholderAnchorAdapter } from '../src/placeholder-anchor-adapter.js';
import {
  attachAnchorResultToAuditReceipt,
  buildT3AnchorTelemetryPayload,
  telemetryKindForReceipt,
} from '../src/index.js';
import { AnchorConfigError } from '../src/anchor-config.js';

const ROOT = 'sha256:' + 'd'.repeat(64);

describe('T3AnchorAdapter', () => {
  it('dry_run delegates without secrets', async () => {
    const adapter = new T3AnchorAdapter({
      config: {
        mode: 'dry_run',
        apiKey: '',
        environment: 'testnet',
        contractId: NaN,
        contractTail: 'containment-trust-anchor-v1',
        contractVersion: '0.1.0',
      },
    });
    const receipt = await adapter.anchorPolicyRoot(ROOT);
    assert.equal(receipt.mode, 'dry_run');
    assert.equal(receipt.adapter, 't3');
    assert.equal(receipt.status, 'confirmed');
  });

  it('9. anchor failure returns failed receipt without leaking secrets', async () => {
    const adapter = new T3AnchorAdapter({
      config: {
        mode: 'real_write',
        apiKey: '',
        environment: 'testnet',
        contractId: NaN,
        contractTail: '',
        contractVersion: '0.1.0',
      },
    });
    const receipt = await adapter.anchorAuditRoot(ROOT);
    assert.equal(receipt.status, 'failed');
    assert.ok(receipt.error_reason);
    assert.equal(receipt.error_reason?.includes('T3N_API_KEY'), true);
    assert.equal(JSON.stringify(receipt).includes('secret'), false);
  });

  it('real_write with mock session probe returns pending stub', async () => {
    const adapter = new T3AnchorAdapter({
      config: {
        mode: 'real_write',
        apiKey: 'mock-key',
        environment: 'testnet',
        contractId: 15,
        contractTail: 'containment-trust-anchor-v1',
        contractVersion: '0.1.0',
      },
      sessionProbe: async () => ({ ok: true, tenantDid: 'did:t3n:test' }),
    });
    const receipt = await adapter.anchorReleaseRoot(ROOT);
    assert.equal(receipt.status, 'pending');
    assert.equal(receipt.mode, 'real_write');
    assert.match(receipt.error_reason ?? '', /gated/i);
  });

  it('10. T3 telemetry payload does not include secrets', () => {
    const receipt = {
      anchor_id: 'a1',
      root_hash: ROOT,
      anchor_type: 'policy' as const,
      anchored_at: new Date().toISOString(),
      status: 'confirmed' as const,
      mode: 'dry_run' as const,
      adapter: 't3' as const,
    };
    const payload = buildT3AnchorTelemetryPayload({
      kind: telemetryKindForReceipt(receipt),
      trace_id: 'trace-1',
      session_id: 'session-1',
      receipt,
    });
    assert.equal(payload.telemetry_event, 'T3_ANCHOR_CONFIRMED');
    assert.equal('private_key' in payload, false);
    assert.equal('api_key' in payload, false);
    assert.equal('raw_token' in payload, false);
  });

  it('11-13. audit receipt anchor attachment is non-destructive', async () => {
    const audit = createAuditReceipt({
      receipt_id: 'r1',
      session_id: 's1',
      action: 'payment.transfer',
      policy_decision: 'deny',
      previous_state_root: EMPTY_AUDIT_ROOT,
      current_state_root: asSha256Hex('sha256:' + 'e'.repeat(64)),
      event_hash: 'evt',
    });
    assert.equal(audit.t3_anchor_pending, true);

    const placeholder = new PlaceholderAnchorAdapter({ mode: 'dry_run', defaultStatus: 'confirmed' });
    const anchor = await placeholder.anchorAuditRoot(ROOT);
    const attached = attachAnchorResultToAuditReceipt(audit, anchor);

    assert.notEqual(attached, audit);
    assert.equal(audit.t3_anchor_pending, true);
    assert.equal(attached.t3_anchor_pending, false);
    assert.equal(attached.t3_anchor_status, 'confirmed');

    const failed = attachAnchorResultToAuditReceipt(
      audit,
      await new T3AnchorAdapter({
        config: {
          mode: 'real_write',
          apiKey: '',
          environment: 'testnet',
          contractId: NaN,
          contractTail: '',
          contractVersion: '0.1.0',
        },
      }).anchorAuditRoot(ROOT),
    );
    assert.equal(failed.t3_anchor_status, 'failed');
    assert.equal(audit.t3_anchor_pending, true);
  });

  it('assertRealWriteReady throws AnchorConfigError', () => {
    assert.throws(() => {
      throw new AnchorConfigError('real_write requires T3N_API_KEY');
    }, AnchorConfigError);
  });
});

describe('core independence', () => {
  it('14. packages/core does not import concrete T3 adapter', async () => {
    const corePkg = await import('@sovereign/core');
    assert.equal('T3AnchorAdapter' in corePkg, false);
    assert.equal('PlaceholderAnchorAdapter' in corePkg, false);
  });
});
