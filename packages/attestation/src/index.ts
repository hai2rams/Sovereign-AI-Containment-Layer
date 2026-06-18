export {
  attestationIdFor,
  consumeChallenge,
  createAttestationChallenge,
  getChallenge,
  isChallengeExpired,
  resetChallengeStore,
} from './challenge.js';
export type { VerifyMockAttestationInput } from './verifier.js';
export { buildMockQuoteFromPassport, verifyMockAttestation } from './verifier.js';
export type {
  AttestationChallenge,
  AttestationVerificationResult,
  MockAttestationQuote,
} from './types.js';
