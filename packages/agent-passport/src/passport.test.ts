import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  buildHashBundle,
  generateAgentPassport,
  hashJsonContent,
  normalizeJsonForHash,
  passportContainsSecrets,
  readAgentPassport,
} from './index.js';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const artifactsDir = join(repoRoot, 'configs/certified-artifacts');

test('JSON key order does not change JSON hash', () => {
  const a = hashJsonContent(JSON.stringify({ z: 1, a: 2, m: { b: 1, a: 2 } }));
  const b = hashJsonContent(JSON.stringify({ m: { a: 2, b: 1 }, a: 2, z: 1 }));
  assert.equal(a, b);
});

test('normalizeJsonForHash produces stable trailing newline', () => {
  const normalized = normalizeJsonForHash('{"b":2,"a":1}');
  assert.equal(normalized, '{"a":1,"b":2}\n');
});

test('same inputs produce same bundle_root_hash', async () => {
  const first = await buildHashBundle(repoRoot);
  const second = await buildHashBundle(repoRoot);
  assert.equal(first.bundle_root_hash, second.bundle_root_hash);
  assert.match(first.bundle_root_hash, /^sha256:[a-f0-9]{64}$/);
});

let tempRepo = '';

before(async () => {
  tempRepo = await mkdtemp(join(tmpdir(), 'sac-passport-'));
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

async function mutateArtifact(
  repo: string,
  relativePath: string,
  mutator: (content: string) => string,
): Promise<void> {
  const filePath = join(repo, 'configs/certified-artifacts', relativePath);
  const content = await readFile(filePath, 'utf8');
  await writeFile(filePath, mutator(content), 'utf8');
}

test('changing system-prompt.md changes system_prompt_hash and bundle_root_hash', async () => {
  const baseline = await buildHashBundle(tempRepo);
  await mutateArtifact(tempRepo, 'system-prompt.md', (c) => `${c}\n<!-- mutation -->\n`);
  const mutated = await buildHashBundle(tempRepo);

  assert.notEqual(mutated.system_prompt_hash, baseline.system_prompt_hash);
  assert.notEqual(mutated.bundle_root_hash, baseline.bundle_root_hash);
});

test('changing developer-prompt.md changes developer_prompt_hash and bundle_root_hash', async () => {
  await copyArtifacts(tempRepo);
  const baseline = await buildHashBundle(tempRepo);
  await mutateArtifact(tempRepo, 'developer-prompt.md', (c) => `${c}\n<!-- mutation -->\n`);
  const mutated = await buildHashBundle(tempRepo);

  assert.notEqual(mutated.developer_prompt_hash, baseline.developer_prompt_hash);
  assert.notEqual(mutated.bundle_root_hash, baseline.bundle_root_hash);
});

test('changing policy-rules.json changes policy_rules_hash and bundle_root_hash', async () => {
  await copyArtifacts(tempRepo);
  const baseline = await buildHashBundle(tempRepo);
  await mutateArtifact(tempRepo, 'policy-rules.json', (c) =>
    c.replace('"max_amount": 50', '"max_amount": 51'),
  );
  const mutated = await buildHashBundle(tempRepo);

  assert.notEqual(mutated.policy_rules_hash, baseline.policy_rules_hash);
  assert.notEqual(mutated.bundle_root_hash, baseline.bundle_root_hash);
});

test('changing tool-manifest.json changes tool_manifest_hash and bundle_root_hash', async () => {
  await copyArtifacts(tempRepo);
  const baseline = await buildHashBundle(tempRepo);
  await mutateArtifact(tempRepo, 'tool-manifest.json', (c) =>
    c.replace(/"enabled": true/, '"enabled": false'),
  );
  const mutated = await buildHashBundle(tempRepo);

  assert.notEqual(mutated.tool_manifest_hash, baseline.tool_manifest_hash);
  assert.notEqual(mutated.bundle_root_hash, baseline.bundle_root_hash);
});

test('passport does not expose secrets', async () => {
  const passport = await generateAgentPassport({
    repoRoot,
    outputPath: join(tempRepo, 'artifacts/agent-passport.json'),
  });

  assert.equal(passportContainsSecrets(passport), false);
  const serialized = JSON.stringify(passport);
  assert.doesNotMatch(serialized, /T3N_API_KEY/i);
  assert.doesNotMatch(serialized, /0x[a-fA-F0-9]{32,}/);
});

test('readAgentPassport returns null when missing', async () => {
  const missingRepo = await mkdtemp(join(tmpdir(), 'sac-missing-'));
  try {
    const result = await readAgentPassport(missingRepo);
    assert.equal(result, null);
  } finally {
    await rm(missingRepo, { recursive: true, force: true });
  }
});

test('generateAgentPassport creates passport file', async () => {
  const outRepo = await mkdtemp(join(tmpdir(), 'sac-out-'));
  await copyArtifacts(outRepo);

  const passport = await generateAgentPassport({
    repoRoot: outRepo,
    outputPath: join(outRepo, 'artifacts/agent-passport.json'),
  });

  const onDisk = await readAgentPassport(outRepo);
  assert.ok(onDisk);
  assert.equal(onDisk?.release_id, passport.release_id);
  assert.equal(onDisk?.hash_bundle.bundle_root_hash, passport.hash_bundle.bundle_root_hash);
});
