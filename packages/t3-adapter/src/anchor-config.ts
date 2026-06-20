import type { AnchorMode } from './anchor-types.js';

export type T3AnchorEnvironment = 'testnet' | 'production';

export type AnchorConfig = {
  mode: AnchorMode;
  apiKey: string;
  environment: T3AnchorEnvironment;
  contractId: number;
  contractTail: string;
  contractVersion: string;
};

export class AnchorConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnchorConfigError';
  }
}

function parseContractId(raw: string | undefined): number {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return NaN;
  }
  return Number(trimmed);
}

export function loadAnchorConfig(env: NodeJS.ProcessEnv = process.env): AnchorConfig {
  const modeRaw = env.T3_ANCHOR_MODE?.trim() || 'dry_run';
  const mode: AnchorMode = modeRaw === 'real_write' ? 'real_write' : 'dry_run';

  return {
    mode,
    apiKey: env.T3N_API_KEY?.trim() ?? '',
    environment: env.T3N_ENVIRONMENT === 'production' ? 'production' : 'testnet',
    contractId: parseContractId(env.T3N_CONTRACT_ID),
    contractTail: env.T3N_CONTRACT_TAIL?.trim() || 'containment-trust-anchor-v1',
    contractVersion: env.T3N_CONTRACT_VERSION?.trim() || '0.1.0',
  };
}

export function isRealWriteConfigReady(config: AnchorConfig): boolean {
  return (
    Boolean(config.apiKey) &&
    Number.isInteger(config.contractId) &&
    config.contractId > 0 &&
    Boolean(config.contractTail)
  );
}

/** Fail closed when real_write is requested without required secrets/config. */
export function assertRealWriteReady(config: AnchorConfig): void {
  if (config.mode !== 'real_write') {
    return;
  }
  if (!config.apiKey) {
    throw new AnchorConfigError('real_write requires T3N_API_KEY');
  }
  if (!Number.isInteger(config.contractId) || config.contractId <= 0) {
    throw new AnchorConfigError('real_write requires valid T3N_CONTRACT_ID');
  }
  if (!config.contractTail) {
    throw new AnchorConfigError('real_write requires T3N_CONTRACT_TAIL');
  }
}
