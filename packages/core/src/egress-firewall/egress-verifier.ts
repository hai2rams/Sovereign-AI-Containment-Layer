import type {
  EgressBlockedReason,
  EgressVerificationRequest,
  EgressVerificationResult,
} from './types.js';
import { verifyEgressPolicyHashes } from './egress-policy.js';
import { validateEgressSchemaContract } from './schema-contract.js';
import { isDestinationAllowlisted } from './allowlist-verifier.js';
import { detectExfilPatterns } from './exfil-detector.js';
import { riskModePermitsEgress, streamingPermitted } from './streaming-gate.js';
import { computeTimingPadMs } from './timing-pad.js';

function blocked(
  reason_codes: EgressBlockedReason[],
  partial: Partial<EgressVerificationResult>,
  timing_pad_ms: number,
): EgressVerificationResult {
  return {
    decision: 'blocked',
    reason_codes,
    schema_valid: partial.schema_valid ?? false,
    destination_allowed: partial.destination_allowed ?? false,
    exfil_pattern_detected: partial.exfil_pattern_detected ?? false,
    streaming_permitted: partial.streaming_permitted ?? false,
    policy_hash_matches: partial.policy_hash_matches ?? false,
    timing_pad_ms,
    egress_transmitted: false,
  };
}

export function verifyEgress(request: EgressVerificationRequest): EgressVerificationResult {
  const tick = request.monotonic_tick ?? 0;
  const timing_pad_ms = computeTimingPadMs(tick);

  const policy_hash_matches = verifyEgressPolicyHashes(
    request.envelope_policy_hash,
    request.policy,
  );

  if (!policy_hash_matches) {
    return blocked(['EGRESS_POLICY_HASH_MISMATCH'], { policy_hash_matches: false }, timing_pad_ms);
  }

  if (!riskModePermitsEgress(request.risk_mode)) {
    return blocked(['RISK_MODE_BLOCKS_EGRESS'], { policy_hash_matches: true }, timing_pad_ms);
  }

  const destination_allowed = isDestinationAllowlisted(
    request.egress_destination,
    request.policy.certified_destinations,
  );
  if (!destination_allowed) {
    return blocked(
      ['EGRESS_DESTINATION_NOT_ALLOWLISTED'],
      { policy_hash_matches: true, destination_allowed: false },
      timing_pad_ms,
    );
  }

  const stream_ok = streamingPermitted(request.risk_mode, request.streaming_requested);
  if (!stream_ok) {
    return blocked(
      ['STREAMING_DISABLED_IN_QUARANTINE'],
      {
        policy_hash_matches: true,
        destination_allowed: true,
        streaming_permitted: false,
      },
      timing_pad_ms,
    );
  }

  const exfil = detectExfilPatterns(request.output_body);
  if (exfil.exfil_pattern_detected) {
    return blocked(
      ['EXFIL_PATTERN_DETECTED'],
      {
        policy_hash_matches: true,
        destination_allowed: true,
        streaming_permitted: stream_ok,
        exfil_pattern_detected: true,
      },
      timing_pad_ms,
    );
  }

  const schema_valid = validateEgressSchemaContract(
    request.output_contract_id,
    request.output_body,
  );
  if (!schema_valid) {
    if (exfil.high_entropy_blocked) {
      return blocked(
        ['HIGH_ENTROPY_OUTPUT_BLOCKED'],
        {
          policy_hash_matches: true,
          destination_allowed: true,
          streaming_permitted: stream_ok,
          schema_valid: false,
        },
        timing_pad_ms,
      );
    }
    return blocked(
      ['EGRESS_SCHEMA_VIOLATION'],
      {
        policy_hash_matches: true,
        destination_allowed: true,
        streaming_permitted: stream_ok,
        schema_valid: false,
      },
      timing_pad_ms,
    );
  }

  return {
    decision: 'allowed',
    reason_codes: [],
    schema_valid: true,
    destination_allowed: true,
    exfil_pattern_detected: false,
    streaming_permitted: stream_ok,
    policy_hash_matches: true,
    timing_pad_ms,
    egress_transmitted: false,
  };
}
