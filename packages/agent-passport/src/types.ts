export type HashBundle = Record<string, string>;

export type AgentPassport = {
  agent_did: string;
  release_id: string;
  project: string;
  certification_status: 'draft' | 'certified' | 'revoked';
  policy_version: string;
  runtime_target: string;
  hash_bundle: HashBundle;
  created_at: string;
  created_by: string;
  trust_claim: string;
  non_claim: string;
};

export type GeneratePassportOptions = {
  repoRoot: string;
  releaseId?: string;
  createdBy?: string;
  certificationStatus?: AgentPassport['certification_status'];
  outputPath?: string;
};

export type CertifiedArtifactDefinition = {
  bundleKey: string;
  relativePath: string;
  kind: 'json' | 'text';
};

export const RELEASE_STATUSES = [
  'draft',
  'certified',
  'suspended',
  'revoked',
  'under_review',
] as const;

export type ReleaseStatus = (typeof RELEASE_STATUSES)[number];

export type ReleaseRecord = {
  release_id: string;
  agent_did: string;
  policy_version: string;
  runtime_target: string;
  bundle_root_hash: string;
  passport_certification_status: AgentPassport['certification_status'];
  status: ReleaseStatus;
  registered_at: string;
  updated_at: string;
};

export type ReleaseRegistry = {
  version: '0.1.0';
  releases: ReleaseRecord[];
};

export type SensitiveActionCheck = {
  allowed: boolean;
  release_id: string;
  status: ReleaseStatus | null;
  reason: string;
};
