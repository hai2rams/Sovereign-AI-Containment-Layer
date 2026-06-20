import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { T3AnchorAdapter } from './t3-anchor-adapter.js';

describe('T3AnchorAdapter (M0)', () => {
  it('defers anchor writes without API key', async () => {
    const adapter = new T3AnchorAdapter({
      apiKey: '',
      environment: 'testnet',
      contractId: NaN,
      contractTail: 'containment-trust-anchor-v1',
      contractVersion: '0.1.0',
      contractWasmPath: '',
    });

    const status = await adapter.getStatus();
    assert.equal(status.configured, false);
    assert.equal(status.writable, false);
    assert.equal(status.provider, 't3');

    const result = await adapter.anchorReleaseHashRoot('0x' + 'cd'.repeat(32));
    assert.equal(result.mode, 'deferred');
    assert.match(result.message ?? '', /M0/);
  });

  it('implements AnchorAdapter root methods', async () => {
    const adapter = new T3AnchorAdapter({
      apiKey: '',
      environment: 'testnet',
      contractId: 15,
      contractTail: 'containment-trust-anchor-v1',
      contractVersion: '0.1.0',
      contractWasmPath: '',
    });

    await adapter.anchorPolicyHash('0x' + '11'.repeat(32));
    await adapter.anchorAuditStateRoot('0x' + '22'.repeat(32));
    await adapter.anchorRevocationStateRoot('0x' + '33'.repeat(32));

    const roots = await adapter.getRoots();
    assert.equal(roots.policyHash, '0x' + '11'.repeat(32));
    assert.equal(roots.auditStateRoot, '0x' + '22'.repeat(32));
    assert.equal(roots.revocationStateRoot, '0x' + '33'.repeat(32));
  });
});
