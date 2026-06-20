import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildRedactedModelPreview,
  redactPayloadFields,
} from '../../src/telemetry/redaction.js';
import { TelemetryEmitter } from '../../src/telemetry/telemetry-emitter.js';
import { TelemetryJsonlWriter } from '../../src/telemetry/telemetry-jsonl-writer.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('telemetry redaction', () => {
  it('production redaction removes raw preview', () => {
    const redacted = buildRedactedModelPreview('secret model output', 'production');
    assert.equal(redacted.preview_included, false);
    assert.equal(redacted.preview, undefined);
  });

  it('demo mode includes capped encoded preview', () => {
    const redacted = buildRedactedModelPreview('demo output text', 'demo', 32);
    assert.equal(redacted.preview_included, true);
    assert.ok(redacted.preview?.preview_base64url);
  });

  it('telemetry does not emit idempotency_key or token secrets', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tel-redact-'));
    const path = join(dir, 'stream.jsonl');
    const emitter = new TelemetryEmitter({
      session_id: 's',
      writer: new TelemetryJsonlWriter(path),
      redaction_profile: 'production',
    });

    emitter.emit('POLICY_DECISION_ISSUED', {
      idempotency_key: 'secret-idem',
      token_secret: 'top-secret',
      action_token: 'tok',
      model_output_preview: 'should be stripped',
    });

    const event = emitter.getEvents()[0];
    assert.equal('idempotency_key' in event.payload, false);
    assert.equal('token_secret' in event.payload, false);
    assert.equal('action_token' in event.payload, false);
    assert.equal(event.payload.model_output_preview, undefined);

    rmSync(dir, { recursive: true, force: true });
  });

  it('telemetry does not emit full StateEnvelope', () => {
    const payload = redactPayloadFields(
      {
        state_envelope: { session_id: 'hidden' },
        action: 'payment.transfer',
      },
      'demo',
    );
    assert.equal(payload.state_envelope, '[REDACTED_ENVELOPE]');
  });
});
