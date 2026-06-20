import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeTimingPadMs } from '../../src/egress-firewall/timing-pad.js';

describe('timing-pad', () => {
  it('pads to fixed interval boundary', () => {
    assert.equal(computeTimingPadMs(0, 100), 100);
    assert.equal(computeTimingPadMs(40, 100), 60);
    assert.equal(computeTimingPadMs(100, 100), 100);
  });
});
