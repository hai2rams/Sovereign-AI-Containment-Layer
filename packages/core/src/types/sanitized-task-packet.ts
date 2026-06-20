import type { AsciiSlug } from './brands.js';

export const OUTPUT_CONTRACT_ACTION_PROPOSAL_V1 = 'ACTION_PROPOSAL_V1' as const;

export type OutputContractId = typeof OUTPUT_CONTRACT_ACTION_PROPOSAL_V1;

/** Safe task packet exposed to the model — no control-plane fields. */
export type SanitizedModelTaskPacket = {
  output_contract_id: OutputContractId;
  task_id: AsciiSlug;
  instruction: string;
  context_summary?: string;
};
