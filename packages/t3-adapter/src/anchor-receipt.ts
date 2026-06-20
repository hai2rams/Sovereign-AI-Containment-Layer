import type {
  AnchorAdapterKind,
  AnchorMode,
  AnchorStatus,
  AnchorType,
} from './anchor-types.js';

export interface AnchorReceipt {
  anchor_id: string;
  root_hash: string;
  anchor_type: AnchorType;
  anchored_at: string;
  status: AnchorStatus;
  mode: AnchorMode;
  adapter: AnchorAdapterKind;
  transaction_ref?: string;
  error_reason?: string;
}

export function createAnchorReceipt(input: {
  anchor_id: string;
  root_hash: string;
  anchor_type: AnchorType;
  status: AnchorStatus;
  mode: AnchorMode;
  adapter: AnchorAdapterKind;
  anchored_at?: string;
  transaction_ref?: string;
  error_reason?: string;
}): AnchorReceipt {
  return {
    anchor_id: input.anchor_id,
    root_hash: input.root_hash,
    anchor_type: input.anchor_type,
    anchored_at: input.anchored_at ?? new Date().toISOString(),
    status: input.status,
    mode: input.mode,
    adapter: input.adapter,
    ...(input.transaction_ref ? { transaction_ref: input.transaction_ref } : {}),
    ...(input.error_reason ? { error_reason: input.error_reason } : {}),
  };
}
