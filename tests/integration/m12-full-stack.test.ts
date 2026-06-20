import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { emptyRoots } from '../../packages/core/src/types/roots.js';
import { PlaceholderAnchorAdapter } from '../../packages/t3-adapter/src/placeholder-anchor-adapter.js';
import { InvalidRootHashError } from '../../packages/t3-adapter/src/root-hash.js';
import { asSha256Hex } from '../../packages/core/src/types/brands.js';
import { computeRevocationStateRoot } from '../../packages/core/src/revocation-engine/index.js';
import { runScenario } from '../../packages/core/src/scenario-engine/index.js';

const root = join(import.meta.dirname, '../..');

describe('integration M12 full stack', () => {
  it('core revocation root can be anchored via t3 adapter dry-run', async () => {
    const revocationRoot = computeRevocationStateRoot({
      session_id: 'session-001' as never,
      revocation_status: 'active',
      revocation_epoch: 42,
      containment_epoch: 7,
      security_escalation: false,
    });

    const adapter = new PlaceholderAnchorAdapter();
    const receipt = await adapter.anchorRevocationRoot(revocationRoot);
    assert.equal(receipt.status, 'confirmed');
    assert.equal(receipt.anchor_type, 'revocation');
  });

  it('golden-path scenario composes with containment roots', () => {
    const scenario = JSON.parse(
      readFileSync(join(root, 'demo/scenarios/golden-path.json'), 'utf8'),
    );
    const result = runScenario(scenario);
    assert.equal(result.outcome, 'allowed');

    const roots = emptyRoots();
    assert.ok(roots.releaseRoot.startsWith('0x'));
    assert.ok(roots.policyHash.startsWith('0x'));
  });

  it('t3 adapter rejects anchoring non-hash root content', async () => {
    const adapter = new PlaceholderAnchorAdapter();
    await assert.rejects(
      () => adapter.anchorRevocationRoot('not-a-valid-root'),
      InvalidRootHashError,
    );
  });

  it('revocation transition root is sha256 branded', () => {
    const rootHash = computeRevocationStateRoot({
      session_id: 'session-001' as never,
      revocation_status: 'quarantined',
      revocation_epoch: 43,
      containment_epoch: 8,
      security_escalation: true,
    });
    assert.match(rootHash, /^sha256:[0-9a-f]{64}$/);
    assert.ok(asSha256Hex(rootHash));
  });
});
