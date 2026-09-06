import test from 'node:test';
import assert from 'node:assert/strict';
import * as Y from 'yjs';
import { canEditBoard, resolvePermission } from '../src/services/boardService.js';

test('resolves owner, member, public viewer, and denied permissions', () => {
  const board = {
    ownerId: 'owner',
    isPublic: true,
    members: [{ userId: 'editor', permission: 'edit' }],
  };

  assert.equal(resolvePermission(board, 'owner'), 'owner');
  assert.equal(resolvePermission(board, 'editor'), 'edit');
  assert.equal(resolvePermission(board, 'anonymous'), 'view');
  assert.equal(resolvePermission({ ...board, isPublic: false }, 'anonymous'), null);
});

test('only edit-capable permissions can mutate shared state', () => {
  assert.equal(canEditBoard('owner'), true);
  assert.equal(canEditBoard('admin'), true);
  assert.equal(canEditBoard('edit'), true);
  assert.equal(canEditBoard('view'), false);
  assert.equal(canEditBoard(null), false);
});

test('Yjs state converges across two documents', () => {
  const first = new Y.Doc();
  const second = new Y.Doc();
  const firstShapes = first.getMap('shapes');
  const secondShapes = second.getMap('shapes');

  firstShapes.set('shape-a', { id: 'shape-a', type: 'rectangle', x: 10 });
  Y.applyUpdate(second, Y.encodeStateAsUpdate(first));
  secondShapes.set('shape-b', { id: 'shape-b', type: 'ellipse', x: 20 });
  Y.applyUpdate(first, Y.encodeStateAsUpdate(second));

  assert.deepEqual(firstShapes.get('shape-a'), secondShapes.get('shape-a'));
  assert.deepEqual(firstShapes.get('shape-b'), secondShapes.get('shape-b'));
});
