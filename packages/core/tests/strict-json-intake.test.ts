import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  StrictJsonIntake,
  StrictJsonIntakeError,
} from '../src/strict-json/strict-json-intake.js';

describe('StrictJsonIntake', () => {
  it('17. duplicate JSON key rejects', () => {
    assert.throws(
      () => StrictJsonIntake.parseRejectingDuplicateKeys('{"action":"a","action":"b"}'),
      (error: unknown) =>
        error instanceof StrictJsonIntakeError &&
        (error as StrictJsonIntakeError).message.includes('Duplicate object key'),
    );
  });

  it('18. top-level array rejects for ActionProposal intake', () => {
    assert.throws(
      () => StrictJsonIntake.parseActionProposalJson('[{"action":"pay"}]'),
      (error: unknown) =>
        error instanceof StrictJsonIntakeError &&
        (error as StrictJsonIntakeError).message.includes('Top-level JSON array'),
    );
  });

  it('rejects trailing commas', () => {
    assert.throws(() => StrictJsonIntake.parseRejectingDuplicateKeys('{"a":1,}'));
  });

  it('rejects comments', () => {
    assert.throws(() => StrictJsonIntake.parseRejectingDuplicateKeys('{"a":1}//comment'));
  });

  it('rejects NaN token', () => {
    assert.throws(() => StrictJsonIntake.parseRejectingDuplicateKeys('NaN'));
  });

  it('rejects oversized body', () => {
    assert.throws(() =>
      StrictJsonIntake.parseRejectingDuplicateKeys('[]', { maxBodyBytes: 1 }),
    );
  });
});
