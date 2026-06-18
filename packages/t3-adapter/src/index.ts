export { getT3Session, resetT3Session, type T3Session } from './client.js';
export { loadT3Config, isT3Configured } from './config.js';
export {
  initializeSecretsMap,
  listSealedKeys,
  resetSealedKeyRegistry,
  SECRETS_MAP_TAIL,
} from './secretsMap.js';
export { readMapEntry } from './mapEntry.js';
export { executeContract } from './contractExecute.js';
export { registerContract } from './registerContract.js';
export type {
  T3AdapterConfig,
  SecretsMapInitResult,
  SealedKeysView,
  ContractExecuteInput,
  ContractExecuteResult,
  RegisterContractResult,
} from './types.js';
