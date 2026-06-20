import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import {
  compareScenarioResult,
  loadReplayEvents,
  runScenario,
  SCENARIO_IDS,
  type ScenarioDefinition,
  type ScenarioExpected,
} from '../../packages/core/src/scenario-engine/index.js';

const root = join(import.meta.dirname, '../..');
const scenariosDir = join(root, 'demo/scenarios');
const expectedDir = join(root, 'demo/expected');
const replaysDir = join(root, 'demo/replays');

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

describe('integration M10 scenario harness', () => {
  it('all architecture scenarios match demo/expected', () => {
    for (const scenarioId of SCENARIO_IDS) {
      const scenario = loadJson<ScenarioDefinition>(join(scenariosDir, `${scenarioId}.json`));
      const expected = loadJson<ScenarioExpected>(join(expectedDir, `${scenarioId}.json`));

      let replay_events;
      if (scenario.replay_ref) {
        replay_events = loadReplayEvents(loadJson(join(replaysDir, scenario.replay_ref)));
      }

      const result = runScenario(scenario, { replay_events });
      const comparison = compareScenarioResult(result, expected);
      assert.equal(
        comparison.match,
        true,
        `${scenarioId}: ${comparison.mismatches.join('; ')}`,
      );
    }
  });
});
