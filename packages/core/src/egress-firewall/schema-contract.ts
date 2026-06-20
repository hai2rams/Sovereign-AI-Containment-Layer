import type { AsciiSlug } from '../types/brands.js';
import { OUTPUT_CONTRACT_ACTION_PROPOSAL_V1 } from '../types/sanitized-task-packet.js';
import { StrictJsonIntake } from '../strict-json/index.js';
import { validateActionProposal } from '../validators/action-proposal-validator.js';
import {
  CERTIFIED_EGRESS_CONTRACTS,
  type CertifiedEgressContract,
} from './types.js';

const CONTRACT_SET = new Set<string>(CERTIFIED_EGRESS_CONTRACTS);

export function isCertifiedEgressContract(value: string): value is CertifiedEgressContract {
  return CONTRACT_SET.has(value);
}

export function validateEgressSchemaContract(
  output_contract_id: AsciiSlug,
  output_body: string,
): boolean {
  if (!isCertifiedEgressContract(output_contract_id)) {
    return false;
  }

  if (output_contract_id === OUTPUT_CONTRACT_ACTION_PROPOSAL_V1) {
    try {
      const parsed = StrictJsonIntake.parseRejectingDuplicateKeys(output_body);
      return validateActionProposal(parsed).ok;
    } catch {
      return false;
    }
  }

  if (output_contract_id === 'TEXT_EGRESS_V1') {
    if (output_body.length === 0 || output_body.length > 16_384) {
      return false;
    }
    for (let i = 0; i < output_body.length; i += 1) {
      const code = output_body.charCodeAt(i);
      if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
        return false;
      }
    }
    return true;
  }

  return false;
}
