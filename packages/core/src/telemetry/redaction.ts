import type { SafePreviewResult } from './safe-preview.js';
import { buildSafePreview } from './safe-preview.js';

export type RedactionProfile = 'demo' | 'production';

export type RedactedPreview = {
  profile: RedactionProfile;
  preview_included: boolean;
  preview?: SafePreviewResult;
};

const SECRET_FIELD_PATTERN =
  /token|secret|idempotency|private_key|signature|password|api_key/i;

export function redactPayloadFields(
  payload: Record<string, unknown>,
  profile: RedactionProfile,
): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (SECRET_FIELD_PATTERN.test(key)) {
      redacted[key] = '[REDACTED]';
      continue;
    }
    if (key === 'state_envelope' || key === 'full_envelope') {
      redacted[key] = '[REDACTED_ENVELOPE]';
      continue;
    }
    redacted[key] = value;
  }

  if (profile === 'production' && 'model_output_preview' in redacted) {
    delete redacted.model_output_preview;
    delete redacted.preview_text;
    redacted.preview_redacted = true;
  }

  return redacted;
}

export function buildRedactedModelPreview(
  rawOutput: string,
  profile: RedactionProfile,
  maxBytes = 256,
): RedactedPreview {
  if (profile === 'production') {
    return {
      profile,
      preview_included: false,
    };
  }

  return {
    profile,
    preview_included: true,
    preview: buildSafePreview(rawOutput, {
      maxBytes,
      encodeBase64Url: true,
    }),
  };
}
