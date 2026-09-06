import test from 'node:test';
import assert from 'node:assert/strict';
import * as Y from 'yjs';
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate, removeAwarenessStates } from 'y-protocols/awareness';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../src/utils/auth.js';

test('JWT verification enforces access and refresh token types', async () => {
  const payload = { sub: 'user-1', email: 'user@example.com', name: 'User' };
  const access = await signAccessToken(payload);
  const refresh = await signRefreshToken(payload);

  assert.equal((await verifyAccessToken(access))?.type, 'access');
  assert.equal(await verifyRefreshToken(access), null);
  assert.equal((await verifyRefreshToken(refresh))?.type, 'refresh');
  assert.equal(await verifyAccessToken(refresh), null);
});

test('concurrent Yjs updates converge after exchanging incremental updates', () => {
  const first = new Y.Doc();
  const second = new Y.Doc();
  const firstUpdates: Uint8Array[] = [];
  const secondUpdates: Uint8Array[] = [];
  first.on('update', (update: Uint8Array) => firstUpdates.push(update));
  second.on('update', (update: Uint8Array) => secondUpdates.push(update));

  first.getMap('shapes').set('a', { id: 'a', type: 'rectangle', x: 1 });
  second.getMap('shapes').set('b', { id: 'b', type: 'ellipse', x: 2 });
  for (const update of firstUpdates) Y.applyUpdate(second, update);
  for (const update of secondUpdates) Y.applyUpdate(first, update);

  assert.deepEqual(
    Object.fromEntries(first.getMap('shapes').entries()),
    Object.fromEntries(second.getMap('shapes').entries()),
  );
});

test('local Yjs edits survive a disconnected provider boundary', () => {
  const disconnected = new Y.Doc();
  disconnected.getMap('shapes').set('offline-shape', { id: 'offline-shape', type: 'arrow' });
  const pendingUpdate = Y.encodeStateAsUpdate(disconnected);

  const reconnected = new Y.Doc();
  Y.applyUpdate(reconnected, pendingUpdate);
  assert.deepEqual(reconnected.getMap('shapes').get('offline-shape'), {
    id: 'offline-shape',
    type: 'arrow',
  });
});

test('Awareness state is exchanged and removed when a client disconnects', () => {
  const first = new Awareness(new Y.Doc());
  const second = new Awareness(new Y.Doc());
  first.setLocalState({ user: { userId: 'user-1', name: 'Alice', color: '#fff' } });

  applyAwarenessUpdate(second, encodeAwarenessUpdate(first, [first.clientID]), 'test');
  assert.equal(second.getStates().get(first.clientID)?.user.name, 'Alice');

  removeAwarenessStates(second, [first.clientID], 'test');
  assert.equal(second.getStates().has(first.clientID), false);
});
