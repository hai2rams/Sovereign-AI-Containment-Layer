import type { AsciiSlug } from './brands.js';

export const ACTION_PROPOSAL_ALLOWED_FIELDS = [
  'action',
  'amount_minor_units',
  'currency',
  'destination',
  'reason_code',
  'payment_reference',
] as const;

export type ActionProposalField = (typeof ACTION_PROPOSAL_ALLOWED_FIELDS)[number];

/** Model-facing payment action — control-plane fields are forbidden. */
export type ActionProposal = {
  action: AsciiSlug;
  amount_minor_units: number;
  currency: AsciiSlug;
  destination: AsciiSlug;
  reason_code: AsciiSlug;
  payment_reference: AsciiSlug;
};
