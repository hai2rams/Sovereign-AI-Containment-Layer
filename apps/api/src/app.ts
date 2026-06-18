import express, { type Express } from 'express';
import {
  generateAgentPassport,
  readAgentPassport,
} from '@sovereign/agent-passport';
import {
  executeContract,
  getT3Session,
  isT3Configured,
  loadT3Config,
} from '@sovereign/t3-adapter';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');

export function createApp(): Express {
  const app = express();
  app.use(express.json());

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

  app.get('/t3/contract', async (_req, res) => {
    const t3Config = loadT3Config();
    const configured = isT3Configured(t3Config);

    const base = {
      configured,
      environment: t3Config.environment,
      contractId: Number.isInteger(t3Config.contractId) ? t3Config.contractId : null,
      contractTail: t3Config.contractTail,
      contractVersion: t3Config.contractVersion,
    };

    if (!configured) {
      res.status(200).json({
        ...base,
        invocation: null,
        message: 'Set T3N_API_KEY and T3N_CONTRACT_ID in configs/.env to query the trust anchor.',
      });
      return;
    }

    try {
      const { tenant } = await getT3Session(t3Config.apiKey, t3Config.environment);
      const invocation = await executeContract(
        tenant,
        t3Config.contractTail,
        t3Config.contractVersion,
        { functionName: 'get-compliance-snapshot', input: {} },
      );

      res.status(200).json({
        ...base,
        invocation,
        message: 'Trust-anchor contract invoked.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown contract error';
      res.status(200).json({
        ...base,
        invocation: null,
        message,
      });
    }
  });

  app.get('/passport/current', async (_req, res) => {
    try {
      const passport = await readAgentPassport(repoRoot);
      if (!passport) {
        res.status(200).json({
          available: false,
          reason: 'passport_not_generated',
          hint: 'Run generate-passport or POST /passport/generate',
        });
        return;
      }

      res.status(200).json(passport);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown passport read error';
      res.status(500).json({ error: 'PassportReadFailed', message });
    }
  });

  app.post('/passport/generate', async (_req, res) => {
    try {
      const passport = await generateAgentPassport({ repoRoot });
      res.status(200).json(passport);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown passport generation error';
      res.status(500).json({ error: 'PassportGenerateFailed', message });
    }
  });

  return app;
}
