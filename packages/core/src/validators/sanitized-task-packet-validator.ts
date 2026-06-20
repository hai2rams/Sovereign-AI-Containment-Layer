import type { SanitizedModelTaskPacket } from '../types/sanitized-task-packet.js';
import { OUTPUT_CONTRACT_ACTION_PROPOSAL_V1 } from '../types/sanitized-task-packet.js';
import { validateAsciiSlug } from './ascii-slug.js';
import { validateNoForbiddenFields } from './forbidden-fields.js';
import { failure, mergeFailures, success, type ValidationResult } from './result.js';

const MAX_INSTRUCTION_LENGTH = 16_384;
const MAX_CONTEXT_SUMMARY_LENGTH = 4_096;

export function validateSanitizedModelTaskPacket(
  input: unknown,
): ValidationResult<SanitizedModelTaskPacket> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return failure('SanitizedModelTaskPacket must be an object');
  }

  const record = input as Record<string, unknown>;

  if ('output_contract' in record) {
    return failure('output_contract is not allowed; use output_contract_id');
  }

  if (!('output_contract_id' in record)) {
    return failure('output_contract_id is required');
  }

  if (record.output_contract_id !== OUTPUT_CONTRACT_ACTION_PROPOSAL_V1) {
    return failure(
      `output_contract_id must be exactly ${OUTPUT_CONTRACT_ACTION_PROPOSAL_V1}`,
    );
  }

  const forbidden = validateNoForbiddenFields(record);
  if (!forbidden.ok) {
    return failure(...forbidden.errors);
  }

  if (typeof record.instruction !== 'string' || record.instruction.length === 0) {
    return failure('instruction must be a non-empty string');
  }
  if (record.instruction.length > MAX_INSTRUCTION_LENGTH) {
    return failure('instruction exceeds maximum length');
  }

  if (record.context_summary !== undefined) {
    if (typeof record.context_summary !== 'string') {
      return failure('context_summary must be a string when provided');
    }
    if (record.context_summary.length > MAX_CONTEXT_SUMMARY_LENGTH) {
      return failure('context_summary exceeds maximum length');
    }
  }

  const taskId = validateAsciiSlug(record.task_id);
  const merged = mergeFailures([taskId]);
  if (merged) {
    return merged;
  }
  if (!taskId.ok) {
    return failure('task_id validation failed');
  }

  return success({
    output_contract_id: OUTPUT_CONTRACT_ACTION_PROPOSAL_V1,
    task_id: taskId.value,
    instruction: record.instruction,
    ...(record.context_summary !== undefined
      ? { context_summary: record.context_summary }
      : {}),
  });
}
