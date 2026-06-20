export type RiskMode = 'normal' | 'degraded' | 'read_only' | 'quarantine' | 'revoked';

/** Numeric source trust tier (0 = highest trust, 5 = adversarial). */
export type SourceTrustLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type ReleaseStatus = 'pending' | 'certified' | 'revoked';

export type RevocationStatus = 'active' | 'revoked' | 'quarantined';

export type PolicyDecision = 'allow' | 'deny' | 'defer';

export type MemoryQuotaStatus = 'normal' | 'near_limit' | 'exceeded';

export const RISK_MODES: readonly RiskMode[] = [
  'normal',
  'degraded',
  'read_only',
  'quarantine',
  'revoked',
];

export const SOURCE_TRUST_LEVELS: readonly SourceTrustLevel[] = [0, 1, 2, 3, 4, 5];

export const RELEASE_STATUSES: readonly ReleaseStatus[] = ['pending', 'certified', 'revoked'];
export const REVOCATION_STATUSES: readonly RevocationStatus[] = [
  'active',
  'revoked',
  'quarantined',
];
export const POLICY_DECISIONS: readonly PolicyDecision[] = ['allow', 'deny', 'defer'];
export const MEMORY_QUOTA_STATUSES: readonly MemoryQuotaStatus[] = [
  'normal',
  'near_limit',
  'exceeded',
];

/** Higher index = more severe — used when applying semantic outcomes to risk_mode. */
export const RISK_MODE_SEVERITY: Record<RiskMode, number> = {
  normal: 0,
  degraded: 1,
  read_only: 2,
  revoked: 3,
  quarantine: 4,
};

export function isSourceTrustLevel(value: unknown): value is SourceTrustLevel {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 5;
}

export function isRiskMode(value: unknown): value is RiskMode {
  return typeof value === 'string' && (RISK_MODES as readonly string[]).includes(value);
}
