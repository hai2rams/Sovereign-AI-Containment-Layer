import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { asAsciiSlug, asSha256Hex } from '../../src/types/brands.js';
import {
  verifyEgress,
  buildEgressTelemetryPayload,
  assertEgressTelemetrySafe,
} from '../../src/egress-firewall/index.js';
import {
  actionProposalEgressRequest,
  baseEgressRequest,
  egressPolicy,
  EXFIL_PRIVATE_KEY,
  HIGH_ENTROPY_BLOB,
  VALID_TEXT_EGRESS,
} from './fixtures.js';

describe('EgressVerifier', () => {
  it('allows certified egress with valid schema and destination', () => {
    const result = verifyEgress(baseEgressRequest());
    assert.equal(result.decision, 'allowed');
    assert.equal(result.egress_transmitted, false);
    assert.equal(result.destination_allowed, true);
    assert.equal(result.schema_valid, true);
    assert.ok(result.timing_pad_ms > 0);
  });

  it('allows ACTION_PROPOSAL_V1 contracted egress', () => {
    const result = verifyEgress(actionProposalEgressRequest());
    assert.equal(result.decision, 'allowed');
    assert.equal(result.schema_valid, true);
  });

  it('blocks non-allowlisted destination', () => {
    const result = verifyEgress(
      baseEgressRequest({ egress_destination: asAsciiSlug('attacker_exfil_sink') }),
    );
    assert.equal(result.decision, 'blocked');
    assert.ok(result.reason_codes.includes('EGRESS_DESTINATION_NOT_ALLOWLISTED'));
  });

  it('blocks exfil private key pattern', () => {
    const result = verifyEgress(baseEgressRequest({ output_body: EXFIL_PRIVATE_KEY }));
    assert.equal(result.decision, 'blocked');
    assert.ok(result.reason_codes.includes('EXFIL_PATTERN_DETECTED'));
  });

  it('blocks high-entropy output', () => {
    const result = verifyEgress(baseEgressRequest({ output_body: HIGH_ENTROPY_BLOB }));
    assert.equal(result.decision, 'blocked');
    assert.ok(
      result.reason_codes.includes('HIGH_ENTROPY_OUTPUT_BLOCKED') ||
        result.reason_codes.includes('EXFIL_PATTERN_DETECTED'),
    );
  });

  it('blocks streaming in quarantine', () => {
    const result = verifyEgress(
      baseEgressRequest({ risk_mode: 'quarantine', streaming_requested: true }),
    );
    assert.equal(result.decision, 'blocked');
    assert.ok(result.reason_codes.includes('STREAMING_DISABLED_IN_QUARANTINE'));
  });

  it('blocks egress policy hash mismatch', () => {
    const policy = egressPolicy({ policy_hash: asSha256Hex('sha256:' + 'd'.repeat(64)) });
    const result = verifyEgress(
      baseEgressRequest({
        policy,
        envelope_policy_hash: egressPolicy().policy_hash,
      }),
    );
    assert.equal(result.decision, 'blocked');
    assert.ok(result.reason_codes.includes('EGRESS_POLICY_HASH_MISMATCH'));
  });

  it('blocks revoked risk mode', () => {
    const result = verifyEgress(baseEgressRequest({ risk_mode: 'revoked' }));
    assert.equal(result.decision, 'blocked');
    assert.ok(result.reason_codes.includes('RISK_MODE_BLOCKS_EGRESS'));
  });

  it('blocks schema violation for invalid text egress', () => {
    const result = verifyEgress(
      baseEgressRequest({ output_body: '\u0001binary noise' }),
    );
    assert.equal(result.decision, 'blocked');
    assert.ok(result.reason_codes.includes('EGRESS_SCHEMA_VIOLATION'));
  });

  it('telemetry does not include secrets or raw output body', () => {
    const blocked = verifyEgress(baseEgressRequest({ output_body: EXFIL_PRIVATE_KEY }));
    const telemetry = buildEgressTelemetryPayload(blocked);
    assert.doesNotThrow(() => assertEgressTelemetrySafe(telemetry));
    assert.equal(JSON.stringify(telemetry).includes('PRIVATE KEY'), false);
    assert.equal(telemetry.egress_firewall.egress_transmitted, false);
  });

  it('no egress transmission occurs in M8', () => {
    const allowed = verifyEgress(baseEgressRequest({ output_body: VALID_TEXT_EGRESS }));
    assert.equal(allowed.egress_transmitted, false);
  });
});
