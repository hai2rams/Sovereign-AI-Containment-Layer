import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  generateAgentPassport,
  registerRelease,
  updateReleaseStatus,
} from '@sovereign/agent-passport';
import {
  createAttestationChallenge,
  resetChallengeStore,
  verifyMockAttestation,
  buildMockQuoteFromPassport,
} from './index.js';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const artifactsDir = join(repoRoot, 'configs/certified-artifacts');
let tempRepo = '';

before(async () => {
  resetChallengeStore();
  tempRepo = await mkdtemp(join(tmpdir(), 'sac-attest-'));
  await copyArtifacts(tempRepo);
  const passport = await generateAgentPassport({
    repoRoot: tempRepo,
    outputPath: join(tempRepo, 'artifacts/agent-passport.json'),
  });
  await registerRelease(tempRepo, passport, 'certified');
});

after(async () => {
  resetChallengeStore();
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

test('nonce challenge created', () => {
  const challenge = createAttestationChallenge('release-2026-06-23-v1');
  assert.match(challenge.nonce, /^nonce_[a-f0-9]{32}$/);
  assert.ok(challenge.expires_at);
});

test('mock attestation quote verified', async () => {
  const challenge = createAttestationChallenge('release-2026-06-23-v1');
  const quote = await buildMockQuoteFromPassport(
    tempRepo,
    'release-2026-06-23-v1',
    challenge.nonce,
  );
  assert.ok(quote);

  const result = await verifyMockAttestation({ repoRoot: tempRepo, quote: quote! });
  assert.equal(result.verified, true);
  assert.equal(result.reason, 'mock_attestation_verified');
  assert.ok(result.attestation_id);
});

test('stale nonce rejected', async () => {
  const challenge = createAttestationChallenge('release-2026-06-23-v1', 1000);
  const quote = await buildMockQuoteFromPassport(
    tempRepo,
    'release-2026-06-23-v1',
    challenge.nonce,
  );
  assert.ok(quote);

  const staleTime = new Date(new Date(challenge.expires_at).getTime() + 1000);
  const result = await verifyMockAttestation({
    repoRoot: tempRepo,
    quote: quote!,
    now: staleTime,
  });
  assert.equal(result.verified, false);
  assert.equal(result.reason, 'stale_nonce');
});

test('revoked release rejected', async () => {
  await updateReleaseStatus(tempRepo, 'release-2026-06-23-v1', 'revoked');
  const challenge = createAttestationChallenge('release-2026-06-23-v1');
  const quote = await buildMockQuoteFromPassport(
    tempRepo,
    'release-2026-06-23-v1',
    challenge.nonce,
  );
  assert.ok(quote);

  const result = await verifyMockAttestation({ repoRoot: tempRepo, quote: quote! });
  assert.equal(result.verified, false);
  assert.equal(result.reason, 'release_revoked');

  await updateReleaseStatus(tempRepo, 'release-2026-06-23-v1', 'certified');
});

test('debug=false checked', async () => {
  const challenge = createAttestationChallenge('release-2026-06-23-v1');
  const quote = await buildMockQuoteFromPassport(
    tempRepo,
    'release-2026-06-23-v1',
    challenge.nonce,
  );
  assert.ok(quote);
  quote!.debug = true;

  const result = await verifyMockAttestation({ repoRoot: tempRepo, quote: quote! });
  assert.equal(result.verified, false);
  assert.equal(result.reason, 'debug_mode_not_allowed');
});

test('policy hash mismatch rejected', async () => {
  const challenge = createAttestationChallenge('release-2026-06-23-v1');
  const quote = await buildMockQuoteFromPassport(
    tempRepo,
    'release-2026-06-23-v1',
    challenge.nonce,
  );
  assert.ok(quote);
  quote!.policy_hash = 'sha256:deadbeef';

  const result = await verifyMockAttestation({ repoRoot: tempRepo, quote: quote! });
  assert.equal(result.verified, false);
  assert.equal(result.reason, 'policy_hash_mismatch');
});

test('measurement hash mismatch rejected', async () => {
  const challenge = createAttestationChallenge('release-2026-06-23-v1');
  const quote = await buildMockQuoteFromPassport(
    tempRepo,
    'release-2026-06-23-v1',
    challenge.nonce,
  );
  assert.ok(quote);
  quote!.measurement_hash = 'sha256:deadbeef';

  const result = await verifyMockAttestation({ repoRoot: tempRepo, quote: quote! });
  assert.equal(result.verified, false);
  assert.equal(result.reason, 'measurement_hash_mismatch');
});
