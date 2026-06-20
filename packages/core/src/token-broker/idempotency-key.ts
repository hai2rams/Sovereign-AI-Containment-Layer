import { createHash } from 'node:crypto';
import { asAsciiSlug, type AsciiSlug, type Sha256Hex } from '../types/brands.js';
import { stableStringify } from '../telemetry/types.js';

export type IdempotencyKeyInput = {
  session_id: AsciiSlug;
  transaction_sequence_counter: number;
  policy_hash: Sha256Hex;
  parameter_hash: Sha256Hex;
  action: AsciiSlug;
  tool_id: AsciiSlug;
  revocation_epoch: number;
};

/**
 * Control-plane only — binds idempotency to session, sequence, policy, and parameters.
 * Returns an opaque slug; does not expose signing secrets.
 */
export function generateIdempotencyKey(input: IdempotencyKeyInput): AsciiSlug {
  const canonical = stableStringify({
    action: input.action,
    parameter_hash: input.parameter_hash,
    policy_hash: input.policy_hash,
    revocation_epoch: input.revocation_epoch,
    session_id: input.session_id,
    tool_id: input.tool_id,
    transaction_sequence_counter: input.transaction_sequence_counter,
  });
  const digest = createHash('sha256').update(canonical, 'utf8').digest('hex').slice(0, 40);
  return asAsciiSlug(`idem-${digest}`);
}
