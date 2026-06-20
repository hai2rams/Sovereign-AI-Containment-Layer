import { createHash } from 'node:crypto';
import { asAsciiSlug, type AsciiSlug } from '../types/brands.js';

let jtiSequence = 0;

/** Control-plane only — model must never supply JTI. */
export function generateJti(session_id: AsciiSlug, transaction_sequence_counter: number): AsciiSlug {
  jtiSequence += 1;
  const material = `jti:v1:${session_id}:${transaction_sequence_counter}:${jtiSequence}`;
  const digest = createHash('sha256').update(material, 'utf8').digest('hex').slice(0, 32);
  return asAsciiSlug(`jti-${digest}`);
}

export function resetJtiSequenceForTests(): void {
  jtiSequence = 0;
}
