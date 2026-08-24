import { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import type { CanvasElement } from '@/types';

export interface CollabUser {
  userId: string;
  name: string;
  color: string;
}

export interface CursorPosition {
  userId: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

interface UseCollaborationOptions {
  boardId: string;
  token: string;
  user: { id: string; name: string; email: string };
  onElementsChange?: (elements: CanvasElement[]) => void;
}

const WS_URL = import.meta.env.VITE_YJS_WS_URL || 'ws://localhost:4001/yjs';

export function useCollaboration({
  boardId,
  token,
  user,
  onElementsChange,
}: UseCollaborationOptions) {
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const ymapRef = useRef<Y.Map<unknown> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [onlineUsers, setOnlineUsers] = useState<CollabUser[]>([]);
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const cursorColorRef = useRef<string>(
    ['#f472b6', '#c084fc', '#fb7185', '#fbbf24', '#34d399', '#60a5fa'][
      Math.floor(Math.random() * 6)
    ],
  );

  useEffect(() => {
    if (!boardId || !token || !user.id) {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setOnlineUsers([]);
      setCursors([]);
      return;
    }

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    const ymap = ydoc.getMap('shapes');
    ymapRef.current = ymap;

    const provider = new WebsocketProvider(WS_URL, `board-${boardId}`, ydoc, {
      params: {
        board: boardId,
        token,
      },
    });
    providerRef.current = provider;
    setConnectionStatus('connecting');

    provider.on('status', (event: { status: string }) => {
      const connected = event.status === 'connected';
      setIsConnected(connected);
      setConnectionStatus(connected ? 'connected' : 'disconnected');
      if (connected) {
        provider.awareness.setLocalStateField('user', {
          userId: user.id,
          name: user.name,
          color: cursorColorRef.current,
        });
      }
    });

    // Sync shapes from Yjs to React
    const syncElements = () => {
      const elements: CanvasElement[] = [];
      ymap.forEach((value) => {
        elements.push(value as CanvasElement);
      });
      onElementsChange?.(elements);
    };

    ymap.observe(syncElements);

    // Awareness for online users and cursors
    const awareness = provider.awareness;

    const updateLocalAwareness = () => {
      awareness.setLocalStateField('user', {
        userId: user.id,
        name: user.name,
        color: cursorColorRef.current,
      });
    };
    updateLocalAwareness();

    const onAwarenessChange = () => {
      const states = awareness.getStates();
      const users: CollabUser[] = [];
      const cursorsList: CursorPosition[] = [];

      states.forEach((state, clientId) => {
        if (state.user) {
          users.push({
            userId: state.user.userId,
            name: state.user.name,
            color: state.user.color,
          });
        }
        if (state.cursor) {
          cursorsList.push({
            userId: state.user?.userId ?? String(clientId),
            name: state.user?.name ?? 'Anonymous',
            color: state.user?.color ?? '#f472b6',
            x: state.cursor.x,
            y: state.cursor.y,
          });
        }
      });

      setOnlineUsers(users);
      setCursors(cursorsList);
    };

    awareness.on('change', onAwarenessChange);
    onAwarenessChange();

    return () => {
      ymap.unobserve(syncElements);
      awareness.off('change', onAwarenessChange);
      awareness.setLocalState(null);
      provider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      providerRef.current = null;
      ymapRef.current = null;
      setOnlineUsers([]);
      setCursors([]);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [boardId, token, user.id, user.name, onElementsChange]);

  // Update elements in Yjs
  const updateElement = useCallback((element: CanvasElement) => {
    const ymap = ymapRef.current;
    if (!ymap) return;
    ymap.set(element.id, element);
  }, []);

  // Delete element from Yjs
  const deleteElement = useCallback((elementId: string) => {
    const ymap = ymapRef.current;
    if (!ymap) return;
    ymap.delete(elementId);
  }, []);

  // Bulk set elements (for imports)
  const setElements = useCallback((elements: CanvasElement[]) => {
    const ydoc = ydocRef.current;
    const ymap = ymapRef.current;
    if (!ydoc || !ymap) return;
    ydoc.transact(() => {
      ymap.clear();
      for (const el of elements) {
        ymap.set(el.id, el);
      }
    });
  }, []);

  // Clear all elements
  const clearAll = useCallback(() => {
    const ymap = ymapRef.current;
    if (!ymap) return;
    ymap.clear();
  }, []);

  // Reorder all elements (z-order sync)
  const reorderElements = useCallback((elements: CanvasElement[]) => {
    const ydoc = ydocRef.current;
    const ymap = ymapRef.current;
    if (!ydoc || !ymap) return;
    ydoc.transact(() => {
      ymap.clear();
      for (const el of elements) {
        ymap.set(el.id, el);
      }
    });
  }, []);

  // Update cursor position via awareness
  const updateCursor = useCallback((x: number, y: number) => {
    const provider = providerRef.current;
    if (!provider) return;
    provider.awareness.setLocalStateField('cursor', { x, y });
  }, []);

  // Clear cursor on mouse leave
  const clearCursor = useCallback(() => {
    const provider = providerRef.current;
    if (!provider) return;
    provider.awareness.setLocalStateField('cursor', null);
  }, []);

  return {
    isConnected,
    connectionStatus,
    onlineUsers,
    cursors,
    updateElement,
    deleteElement,
    setElements,
    reorderElements,
    clearAll,
    updateCursor,
    clearCursor,
    ydoc: ydocRef,
    ymap: ymapRef,
    provider: providerRef,
  };
}
