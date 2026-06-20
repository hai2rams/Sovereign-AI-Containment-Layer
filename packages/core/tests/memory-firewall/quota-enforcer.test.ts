import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { checkWriteQuota, applySuccessfulWrite } from '../../src/memory-firewall/quota-enforcer.js';
import { memoryEnvelope, TIGHT_POLICY } from './fixtures.js';

describe('quota-enforcer', () => {
  it('blocks when write count quota exceeded', () => {
    const quota = memoryEnvelope({
      memory_quota: {
        ...memoryEnvelope().memory_quota,
        memory_write_count: 2,
      },
    }).memory_quota;
    const result = checkWriteQuota(quota, TIGHT_POLICY, 10);
    assert.equal(result.allowed, false);
    if (!result.allowed) {
      assert.equal(result.reason, 'MEMORY_QUOTA_EXCEEDED');
    }
  });

  it('updates counters on successful write', () => {
    const quota = memoryEnvelope().memory_quota;
    const updated = applySuccessfulWrite(quota, TIGHT_POLICY, 100, {
      duplicate_detected: false,
      similar_detected: false,
      unique_payload: true,
    });
    assert.equal(updated.memory_write_count, 1);
    assert.equal(updated.memory_payload_bytes, 100);
    assert.equal(updated.memory_unique_payload_attempts, 1);
  });
});
