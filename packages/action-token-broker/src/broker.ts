import { checkSensitiveActionAllowed, readAgentPassport } from '@sovereign/agent-passport';
import { evaluatePolicy } from '@sovereign/policy-engine';
import {
  decodeToken,
  encodeToken,
  getDevSigningKey,
  newTokenId,
  tokenContainsSecrets,
} from './signing.js';
import type {
  IssueActionTokenInput,
  IssueActionTokenResult,
  VerifyActionTokenInput,
  VerifyActionTokenResult,
} from './types.js';

const DEFAULT_TTL_SECONDS = 300;

export async function issueActionToken(
  input: IssueActionTokenInput,
): Promise<IssueActionTokenResult> {
  const policy = await evaluatePolicy({ repoRoot: input.repoRoot, proposal: input.proposal });
  if (!policy.allowed) {
    throw new Error(`policy_denied:${policy.reason}`);
  }

  const releaseGate = await checkSensitiveActionAllowed(input.repoRoot, input.release_id);
  if (!releaseGate.allowed) {
    throw new Error(`release_blocked:${releaseGate.reason}`);
  }

  const passport = await readAgentPassport(input.repoRoot);
  if (!passport) {
    throw new Error('passport_not_found');
  }

  const now = new Date();
  const ttl = input.ttl_seconds ?? DEFAULT_TTL_SECONDS;
  const expiresAt = new Date(now.getTime() + ttl * 1000).toISOString();

  const claims = {
    token_id: newTokenId(),
    agent_did: input.agent_did,
    release_id: input.release_id,
    attestation_id: input.attestation_id,
    session_id: input.session_id,
    action: input.action,
    policy_hash: input.policy_hash || passport.hash_bundle.policy_rules_hash,
    issued_at: now.toISOString(),
    expires_at: expiresAt,
  } as IssueActionTokenResult['claims'];

  if (input.action === 'payment.transfer' && typeof input.proposal === 'object' && input.proposal) {
    const params = (input.proposal as { parameters?: Record<string, unknown> }).parameters ?? {};
    if (typeof params.amount === 'number') {
      claims.max_amount = params.amount;
    }
    if (typeof params.destination === 'string') {
      claims.allowed_destination = params.destination;
    }
  }

  if (tokenContainsSecrets(claims)) {
    throw new Error('token_would_expose_secrets');
  }

  const signingKey = input.signingKey || getDevSigningKey();
  const token = encodeToken(claims, signingKey);

  return { token, claims, expires_at: expiresAt };
}

export async function verifyActionToken(
  input: VerifyActionTokenInput,
): Promise<VerifyActionTokenResult> {
  const signingKey = input.signingKey || getDevSigningKey();
  const claims = decodeToken(input.token, signingKey);

  if (!claims) {
    return { valid: false, reason: 'invalid_token', claims: null };
  }

  const now = input.now ?? new Date();
  if (now.getTime() >= new Date(claims.expires_at).getTime()) {
    return { valid: false, reason: 'token_expired', claims };
  }

  if (input.expected_action && claims.action !== input.expected_action) {
    return { valid: false, reason: 'wrong_action', claims };
  }

  if (input.expected_release_id && claims.release_id !== input.expected_release_id) {
    return { valid: false, reason: 'wrong_release', claims };
  }

  const releaseGate = await checkSensitiveActionAllowed(input.repoRoot, claims.release_id);
  if (!releaseGate.allowed) {
    return { valid: false, reason: releaseGate.reason, claims };
  }

  return { valid: true, reason: 'token_valid', claims };
}

export { getDevSigningKey };
