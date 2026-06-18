import express, { type Express } from 'express';
import {
  checkSensitiveActionAllowed,
  generateAgentPassport,
  getRelease,
  isReleaseStatus,
  listReleases,
  readAgentPassport,
  registerRelease,
  updateReleaseStatus,
  type ReleaseStatus,
} from '@sovereign/agent-passport';
import {
  createAttestationChallenge,
  verifyMockAttestation,
} from '@sovereign/attestation';
import { evaluatePolicy } from '@sovereign/policy-engine';
import {
  getDevSigningKey,
  issueActionToken,
  verifyActionToken,
} from '@sovereign/action-token-broker';
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

  app.get('/releases', async (_req, res) => {
    try {
      const releases = await listReleases(repoRoot);
      res.status(200).json({ count: releases.length, releases });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown release list error';
      res.status(500).json({ error: 'ReleaseListFailed', message });
    }
  });

  app.get('/releases/:releaseId', async (req, res) => {
    try {
      const release = await getRelease(repoRoot, req.params.releaseId);
      if (!release) {
        res.status(404).json({
          available: false,
          reason: 'release_not_found',
          release_id: req.params.releaseId,
        });
        return;
      }

      res.status(200).json(release);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown release read error';
      res.status(500).json({ error: 'ReleaseReadFailed', message });
    }
  });

  app.post('/releases/register', async (req, res) => {
    try {
      const requestedStatus = req.body?.status as string | undefined;
      const status: ReleaseStatus =
        requestedStatus && isReleaseStatus(requestedStatus) ? requestedStatus : 'draft';

      let passport = await readAgentPassport(repoRoot);
      if (!passport) {
        passport = await generateAgentPassport({ repoRoot });
      }

      const record = await registerRelease(repoRoot, passport, status);
      res.status(200).json(record);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown release registration error';
      res.status(500).json({ error: 'ReleaseRegisterFailed', message });
    }
  });

  app.patch('/releases/:releaseId/status', async (req, res) => {
    try {
      const status = req.body?.status;
      if (typeof status !== 'string' || !isReleaseStatus(status)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Body must include valid status',
          allowed_statuses: ['draft', 'certified', 'suspended', 'revoked', 'under_review'],
        });
        return;
      }

      const record = await updateReleaseStatus(repoRoot, req.params.releaseId, status);
      res.status(200).json(record);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown release status update error';
      if (message.startsWith('Release not found')) {
        res.status(404).json({ error: 'ReleaseNotFound', message });
        return;
      }
      res.status(500).json({ error: 'ReleaseStatusUpdateFailed', message });
    }
  });

  app.post('/releases/:releaseId/check-sensitive-action', async (req, res) => {
    try {
      const check = await checkSensitiveActionAllowed(repoRoot, req.params.releaseId);
      res.status(200).json(check);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown sensitive action check error';
      res.status(500).json({ error: 'SensitiveActionCheckFailed', message });
    }
  });

  app.post('/attestation/challenge', async (req, res) => {
    try {
      const releaseId = req.body?.release_id;
      if (typeof releaseId !== 'string' || !releaseId.trim()) {
        res.status(400).json({ error: 'Bad Request', message: 'release_id is required' });
        return;
      }

      const challenge = createAttestationChallenge(releaseId.trim());
      res.status(200).json(challenge);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown challenge error';
      res.status(500).json({ error: 'AttestationChallengeFailed', message });
    }
  });

  app.post('/attestation/verify', async (req, res) => {
    try {
      const result = await verifyMockAttestation({ repoRoot, quote: req.body });
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown attestation verify error';
      res.status(500).json({ error: 'AttestationVerifyFailed', message });
    }
  });

  app.post('/policy/evaluate', async (req, res) => {
    try {
      const proposal = req.body?.proposal ?? req.body;
      const result = await evaluatePolicy({ repoRoot, proposal });
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown policy evaluation error';
      res.status(500).json({ error: 'PolicyEvaluateFailed', message });
    }
  });

  app.post('/tokens/issue', async (req, res) => {
    try {
      const body = req.body ?? {};
      const proposal = body.proposal ?? body;
      const result = await issueActionToken({
        repoRoot,
        agent_did: body.agent_did ?? 'did:t3n:agent:sovereign-ai-containment',
        release_id: body.release_id ?? proposal.release_id,
        attestation_id: body.attestation_id ?? proposal.attestation_id,
        session_id: body.session_id ?? proposal.session_id,
        action: body.action ?? proposal.action,
        policy_hash: body.policy_hash,
        proposal,
        ttl_seconds: body.ttl_seconds,
        signingKey: getDevSigningKey(),
      });
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown token issue error';
      res.status(400).json({ error: 'TokenIssueFailed', message });
    }
  });

  app.post('/tokens/verify', async (req, res) => {
    try {
      const token = req.body?.token;
      if (typeof token !== 'string' || !token.trim()) {
        res.status(400).json({ error: 'Bad Request', message: 'token is required' });
        return;
      }

      const result = await verifyActionToken({
        repoRoot,
        token: token.trim(),
        expected_action: req.body?.expected_action,
        expected_release_id: req.body?.expected_release_id,
        signingKey: getDevSigningKey(),
      });
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown token verify error';
      res.status(500).json({ error: 'TokenVerifyFailed', message });
    }
  });

  return app;
}
