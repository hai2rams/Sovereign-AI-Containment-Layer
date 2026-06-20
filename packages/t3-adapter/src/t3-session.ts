/**
 * Ported session bootstrap from prototype/t3-validated (reference only).
 * Used for future contract writes — M4 does not execute production writes.
 */
import {
  T3nClient,
  TenantClient,
  createEthAuthInput,
  eth_get_address,
  getNodeUrl,
  loadWasmComponent,
  metamask_sign,
  setEnvironment,
  type TenantSdkEnvironment,
} from '@terminal3/t3n-sdk';
import type { T3AnchorEnvironment } from './anchor-config.js';

export type T3Session = {
  tenantDid: string;
};

let sessionPromise: Promise<T3Session> | null = null;

export async function getT3SessionForAnchoring(
  apiKey: string,
  environment: T3AnchorEnvironment,
): Promise<T3Session> {
  if (!sessionPromise) {
    sessionPromise = bootstrapSession(apiKey, environment);
  }
  return sessionPromise;
}

async function bootstrapSession(
  apiKey: string,
  environment: T3AnchorEnvironment,
): Promise<T3Session> {
  const sdkEnv: TenantSdkEnvironment = environment;
  setEnvironment(sdkEnv);

  const wasmComponent = await loadWasmComponent();
  const address = eth_get_address(apiKey);

  const t3n = new T3nClient({
    wasmComponent,
    handlers: {
      EthSign: metamask_sign(address, undefined, apiKey),
    },
  });

  await t3n.handshake();
  const did = await t3n.authenticate(createEthAuthInput(address));
  const tenantDid = did.value;

  // Tenant client retained for future contract execute — session proof only in M4.
  void new TenantClient({
    t3n,
    baseUrl: getNodeUrl(),
    tenantDid,
    environment: sdkEnv,
  });

  return { tenantDid };
}

export function resetT3SessionCache(): void {
  sessionPromise = null;
}
