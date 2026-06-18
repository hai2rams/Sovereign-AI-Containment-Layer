import type { T3AdapterConfig } from './types.js';

function parseContractId(raw: string | undefined): number {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return NaN;
  }
  return Number(trimmed);
}

/**
 * Loads T3 adapter settings from process environment.
 * Set `required: true` when the caller needs a configured API key.
 */
export function loadT3Config(options: { required?: boolean } = {}): T3AdapterConfig {
  const apiKey = process.env.T3N_API_KEY?.trim() ?? '';

  if (options.required && !apiKey) {
    throw new Error('Missing required environment variable: T3N_API_KEY');
  }

  return {
    apiKey,
    environment: process.env.T3N_ENVIRONMENT === 'production' ? 'production' : 'testnet',
    contractId: parseContractId(process.env.T3N_CONTRACT_ID),
    contractTail: process.env.T3N_CONTRACT_TAIL?.trim() || 'containment-trust-anchor-v1',
    contractVersion: process.env.T3N_CONTRACT_VERSION?.trim() || '0.1.0',
    contractWasmPath: process.env.T3N_CONTRACT_WASM_PATH?.trim() ?? '',
  };
}

/** True when live T3N calls are possible (API key + registered contract id). */
export function isT3Configured(config: T3AdapterConfig): boolean {
  return Boolean(config.apiKey) && Number.isInteger(config.contractId) && config.contractId > 0;
}
