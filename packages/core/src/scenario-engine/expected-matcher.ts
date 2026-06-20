import type { TelemetryEventEnvelope } from '../telemetry/types.js';
import type { ScenarioRunResult } from './types.js';

export type ScenarioExpected = {
  scenario_id: string;
  outcome?: 'allowed' | 'contained';
  semantic_validation?: {
    accepted: boolean;
    engine: string;
    final_semantic_result: string;
    policy_decision: string;
    reason_codes?: string[];
    required_reason_codes?: string[];
  };
  tool_execution?: {
    verification_result: string;
    required_reason_codes?: string[];
  };
  memory_firewall?: {
    decision: string;
    required_reason_codes?: string[];
    quarantine_recommended?: boolean;
  };
  revocation_race?: {
    race_lost: boolean;
    required_reason_codes?: string[];
  };
  telemetry_chain?: {
    valid: boolean;
    reason?: string;
  };
};

function includesAll(actual: string[], required: string[]): boolean {
  return required.every((code) => actual.includes(code));
}

export function compareScenarioResult(
  actual: ScenarioRunResult,
  expected: ScenarioExpected,
): { match: boolean; mismatches: string[] } {
  const mismatches: string[] = [];

  if (expected.outcome !== undefined && actual.outcome !== expected.outcome) {
    mismatches.push(`outcome: expected ${expected.outcome}, got ${actual.outcome}`);
  }

  if (expected.semantic_validation) {
    const exp = expected.semantic_validation;
    const act = actual.semantic_validation;
    if (!act) {
      mismatches.push('semantic_validation: missing in actual result');
    } else {
      if (act.accepted !== exp.accepted) {
        mismatches.push(`semantic_validation.accepted: expected ${exp.accepted}, got ${act.accepted}`);
      }
      if (act.engine !== exp.engine) {
        mismatches.push(`semantic_validation.engine: expected ${exp.engine}, got ${act.engine}`);
      }
      if (act.final_semantic_result !== exp.final_semantic_result) {
        mismatches.push(
          `semantic_validation.final_semantic_result: expected ${exp.final_semantic_result}, got ${act.final_semantic_result}`,
        );
      }
      if (act.policy_decision !== exp.policy_decision) {
        mismatches.push(
          `semantic_validation.policy_decision: expected ${exp.policy_decision}, got ${act.policy_decision}`,
        );
      }
      if (exp.reason_codes && JSON.stringify(act.reason_codes) !== JSON.stringify(exp.reason_codes)) {
        mismatches.push('semantic_validation.reason_codes mismatch');
      }
      if (
        exp.required_reason_codes &&
        !includesAll(act.reason_codes, exp.required_reason_codes)
      ) {
        mismatches.push('semantic_validation.required_reason_codes not satisfied');
      }
    }
  }

  if (expected.tool_execution) {
    const act = actual.tool_execution;
    if (!act) {
      mismatches.push('tool_execution: missing in actual result');
    } else {
      if (act.verification_result !== expected.tool_execution.verification_result) {
        mismatches.push('tool_execution.verification_result mismatch');
      }
      if (
        expected.tool_execution.required_reason_codes &&
        !includesAll(act.reason_codes, expected.tool_execution.required_reason_codes)
      ) {
        mismatches.push('tool_execution.required_reason_codes not satisfied');
      }
    }
  }

  if (expected.memory_firewall) {
    const act = actual.memory_firewall;
    if (!act) {
      mismatches.push('memory_firewall: missing in actual result');
    } else {
      if (act.decision !== expected.memory_firewall.decision) {
        mismatches.push('memory_firewall.decision mismatch');
      }
      if (
        expected.memory_firewall.required_reason_codes &&
        !includesAll(act.reason_codes, expected.memory_firewall.required_reason_codes)
      ) {
        mismatches.push('memory_firewall.required_reason_codes not satisfied');
      }
      if (
        expected.memory_firewall.quarantine_recommended !== undefined &&
        act.quarantine_recommended !== expected.memory_firewall.quarantine_recommended
      ) {
        mismatches.push('memory_firewall.quarantine_recommended mismatch');
      }
    }
  }

  if (expected.revocation_race) {
    const act = actual.revocation_race;
    if (!act) {
      mismatches.push('revocation_race: missing in actual result');
    } else {
      if (act.race_lost !== expected.revocation_race.race_lost) {
        mismatches.push('revocation_race.race_lost mismatch');
      }
      if (
        expected.revocation_race.required_reason_codes &&
        !includesAll(act.reason_codes, expected.revocation_race.required_reason_codes)
      ) {
        mismatches.push('revocation_race.required_reason_codes not satisfied');
      }
    }
  }

  if (expected.telemetry_chain) {
    const act = actual.telemetry_chain;
    if (!act) {
      mismatches.push('telemetry_chain: missing in actual result');
    } else {
      if (act.valid !== expected.telemetry_chain.valid) {
        mismatches.push('telemetry_chain.valid mismatch');
      }
      if (expected.telemetry_chain.reason && act.reason !== expected.telemetry_chain.reason) {
        mismatches.push('telemetry_chain.reason mismatch');
      }
    }
  }

  return { match: mismatches.length === 0, mismatches };
}

export function loadReplayEvents(replay: { events: TelemetryEventEnvelope[] }): TelemetryEventEnvelope[] {
  return replay.events;
}
