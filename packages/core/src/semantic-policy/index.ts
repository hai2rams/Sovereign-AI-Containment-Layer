/** M0 placeholder — semantic policy evaluation (M2). */
export type PolicyDecision = 'allow' | 'deny' | 'defer';

export function placeholderPolicyDecision(): PolicyDecision {
  return 'defer';
}
