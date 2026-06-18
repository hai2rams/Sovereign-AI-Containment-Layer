import { createHmac, randomBytes } from 'node:crypto';
import type { ActionTokenClaims } from './types.js';

export function getDevSigningKey(): string {
  return process.env.ACTION_TOKEN_SIGNING_KEY?.trim() || 'local-dev-action-token-signing-key';
}

export function encodeToken(claims: ActionTokenClaims, signingKey: string): string {
  const payload = Buffer.from(JSON.stringify(claims), 'utf8').toString('base64url');
  const signature = createHmac('sha256', signingKey).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function decodeToken(token: string, signingKey: string): ActionTokenClaims | null {
  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [payload, signature] = parts;
  const expected = createHmac('sha256', signingKey).update(payload).digest('base64url');
  if (signature !== expected) {
    return null;
  }

  try {
    const json = Buffer.from(payload, 'base64url').toString('utf8');
    return JSON.parse(json) as ActionTokenClaims;
  } catch {
    return null;
  }
}

export function newTokenId(): string {
  return `tok_${randomBytes(12).toString('hex')}`;
}

export function tokenContainsSecrets(claims: ActionTokenClaims): boolean {
  const serialized = JSON.stringify(claims);
  return /(api[_-]?key|secret|password|0x[a-fA-F0-9]{32,}|sk-[A-Za-z0-9]{10,})/i.test(
    serialized,
  );
}
