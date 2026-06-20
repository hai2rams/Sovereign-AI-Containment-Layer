import { createHash } from 'node:crypto';
import { asSha256Hex, type Sha256Hex } from '../types/brands.js';
import { stableStringify } from '../telemetry/types.js';
import type { RevocationStateRootInput } from './types.js';

export function computeRevocationStateRoot(input: RevocationStateRootInput): Sha256Hex {
  const canonical = stableStringify({
    session_id: input.session_id,
    revocation_status: input.revocation_status,
    revocation_epoch: input.revocation_epoch,
    containment_epoch: input.containment_epoch,
    security_escalation: input.security_escalation,
  });
  const digest = createHash('sha256').update(canonical, 'utf8').digest('hex');
  return asSha256Hex(`sha256:${digest}`);
}
