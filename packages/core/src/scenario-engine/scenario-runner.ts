import { asAsciiSlug, asIsoTimestamp } from '../types/brands.js';
import { evaluateMemoryWrite } from '../memory-firewall/memory-firewall.js';
import { validateMemoryEvidenceMetadata } from '../memory-firewall/memory-metadata.js';
import { hashMemoryPayload } from '../memory-firewall/quota-enforcer.js';
import {
  applyRevocationSignal,
  resolveInFlightActionRace,
} from '../revocation-engine/index.js';
import {
  evaluateSemanticPolicy,
  mapSemanticResultToPolicyDecision,
} from '../semantic-policy/index.js';
import { buildTelemetryEvent } from '../telemetry/telemetry-event.js';
import { verifyHashChain } from '../telemetry/telemetry-hash-chain.js';
import {
  DEFAULT_PARAMETER_SCHEMA_VERSION,
  DEFAULT_SIGNING_KEY_ID,
  TokenBroker,
} from '../token-broker/index.js';
import { verifyToolExecution } from '../tool-executor/tool-executor-verifier.js';
import { envelopeFromScenario } from './envelope-builder.js';
import { resolvePaymentPolicy } from './policy-registry.js';
import type { ScenarioDefinition, ScenarioRunResult } from './types.js';
import { proposalFromScenario } from './types.js';

function runSemanticScenario(def: ScenarioDefinition): ScenarioRunResult {
  if (!def.proposal) {
    throw new Error(`Scenario ${def.id} requires proposal`);
  }

  const proposal = proposalFromScenario(def.proposal);
  const envelope = envelopeFromScenario(def.envelope);
  const policy = resolvePaymentPolicy(def.policy_ref);
  const semantic = evaluateSemanticPolicy({ proposal, envelope, policy });

  const outcome = semantic.final_semantic_result === 'allowed' ? 'allowed' : 'contained';

  return {
    scenario_id: def.id,
    outcome,
    semantic_validation: {
      accepted: semantic.accepted,
      engine: semantic.engine,
      final_semantic_result: semantic.final_semantic_result,
      policy_decision: mapSemanticResultToPolicyDecision(semantic.final_semantic_result),
      reason_codes: semantic.reason_codes,
    },
  };
}

function runParameterSwapScenario(def: ScenarioDefinition): ScenarioRunResult {
  if (!def.proposal || !def.attack_proposal) {
    throw new Error(`Scenario ${def.id} requires proposal and attack_proposal`);
  }

  const proposal = proposalFromScenario(def.proposal);
  const attackProposal = proposalFromScenario(def.attack_proposal);
  const envelope = envelopeFromScenario({
    source_trust_level: 1,
    ...def.envelope,
  });
  const policy = resolvePaymentPolicy(def.policy_ref);
  const semantic = evaluateSemanticPolicy({ proposal, envelope, policy });

  const broker = new TokenBroker();
  const issuance = broker.issueToken({
    proposal,
    envelope,
    semantic,
    tool_id: asAsciiSlug('tool.payment.transfer'),
    parameter_schema_version: asAsciiSlug(DEFAULT_PARAMETER_SCHEMA_VERSION),
    policy_decision_id: asAsciiSlug('policy-decision-scenario'),
    signing_key_id: DEFAULT_SIGNING_KEY_ID,
  });

  if (issuance.decision !== 'issued' || !issuance.token) {
    return {
      scenario_id: def.id,
      outcome: 'contained',
      tool_execution: {
        verification_result: 'blocked',
        reason_codes: [issuance.reason_code ?? 'TOKEN_NOT_ISSUED'],
      },
    };
  }

  const verification = verifyToolExecution({
    token: issuance.token,
    execution_payload: attackProposal,
    current_revocation_epoch: envelope.revocation_epoch,
    current_containment_epoch: envelope.containment_epoch,
    current_key_epoch: envelope.key_epoch,
    used_jtis: new Set(),
    used_idempotency_keys: new Set(),
  });

  return {
    scenario_id: def.id,
    outcome: verification.decision === 'allowed' ? 'allowed' : 'contained',
    tool_execution: {
      verification_result: verification.decision,
      reason_codes: verification.reason_codes,
    },
  };
}

function runMemoryPoisoningScenario(def: ScenarioDefinition): ScenarioRunResult {
  const payload = def.memory_payload ?? '<script>alert("poison")</script>';
  const envelope = envelopeFromScenario(def.envelope);
  const byte_length = Buffer.byteLength(payload, 'utf8');
  const content_hash = hashMemoryPayload(payload);

  const metadataResult = validateMemoryEvidenceMetadata({
    evidence_id: asAsciiSlug('evidence-poison-001'),
    evidence_trust_level: envelope.source_trust_level,
    captured_at: asIsoTimestamp('2030-01-01T00:00:00.000Z'),
    byte_length,
    content_hash: content_hash,
    content_type: asAsciiSlug('text_plain'),
  });

  if (!metadataResult.ok) {
    return {
      scenario_id: def.id,
      outcome: 'contained',
      memory_firewall: {
        decision: 'blocked',
        reason_codes: ['INVALID_MEMORY_METADATA'],
        quarantine_recommended: false,
      },
    };
  }

  const result = evaluateMemoryWrite({
    metadata: metadataResult.value,
    payload,
    envelope,
  });

  return {
    scenario_id: def.id,
    outcome: result.decision === 'allowed' ? 'allowed' : 'contained',
    memory_firewall: {
      decision: result.decision,
      reason_codes: result.reason_codes,
      quarantine_recommended: result.quarantine_recommended,
    },
  };
}

function runRevocationRaceScenario(def: ScenarioDefinition): ScenarioRunResult {
  if (!def.proposal) {
    throw new Error(`Scenario ${def.id} requires proposal`);
  }

  const proposal = proposalFromScenario(def.proposal);
  const envelope = envelopeFromScenario({
    revocation_epoch: 42,
    containment_epoch: 7,
    ...def.envelope,
  });
  const policy = resolvePaymentPolicy(def.policy_ref);
  const semantic = evaluateSemanticPolicy({ proposal, envelope, policy });

  const broker = new TokenBroker();
  const issuance = broker.issueToken({
    proposal,
    envelope,
    semantic,
    tool_id: asAsciiSlug('tool.payment.transfer'),
    parameter_schema_version: asAsciiSlug(DEFAULT_PARAMETER_SCHEMA_VERSION),
    policy_decision_id: asAsciiSlug('policy-decision-revocation-race'),
    signing_key_id: DEFAULT_SIGNING_KEY_ID,
  });

  if (issuance.decision !== 'issued' || !issuance.token) {
    throw new Error(`Revocation race scenario requires issued token: ${issuance.reason_code}`);
  }

  const transition = applyRevocationSignal({
    envelope,
    signal: def.revocation_signal ?? 'quarantine',
    monotonic_tick: 500,
  });

  const race = resolveInFlightActionRace({
    envelope: transition.updated_envelope,
    token: issuance.token,
  });

  return {
    scenario_id: def.id,
    outcome: race.race_lost ? 'contained' : 'allowed',
    revocation_race: {
      race_lost: race.race_lost,
      reason_codes: race.reason_codes,
    },
  };
}

function runTelemetrySpoofingScenario(
  def: ScenarioDefinition,
  replayEvents?: Parameters<typeof verifyHashChain>[0],
): ScenarioRunResult {
  if (replayEvents) {
    const chain = verifyHashChain(replayEvents);
    return {
      scenario_id: def.id,
      outcome: chain.valid ? 'allowed' : 'contained',
      telemetry_chain: {
        valid: chain.valid,
        reason: chain.reason,
        broken_at_sequence: chain.broken_at_sequence,
      },
    };
  }

  const e1 = buildTelemetryEvent({
    event_type: 'SESSION_STARTED',
    session_id: 'session-001',
    trace_id: 'trace-001',
    span_id: 'span-1',
    event_sequence: 1,
    previous_event_hash: null,
  });
  const e2 = buildTelemetryEvent({
    event_type: 'SEMANTIC_VALIDATION_COMPLETED',
    session_id: 'session-001',
    trace_id: 'trace-001',
    span_id: 'span-2',
    event_sequence: 2,
    previous_event_hash: 'tampered-hash',
  });
  const chain = verifyHashChain([e1, e2]);

  return {
    scenario_id: def.id,
    outcome: 'contained',
    telemetry_chain: {
      valid: chain.valid,
      reason: chain.reason,
      broken_at_sequence: chain.broken_at_sequence,
    },
  };
}

export type RunScenarioOptions = {
  replay_events?: Parameters<typeof verifyHashChain>[0];
};

export function runScenario(
  def: ScenarioDefinition,
  options: RunScenarioOptions = {},
): ScenarioRunResult {
  switch (def.id) {
    case 'golden-path':
    case 'poisoned-invoice':
      return runSemanticScenario(def);
    case 'parameter-swap':
      return runParameterSwapScenario(def);
    case 'memory-poisoning':
      return runMemoryPoisoningScenario(def);
    case 'revocation-race':
      return runRevocationRaceScenario(def);
    case 'telemetry-spoofing':
      return runTelemetrySpoofingScenario(def, options.replay_events);
    default:
      throw new Error(`Unknown scenario id: ${def.id}`);
  }
}

export const SCENARIO_IDS = [
  'golden-path',
  'poisoned-invoice',
  'parameter-swap',
  'memory-poisoning',
  'revocation-race',
  'telemetry-spoofing',
] as const;
