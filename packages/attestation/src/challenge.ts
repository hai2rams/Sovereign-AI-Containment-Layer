import { createHash, randomBytes } from 'node:crypto';
import type { AttestationChallenge } from './types.js';

const DEFAULT_TTL_MS = 5 * 60 * 1000;

const challengeStore = new Map<string, AttestationChallenge>();

export function resetChallengeStore(): void {
  challengeStore.clear();
}

export function createAttestationChallenge(
  releaseId: string,
  ttlMs: number = DEFAULT_TTL_MS,
  now: Date = new Date(),
): AttestationChallenge {
  const nonce = `nonce_${randomBytes(16).toString('hex')}`;
  const createdAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + ttlMs).toISOString();

  const challenge: AttestationChallenge = {
    nonce,
    release_id: releaseId,
    expires_at: expiresAt,
    created_at: createdAt,
  };

  challengeStore.set(nonce, challenge);
  return challenge;
}

export function getChallenge(nonce: string): AttestationChallenge | null {
  return challengeStore.get(nonce) ?? null;
}

export function isChallengeExpired(
  challenge: AttestationChallenge,
  now: Date = new Date(),
): boolean {
  return now.getTime() >= new Date(challenge.expires_at).getTime();
}

export function consumeChallenge(nonce: string): AttestationChallenge | null {
  const challenge = challengeStore.get(nonce) ?? null;
  if (challenge) {
    challengeStore.delete(nonce);
  }
  return challenge;
}

export function attestationIdFor(quote: {
  release_id: string;
  measurement_hash: string;
  policy_hash: string;
  nonce: string;
}): string {
  const digest = createHash('sha256')
    .update(quote.release_id)
    .update(quote.measurement_hash)
    .update(quote.policy_hash)
    .update(quote.nonce)
    .digest('hex');
  return `attest_${digest.slice(0, 24)}`;
}
