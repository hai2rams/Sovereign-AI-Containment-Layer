import type { ActionProposal } from '../types/action-proposal.js';
import { asAsciiSlug } from '../types/brands.js';
import type { RevocationSignal } from '../revocation-engine/types.js';
import type { StateEnvelope } from '../types/state-envelope.js';

export type ScenarioProposalInput = {
  action: string;
  amount_minor_units: number;
  currency: string;
  destination: string;
  reason_code: string;
  payment_reference: string;
};

export type ScenarioEnvelopeInput = {
  source_trust_level?: number;
  user_role?: string;
  risk_mode?: StateEnvelope['risk_mode'];
  release_status?: StateEnvelope['release_status'];
  revocation_status?: StateEnvelope['revocation_status'];
  attestation_id?: string;
  revocation_epoch?: number;
  containment_epoch?: number;
  key_epoch?: number;
};

export type ScenarioDefinition = {
  id: string;
  title: string;
  status: string;
  description: string;
  proposal?: ScenarioProposalInput;
  attack_proposal?: ScenarioProposalInput;
  envelope?: ScenarioEnvelopeInput;
  memory_payload?: string;
  revocation_signal?: RevocationSignal;
  policy_ref?: string;
  replay_ref?: string;
};

export type ScenarioOutcome = 'allowed' | 'contained';

export type ScenarioRunResult = {
  scenario_id: string;
  outcome: ScenarioOutcome;
  semantic_validation?: {
    accepted: boolean;
    engine: string;
    final_semantic_result: string;
    policy_decision: string;
    reason_codes: string[];
  };
  tool_execution?: {
    verification_result: string;
    reason_codes: string[];
  };
  memory_firewall?: {
    decision: string;
    reason_codes: string[];
    quarantine_recommended: boolean;
  };
  revocation_race?: {
    race_lost: boolean;
    reason_codes: string[];
  };
  telemetry_chain?: {
    valid: boolean;
    reason?: string;
    broken_at_sequence: number | null;
  };
};

export function proposalFromScenario(input: ScenarioProposalInput): ActionProposal {
  return {
    action: asAsciiSlug(input.action),
    amount_minor_units: input.amount_minor_units,
    currency: asAsciiSlug(input.currency),
    destination: asAsciiSlug(input.destination),
    reason_code: asAsciiSlug(input.reason_code),
    payment_reference: asAsciiSlug(input.payment_reference),
  };
}
