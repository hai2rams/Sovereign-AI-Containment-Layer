#!/usr/bin/env npx tsx
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  compareScenarioResult,
  loadReplayEvents,
  runScenario,
  SCENARIO_IDS,
  type ScenarioDefinition,
  type ScenarioExpected,
} from '../packages/core/src/scenario-engine/index.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function argValue(prefix: string): string | undefined {
  const direct = process.argv.find((a) => a.startsWith(`${prefix}=`));
  return direct?.split('=').slice(1).join('=');
}

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function expectedPathForScenario(scenarioId: string): string {
  const primary = join(root, 'demo/expected', `${scenarioId}.json`);
  if (existsSync(primary)) {
    return primary;
  }
  const legacy = join(root, 'demo/expected', `${scenarioId}-semantic.json`);
  if (existsSync(legacy)) {
    return legacy;
  }
  throw new Error(`No expected output for scenario: ${scenarioId}`);
}

function runOne(scenarioId: string, compareExpected: boolean): number {
  const scenarioPath = join(root, 'demo/scenarios', `${scenarioId}.json`);
  if (!existsSync(scenarioPath)) {
    console.error(`Scenario not found: ${scenarioPath}`);
    return 1;
  }

  const scenario = loadJson<ScenarioDefinition>(scenarioPath);
  let replay_events;
  if (scenario.replay_ref) {
    const replayPath = join(root, 'demo/replays', scenario.replay_ref);
    if (!existsSync(replayPath)) {
      console.error(`Replay not found: ${replayPath}`);
      return 1;
    }
    replay_events = loadReplayEvents(loadJson(replayPath));
  }

  const result = runScenario(scenario, { replay_events });
  const output = {
    scenario_id: result.scenario_id,
    outcome: result.outcome,
    ...(result.semantic_validation ? { semantic_validation: result.semantic_validation } : {}),
    ...(result.tool_execution ? { tool_execution: result.tool_execution } : {}),
    ...(result.memory_firewall ? { memory_firewall: result.memory_firewall } : {}),
    ...(result.revocation_race ? { revocation_race: result.revocation_race } : {}),
    ...(result.telemetry_chain ? { telemetry_chain: result.telemetry_chain } : {}),
  };

  console.log(JSON.stringify(output, null, 2));

  if (!compareExpected) {
    return 0;
  }

  const expected = loadJson<ScenarioExpected>(expectedPathForScenario(scenarioId));
  const comparison = compareScenarioResult(result, expected);
  if (!comparison.match) {
    console.error(`Expected mismatch for ${scenarioId}:`);
    for (const mismatch of comparison.mismatches) {
      console.error(`  - ${mismatch}`);
    }
    return 1;
  }

  console.error(`[ok] ${scenarioId} matches expected`);
  return 0;
}

const scenarioArg = argValue('--scenario');
const runAll = process.argv.includes('--all');
const compareExpected = process.argv.includes('--compare-expected');

if (runAll) {
  let exitCode = 0;
  for (const scenarioId of SCENARIO_IDS) {
    const code = runOne(scenarioId, compareExpected);
    if (code !== 0) {
      exitCode = code;
    }
  }
  process.exit(exitCode);
}

const scenarioId = scenarioArg ?? 'golden-path';
process.exit(runOne(scenarioId, compareExpected));
