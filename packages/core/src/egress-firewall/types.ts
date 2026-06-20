import { asSha256Hex, type AsciiSlug, type Sha256Hex } from '../types/brands.js';
import type { RiskMode } from '../types/risk.js';

export type EgressDecision = 'allowed' | 'blocked';

export const EGRESS_BLOCKED_REASONS = [
  'EGRESS_DESTINATION_NOT_ALLOWLISTED',
  'EGRESS_SCHEMA_VIOLATION',
  'EXFIL_PATTERN_DETECTED',
  'HIGH_ENTROPY_OUTPUT_BLOCKED',
  'STREAMING_DISABLED_IN_QUARANTINE',
  'EGRESS_POLICY_HASH_MISMATCH',
  'RISK_MODE_BLOCKS_EGRESS',
] as const;

export type EgressBlockedReason = (typeof EGRESS_BLOCKED_REASONS)[number];

export const CERTIFIED_EGRESS_CONTRACTS = ['ACTION_PROPOSAL_V1', 'TEXT_EGRESS_V1'] as const;

export type CertifiedEgressContract = (typeof CERTIFIED_EGRESS_CONTRACTS)[number];

export interface EgressPolicyArtifact {
  policy_hash: Sha256Hex;
  egress_policy_hash: Sha256Hex;
  certified_destinations: readonly string[];
  certified_contracts: readonly CertifiedEgressContract[];
}

export interface EgressVerificationRequest {
  output_body: string;
  output_contract_id: AsciiSlug;
  egress_destination: AsciiSlug;
  risk_mode: RiskMode;
  envelope_policy_hash: Sha256Hex;
  policy: EgressPolicyArtifact;
  streaming_requested: boolean;
  monotonic_tick?: number;
}

export interface EgressVerificationResult {
  decision: EgressDecision;
  reason_codes: EgressBlockedReason[];
  schema_valid: boolean;
  destination_allowed: boolean;
  exfil_pattern_detected: boolean;
  streaming_permitted: boolean;
  policy_hash_matches: boolean;
  timing_pad_ms: number;
  egress_transmitted: false;
}

export const DEFAULT_TIMING_PAD_INTERVAL_MS = 100;

export const DEFAULT_EGRESS_POLICY: EgressPolicyArtifact = {
  policy_hash: asSha256Hex('sha256:' + 'b'.repeat(64)),
  egress_policy_hash: asSha256Hex('sha256:' + 'c'.repeat(64)),
  certified_destinations: ['telemetry_sink', 'audit_ledger', 'model_response_channel'],
  certified_contracts: ['ACTION_PROPOSAL_V1', 'TEXT_EGRESS_V1'],
};
