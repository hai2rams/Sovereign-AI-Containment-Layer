import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import { createApp } from './app.js';
import { DEFAULT_API_PORT, resolveApiPort } from './port.js';

test('resolveApiPort defaults to 4100 when PORT is missing', () => {
  assert.equal(resolveApiPort(undefined), DEFAULT_API_PORT);
  assert.equal(DEFAULT_API_PORT, 4100);
});

test('resolveApiPort uses PORT when set', () => {
  assert.equal(resolveApiPort('5100'), 5100);
});

test('resolveApiPort rejects invalid PORT values', () => {
  assert.equal(resolveApiPort(''), DEFAULT_API_PORT);
  assert.equal(resolveApiPort('0'), DEFAULT_API_PORT);
  assert.equal(resolveApiPort('not-a-port'), DEFAULT_API_PORT);
});

let server: Server;
let baseUrl: string;

before(() => {
  const app = createApp();
  server = app.listen(0);
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Expected server to bind to a TCP port');
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(() => {
  server.close();
});

test('GET /health returns ok', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  const body = (await response.json()) as { status: string; service: string };
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'sovereign-ai-containment-api');
});

test('GET /t3/status returns configuration shape', async () => {
  const response = await fetch(`${baseUrl}/t3/status`);
  assert.equal(response.status, 200);
  const body = (await response.json()) as {
    configured: boolean;
    session: { status: string };
  };
  assert.equal(typeof body.configured, 'boolean');
  assert.equal(typeof body.session.status, 'string');
});

test('GET /t3/contract returns contract shape', async () => {
  const response = await fetch(`${baseUrl}/t3/contract`);
  assert.equal(response.status, 200);
  const body = (await response.json()) as {
    contractTail: string;
    contractVersion: string;
    message: string;
  };
  assert.equal(typeof body.contractTail, 'string');
  assert.equal(typeof body.contractVersion, 'string');
  assert.equal(typeof body.message, 'string');
});

test('GET /passport/current fails safely when missing', async () => {
  const response = await fetch(`${baseUrl}/passport/current`);
  assert.equal(response.status, 200);
  const body = (await response.json()) as {
    available?: boolean;
    reason?: string;
    agent_did?: string;
  };

  if (body.available === false) {
    assert.equal(body.reason, 'passport_not_generated');
  } else {
    assert.equal(body.agent_did, 'did:t3n:agent:sovereign-ai-containment');
  }
});

test('POST /passport/generate creates passport', async () => {
  const response = await fetch(`${baseUrl}/passport/generate`, { method: 'POST' });
  assert.equal(response.status, 200);
  const body = (await response.json()) as {
    agent_did: string;
    release_id: string;
    hash_bundle: { bundle_root_hash: string };
  };
  assert.equal(body.agent_did, 'did:t3n:agent:sovereign-ai-containment');
  assert.match(body.hash_bundle.bundle_root_hash, /^sha256:[a-f0-9]{64}$/);

  const current = await fetch(`${baseUrl}/passport/current`);
  const currentBody = (await current.json()) as { release_id: string };
  assert.equal(currentBody.release_id, body.release_id);
});

test('POST /releases/register registers passport release', async () => {
  const response = await fetch(`${baseUrl}/releases/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'draft' }),
  });
  assert.equal(response.status, 200);
  const body = (await response.json()) as { release_id: string; status: string };
  assert.equal(typeof body.release_id, 'string');
  assert.equal(body.status, 'draft');
});

test('GET /releases/:releaseId returns registered release', async () => {
  const register = await fetch(`${baseUrl}/releases/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'certified' }),
  });
  const registered = (await register.json()) as { release_id: string };

  const response = await fetch(`${baseUrl}/releases/${registered.release_id}`);
  assert.equal(response.status, 200);
  const body = (await response.json()) as { status: string };
  assert.equal(body.status, 'certified');
});

test('POST /releases/:releaseId/check-sensitive-action blocks revoked release', async () => {
  const register = await fetch(`${baseUrl}/releases/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'draft' }),
  });
  const registered = (await register.json()) as { release_id: string };

  await fetch(`${baseUrl}/releases/${registered.release_id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'revoked' }),
  });

  const response = await fetch(
    `${baseUrl}/releases/${registered.release_id}/check-sensitive-action`,
    { method: 'POST' },
  );
  const body = (await response.json()) as { allowed: boolean; reason: string };
  assert.equal(body.allowed, false);
  assert.equal(body.reason, 'release_revoked');
});

test('POST /attestation/challenge and verify mock quote', async () => {
  await fetch(`${baseUrl}/releases/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'certified' }),
  });
  await fetch(`${baseUrl}/passport/generate`, { method: 'POST' });

  const challengeRes = await fetch(`${baseUrl}/attestation/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ release_id: 'release-2026-06-23-v1' }),
  });
  const challenge = (await challengeRes.json()) as { nonce: string };

  const passportRes = await fetch(`${baseUrl}/passport/current`);
  const passport = (await passportRes.json()) as {
    hash_bundle: { policy_rules_hash: string; bundle_root_hash: string };
  };

  const verifyRes = await fetch(`${baseUrl}/attestation/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      release_id: 'release-2026-06-23-v1',
      measurement_hash: passport.hash_bundle.bundle_root_hash,
      policy_hash: passport.hash_bundle.policy_rules_hash,
      debug: false,
      nonce: challenge.nonce,
      issued_at: new Date().toISOString(),
    }),
  });
  const result = (await verifyRes.json()) as { verified: boolean };
  assert.equal(result.verified, true);
});

test('POST /policy/evaluate blocks excessive payment', async () => {
  await fetch(`${baseUrl}/releases/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'certified' }),
  });

  const response = await fetch(`${baseUrl}/policy/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'payment.transfer',
      parameters: { amount: 5000, currency: 'USD', destination: 'approved-vendor-001' },
      source_trust_level: 1,
      session_id: 'session-demo',
      release_id: 'release-2026-06-23-v1',
      attestation_id: 'attest_demo',
      evidence_summary: 'Invoice payment proposal.',
    }),
  });
  const body = (await response.json()) as { allowed: boolean; reason: string };
  assert.equal(body.allowed, false);
  assert.equal(body.reason, 'amount_limit_exceeded');
});
