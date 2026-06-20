/** Commitment roots anchored to an external trust layer (e.g. T3). */
export type AnchorRoots = {
  releaseHashRoot: string;
  policyHash: string;
  auditStateRoot: string;
  revocationStateRoot: string;
};

/** Partial update for one or more roots. */
export type AnchorRootsUpdate = Partial<AnchorRoots>;

export type AnchorWriteMode = 'anchored' | 'deferred' | 'local-only';

export type AnchorWriteResult = {
  mode: AnchorWriteMode;
  roots: AnchorRoots;
  /** External reference when anchored (contract id, tx id, etc.). */
  externalRef?: string;
  message?: string;
};

export type AnchorStatus = {
  configured: boolean;
  writable: boolean;
  provider: string;
  tenantDid?: string;
  contractId?: number;
  contractTail?: string;
};
