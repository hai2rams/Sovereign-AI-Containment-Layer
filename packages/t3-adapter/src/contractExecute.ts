import type { TenantClient } from '@terminal3/t3n-sdk';
import type { ContractExecuteInput, ContractExecuteResult } from './types.js';

/**
 * Invokes a registered TEE contract function on T3N.
 * Contract code reads sealed map entries inside the enclave — not via this SDK.
 */
export async function executeContract(
  tenant: TenantClient,
  contractTail: string,
  contractVersion: string,
  request: ContractExecuteInput,
): Promise<ContractExecuteResult> {
  const result = await tenant.contracts.execute(contractTail, {
    version: contractVersion,
    functionName: request.functionName,
    input: request.input ?? {},
  });

  return {
    contractTail,
    contractVersion,
    result,
  };
}
