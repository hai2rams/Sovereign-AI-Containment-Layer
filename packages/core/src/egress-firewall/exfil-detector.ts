const EXFIL_PATTERNS: readonly RegExp[] = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bghp_[A-Za-z0-9]{20,}\b/,
  /\bsk-[A-Za-z0-9]{20,}\b/,
  /\bBearer\s+[A-Za-z0-9._-]{20,}\b/i,
];

const BASE64_BLOB = /[A-Za-z0-9+/]{80,}={0,2}/;

export type ExfilDetectionResult = {
  exfil_pattern_detected: boolean;
  high_entropy_blocked: boolean;
  matched_pattern?: string;
};

export function detectExfilPatterns(output_body: string): ExfilDetectionResult {
  for (const pattern of EXFIL_PATTERNS) {
    if (pattern.test(output_body)) {
      return {
        exfil_pattern_detected: true,
        high_entropy_blocked: false,
        matched_pattern: pattern.source,
      };
    }
  }

  if (BASE64_BLOB.test(output_body)) {
    return {
      exfil_pattern_detected: true,
      high_entropy_blocked: true,
      matched_pattern: 'base64_blob',
    };
  }

  const entropy = shannonEntropy(output_body);
  if (output_body.length >= 64 && entropy >= 4.5) {
    return {
      exfil_pattern_detected: false,
      high_entropy_blocked: true,
    };
  }

  return { exfil_pattern_detected: false, high_entropy_blocked: false };
}

function shannonEntropy(text: string): number {
  if (text.length === 0) {
    return 0;
  }
  const freq = new Map<string, number>();
  for (const char of text) {
    freq.set(char, (freq.get(char) ?? 0) + 1);
  }
  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / text.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}
