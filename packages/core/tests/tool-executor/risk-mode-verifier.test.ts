import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { verifyRiskModePermitsExecution } from '../../src/tool-executor/risk-mode-verifier.js';
import { SWAP_ORIGINAL_PAYLOAD } from './fixtures.js';

describe('risk-mode-verifier', () => {
  it('12. quarantine blocks execution', () => {
    assert.equal(verifyRiskModePermitsExecution('quarantine', SWAP_ORIGINAL_PAYLOAD), false);
  });

  it('13. read_only blocks state-changing payment action', () => {
    assert.equal(verifyRiskModePermitsExecution('read_only', SWAP_ORIGINAL_PAYLOAD), false);
  });

  it('normal risk mode permits payment', () => {
    assert.equal(verifyRiskModePermitsExecution('normal', SWAP_ORIGINAL_PAYLOAD), true);
  });
});
