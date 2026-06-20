/** Patterns that must not appear in inert memory evidence payloads. */
const INERT_VIOLATION_PATTERNS: readonly RegExp[] = [
  /<script\b/i,
  /\bon\w+\s*=/i,
  /\beval\s*\(/i,
  /\bFunction\s*\(/i,
  /javascript:/i,
  /<iframe\b/i,
  /\b__proto__\b/,
  /\bconstructor\s*\[/i,
];

export function isInertEvidencePayload(payload: string): boolean {
  if (payload.length === 0) {
    return true;
  }
  return !INERT_VIOLATION_PATTERNS.some((pattern) => pattern.test(payload));
}

export function inertViolationReason(payload: string): string | null {
  for (const pattern of INERT_VIOLATION_PATTERNS) {
    if (pattern.test(payload)) {
      return `Payload matches forbidden pattern: ${pattern.source}`;
    }
  }
  return null;
}
