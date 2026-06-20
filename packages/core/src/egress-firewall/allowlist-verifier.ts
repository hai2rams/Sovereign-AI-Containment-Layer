import type { AsciiSlug } from '../types/brands.js';

export function isDestinationAllowlisted(
  egress_destination: AsciiSlug,
  certified_destinations: readonly string[],
): boolean {
  return certified_destinations.includes(egress_destination);
}
