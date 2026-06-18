import 'dotenv/config';
import { getT3Session, initializeSecretsMap, loadT3Config } from '../src/index.js';

function parseEntriesFromEnv(): Record<string, string> {
  const raw = process.env.T3N_SECRETS_ENTRIES_JSON?.trim();
  if (!raw) {
    return {};
  }

  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('T3N_SECRETS_ENTRIES_JSON must be a JSON object of string key/value pairs');
  }

  const entries: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === 'string') {
      entries[key] = value;
    }
  }
  return entries;
}

async function main(): Promise<void> {
  const config = loadT3Config({ required: true });
  const { tenant, tenantDid } = await getT3Session(config.apiKey, config.environment);
  const entries = parseEntriesFromEnv();

  const result = await initializeSecretsMap(tenant, config.contractId, entries);

  console.log('Secrets map initialized.');
  console.log(`  tenant: ${tenantDid}`);
  console.log(`  map:    ${result.mapName}`);
  console.log(`  keys:   ${result.sealedKeys.join(', ') || '(none)'}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[init-secrets-map] failed: ${message}`);
  process.exit(1);
});
