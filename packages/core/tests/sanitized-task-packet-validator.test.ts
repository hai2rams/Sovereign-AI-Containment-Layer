import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateSanitizedModelTaskPacket } from '../src/validators/sanitized-task-packet-validator.js';
import { OUTPUT_CONTRACT_ACTION_PROPOSAL_V1 } from '../src/types/sanitized-task-packet.js';

describe('validateSanitizedModelTaskPacket', () => {
  it('19. accepts ACTION_PROPOSAL_V1', () => {
    const result = validateSanitizedModelTaskPacket({
      output_contract_id: OUTPUT_CONTRACT_ACTION_PROPOSAL_V1,
      task_id: 'task-001',
      instruction: 'Propose a payment for invoice 123',
    });
    assert.equal(result.ok, true);
  });

  it('20. arbitrary output_contract string rejects', () => {
    const withLegacyField = validateSanitizedModelTaskPacket({
      output_contract: 'ACTION_PROPOSAL_V1',
      task_id: 'task-001',
      instruction: 'test',
    });
    assert.equal(withLegacyField.ok, false);

    const withWrongId = validateSanitizedModelTaskPacket({
      output_contract_id: 'CUSTOM_CONTRACT_V9',
      task_id: 'task-001',
      instruction: 'test',
    });
    assert.equal(withWrongId.ok, false);
  });
});
