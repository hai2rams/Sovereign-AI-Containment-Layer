import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { streamingPermitted } from '../../src/egress-firewall/streaming-gate.js';

describe('streaming-gate', () => {
  it('blocks streaming in quarantine', () => {
    assert.equal(streamingPermitted('quarantine', true), false);
  });

  it('allows streaming in normal mode', () => {
    assert.equal(streamingPermitted('normal', true), true);
  });

  it('allows non-streaming egress in quarantine', () => {
    assert.equal(streamingPermitted('quarantine', false), true);
  });
});
