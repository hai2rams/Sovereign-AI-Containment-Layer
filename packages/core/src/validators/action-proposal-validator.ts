import type { ActionProposal } from '../types/action-proposal.js';
import { ACTION_PROPOSAL_ALLOWED_FIELDS } from '../types/action-proposal.js';
import { validateAsciiSlug } from './ascii-slug.js';
import { validateNoForbiddenFields } from './forbidden-fields.js';
import { validatePositiveSafeInteger } from './positive-safe-integer.js';
import { failure, mergeFailures, success, type ValidationResult } from './result.js';

const ALLOWED_FIELD_SET = new Set<string>(ACTION_PROPOSAL_ALLOWED_FIELDS);

export function validateActionProposal(input: unknown): ValidationResult<ActionProposal> {
  if (Array.isArray(input)) {
    return failure('ActionProposal must be a JSON object, not an array');
  }
  if (input === null || typeof input !== 'object') {
    return failure('ActionProposal must be an object');
  }

  const record = input as Record<string, unknown>;
  const unknownFields = Object.keys(record).filter((key) => !ALLOWED_FIELD_SET.has(key));
  if (unknownFields.length > 0) {
    return failure(`Unknown field(s): ${unknownFields.join(', ')}`);
  }
  if ('additional_parameters' in record) {
    return failure('additional_parameters is not allowed');
  }

  const forbidden = validateNoForbiddenFields(record);
  if (!forbidden.ok) {
    return failure(...forbidden.errors);
  }

  const required = ACTION_PROPOSAL_ALLOWED_FIELDS;
  for (const field of required) {
    if (!(field in record)) {
      return failure(`Missing required field: ${field}`);
    }
  }

  const action = validateAsciiSlug(record.action);
  const amount = validatePositiveSafeInteger(record.amount_minor_units);
  const currency = validateAsciiSlug(record.currency);
  const destination = validateAsciiSlug(record.destination);
  const reasonCode = validateAsciiSlug(record.reason_code);
  const paymentReference = validateAsciiSlug(record.payment_reference);

  const merged = mergeFailures([action, amount, currency, destination, reasonCode, paymentReference]);
  if (merged) {
    return merged;
  }

  if (!action.ok || !amount.ok || !currency.ok || !destination.ok || !reasonCode.ok || !paymentReference.ok) {
    return failure('ActionProposal validation failed');
  }

  return success({
    action: action.value,
    amount_minor_units: amount.value,
    currency: currency.value,
    destination: destination.value,
    reason_code: reasonCode.value,
    payment_reference: paymentReference.value,
  });
}
