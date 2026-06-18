import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
  CERTIFIED_ARTIFACTS,
  CERTIFIED_ARTIFACTS_DIR,
  DEFAULT_PASSPORT_OUTPUT,
  FORBIDDEN_FIELD_NAMES,
  SECRET_VALUE_PATTERNS,
} from './artifacts.js';
import {
  computeBundleRootHash,
  hashJsonContent,
  hashTextContent,
} from './hash.js';
import type { AgentPassport, GeneratePassportOptions, HashBundle } from './types.js';

export function getCertifiedArtifactsDir(repoRoot: string): string {
  return resolve(repoRoot, CERTIFIED_ARTIFACTS_DIR);
}

export function getDefaultPassportPath(repoRoot: string): string {
  return resolve(repoRoot, DEFAULT_PASSPORT_OUTPUT);
}

export async function buildHashBundle(repoRoot: string): Promise<HashBundle> {
  const artifactsDir = getCertifiedArtifactsDir(repoRoot);
  const bundle: HashBundle = {};

  for (const artifact of CERTIFIED_ARTIFACTS) {
    const filePath = resolve(artifactsDir, artifact.relativePath);
    const raw = await readFile(filePath, 'utf8');
    bundle[artifact.bundleKey] =
      artifact.kind === 'json' ? hashJsonContent(raw) : hashTextContent(raw);
  }

  bundle.bundle_root_hash = computeBundleRootHash(bundle);
  return bundle;
}

export function passportContainsSecrets(value: unknown, path = ''): boolean {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'string') {
      return SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value));
    }
    return false;
  }

  if (Array.isArray(value)) {
    return value.some((item, index) => passportContainsSecrets(item, `${path}[${index}]`));
  }

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_FIELD_NAMES.has(key.toLowerCase())) {
      return true;
    }
    if (passportContainsSecrets(nested, path ? `${path}.${key}` : key)) {
      return true;
    }
  }

  return false;
}

export async function generateAgentPassport(
  options: GeneratePassportOptions,
): Promise<AgentPassport> {
  const hashBundle = await buildHashBundle(options.repoRoot);
  const policyRaw = await readFile(
    resolve(getCertifiedArtifactsDir(options.repoRoot), 'policy-rules.json'),
    'utf8',
  );
  const runtimeRaw = await readFile(
    resolve(getCertifiedArtifactsDir(options.repoRoot), 'runtime-config.json'),
    'utf8',
  );
  const policy = JSON.parse(policyRaw) as { policy_version: string };
  const runtime = JSON.parse(runtimeRaw) as { runtime_target: string };

  const passport: AgentPassport = {
    agent_did: 'did:t3n:agent:sovereign-ai-containment',
    release_id: options.releaseId ?? 'release-2026-06-23-v1',
    project: 'Sovereign AI Containment Layer',
    certification_status: options.certificationStatus ?? 'draft',
    policy_version: policy.policy_version,
    runtime_target: runtime.runtime_target,
    hash_bundle: hashBundle,
    created_at: new Date().toISOString(),
    created_by: options.createdBy ?? 'local-dev',
    trust_claim:
      'This passport proves release integrity, not inherent model safety.',
    non_claim:
      'This passport does not prove the model is safe under all future inputs.',
  };

  if (passportContainsSecrets(passport)) {
    throw new Error('Refusing to generate passport: potential secret material detected');
  }

  const outputPath = options.outputPath ?? getDefaultPassportPath(options.repoRoot);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(passport, null, 2)}\n`, 'utf8');

  return passport;
}

export async function readAgentPassport(repoRoot: string): Promise<AgentPassport | null> {
  const passportPath = getDefaultPassportPath(repoRoot);

  try {
    const raw = await readFile(passportPath, 'utf8');
    return JSON.parse(raw) as AgentPassport;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}
