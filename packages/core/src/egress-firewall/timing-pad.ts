import { DEFAULT_TIMING_PAD_INTERVAL_MS } from './types.js';

/** Fixed-interval timing pad — mitigates coarse timing side channels (M8 placeholder). */
export function computeTimingPadMs(
  monotonic_tick: number,
  interval_ms: number = DEFAULT_TIMING_PAD_INTERVAL_MS,
): number {
  const slot = monotonic_tick % interval_ms;
  return interval_ms - slot;
}
