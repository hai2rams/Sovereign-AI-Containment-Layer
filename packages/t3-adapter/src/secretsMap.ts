import type { TenantClient } from '@terminal3/t3n-sdk';
import type { SecretsMapInitResult, SealedKeysView } from './types.js';

export const SECRETS_MAP_TAIL = 'secrets';

/** Keys tracked after sealing — values are never readable via the tenant SDK. */
const sealedKeyRegistry = new Set<string>();

/**
 * Creates the hardware-isolated secrets map and seeds key/value entries.
 * Only the TEE contract id may read or write entries.
 *
 * @see https://docs.terminal3.io/developers/adk/tips/create-kv-maps
 * @see https://docs.terminal3.io/developers/adk/tips/seed-api-key
 */
export async function initializeSecretsMap(
  tenant: TenantClient,
  contractId: number,
  entries: Record<string, string>,
): Promise<SecretsMapInitResult> {
  if (!Number.isInteger(contractId) || contractId < 0) {
    throw new Error('T3N_CONTRACT_ID must be a non-negative integer contract id');
  }

  const mapName = tenant.canonicalName(SECRETS_MAP_TAIL);

  await tenant.maps.create({
    tail: SECRETS_MAP_TAIL,
    visibility: 'private',
    writers: { only: [contractId] },
    readers: { only: [contractId] },
  });

  const sealedKeys: string[] = [];

  for (const [key, value] of Object.entries(entries)) {
    if (!value.trim()) {
      continue;
    }

    await tenant.executeControl('map-entry-set', {
      map_name: mapName,
      key,
      value,
    });

    sealedKeyRegistry.add(key);
    sealedKeys.push(key);
  }

  return {
    mapName,
    sealedKeys,
    message:
      'Keys sealed in z::<tenant>:secrets. Values are only readable inside the trust-anchor TEE contract.',
  };
}

/**
 * Returns metadata for sealed keys. Secret values cannot be read back via the
 * tenant SDK — only the registered TEE contract can call kv_store::get in-enclave.
 */
export function listSealedKeys(tenant: TenantClient): SealedKeysView {
  return {
    mapName: tenant.canonicalName(SECRETS_MAP_TAIL),
    keys: [...sealedKeyRegistry].sort().map((name) => ({ name, sealed: true as const })),
    note:
      'Sealed values are not exposed by the adapter. Invoke the trust-anchor contract to use secrets at runtime.',
  };
}

/** Clears the in-process sealed-key registry (tests only). */
export function resetSealedKeyRegistry(): void {
  sealedKeyRegistry.clear();
}
