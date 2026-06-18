import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateAgentPassport, getDefaultPassportPath } from '../src/index.js';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');

async function main(): Promise<void> {
  const passport = await generateAgentPassport({ repoRoot });
  const outputPath = getDefaultPassportPath(repoRoot);

  console.log('Agent Passport generated.');
  console.log(`  release_id:         ${passport.release_id}`);
  console.log(`  bundle_root_hash:   ${passport.hash_bundle.bundle_root_hash}`);
  console.log(`  output:             ${outputPath}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[generate-passport] failed: ${message}`);
  process.exit(1);
});
