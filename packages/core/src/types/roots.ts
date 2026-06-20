/** Abstract trust roots — core domain types (no T3 dependency). */
export type ReleaseRoot = string;
export type PolicyHash = string;
export type AuditStateRoot = string;
export type RevocationStateRoot = string;

export type ContainmentRoots = {
  releaseRoot: ReleaseRoot;
  policyHash: PolicyHash;
  auditStateRoot: AuditStateRoot;
  revocationStateRoot: RevocationStateRoot;
};

export const EMPTY_ROOT = '0x' + '0'.repeat(64);

export function emptyRoots(): ContainmentRoots {
  return {
    releaseRoot: EMPTY_ROOT,
    policyHash: EMPTY_ROOT,
    auditStateRoot: EMPTY_ROOT,
    revocationStateRoot: EMPTY_ROOT,
  };
}
