export type AnchorType = 'release' | 'policy' | 'audit' | 'revocation';

export type AnchorMode = 'dry_run' | 'real_write';

export type AnchorStatus = 'pending' | 'confirmed' | 'failed';

export type AnchorAdapterKind = 'placeholder' | 't3';

export const ANCHOR_TYPES: readonly AnchorType[] = [
  'release',
  'policy',
  'audit',
  'revocation',
];

/** Payload types that must never be passed to the anchoring layer. */
export const ANCHOR_FORBIDDEN_CONTENT_KINDS = [
  'raw_prompt',
  'raw_rag_content',
  'uploaded_document',
  'raw_memory_payload',
  'action_token',
  'private_key',
  'secret',
  'state_envelope',
  'idempotency_key',
  'full_attestation_quote',
] as const;
