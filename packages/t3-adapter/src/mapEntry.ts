import type { TenantClient } from '@terminal3/t3n-sdk';
import { SECRETS_MAP_TAIL } from './secretsMap.js';

/**
 * Reads a map entry via the T3N control plane.
 * Returns null when the entry is missing or the control call is unavailable.
 */
export async function readMapEntry(
  tenant: TenantClient,
  key: string,
): Promise<string | null> {
  const mapName = tenant.canonicalName(SECRETS_MAP_TAIL);

  try {
    const result = await tenant.executeControl('map-entry-get', {
      map_name: mapName,
      key,
    });

    if (result && typeof result === 'object' && 'value' in result) {
      const value = (result as { value: unknown }).value;
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  } catch {
    // map-entry-get may be unavailable until the secrets map is seeded
  }

  return null;
}
