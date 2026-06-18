export type ActionTokenClaims = {
  token_id: string;
  agent_did: string;
  release_id: string;
  attestation_id: string;
  session_id: string;
  action: string;
  policy_hash: string;
  max_amount?: number;
  allowed_destination?: string;
  issued_at: string;
  expires_at: string;
};

export type IssueActionTokenInput = {
  repoRoot: string;
  agent_did: string;
  release_id: string;
  attestation_id: string;
  session_id: string;
  action: string;
  policy_hash: string;
  proposal: unknown;
  ttl_seconds?: number;
  signingKey: string;
};

export type IssueActionTokenResult = {
  token: string;
  claims: ActionTokenClaims;
  expires_at: string;
};

export type VerifyActionTokenInput = {
  repoRoot: string;
  token: string;
  expected_action?: string;
  expected_release_id?: string;
  signingKey: string;
  now?: Date;
};

export type VerifyActionTokenResult = {
  valid: boolean;
  reason: string;
  claims: ActionTokenClaims | null;
};
