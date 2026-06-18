import type { TenantClient } from '@terminal3/t3n-sdk';
import type { RegisterContractResult } from './types.js';

type RegisterResponse = {
  contract_id?: number;
  contractId?: number;
};

function extractContractId(result: unknown): number {
  if (!result || typeof result !== 'object') {
    throw new Error('Unexpected register response shape');
  }

  const payload = result as RegisterResponse;
  const contractId = payload.contract_id ?? payload.contractId;

  if (typeof contractId !== 'number' || !Number.isInteger(contractId)) {
    throw new Error(`Register succeeded but contract id was missing: ${JSON.stringify(result)}`);
  }

  return contractId;
}

/**
 * Registers a WASM TEE contract on T3N and returns the numeric contract id.
 */
export async function registerContract(
  tenant: TenantClient,
  tenantDid: string,
  options: {
    tail: string;
    version: string;
    wasm: Uint8Array;
  },
): Promise<RegisterContractResult> {
  const result = await tenant.contracts.register({
    tail: options.tail,
    version: options.version,
    wasm: options.wasm,
  });

  const contractId = extractContractId(result);
  const tenantId = tenantDid.replace(/^did:t3n:/, '');
  const scriptName = `z:${tenantId}:${options.tail}`;

  return { contractId, scriptName, tenantDid };
}
