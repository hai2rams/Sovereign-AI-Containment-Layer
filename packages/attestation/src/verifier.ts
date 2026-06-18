import {
  checkSensitiveActionAllowed,
  getRelease,
  readAgentPassport,
} from '@sovereign/agent-passport';
import {
  attestationIdFor,
  consumeChallenge,
  isChallengeExpired,
} from './challenge.js';
import type { AttestationVerificationResult, MockAttestationQuote } from './types.js';

export type VerifyMockAttestationInput = {
  repoRoot: string;
  quote: MockAttestationQuote;
  now?: Date;
};

export async function verifyMockAttestation(
  input: VerifyMockAttestationInput,
): Promise<AttestationVerificationResult> {
  const { repoRoot, quote, now = new Date() } = input;
  const base = {
    release_id: quote.release_id,
    attestation_id: null as string | null,
  };

  if (quote.debug !== false) {
    return { ...base, verified: false, reason: 'debug_mode_not_allowed' };
  }

  const challenge = consumeChallenge(quote.nonce);
  if (!challenge) {
    return { ...base, verified: false, reason: 'unknown_nonce' };
  }

  if (challenge.release_id !== quote.release_id) {
    return { ...base, verified: false, reason: 'release_id_mismatch' };
  }

  if (isChallengeExpired(challenge, now)) {
    return { ...base, verified: false, reason: 'stale_nonce' };
  }

  const release = await getRelease(repoRoot, quote.release_id);
  if (!release) {
    return { ...base, verified: false, reason: 'release_not_registered' };
  }

  const sensitive = await checkSensitiveActionAllowed(repoRoot, quote.release_id);
  if (!sensitive.allowed && sensitive.reason === 'release_revoked') {
    return { ...base, verified: false, reason: 'release_revoked' };
  }

  if (release.bundle_root_hash !== quote.measurement_hash) {
    return { ...base, verified: false, reason: 'measurement_hash_mismatch' };
  }

  const passport = await readAgentPassport(repoRoot);
  const expectedPolicyHash = passport?.hash_bundle.policy_rules_hash;
  if (!expectedPolicyHash || expectedPolicyHash !== quote.policy_hash) {
    return { ...base, verified: false, reason: 'policy_hash_mismatch' };
  }

  const attestation_id = attestationIdFor(quote);
  return {
    verified: true,
    release_id: quote.release_id,
    reason: 'mock_attestation_verified',
    attestation_id,
  };
}

export async function buildMockQuoteFromPassport(
  repoRoot: string,
  releaseId: string,
  nonce: string,
): Promise<MockAttestationQuote | null> {
  const passport = await readAgentPassport(repoRoot);
  const release = await getRelease(repoRoot, releaseId);

  if (!passport || !release) {
    return null;
  }

  return {
    release_id: releaseId,
    measurement_hash: release.bundle_root_hash,
    policy_hash: passport.hash_bundle.policy_rules_hash,
    debug: false,
    nonce,
    issued_at: new Date().toISOString(),
  };
}
