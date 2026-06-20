import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeRevocationStateRoot } from '../../src/revocation-engine/revocation-state-root.js';
import { asAsciiSlug } from '../../src/types/brands.js';

describe('revocation-state-root', () => {
  it('changes when revocation epoch transitions', () => {
    const base = {
      session_id: asAsciiSlug('session-001'),
      revocation_status: 'active' as const,
      containment_epoch: 7,
      security_escalation: false,
    };
    const rootA = computeRevocationStateRoot({ ...base, revocation_epoch: 42 });
    const rootB = computeRevocationStateRoot({ ...base, revocation_epoch: 43 });
    assert.notEqual(rootA, rootB);
    assert.match(rootA, /^sha256:[0-9a-f]{64}$/);
  });

  it('changes when revocation status transitions', () => {
    const base = {
      session_id: asAsciiSlug('session-001'),
      revocation_epoch: 43,
      containment_epoch: 8,
      security_escalation: true,
    };
    const quarantined = computeRevocationStateRoot({ ...base, revocation_status: 'quarantined' });
    const revoked = computeRevocationStateRoot({ ...base, revocation_status: 'revoked' });
    assert.notEqual(quarantined, revoked);
  });
});
