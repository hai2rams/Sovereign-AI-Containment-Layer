import { checkSensitiveActionAllowed } from '@sovereign/agent-passport';
import {
  loadPolicyRules,
  loadToolManifest,
  SENSITIVE_ACTIONS,
} from './config.js';
import { scanProposalForPolicyOverride, validateActionProposal } from './schema.js';
import type {
  EvaluatePolicyInput,
  PolicyDecision,
  PolicyEvaluationResult,
  ToolManifestEntry,
} from './types.js';

function deny(
  partial: Pick<PolicyEvaluationResult, 'action' | 'release_id' | 'reason' | 'policy_version'>,
): PolicyEvaluationResult {
  return {
    decision: 'DENY',
    allowed: false,
    evaluated_at: new Date().toISOString(),
    ...partial,
  };
}

function allow(
  partial: Pick<PolicyEvaluationResult, 'action' | 'release_id' | 'reason' | 'policy_version'>,
): PolicyEvaluationResult {
  return {
    decision: 'ALLOW',
    allowed: true,
    evaluated_at: new Date().toISOString(),
    ...partial,
  };
}

function findTool(manifest: ToolManifestEntry[], action: string): ToolManifestEntry | null {
  return manifest.find((tool) => tool.name === action) ?? null;
}

export async function evaluatePolicy(input: EvaluatePolicyInput): Promise<PolicyEvaluationResult> {
  const policy = await loadPolicyRules(input.repoRoot);
  const manifest = await loadToolManifest(input.repoRoot);

  const validated = validateActionProposal(input.proposal);
  if (!validated.ok) {
    return deny({
      action: 'unknown',
      release_id: 'unknown',
      reason: validated.reason,
      policy_version: policy.policy_version,
    });
  }

  const proposal = validated.proposal;

  if (scanProposalForPolicyOverride(proposal)) {
    return deny({
      action: proposal.action,
      release_id: proposal.release_id,
      reason: 'policy_override_blocked',
      policy_version: policy.policy_version,
    });
  }

  const tool = findTool(manifest, proposal.action);
  if (!tool || !tool.enabled) {
    return deny({
      action: proposal.action,
      release_id: proposal.release_id,
      reason: 'action_not_allowed',
      policy_version: policy.policy_version,
    });
  }

  const releaseGate = await checkSensitiveActionAllowed(input.repoRoot, proposal.release_id);
  if (SENSITIVE_ACTIONS.has(proposal.action) || tool.permission_level === 'sensitive') {
    if (!releaseGate.allowed) {
      return deny({
        action: proposal.action,
        release_id: proposal.release_id,
        reason: releaseGate.reason,
        policy_version: policy.policy_version,
      });
    }

    if (!proposal.attestation_id) {
      return deny({
        action: proposal.action,
        release_id: proposal.release_id,
        reason: 'missing_attestation',
        policy_version: policy.policy_version,
      });
    }
  }

  if (!tool.allowed_source_trust_levels.includes(proposal.source_trust_level)) {
    return deny({
      action: proposal.action,
      release_id: proposal.release_id,
      reason: 'source_trust_level_denied',
      policy_version: policy.policy_version,
    });
  }

  if (proposal.source_trust_level >= 3) {
    return deny({
      action: proposal.action,
      release_id: proposal.release_id,
      reason: 'source_trust_read_only_or_quarantine',
      policy_version: policy.policy_version,
    });
  }

  if (proposal.risk_mode === 'quarantine') {
    return deny({
      action: proposal.action,
      release_id: proposal.release_id,
      reason: 'session_quarantined',
      policy_version: policy.policy_version,
    });
  }

  if (proposal.action === 'payment.transfer') {
    const paymentDecision = evaluatePaymentTransfer(proposal.parameters, policy);
    if (paymentDecision) {
      return deny({
        action: proposal.action,
        release_id: proposal.release_id,
        reason: paymentDecision,
        policy_version: policy.policy_version,
      });
    }
  }

  if (proposal.action === 'memory.write' && proposal.source_trust_level >= 2) {
    return deny({
      action: proposal.action,
      release_id: proposal.release_id,
      reason: 'memory_write_source_denied',
      policy_version: policy.policy_version,
    });
  }

  return allow({
    action: proposal.action,
    release_id: proposal.release_id,
    reason: 'policy_allow',
    policy_version: policy.policy_version,
  });
}

function evaluatePaymentTransfer(
  parameters: Record<string, unknown>,
  policy: Awaited<ReturnType<typeof loadPolicyRules>>,
): string | null {
  const amount = parameters.amount;
  const destination = parameters.destination;
  const currency = parameters.currency;

  if (typeof amount !== 'number' || amount <= 0) {
    return 'invalid_payment_amount';
  }

  if (amount > 50) {
    return 'amount_limit_exceeded';
  }

  if (typeof currency !== 'string' || currency !== 'USD') {
    return 'invalid_payment_currency';
  }

  if (typeof destination !== 'string' || !destination.trim()) {
    return 'missing_payment_destination';
  }

  if (!policy.approved_payment_destinations.includes(destination)) {
    return 'destination_not_allowlisted';
  }

  return null;
}
