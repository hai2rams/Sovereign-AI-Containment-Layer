import { createHash } from 'node:crypto';
import type { AsciiSlug } from '../types/brands.js';
import { stableStringify } from '../telemetry/types.js';
import type { UnsignedParameterBoundActionToken } from './types.js';

/** Prefix labels mock signatures — not cryptographic proof. Real asymmetric signing comes later. */
export const MOCK_SIGNATURE_PREFIX = 'mock_sig_v1:' as const;

export interface TokenSigner {
  readonly signing_key_id: AsciiSlug;
  sign(claims: UnsignedParameterBoundActionToken): string;
}

/**
 * Deterministic mock signer for M5 — no private keys, no committed secrets.
 * Signature is a SHA-256 digest over canonical claims + signing_key_id.
 */
export class MockTokenSigner implements TokenSigner {
  constructor(public readonly signing_key_id: AsciiSlug) {}

  sign(claims: UnsignedParameterBoundActionToken): string {
    const canonical = stableStringify({
      claims,
      signing_key_id: this.signing_key_id,
      signer: 'mock_v1',
    });
    const digest = createHash('sha256').update(canonical, 'utf8').digest('hex');
    return `${MOCK_SIGNATURE_PREFIX}${digest}`;
  }
}

export function isMockSignature(signature: string): boolean {
  return signature.startsWith(MOCK_SIGNATURE_PREFIX);
}
