import type { CertifiedArtifactDefinition } from './types.js';

export const CERTIFIED_ARTIFACTS_DIR = 'configs/certified-artifacts';

export const CERTIFIED_ARTIFACTS: CertifiedArtifactDefinition[] = [
  { bundleKey: 'model_hash', relativePath: 'model.json', kind: 'json' },
  { bundleKey: 'tokenizer_hash', relativePath: 'tokenizer.json', kind: 'json' },
  { bundleKey: 'system_prompt_hash', relativePath: 'system-prompt.md', kind: 'text' },
  { bundleKey: 'developer_prompt_hash', relativePath: 'developer-prompt.md', kind: 'text' },
  { bundleKey: 'tool_manifest_hash', relativePath: 'tool-manifest.json', kind: 'json' },
  { bundleKey: 'policy_rules_hash', relativePath: 'policy-rules.json', kind: 'json' },
  { bundleKey: 'rag_config_hash', relativePath: 'rag-config.json', kind: 'json' },
  { bundleKey: 'memory_rules_hash', relativePath: 'memory-rules.json', kind: 'json' },
  { bundleKey: 'runtime_config_hash', relativePath: 'runtime-config.json', kind: 'json' },
  { bundleKey: 'egress_allowlist_hash', relativePath: 'egress-allowlist.json', kind: 'json' },
  { bundleKey: 'audit_config_hash', relativePath: 'audit-config.json', kind: 'json' },
  { bundleKey: 'sbom_placeholder_hash', relativePath: 'sbom-placeholder.json', kind: 'json' },
];

export const DEFAULT_PASSPORT_OUTPUT = 'artifacts/agent-passport.json';

export const SECRET_VALUE_PATTERNS = [
  /sk-[A-Za-z0-9]{10,}/,
  /0x[a-fA-F0-9]{32,}/,
  /AQ\.[A-Za-z0-9._-]{10,}/,
] as const;

const FORBIDDEN_FIELD_NAMES = new Set([
  'api_key',
  'apikey',
  'secret',
  'password',
  'token',
  'credential',
  'private_key',
  'authorization',
]);

export { FORBIDDEN_FIELD_NAMES };
