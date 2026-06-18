import { config as loadEnv } from 'dotenv';
import express from 'express';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getT3Session, isT3Configured, loadT3Config } from '@sovereign/t3-adapter';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
loadEnv({ path: resolve(repoRoot, 'configs/.env') });

const portParsed = Number(process.env.PORT);
const port =
  Number.isInteger(portParsed) && portParsed > 0 && portParsed <= 65535
    ? portParsed
    : 4000;

const app = express();

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'sovereign-ai-containment-api',
    timestamp: new Date().toISOString(),
  });
});

app.get('/t3/status', async (_req, res) => {
  const t3Config = loadT3Config();
  const configured = isT3Configured(t3Config);

  const base = {
    configured,
    environment: t3Config.environment,
    contractId: Number.isInteger(t3Config.contractId) ? t3Config.contractId : null,
    contractTail: t3Config.contractTail,
    contractVersion: t3Config.contractVersion,
    hasApiKey: Boolean(t3Config.apiKey),
  };

  if (!configured) {
    res.status(200).json({
      ...base,
      session: {
        status: 'not_configured',
        tenantDid: null,
        message: 'Set T3N_API_KEY and T3N_CONTRACT_ID in configs/.env for live T3.',
      },
    });
    return;
  }

  try {
    const { tenantDid } = await getT3Session(t3Config.apiKey, t3Config.environment);
    res.status(200).json({
      ...base,
      session: {
        status: 'connected',
        tenantDid,
        message: 'T3N session established.',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown T3 session error';
    res.status(200).json({
      ...base,
      session: {
        status: 'error',
        tenantDid: null,
        message,
      },
    });
  }
});

app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});
