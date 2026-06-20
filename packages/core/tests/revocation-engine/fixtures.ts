import { asAsciiSlug } from '../../src/types/brands.js';
import type { StateEnvelope } from '../../src/types/state-envelope.js';
import { baseStateEnvelope } from '../semantic-policy/fixtures.js';
import type { ParameterBoundActionToken } from '../../src/token-broker/types.js';
import { TokenBroker } from '../../src/token-broker/token-broker.js';
import { baseIssuanceRequest } from '../token-broker/fixtures.js';

export { baseStateEnvelope };

export function quarantinedEnvelope(
  overrides: Partial<StateEnvelope> = {},
): StateEnvelope {
  return baseStateEnvelope({
    revocation_status: 'quarantined',
    risk_mode: 'quarantine',
    revocation_epoch: 43,
    containment_epoch: 8,
    policy_decision: 'deny',
    action_token_id: null,
    ...overrides,
  });
}

export function revokedEnvelope(overrides: Partial<StateEnvelope> = {}): StateEnvelope {
  return baseStateEnvelope({
    revocation_status: 'revoked',
    release_status: 'revoked',
    risk_mode: 'revoked',
    revocation_epoch: 44,
    containment_epoch: 9,
    policy_decision: 'deny',
    action_token_id: null,
    ...overrides,
  });
}

export function issuedTokenAtEpoch(epoch: number): ParameterBoundActionToken {
  const broker = new TokenBroker();
  const result = broker.issueToken(
    baseIssuanceRequest({
      envelope: baseStateEnvelope({
        source_trust_level: 1,
        revocation_epoch: epoch,
        containment_epoch: 7,
      }),
    }),
  );
  if (result.decision !== 'issued' || !result.token) {
    throw new Error('expected issued token fixture');
  }
  return result.token;
}

export const HEARTBEAT_NONCE = asAsciiSlug('heartbeat-nonce-001');
