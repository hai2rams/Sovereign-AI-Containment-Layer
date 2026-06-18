import type { TenantSdkEnvironment } from '@terminal3/t3n-sdk';

export type T3AdapterConfig = {
  apiKey: string;
  environment: TenantSdkEnvironment;
  contractId: number;
  contractTail: string;
  contractVersion: string;
  contractWasmPath: string;
};

export type SecretsMapInitResult = {
  mapName: string;
  sealedKeys: string[];
  message: string;
};

export type SealedKeysView = {
  mapName: string;
  keys: Array<{ name: string; sealed: true }>;
  note: string;
};

export type ContractExecuteInput = {
  functionName: string;
  input?: Record<string, unknown>;
};

export type ContractExecuteResult = {
  contractTail: string;
  contractVersion: string;
  result: unknown;
};

export type RegisterContractResult = {
  contractId: number;
  scriptName: string;
  tenantDid: string;
};
