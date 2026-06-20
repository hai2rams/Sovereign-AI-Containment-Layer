/** M0 placeholder — agent state envelope (M1). */
export type StateEnvelope = {
  version: '0.0-m0';
  payload: Record<string, unknown>;
};

export function createPlaceholderEnvelope(): StateEnvelope {
  return { version: '0.0-m0', payload: {} };
}
