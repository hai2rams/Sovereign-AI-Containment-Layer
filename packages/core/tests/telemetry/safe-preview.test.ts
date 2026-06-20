import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildSafePreview, truncateUtf8Safe } from '../../src/telemetry/safe-preview.js';

describe('safe preview', () => {
  it('caps large output', () => {
    const raw = 'a'.repeat(10_000);
    const preview = buildSafePreview(raw, { maxBytes: 64 });
    assert.equal(preview.truncated, true);
    assert.ok((preview.preview_byte_length ?? 0) <= 64);
  });

  it('handles emoji/CJK truncation safely without splitting code points', () => {
    const raw = '支付💳' + '文'.repeat(200);
    const truncated = truncateUtf8Safe(raw, 20);
    assert.ok(Buffer.byteLength(truncated, 'utf8') <= 20);
    assert.doesNotThrow(() => truncated.normalize());
  });

  it('demo mode includes capped encoded preview', () => {
    const preview = buildSafePreview('hello world', { maxBytes: 64, encodeBase64Url: true });
    assert.ok(preview.preview_base64url);
    assert.equal(preview.preview_text, undefined);
  });
});
