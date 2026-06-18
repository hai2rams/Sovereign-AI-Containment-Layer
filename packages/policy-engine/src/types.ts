export type RiskMode = 'normal' | 'degraded' | 'quarantine';

export type ActionProposal = {
  action: string;
  parameters: Record<string, unknown>;
  source_trust_level: number;
  session_id: string;
  release_id: string;
  attestation_id?: string;
  evidence_summary: string;
  risk_mode?: RiskMode;
};

export type PolicyDecision = 'ALLOW' | 'DENY' | 'HOLD';

export type PolicyEvaluationResult = {
  decision: PolicyDecision;
  allowed: boolean;
  action: string;
  release_id: string;
  reason: string;
  policy_version: string;
  evaluated_at: string;
};

export type ToolManifestEntry = {
  name: string;
  permission_level: string;
  allowed_source_trust_levels: number[];
  human_approval_required: boolean;
  enabled: boolean;
};

export type PolicyRulesConfig = {
  policy_version: string;
  approved_payment_destinations: string[];
  rules: Array<Record<string, unknown>>;
};

export type EvaluatePolicyInput = {
  repoRoot: string;
  proposal: unknown;
};
