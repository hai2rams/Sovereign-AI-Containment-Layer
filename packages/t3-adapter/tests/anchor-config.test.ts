import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertRealWriteReady,
  AnchorConfigError,
  loadAnchorConfig,
} from '../src/anchor-config.js';

const VALID_ROOT = 'sha256:' + 'a'.repeat(64);

describe('anchor-config', () => {
  it('6. dry-run mode works without secrets', () => {
    const config = loadAnchorConfig({
      T3_ANCHOR_MODE: 'dry_run',
    } as NodeJS.ProcessEnv);
    assert.equal(config.mode, 'dry_run');
    assert.doesNotThrow(() => assertRealWriteReady(config));
  });

  it('7. real-write mode without required environment variables fails closed', () => {
    const config = loadAnchorConfig({
      T3_ANCHOR_MODE: 'real_write',
    } as NodeJS.ProcessEnv);
    assert.throws(() => assertRealWriteReady(config), AnchorConfigError);
  });

  it('real_write with invalid contract id fails closed', () => {
    const config = loadAnchorConfig({
      T3_ANCHOR_MODE: 'real_write',
      T3N_API_KEY: 'test-key',
      T3N_CONTRACT_ID: '0',
    } as NodeJS.ProcessEnv);
    assert.throws(() => assertRealWriteReady(config), /T3N_CONTRACT_ID/);
  });

  it('placeholder sanity root constant', () => {
    assert.match(VALID_ROOT, /^sha256:[a-f0-9]{64}$/);
  });
});
