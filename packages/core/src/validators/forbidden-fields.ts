export const FORBIDDEN_CONTROL_PLANE_FIELDS = [
  'risk_mode',
  'source_trust_level',
  'release_status',
  'revocation_status',
  'attestation_id',
  'policy_hash',
  'state_root',
  'action_token_id',
  'audit_receipt_id',
  'approved',
  'authorized',
  'policy_decision',
  'token_valid',
  'release_certified',
  'revocation_epoch',
  'containment_epoch',
  'key_epoch',
  'idempotency_key',
  'transaction_sequence_counter',
  'signature',
  'public_key',
  'private_key',
  'monotonic_tick',
] as const;

const FORBIDDEN_SET = new Set<string>(FORBIDDEN_CONTROL_PLANE_FIELDS);

export function collectForbiddenFieldPaths(value: unknown, path = ''): string[] {
  if (value === null || typeof value !== 'object') {
    return [];
  }

  const errors: string[] = [];

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      errors.push(...collectForbiddenFieldPaths(item, `${path}[${index}]`));
    });
    return errors;
  }

  for (const [key, nested] of Object.entries(value)) {
    const fieldPath = path ? `${path}.${key}` : key;
    if (FORBIDDEN_SET.has(key)) {
      errors.push(`Forbidden control-plane field: ${fieldPath}`);
    }
    errors.push(...collectForbiddenFieldPaths(nested, fieldPath));
  }

  return errors;
}

export function validateNoForbiddenFields(value: unknown): { ok: true } | { ok: false; errors: string[] } {
  const errors = collectForbiddenFieldPaths(value);
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true };
}
