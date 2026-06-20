export type RiskMode = 'normal' | 'elevated' | 'critical';

export type SourceTrustLevel = 'untrusted' | 'verified' | 'certified';

export type ReleaseStatus = 'pending' | 'certified' | 'revoked';

export type RevocationStatus = 'active' | 'revoked' | 'quarantined';

export type PolicyDecision = 'allow' | 'deny' | 'defer';

export type MemoryQuotaStatus = 'normal' | 'near_limit' | 'exceeded';

export const RISK_MODES: readonly RiskMode[] = ['normal', 'elevated', 'critical'];
export const SOURCE_TRUST_LEVELS: readonly SourceTrustLevel[] = [
  'untrusted',
  'verified',
  'certified',
];
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
