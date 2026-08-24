import { WebSocketServer, WebSocket } from 'ws';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { config } from '@/config/env';
import { logger } from '@/config/logger';
import { verifyAccessToken } from '@/utils/auth';
import { prisma } from '@/config/prisma';
import { pubRedis, subRedis, CHANNELS } from '@/services/redis';
import { getBoardById, upsertShape, deleteShape } from '@/services/boardService';
import { uploadSnapshot } from '@/services/minio';

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;
const wsReadyStateClosing = 2;
const wsReadyStateClosed = 3;

const messageSync = 0;
const messageAwareness = 1;
const messageQueryAwareness = 3;

interface ClientInfo {
  userId: string;
  name: string;
  email: string;
  color: string;
}

class BoardDoc {
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  connections = new Map<WebSocket, ClientInfo>();
  connectionClientIds = new Map<WebSocket, Set<number>>();
  persistTimer: NodeJS.Timeout | null = null;

  constructor(public boardId: string) {
    this.doc = new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.doc);

    this.doc.on('update', (update: Uint8Array, origin: unknown) => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.writeUpdate(encoder, update);
      const message = encoding.toUint8Array(encoder);
      const originConn = origin instanceof WebSocket ? origin : null;
      this.broadcast(message, originConn);
      this.schedulePersistence();
    });

    this.awareness.on('update', ({ added, updated, removed }, origin) => {
      const changedClients = [...added, ...updated, ...removed];
      if (changedClients.length === 0) return;

      const originConn = origin instanceof WebSocket ? origin : null;
      if (originConn) {
        const clientIds = this.connectionClientIds.get(originConn) ?? new Set<number>();
        for (const clientId of added) clientIds.add(clientId);
        for (const clientId of updated) clientIds.add(clientId);
        for (const clientId of removed) clientIds.delete(clientId);
        this.connectionClientIds.set(originConn, clientIds);
      }

      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients),
      );
      this.broadcast(encoding.toUint8Array(encoder), originConn);
    });
  }

  async loadFromDatabase() {
    try {
      const shapes = await prisma.shape.findMany({ where: { boardId: this.boardId } });
      if (shapes.length === 0) return;
      const ymap = this.doc.getMap('shapes');
      this.doc.transact(() => {
        for (const shape of shapes) {
          ymap.set(shape.elementId, { id: shape.elementId, type: shape.type, ...(shape.data as object) });
        }
      });
      logger.info({ boardId: this.boardId, count: shapes.length }, 'Loaded shapes from DB');
    } catch (err) {
      logger.error({ err, boardId: this.boardId }, 'Failed to load shapes');
    }
  }

  schedulePersistence() {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => this.persist(), 5000);
  }

  async persist() {
    try {
      const ymap = this.doc.getMap('shapes');
      const entries = Array.from(ymap.entries()) as [string, any][];

      for (const [elementId, shape] of entries) {
        const { id, type, ...rest } = shape;
        await upsertShape(this.boardId, elementId, type, rest);
      }

      const currentIds = new Set(entries.map(([id]) => id));
      const dbShapes = await prisma.shape.findMany({ where: { boardId: this.boardId }, select: { elementId: true } });
      for (const dbShape of dbShapes) {
        if (!currentIds.has(dbShape.elementId)) {
          await deleteShape(this.boardId, dbShape.elementId);
        }
      }
      logger.debug({ boardId: this.boardId, count: entries.length }, 'Persisted to DB');
    } catch (err) {
      logger.error({ err, boardId: this.boardId }, 'Persist failed');
    }
  }

  cleanup() {
    if (this.persistTimer) clearTimeout(this.persistTimer);
  }

  broadcast(message: Uint8Array, origin: WebSocket | null = null) {
    for (const [conn] of this.connections) {
      if (origin && conn === origin) continue;
      if (conn.readyState === wsReadyStateOpen) {
        send(conn, message);
      }
    }
  }
}

const docs = new Map<string, BoardDoc>();

async function getOrCreateDoc(boardId: string): Promise<BoardDoc> {
  let bdoc = docs.get(boardId);
  if (!bdoc) {
    bdoc = new BoardDoc(boardId);
    docs.set(boardId, bdoc);
    await bdoc.loadFromDatabase();
  }
  return bdoc;
}

function messageListener(conn: WebSocket, bdoc: BoardDoc, message: Uint8Array) {
  if (message.length === 0) return;

  const encoder = encoding.createEncoder();
  const decoder = decoding.createDecoder(message);
  const messageType = decoding.readVarUint(decoder);

  switch (messageType) {
    case messageSync:
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.readSyncMessage(decoder, encoder, bdoc.doc, conn);
      if (encoding.length(encoder) > 1) {
        send(conn, encoding.toUint8Array(encoder));
      }
      break;
    case messageAwareness: {
      awarenessProtocol.applyAwarenessUpdate(bdoc.awareness, decoding.readVarUint8Array(decoder), conn);
      break;
    }
    case messageQueryAwareness:
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(bdoc.awareness, Array.from(bdoc.awareness.getStates().keys())));
      send(conn, encoding.toUint8Array(encoder));
      break;
    default:
      // JSON cursor/presence message
      try {
        const text = Buffer.from(message).toString();
        if (text.startsWith('{')) {
          const json = JSON.parse(text);
          handleJsonMessage(conn, bdoc, json);
        }
      } catch {
        // ignore
      }
  }
}

function handleJsonMessage(conn: WebSocket, bdoc: BoardDoc, json: any) {
  const client = bdoc.connections.get(conn);
  if (!client) return;

  if (json.type === 'cursor') {
    pubRedis.publish(
      CHANNELS.cursors(bdoc.boardId),
      JSON.stringify({ ...json, userId: client.userId, name: client.name, color: client.color }),
    );
  } else if (json.type === 'presence') {
    pubRedis.publish(
      CHANNELS.presence(bdoc.boardId),
      JSON.stringify({ ...json, userId: client.userId, name: client.name, color: client.color }),
    );
  }
}

function send(conn: WebSocket, message: Uint8Array) {
  if (conn.readyState === wsReadyStateOpen) {
    conn.send(message);
  }
}

function setupConnection(ws: WebSocket, bdoc: BoardDoc, clientInfo: ClientInfo) {
  bdoc.connections.set(ws, clientInfo);
  bdoc.connectionClientIds.set(ws, new Set<number>());

  // Send sync step 1
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep1(encoder, bdoc.doc);
  send(ws, encoding.toUint8Array(encoder));

  // Send current awareness state
  const awarenessStates = Array.from(bdoc.awareness.getStates().keys());
  if (awarenessStates.length > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, messageAwareness);
    encoding.writeVarUint8Array(awarenessEncoder, awarenessProtocol.encodeAwarenessUpdate(bdoc.awareness, awarenessStates));
    send(ws, encoding.toUint8Array(awarenessEncoder));
  }
}

export function startYjsServer(): WebSocketServer {
  const wss = new WebSocketServer({ port: config.yjs.wsPort });

  wss.on('connection', async (ws: WebSocket, req: any) => {
    const url = new URL(req.url ?? '', `http://localhost:${config.yjs.wsPort}`);
    const pathname = url.pathname.replace(/\/+$/, '');
    if (pathname !== '/yjs' && !pathname.startsWith('/yjs/')) {
      ws.close(4000, 'Invalid WebSocket path');
      return;
    }

    const roomBoardId = pathname.startsWith('/yjs/')
      ? decodeURIComponent(pathname.slice('/yjs/'.length)).replace(/^board-/, '')
      : null;
    const boardId = url.searchParams.get('board');
    const token = url.searchParams.get('token');

    if ((!boardId && !roomBoardId) || !token) {
      ws.close(4001, 'Missing board or token');
      return;
    }

    const resolvedBoardId = boardId ?? roomBoardId;
    if (!resolvedBoardId) {
      ws.close(4001, 'Missing board');
      return;
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      ws.close(4003, 'Invalid token');
      return;
    }

    const board = await getBoardById(resolvedBoardId, payload.sub);
    if (!board) {
      ws.close(4004, 'Board not found or access denied');
      return;
    }

    const bdoc = await getOrCreateDoc(resolvedBoardId);
    const clientInfo: ClientInfo = {
      userId: payload.sub,
      name: payload.name,
      email: payload.email,
      color: ['#f472b6', '#c084fc', '#fb7185', '#fbbf24', '#34d399', '#60a5fa'][Math.floor(Math.random() * 6)],
    };

    setupConnection(ws, bdoc, clientInfo);

    // Redis pub/sub for cross-process cursor/presence
    const cursorChannel = CHANNELS.cursors(resolvedBoardId);
    const presenceChannel = CHANNELS.presence(resolvedBoardId);
    subRedis.subscribe(cursorChannel, presenceChannel);

    const redisHandler = (channel: string, message: string) => {
      if ((channel === cursorChannel || channel === presenceChannel) && ws.readyState === wsReadyStateOpen) {
        ws.send(message);
      }
    };
    subRedis.on('message', redisHandler);

    logger.info({ boardId: resolvedBoardId, userId: payload.sub, email: payload.email }, 'Yjs client connected');

    ws.on('message', (data: Buffer) => {
      messageListener(ws, bdoc, new Uint8Array(data));
    });

    ws.on('close', () => {
      bdoc.connections.delete(ws);
      const controlledIds = bdoc.connectionClientIds.get(ws);
      bdoc.connectionClientIds.delete(ws);
      subRedis.off('message', redisHandler);

      // Remove awareness state for this client
      if (controlledIds && controlledIds.size > 0) {
        awarenessProtocol.removeAwarenessStates(bdoc.awareness, Array.from(controlledIds), ws);
      }

      logger.info({ boardId: resolvedBoardId, userId: payload.sub }, 'Yjs client disconnected');

      if (bdoc.connections.size === 0) {
        bdoc.persist().then(() => {
          bdoc.cleanup();
          docs.delete(resolvedBoardId);
        });
      }
    });

    ws.on('error', (err) => {
      logger.error({ err, boardId: resolvedBoardId }, 'WebSocket error');
    });
  });

  logger.info({ port: config.yjs.wsPort }, 'Yjs WebSocket server started');
  return wss;
}
