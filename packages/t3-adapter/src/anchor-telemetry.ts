import type { AnchorMode, AnchorStatus, AnchorType } from './anchor-types.js';
import type { AnchorReceipt } from './anchor-receipt.js';

export type T3AnchorTelemetryEventKind =
  | 'T3_ANCHOR_ATTEMPTED'
  | 'T3_ANCHOR_CONFIRMED'
  | 'T3_ANCHOR_FAILED';

export type T3AnchorTelemetryPayload = {
  telemetry_event: T3AnchorTelemetryEventKind;
  trace_id: string;
  session_id?: string;
  anchor_type: AnchorType;
  root_hash: string;
  mode: AnchorMode;
  status: AnchorStatus;
  transaction_ref?: string;
  error_reason?: string;
};

const FORBIDDEN_TELEMETRY_KEYS = [
  'private_key',
  'wallet_seed',
  'rpc_secret',
  'contract_secret',
  'raw_prompt',
  'raw_document',
  'raw_token',
  'state_envelope',
  'api_key',
  'T3N_API_KEY',
] as const;

export function buildT3AnchorTelemetryPayload(input: {
  kind: T3AnchorTelemetryEventKind;
  trace_id: string;
  session_id?: string;
  receipt: AnchorReceipt;
}): T3AnchorTelemetryPayload {
  const payload: T3AnchorTelemetryPayload = {
    telemetry_event: input.kind,
    trace_id: input.trace_id,
    anchor_type: input.receipt.anchor_type,
    root_hash: input.receipt.root_hash,
    mode: input.receipt.mode,
    status: input.receipt.status,
  };

  if (input.session_id) {
    payload.session_id = input.session_id;
  }
  if (input.receipt.transaction_ref) {
    payload.transaction_ref = input.receipt.transaction_ref;
  }
  if (input.receipt.error_reason) {
    payload.error_reason = input.receipt.error_reason;
  }

  for (const key of FORBIDDEN_TELEMETRY_KEYS) {
    if (key in (payload as Record<string, unknown>)) {
      throw new Error(`Forbidden telemetry field: ${key}`);
    }
  }

  return payload;
}

export function telemetryKindForReceipt(receipt: AnchorReceipt): T3AnchorTelemetryEventKind {
  if (receipt.status === 'failed') {
    return 'T3_ANCHOR_FAILED';
  }
  if (receipt.status === 'confirmed') {
    return 'T3_ANCHOR_CONFIRMED';
  }
  return 'T3_ANCHOR_ATTEMPTED';
}
