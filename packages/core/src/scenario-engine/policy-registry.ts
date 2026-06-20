import type { PaymentPolicyContext } from '../semantic-policy/types.js';

export const DEFAULT_PAYMENT_POLICY_REF = 'default-payment-policy-v1' as const;

export const PAYMENT_POLICY_REGISTRY: Record<string, PaymentPolicyContext> = {
  [DEFAULT_PAYMENT_POLICY_REF]: {
    approved_destinations: ['approved-vendor-001', 'treasury-ops-account', 'approved_vendor_001'],
    max_amount_minor_units: 5_000_000,
    approved_invoice_references: {
      'invoice-123': {
        destination: 'approved-vendor-001',
        max_amount_minor_units: 500_000,
        currency: 'USD',
      },
      invoice_2026_001: {
        destination: 'approved_vendor_001',
        max_amount_minor_units: 10_000,
        currency: 'USD',
      },
    },
    allowed_user_roles_for_payment: ['finance-operator', 'treasury-admin'],
    require_attestation: true,
  },
};

export function resolvePaymentPolicy(policy_ref?: string): PaymentPolicyContext {
  const key = policy_ref ?? DEFAULT_PAYMENT_POLICY_REF;
  const policy = PAYMENT_POLICY_REGISTRY[key];
  if (!policy) {
    throw new Error(`Unknown policy_ref: ${key}`);
  }
  return policy;
}
