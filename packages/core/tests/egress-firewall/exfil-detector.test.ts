import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { detectExfilPatterns } from '../../src/egress-firewall/exfil-detector.js';
import { EXFIL_PRIVATE_KEY, HIGH_ENTROPY_BLOB, VALID_TEXT_EGRESS } from './fixtures.js';

describe('exfil-detector', () => {
  it('allows certified plain text', () => {
    const result = detectExfilPatterns(VALID_TEXT_EGRESS);
    assert.equal(result.exfil_pattern_detected, false);
    assert.equal(result.high_entropy_blocked, false);
  });

  it('detects private key exfil pattern', () => {
    const result = detectExfilPatterns(EXFIL_PRIVATE_KEY);
    assert.equal(result.exfil_pattern_detected, true);
  });

  it('blocks high-entropy blob output', () => {
    const result = detectExfilPatterns(HIGH_ENTROPY_BLOB);
    assert.equal(result.high_entropy_blocked, true);
  });
});
