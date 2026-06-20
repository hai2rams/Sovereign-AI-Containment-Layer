import type { SourceTrustLevel } from '../types/risk.js';
import type { MemoryEvidenceMetadata } from './types.js';

/** Re-check trust on memory read — effective trust is the stricter of session and evidence trust. */
export function revalidateReadTrust(
  metadata: MemoryEvidenceMetadata,
  current_source_trust_level: SourceTrustLevel,
): { effective_trust_level: SourceTrustLevel; trust_depreciated: boolean } {
  const effective = Math.max(metadata.evidence_trust_level, current_source_trust_level) as SourceTrustLevel;
  const trust_depreciated = metadata.evidence_trust_level > current_source_trust_level;
  return { effective_trust_level: effective, trust_depreciated };
}

export function readTrustBlocksAccess(
  metadata: MemoryEvidenceMetadata,
  current_source_trust_level: SourceTrustLevel,
): boolean {
  return metadata.evidence_trust_level > current_source_trust_level;
}
