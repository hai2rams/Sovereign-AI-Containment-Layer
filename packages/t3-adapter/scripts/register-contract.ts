import 'dotenv/config';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { getT3Session, loadT3Config, registerContract } from '../src/index.js';

async function updateEnvContractId(contractId: number, envPath: string): Promise<void> {
  let contents: string;

  try {
    contents = await readFile(envPath, 'utf8');
  } catch {
    contents = '';
  }

  const line = `T3N_CONTRACT_ID=${contractId}`;
  if (/^T3N_CONTRACT_ID=.*$/m.test(contents)) {
    contents = contents.replace(/^T3N_CONTRACT_ID=.*$/m, line);
  } else {
    contents =
      contents.trimEnd() +
      (contents.endsWith('\n') || contents.length === 0 ? '' : '\n') +
      `${line}\n`;
  }

  await writeFile(envPath, contents, 'utf8');
}

async function main(): Promise<void> {
  const config = loadT3Config({ required: true });

  if (!config.contractWasmPath) {
    throw new Error('Missing T3N_CONTRACT_WASM_PATH — path to compiled WASM bytes');
  }

  const wasmPath = resolve(config.contractWasmPath);
  const wasmBytes = await readFile(wasmPath);
  const { tenant, tenantDid } = await getT3Session(config.apiKey, config.environment);

  console.log(`[register] tenant: ${tenantDid}`);
  console.log(`[register] tail: ${config.contractTail}`);
  console.log(`[register] version: ${config.contractVersion}`);
  console.log(`[register] wasm: ${wasmPath} (${wasmBytes.byteLength} bytes)`);

  const result = await registerContract(tenant, tenantDid, {
    tail: config.contractTail,
    version: config.contractVersion,
    wasm: wasmBytes,
  });

  const envPath = process.env.T3_ENV_FILE?.trim()
    ? resolve(process.env.T3_ENV_FILE.trim())
    : resolve(process.cwd(), '../../configs/.env');

  await updateEnvContractId(result.contractId, envPath);

  console.log('');
  console.log('Registration complete.');
  console.log(`  script name:  ${result.scriptName}`);
  console.log(`  contract id:  ${result.contractId}`);
  console.log('');
  console.log(`Updated ${envPath} with T3N_CONTRACT_ID.`);
  console.log('Next: npm run init:secrets-map -w @sovereign/t3-adapter');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[register] failed: ${message}`);
  process.exit(1);
});
