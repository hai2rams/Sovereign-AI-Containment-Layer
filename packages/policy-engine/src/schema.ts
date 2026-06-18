import {
  ACTION_PROPOSAL_ALLOWED_KEYS,
  POLICY_OVERRIDE_PATTERNS,
} from './config.js';
import type { ActionProposal } from './types.js';

export type SchemaValidationResult =
  | { ok: true; proposal: ActionProposal }
  | { ok: false; reason: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function parseActionProposalJson(raw: string): SchemaValidationResult {
  try {
    return validateActionProposal(JSON.parse(raw));
  } catch {
    return { ok: false, reason: 'malformed_json' };
  }
}

export function validateActionProposal(input: unknown): SchemaValidationResult {
  if (!isPlainObject(input)) {
    return { ok: false, reason: 'proposal_must_be_object' };
  }

  for (const key of Object.keys(input)) {
    if (!ACTION_PROPOSAL_ALLOWED_KEYS.has(key)) {
      return { ok: false, reason: `unknown_field:${key}` };
    }
  }

  if (typeof input.action !== 'string' || !input.action.trim()) {
    return { ok: false, reason: 'invalid_action' };
  }

  if (!isPlainObject(input.parameters)) {
    return { ok: false, reason: 'invalid_parameters' };
  }

  if (!Number.isInteger(input.source_trust_level)) {
    return { ok: false, reason: 'invalid_source_trust_level' };
  }

  const sourceTrustLevel = input.source_trust_level as number;

  if (typeof input.session_id !== 'string' || !input.session_id.trim()) {
    return { ok: false, reason: 'invalid_session_id' };
  }

  if (typeof input.release_id !== 'string' || !input.release_id.trim()) {
    return { ok: false, reason: 'invalid_release_id' };
  }

  if (typeof input.evidence_summary !== 'string') {
    return { ok: false, reason: 'invalid_evidence_summary' };
  }

  if (input.attestation_id !== undefined && typeof input.attestation_id !== 'string') {
    return { ok: false, reason: 'invalid_attestation_id' };
  }

  if (
    input.risk_mode !== undefined &&
    input.risk_mode !== 'normal' &&
    input.risk_mode !== 'degraded' &&
    input.risk_mode !== 'quarantine'
  ) {
    return { ok: false, reason: 'invalid_risk_mode' };
  }

  return {
    ok: true,
    proposal: {
      action: input.action.trim(),
      parameters: input.parameters,
      source_trust_level: sourceTrustLevel,
      session_id: input.session_id.trim(),
      release_id: input.release_id.trim(),
      attestation_id:
        typeof input.attestation_id === 'string' ? input.attestation_id.trim() : undefined,
      evidence_summary: input.evidence_summary,
      risk_mode: input.risk_mode,
    },
  };
}

export function containsPolicyOverrideAttempt(text: string): boolean {
  return POLICY_OVERRIDE_PATTERNS.some((pattern) => pattern.test(text));
}

export function scanProposalForPolicyOverride(proposal: ActionProposal): boolean {
  if (containsPolicyOverrideAttempt(proposal.evidence_summary)) {
    return true;
  }

  const serialized = JSON.stringify(proposal.parameters);
  return containsPolicyOverrideAttempt(serialized);
}
