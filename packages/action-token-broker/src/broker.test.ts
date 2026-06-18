import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { generateAgentPassport, registerRelease, updateReleaseStatus } from '@sovereign/agent-passport';
import { getDevSigningKey, issueActionToken, verifyActionToken } from './broker.js';
import { tokenContainsSecrets } from './signing.js';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const artifactsDir = join(repoRoot, 'configs/certified-artifacts');
let tempRepo = '';
const signingKey = 'test-signing-key';

before(async () => {
  tempRepo = await mkdtemp(join(tmpdir(), 'sac-token-'));
  await copyArtifacts(tempRepo);
  const passport = await generateAgentPassport({
    repoRoot: tempRepo,
    outputPath: join(tempRepo, 'artifacts/agent-passport.json'),
  });
  await registerRelease(tempRepo, passport, 'certified');
});

after(async () => {
  if (tempRepo) {
    await rm(tempRepo, { recursive: true, force: true });
  }
});

async function copyArtifacts(targetRepo: string): Promise<void> {
  const { mkdir } = await import('node:fs/promises');
  const targetDir = join(targetRepo, 'configs/certified-artifacts');
  await mkdir(targetDir, { recursive: true });
  const files = [
    'model.json',
    'tokenizer.json',
    'system-prompt.md',
    'developer-prompt.md',
    'tool-manifest.json',
    'policy-rules.json',
    'rag-config.json',
    'memory-rules.json',
    'runtime-config.json',
    'egress-allowlist.json',
    'audit-config.json',
    'sbom-placeholder.json',
  ];
  for (const file of files) {
    const content = await readFile(join(artifactsDir, file), 'utf8');
    await writeFile(join(targetDir, file), content, 'utf8');
  }
}

function paymentProposal(overrides: Record<string, unknown> = {}) {
  return {
    action: 'payment.transfer',
    parameters: {
      amount: 25,
      currency: 'USD',
      destination: 'approved-vendor-001',
    },
    source_trust_level: 1,
    session_id: 'session-1',
    release_id: 'release-2026-06-23-v1',
    attestation_id: 'attest_test',
    evidence_summary: 'Pay approved vendor.',
    ...overrides,
  };
}

test('issueActionToken binds claims and does not expose secrets', async () => {
  const proposal = paymentProposal();
  const issued = await issueActionToken({
    repoRoot: tempRepo,
    agent_did: 'did:t3n:agent:sovereign-ai-containment',
    release_id: 'release-2026-06-23-v1',
    attestation_id: 'attest_test',
    session_id: 'session-1',
    action: 'payment.transfer',
    policy_hash: 'sha256:placeholder',
    proposal,
    signingKey,
  });

  assert.equal(tokenContainsSecrets(issued.claims), false);
  assert.equal(issued.claims.action, 'payment.transfer');
  assert.equal(issued.claims.max_amount, 25);
  assert.equal(issued.claims.allowed_destination, 'approved-vendor-001');
  assert.ok(issued.token.includes('.'));
});

test('verifyActionToken accepts valid token', async () => {
  const issued = await issueActionToken({
    repoRoot: tempRepo,
    agent_did: 'did:t3n:agent:sovereign-ai-containment',
    release_id: 'release-2026-06-23-v1',
    attestation_id: 'attest_test',
    session_id: 'session-1',
    action: 'payment.transfer',
    policy_hash: 'sha256:placeholder',
    proposal: paymentProposal(),
    signingKey,
  });

  const verified = await verifyActionToken({
    repoRoot: tempRepo,
    token: issued.token,
    expected_action: 'payment.transfer',
    expected_release_id: 'release-2026-06-23-v1',
    signingKey,
  });

  assert.equal(verified.valid, true);
});

test('expired token rejected', async () => {
  const issued = await issueActionToken({
    repoRoot: tempRepo,
    agent_did: 'did:t3n:agent:sovereign-ai-containment',
    release_id: 'release-2026-06-23-v1',
    attestation_id: 'attest_test',
    session_id: 'session-1',
    action: 'payment.transfer',
    policy_hash: 'sha256:placeholder',
    proposal: paymentProposal(),
    ttl_seconds: 1,
    signingKey,
  });

  const expiredTime = new Date(new Date(issued.expires_at).getTime() + 1000);
  const verified = await verifyActionToken({
    repoRoot: tempRepo,
    token: issued.token,
    signingKey,
    now: expiredTime,
  });

  assert.equal(verified.valid, false);
  assert.equal(verified.reason, 'token_expired');
});

test('wrong action rejected', async () => {
  const issued = await issueActionToken({
    repoRoot: tempRepo,
    agent_did: 'did:t3n:agent:sovereign-ai-containment',
    release_id: 'release-2026-06-23-v1',
    attestation_id: 'attest_test',
    session_id: 'session-1',
    action: 'payment.transfer',
    policy_hash: 'sha256:placeholder',
    proposal: paymentProposal(),
    signingKey,
  });

  const verified = await verifyActionToken({
    repoRoot: tempRepo,
    token: issued.token,
    expected_action: 'memory.write',
    signingKey,
  });

  assert.equal(verified.valid, false);
  assert.equal(verified.reason, 'wrong_action');
});

test('revoked release rejected at verify', async () => {
  const issued = await issueActionToken({
    repoRoot: tempRepo,
    agent_did: 'did:t3n:agent:sovereign-ai-containment',
    release_id: 'release-2026-06-23-v1',
    attestation_id: 'attest_test',
    session_id: 'session-1',
    action: 'payment.transfer',
    policy_hash: 'sha256:placeholder',
    proposal: paymentProposal(),
    signingKey,
  });

  await updateReleaseStatus(tempRepo, 'release-2026-06-23-v1', 'revoked');

  const verified = await verifyActionToken({
    repoRoot: tempRepo,
    token: issued.token,
    signingKey,
  });

  assert.equal(verified.valid, false);
  assert.equal(verified.reason, 'release_revoked');

  await updateReleaseStatus(tempRepo, 'release-2026-06-23-v1', 'certified');
});

test('getDevSigningKey does not return empty string', () => {
  assert.ok(getDevSigningKey().length > 10);
});
