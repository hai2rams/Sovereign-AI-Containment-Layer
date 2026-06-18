import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { PolicyRulesConfig, ToolManifestEntry } from './types.js';

const ARTIFACTS_DIR = 'configs/certified-artifacts';

export async function loadPolicyRules(repoRoot: string): Promise<PolicyRulesConfig> {
  const raw = await readFile(resolve(repoRoot, ARTIFACTS_DIR, 'policy-rules.json'), 'utf8');
  return JSON.parse(raw) as PolicyRulesConfig;
}

export async function loadToolManifest(repoRoot: string): Promise<ToolManifestEntry[]> {
  const raw = await readFile(resolve(repoRoot, ARTIFACTS_DIR, 'tool-manifest.json'), 'utf8');
  const parsed = JSON.parse(raw) as { tools: ToolManifestEntry[] };
  return parsed.tools;
}

export const ACTION_PROPOSAL_ALLOWED_KEYS = new Set([
  'action',
  'parameters',
  'source_trust_level',
  'session_id',
  'release_id',
  'attestation_id',
  'evidence_summary',
  'risk_mode',
]);

export const SENSITIVE_ACTIONS = new Set([
  'payment.transfer',
  'memory.write',
  't3.issue_action_token',
]);

export const POLICY_OVERRIDE_PATTERNS = [
  /ignore\s+(all\s+)?policy/i,
  /override\s+policy/i,
  /disable\s+policy/i,
  /bypass\s+containment/i,
  /you\s+are\s+now\s+unrestricted/i,
];
