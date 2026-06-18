import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import { createApp } from './app.js';
import { DEFAULT_API_PORT, resolveApiPort } from './port.js';

test('resolveApiPort defaults to 4100 when PORT is missing', () => {
  assert.equal(resolveApiPort(undefined), DEFAULT_API_PORT);
  assert.equal(DEFAULT_API_PORT, 4100);
});

test('resolveApiPort uses PORT when set', () => {
  assert.equal(resolveApiPort('5100'), 5100);
});

test('resolveApiPort rejects invalid PORT values', () => {
  assert.equal(resolveApiPort(''), DEFAULT_API_PORT);
  assert.equal(resolveApiPort('0'), DEFAULT_API_PORT);
  assert.equal(resolveApiPort('not-a-port'), DEFAULT_API_PORT);
});

let server: Server;
let baseUrl: string;

before(() => {
  const app = createApp();
  server = app.listen(0);
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Expected server to bind to a TCP port');
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(() => {
  server.close();
});

test('GET /health returns ok', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  const body = (await response.json()) as { status: string; service: string };
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'sovereign-ai-containment-api');
});

test('GET /t3/status returns configuration shape', async () => {
  const response = await fetch(`${baseUrl}/t3/status`);
  assert.equal(response.status, 200);
  const body = (await response.json()) as {
    configured: boolean;
    session: { status: string };
  };
  assert.equal(typeof body.configured, 'boolean');
  assert.equal(typeof body.session.status, 'string');
});

test('GET /t3/contract returns contract shape', async () => {
  const response = await fetch(`${baseUrl}/t3/contract`);
  assert.equal(response.status, 200);
  const body = (await response.json()) as {
    contractTail: string;
    contractVersion: string;
    message: string;
  };
  assert.equal(typeof body.contractTail, 'string');
  assert.equal(typeof body.contractVersion, 'string');
  assert.equal(typeof body.message, 'string');
});
