import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { collectForbiddenFieldPaths } from '../src/validators/forbidden-fields.js';

describe('forbidden fields', () => {
  it('15. forbidden top-level field rejects', () => {
    const errors = collectForbiddenFieldPaths({ risk_mode: 'elevated', action: 'pay' });
    assert.ok(errors.some((e) => e.includes('risk_mode')));
  });

  it('16. forbidden nested field rejects', () => {
    const errors = collectForbiddenFieldPaths({
      meta: { nested: { policy_decision: 'allow' } },
    });
    assert.ok(errors.some((e) => e.includes('policy_decision')));
  });
});
