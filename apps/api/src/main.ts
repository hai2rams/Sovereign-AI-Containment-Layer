import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { resolveApiPort } from './port.js';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
loadEnv({ path: resolve(repoRoot, 'configs/.env') });

const port = resolveApiPort();
const app = createApp();

app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});
