/** UTF-8-safe truncation and Base64URL preview encoding. */

export type SafePreviewOptions = {
  maxBytes?: number;
  encodeBase64Url?: boolean;
};

const DEFAULT_MAX_BYTES = 512;

function utf8ByteLength(text: string): number {
  return Buffer.byteLength(text, 'utf8');
}

/**
 * Truncate string to max UTF-8 bytes without splitting code points.
 */
export function truncateUtf8Safe(text: string, maxBytes: number): string {
  if (utf8ByteLength(text) <= maxBytes) {
    return text;
  }

  let result = '';
  for (const char of text) {
    const next = result + char;
    if (utf8ByteLength(next) > maxBytes) {
      break;
    }
    result = next;
  }
  return result;
}

export function toBase64Url(bytes: Buffer): string {
  return bytes
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function encodeBase64UrlUtf8(text: string): string {
  return toBase64Url(Buffer.from(text, 'utf8'));
}

export type SafePreviewResult = {
  truncated: boolean;
  original_byte_length: number;
  preview_byte_length: number;
  preview_text?: string;
  preview_base64url?: string;
};

export function buildSafePreview(
  raw: string,
  options: SafePreviewOptions = {},
): SafePreviewResult {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const original_byte_length = utf8ByteLength(raw);
  const truncatedText = truncateUtf8Safe(raw, maxBytes);
  const truncated = truncatedText.length < raw.length || original_byte_length > maxBytes;

  const result: SafePreviewResult = {
    truncated,
    original_byte_length,
    preview_byte_length: utf8ByteLength(truncatedText),
  };

  if (options.encodeBase64Url) {
    result.preview_base64url = encodeBase64UrlUtf8(truncatedText);
  } else {
    result.preview_text = truncatedText;
  }

  return result;
}
