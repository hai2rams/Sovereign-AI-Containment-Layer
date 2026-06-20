import type { Sha256Hex } from '../types/brands.js';
import type { EgressPolicyArtifact } from './types.js';

export function verifyEgressPolicyHashes(
  expected_policy_hash: Sha256Hex,
  artifact: EgressPolicyArtifact,
): boolean {
  return (
    artifact.policy_hash === expected_policy_hash &&
    artifact.egress_policy_hash.startsWith('sha256:') &&
    artifact.egress_policy_hash.length === 71
  );
}

export function hashLockEgressPolicyArtifact(artifact: EgressPolicyArtifact): Sha256Hex {
  return artifact.egress_policy_hash;
}
