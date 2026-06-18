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
