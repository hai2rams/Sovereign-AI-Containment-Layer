import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { asAsciiSlug } from '../../src/types/brands.js';
import {
  verifyToolExecution,
  buildToolExecutorVerificationTelemetryPayload,
  assertToolExecutorVerificationTelemetrySafe,
} from '../../src/tool-executor/tool-executor-verifier.js';
import type { ParameterBoundActionToken } from '../../src/token-broker/types.js';
import {
  issueTokenForPayload,
  SWAP_ATTACK_PAYLOAD,
  SWAP_ORIGINAL_PAYLOAD,
  verificationRequest,
} from './fixtures.js';

describe('ToolExecutorVerifier', () => {
  it('1. valid token + matching payload allows verification', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    const result = verifyToolExecution(
      verificationRequest(token, SWAP_ORIGINAL_PAYLOAD),
      { now_ms: Date.parse('2030-01-01T00:00:30.000Z') },
    );
    assert.equal(result.decision, 'allowed');
    assert.equal(result.reason_codes.length, 0);
    assert.equal(result.parameter_hash_matches, true);
    assert.equal(result.downstream_tool_called, false);
    assert.equal(result.transaction_executed, false);
  });

  it('parameter swap attack blocks with PARAMETER_HASH_MISMATCH', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    const result = verifyToolExecution(
      verificationRequest(token, SWAP_ATTACK_PAYLOAD),
      { now_ms: Date.parse('2030-01-01T00:00:30.000Z') },
    );
    assert.equal(result.decision, 'blocked');
    assert.deepEqual(result.reason_codes, ['PARAMETER_HASH_MISMATCH']);
    assert.equal(result.parameter_hash_matches, false);
    assert.equal(result.signature_valid, true);
    assert.equal(result.revocation_epoch_matches, true);
    assert.equal(result.containment_epoch_matches, true);
    assert.equal(result.key_epoch_matches, true);
    assert.equal(result.idempotency_key_unused, true);
    assert.equal(result.jti_unused, true);
    assert.equal(result.downstream_tool_called, false);
    assert.equal(result.transaction_executed, false);
  });

  it('5. action mismatch blocks', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    const payload = {
      ...SWAP_ORIGINAL_PAYLOAD,
      action: asAsciiSlug('payment.refund'),
    };
    const result = verifyToolExecution(verificationRequest(token, payload), {
      now_ms: Date.parse('2030-01-01T00:00:30.000Z'),
    });
    assert.equal(result.decision, 'blocked');
    assert.ok(result.reason_codes.includes('ACTION_MISMATCH'));
    assert.ok(result.reason_codes.includes('TOOL_ID_MISMATCH'));
  });

  it('6. invalid signature blocks', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    const tampered = { ...token, signature: 'mock_sig_v1:invalid' };
    const result = verifyToolExecution(verificationRequest(tampered, SWAP_ORIGINAL_PAYLOAD), {
      now_ms: Date.parse('2030-01-01T00:00:30.000Z'),
    });
    assert.equal(result.decision, 'blocked');
    assert.ok(result.reason_codes.includes('INVALID_TOKEN_SIGNATURE'));
  });

  it('7-9. epoch mismatches block', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    const revocation = verifyToolExecution(
      verificationRequest(token, SWAP_ORIGINAL_PAYLOAD, {
        current_revocation_epoch: token.revocation_epoch + 1,
      }),
      { now_ms: Date.parse('2030-01-01T00:00:30.000Z') },
    );
    assert.ok(revocation.reason_codes.includes('REVOCATION_EPOCH_MISMATCH'));

    const containment = verifyToolExecution(
      verificationRequest(token, SWAP_ORIGINAL_PAYLOAD, {
        current_containment_epoch: token.containment_epoch + 1,
      }),
      { now_ms: Date.parse('2030-01-01T00:00:30.000Z') },
    );
    assert.ok(containment.reason_codes.includes('CONTAINMENT_EPOCH_MISMATCH'));

    const key = verifyToolExecution(
      verificationRequest(token, SWAP_ORIGINAL_PAYLOAD, {
        current_key_epoch: token.key_epoch + 1,
      }),
      { now_ms: Date.parse('2030-01-01T00:00:30.000Z') },
    );
    assert.ok(key.reason_codes.includes('KEY_EPOCH_MISMATCH'));
  });

  it('10. reused jti blocks', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    const result = verifyToolExecution(
      verificationRequest(token, SWAP_ORIGINAL_PAYLOAD, {
        used_jtis: new Set([token.jti]),
      }),
      { now_ms: Date.parse('2030-01-01T00:00:30.000Z') },
    );
    assert.ok(result.reason_codes.includes('TOKEN_JTI_REUSED'));
  });

  it('11. reused idempotency key blocks', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    const result = verifyToolExecution(
      verificationRequest(token, SWAP_ORIGINAL_PAYLOAD, {
        used_idempotency_keys: new Set([token.idempotency_key]),
      }),
      { now_ms: Date.parse('2030-01-01T00:00:30.000Z') },
    );
    assert.ok(result.reason_codes.includes('IDEMPOTENCY_KEY_REUSED'));
  });

  it('12. risk mode quarantine blocks', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    const quarantineToken: ParameterBoundActionToken = { ...token, risk_mode: 'quarantine' };
    const result = verifyToolExecution(verificationRequest(quarantineToken, SWAP_ORIGINAL_PAYLOAD), {
      now_ms: Date.parse('2030-01-01T00:00:30.000Z'),
    });
    assert.ok(result.reason_codes.includes('RISK_MODE_BLOCKS_EXECUTION'));
  });

  it('13. risk mode read_only blocks state-changing action', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    const readOnlyToken: ParameterBoundActionToken = { ...token, risk_mode: 'read_only' };
    const result = verifyToolExecution(verificationRequest(readOnlyToken, SWAP_ORIGINAL_PAYLOAD), {
      now_ms: Date.parse('2030-01-01T00:00:30.000Z'),
    });
    assert.ok(result.reason_codes.includes('RISK_MODE_BLOCKS_EXECUTION'));
  });

  it('14. single_use false blocks', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    const notSingleUse = { ...token, single_use: false as true };
    const result = verifyToolExecution(verificationRequest(notSingleUse, SWAP_ORIGINAL_PAYLOAD), {
      now_ms: Date.parse('2030-01-01T00:00:30.000Z'),
    });
    assert.ok(result.reason_codes.includes('TOKEN_NOT_SINGLE_USE'));
  });

  it('15. verification telemetry does not include secrets', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    const blocked = verifyToolExecution(verificationRequest(token, SWAP_ATTACK_PAYLOAD), {
      now_ms: Date.parse('2030-01-01T00:00:30.000Z'),
    });
    const payload = buildToolExecutorVerificationTelemetryPayload(blocked);
    assert.doesNotThrow(() => assertToolExecutorVerificationTelemetrySafe(payload));
    assert.equal(payload.tool_executor_verification.verification_result, 'blocked');
    assert.equal(payload.tool_executor_verification.reason_code, 'PARAMETER_HASH_MISMATCH');
  });

  it('16. no downstream tool call occurs in M6', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    const allowed = verifyToolExecution(verificationRequest(token, SWAP_ORIGINAL_PAYLOAD), {
      now_ms: Date.parse('2030-01-01T00:00:30.000Z'),
    });
    assert.equal(allowed.downstream_tool_called, false);
    assert.equal(allowed.transaction_executed, false);
  });
});
