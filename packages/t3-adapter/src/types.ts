import type { TenantSdkEnvironment } from '@terminal3/t3n-sdk';

export type T3AdapterConfig = {
  apiKey: string;
  environment: TenantSdkEnvironment;
  contractId: number;
  contractTail: string;
  contractVersion: string;
  contractWasmPath: string;
};
