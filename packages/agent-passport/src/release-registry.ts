import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { AgentPassport } from './types.js';
import {
  RELEASE_STATUSES,
  type ReleaseRecord,
  type ReleaseRegistry,
  type ReleaseStatus,
  type SensitiveActionCheck,
} from './types.js';

export const DEFAULT_RELEASE_REGISTRY_PATH = 'artifacts/release-registry.json';

const SENSITIVE_ACTION_ALLOWED_STATUS: ReleaseStatus = 'certified';

export function getDefaultReleaseRegistryPath(repoRoot: string): string {
  return resolve(repoRoot, DEFAULT_RELEASE_REGISTRY_PATH);
}

export function isReleaseStatus(value: string): value is ReleaseStatus {
  return (RELEASE_STATUSES as readonly string[]).includes(value);
}

export function createEmptyRegistry(): ReleaseRegistry {
  return { version: '0.1.0', releases: [] };
}

export async function loadReleaseRegistry(repoRoot: string): Promise<ReleaseRegistry> {
  const registryPath = getDefaultReleaseRegistryPath(repoRoot);

  try {
    const raw = await readFile(registryPath, 'utf8');
    const parsed = JSON.parse(raw) as ReleaseRegistry;
    if (!parsed.releases || !Array.isArray(parsed.releases)) {
      throw new Error('Invalid release registry shape');
    }
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return createEmptyRegistry();
    }
    throw error;
  }
}

export async function saveReleaseRegistry(
  repoRoot: string,
  registry: ReleaseRegistry,
): Promise<void> {
  const registryPath = getDefaultReleaseRegistryPath(repoRoot);
  await mkdir(dirname(registryPath), { recursive: true });
  await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
}

export function releaseRecordFromPassport(
  passport: AgentPassport,
  status: ReleaseStatus = 'draft',
): ReleaseRecord {
  const now = new Date().toISOString();
  return {
    release_id: passport.release_id,
    agent_did: passport.agent_did,
    policy_version: passport.policy_version,
    runtime_target: passport.runtime_target,
    bundle_root_hash: passport.hash_bundle.bundle_root_hash,
    passport_certification_status: passport.certification_status,
    status,
    registered_at: now,
    updated_at: now,
  };
}

export async function registerRelease(
  repoRoot: string,
  passport: AgentPassport,
  status: ReleaseStatus = 'draft',
): Promise<ReleaseRecord> {
  if (!isReleaseStatus(status)) {
    throw new Error(`Invalid release status: ${status}`);
  }

  const registry = await loadReleaseRegistry(repoRoot);
  const existingIndex = registry.releases.findIndex((r) => r.release_id === passport.release_id);

  const record = releaseRecordFromPassport(passport, status);

  if (existingIndex >= 0) {
    const existing = registry.releases[existingIndex];
    record.registered_at = existing.registered_at;
    registry.releases[existingIndex] = record;
  } else {
    registry.releases.push(record);
  }

  registry.releases.sort((a, b) => a.release_id.localeCompare(b.release_id));
  await saveReleaseRegistry(repoRoot, registry);
  return record;
}

export async function getRelease(
  repoRoot: string,
  releaseId: string,
): Promise<ReleaseRecord | null> {
  const registry = await loadReleaseRegistry(repoRoot);
  return registry.releases.find((r) => r.release_id === releaseId) ?? null;
}

export async function listReleases(repoRoot: string): Promise<ReleaseRecord[]> {
  const registry = await loadReleaseRegistry(repoRoot);
  return [...registry.releases];
}

export async function updateReleaseStatus(
  repoRoot: string,
  releaseId: string,
  status: ReleaseStatus,
): Promise<ReleaseRecord> {
  if (!isReleaseStatus(status)) {
    throw new Error(`Invalid release status: ${status}`);
  }

  const registry = await loadReleaseRegistry(repoRoot);
  const index = registry.releases.findIndex((r) => r.release_id === releaseId);

  if (index < 0) {
    throw new Error(`Release not found: ${releaseId}`);
  }

  const updated: ReleaseRecord = {
    ...registry.releases[index],
    status,
    updated_at: new Date().toISOString(),
  };

  registry.releases[index] = updated;
  await saveReleaseRegistry(repoRoot, registry);
  return updated;
}

export function evaluateSensitiveAction(
  release: ReleaseRecord | null,
  releaseId: string,
): SensitiveActionCheck {
  if (!release) {
    return {
      allowed: false,
      release_id: releaseId,
      status: null,
      reason: 'release_not_registered',
    };
  }

  if (release.status === 'revoked') {
    return {
      allowed: false,
      release_id: releaseId,
      status: release.status,
      reason: 'release_revoked',
    };
  }

  if (release.status === 'suspended') {
    return {
      allowed: false,
      release_id: releaseId,
      status: release.status,
      reason: 'release_suspended',
    };
  }

  if (release.status === 'under_review') {
    return {
      allowed: false,
      release_id: releaseId,
      status: release.status,
      reason: 'release_under_review',
    };
  }

  if (release.status === 'draft') {
    return {
      allowed: false,
      release_id: releaseId,
      status: release.status,
      reason: 'release_not_certified',
    };
  }

  if (release.status === SENSITIVE_ACTION_ALLOWED_STATUS) {
    return {
      allowed: true,
      release_id: releaseId,
      status: release.status,
      reason: 'release_certified',
    };
  }

  return {
    allowed: false,
    release_id: releaseId,
    status: release.status,
    reason: 'release_status_blocked',
  };
}

export async function checkSensitiveActionAllowed(
  repoRoot: string,
  releaseId: string,
): Promise<SensitiveActionCheck> {
  const release = await getRelease(repoRoot, releaseId);
  return evaluateSensitiveAction(release, releaseId);
}
