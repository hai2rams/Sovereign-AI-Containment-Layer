import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateEgressSchemaContract } from '../../src/egress-firewall/schema-contract.js';
import { asAsciiSlug } from '../../src/types/brands.js';
import { OUTPUT_CONTRACT_ACTION_PROPOSAL_V1 } from '../../src/types/sanitized-task-packet.js';
import { VALID_ACTION_PROPOSAL_JSON, VALID_TEXT_EGRESS } from './fixtures.js';

describe('schema-contract', () => {
  it('accepts ACTION_PROPOSAL_V1 contracted output', () => {
    assert.equal(
      validateEgressSchemaContract(asAsciiSlug(OUTPUT_CONTRACT_ACTION_PROPOSAL_V1), VALID_ACTION_PROPOSAL_JSON),
      true,
    );
  });

  it('accepts TEXT_EGRESS_V1 plain output', () => {
    assert.equal(validateEgressSchemaContract(asAsciiSlug('TEXT_EGRESS_V1'), VALID_TEXT_EGRESS), true);
  });

  it('rejects unknown contract id', () => {
    assert.equal(validateEgressSchemaContract(asAsciiSlug('UNKNOWN_CONTRACT'), VALID_TEXT_EGRESS), false);
  });

  it('rejects malformed action proposal JSON', () => {
    assert.equal(
      validateEgressSchemaContract(asAsciiSlug(OUTPUT_CONTRACT_ACTION_PROPOSAL_V1), '{"action":"x"}'),
      false,
    );
  });
});
