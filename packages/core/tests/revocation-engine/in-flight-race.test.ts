import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveInFlightActionRace } from '../../src/revocation-engine/in-flight-race.js';
import { verifyToolExecution } from '../../src/tool-executor/index.js';
import {
  issueTokenForPayload,
  SWAP_ORIGINAL_PAYLOAD,
  swapTestEnvelope,
  verificationRequest,
} from '../tool-executor/fixtures.js';
import { applyRevocationSignal } from '../../src/revocation-engine/revocation-transition.js';
import { baseStateEnvelope, issuedTokenAtEpoch } from './fixtures.js';

describe('in-flight-race', () => {
  it('detects revocation epoch race for in-flight token', () => {
    const token = issuedTokenAtEpoch(42);
    const transition = applyRevocationSignal({
      envelope: baseStateEnvelope({ revocation_epoch: 42, containment_epoch: 7 }),
      signal: 'quarantine',
      monotonic_tick: 50,
    });

    const race = resolveInFlightActionRace({
      envelope: transition.updated_envelope,
      token,
    });

    assert.equal(race.race_lost, true);
    assert.ok(race.reason_codes.includes('IN_FLIGHT_REVOCATION_RACE'));
    assert.equal(race.action_permitted, false);
  });

  it('aligns with tool executor revocation epoch mismatch', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD, swapTestEnvelope());
    const envelope = swapTestEnvelope({ revocation_epoch: token.revocation_epoch + 1 });

    const race = resolveInFlightActionRace({ envelope, token });
    assert.equal(race.race_lost, true);

    const verification = verifyToolExecution(
      verificationRequest(token, SWAP_ORIGINAL_PAYLOAD, {
        current_revocation_epoch: envelope.revocation_epoch,
      }),
    );
    assert.equal(verification.decision, 'blocked');
    assert.ok(verification.reason_codes.includes('REVOCATION_EPOCH_MISMATCH'));
  });

  it('permits action when epochs match and revocation active', () => {
    const token = issuedTokenAtEpoch(42);
    const envelope = baseStateEnvelope({ revocation_epoch: 42, containment_epoch: 7 });

    const race = resolveInFlightActionRace({ envelope, token });
    assert.equal(race.race_lost, false);
    assert.equal(race.action_permitted, true);
  });
});
