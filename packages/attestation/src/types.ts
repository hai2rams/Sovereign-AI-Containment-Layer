export type AttestationChallenge = {
  nonce: string;
  release_id: string;
  expires_at: string;
  created_at: string;
};

export type MockAttestationQuote = {
  release_id: string;
  measurement_hash: string;
  policy_hash: string;
  debug: boolean;
  nonce: string;
  issued_at: string;
};

export type AttestationVerificationResult = {
  verified: boolean;
  release_id: string;
  reason: string;
  attestation_id: string | null;
};
