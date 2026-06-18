import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { generateAgentPassport } from './passport.js';
import {
  checkSensitiveActionAllowed,
  getRelease,
  listReleases,
  loadReleaseRegistry,
  registerRelease,
  updateReleaseStatus,
} from './release-registry.js';
import type { AgentPassport } from './types.js';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const artifactsDir = join(repoRoot, 'configs/certified-artifacts');
let tempRepo = '';

before(async () => {
  tempRepo = await mkdtemp(join(tmpdir(), 'sac-registry-'));
  await copyArtifacts(tempRepo);
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

async function passportFor(repo: string): Promise<AgentPassport> {
  return generateAgentPassport({
    repoRoot: repo,
    outputPath: join(repo, 'artifacts/agent-passport.json'),
  });
}

test('registerRelease stores passport release', async () => {
  const passport = await passportFor(tempRepo);
  const record = await registerRelease(tempRepo, passport, 'draft');

  assert.equal(record.release_id, passport.release_id);
  assert.equal(record.bundle_root_hash, passport.hash_bundle.bundle_root_hash);
  assert.equal(record.status, 'draft');

  const loaded = await getRelease(tempRepo, passport.release_id);
  assert.ok(loaded);
  assert.equal(loaded?.agent_did, passport.agent_did);
});

test('listReleases returns registered releases', async () => {
  const releases = await listReleases(tempRepo);
  assert.ok(releases.length >= 1);
});

test('updateReleaseStatus supports all lifecycle statuses', async () => {
  const passport = await passportFor(tempRepo);

  for (const status of [
    'certified',
    'suspended',
    'under_review',
    'revoked',
    'draft',
  ] as const) {
    const updated = await updateReleaseStatus(tempRepo, passport.release_id, status);
    assert.equal(updated.status, status);
  }
});

test('revoked release blocks sensitive action', async () => {
  const passport = await passportFor(tempRepo);
  await updateReleaseStatus(tempRepo, passport.release_id, 'revoked');

  const check = await checkSensitiveActionAllowed(tempRepo, passport.release_id);
  assert.equal(check.allowed, false);
  assert.equal(check.reason, 'release_revoked');
});

test('certified release allows sensitive action', async () => {
  const passport = await passportFor(tempRepo);
  await updateReleaseStatus(tempRepo, passport.release_id, 'certified');

  const check = await checkSensitiveActionAllowed(tempRepo, passport.release_id);
  assert.equal(check.allowed, true);
  assert.equal(check.reason, 'release_certified');
});

test('draft release blocks sensitive action', async () => {
  const passport = await passportFor(tempRepo);
  await updateReleaseStatus(tempRepo, passport.release_id, 'draft');

  const check = await checkSensitiveActionAllowed(tempRepo, passport.release_id);
  assert.equal(check.allowed, false);
  assert.equal(check.reason, 'release_not_certified');
});

test('loadReleaseRegistry returns empty registry when missing', async () => {
  const emptyRepo = await mkdtemp(join(tmpdir(), 'sac-empty-registry-'));
  try {
    const registry = await loadReleaseRegistry(emptyRepo);
    assert.deepEqual(registry.releases, []);
  } finally {
    await rm(emptyRepo, { recursive: true, force: true });
  }
});

test('registerRelease updates existing release on re-register', async () => {
  const passport = await passportFor(repoRoot);
  const first = await registerRelease(repoRoot, passport, 'draft');
  const second = await registerRelease(repoRoot, passport, 'certified');

  assert.equal(first.release_id, second.release_id);
  assert.equal(second.status, 'certified');
  assert.equal(first.registered_at, second.registered_at);
});
