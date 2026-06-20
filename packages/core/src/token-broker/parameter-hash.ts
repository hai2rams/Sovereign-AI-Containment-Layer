import { createHash } from 'node:crypto';
import type { ActionProposal } from '../types/action-proposal.js';
import { asSha256Hex, type Sha256Hex } from '../types/brands.js';
import {
  canonicalizeActionProposal,
  ParameterCanonicalizerError,
} from './parameter-canonicalizer.js';

export function computeParameterHash(proposal: ActionProposal): Sha256Hex {
  const canonical = canonicalizeActionProposal(proposal);
  const digest = createHash('sha256').update(canonical, 'utf8').digest('hex');
  return asSha256Hex(`sha256:${digest}`);
}

export function tryComputeParameterHash(
  proposal: ActionProposal,
): { ok: true; hash: Sha256Hex } | { ok: false; error: ParameterCanonicalizerError } {
  try {
    return { ok: true, hash: computeParameterHash(proposal) };
  } catch (error) {
    if (error instanceof ParameterCanonicalizerError) {
      return { ok: false, error };
    }
    throw error;
  }
}
