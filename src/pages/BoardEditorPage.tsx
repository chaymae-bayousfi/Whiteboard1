import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stage, Layer, Rect, Ellipse, Line, Arrow, Text, Transformer } from 'react-konva';
import type Konva from 'konva';
import {
  MousePointer,
  Hand,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Pencil,
  Type,
  Eraser,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize2,
  BringToFront,
  SendToBack,
  Copy,
  Trash2,
} from 'lucide-react';
import { BoardLayout } from '@/layouts';
import { Tooltip, ColorPicker } from '@/components/ui';
import { CollabCursors } from '@/components/collaboration';
import { useBoardStore, useCanvasStore, useToolStore, useAuthStore, useCollaborationStore } from '@/stores';
import { boardService, exportService } from '@/services';
import { useCollaboration } from '@/hooks';
import { generateId, cn } from '@/utils';
import { STROKE_COLORS, FILL_COLORS, STROKE_WIDTHS, FONT_SIZES } from '@/constants';
import { CANVAS_CONFIG } from '@/constants/canvas';
import type { CanvasElement, ToolType, Point } from '@/types';

const TOOLS: { id: ToolType; icon: typeof MousePointer; label: string; shortcut: string }[] = [
  { id: 'select', icon: MousePointer, label: 'Select', shortcut: 'V' },
  { id: 'pan', icon: Hand, label: 'Pan', shortcut: 'H' },
  { id: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
  { id: 'ellipse', icon: Circle, label: 'Ellipse', shortcut: 'O' },
  { id: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
  { id: 'arrow', icon: ArrowRight, label: 'Arrow', shortcut: 'A' },
  { id: 'pencil', icon: Pencil, label: 'Pencil', shortcut: 'P' },
  { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
  { id: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
];

const TOOL_CURSORS: Record<ToolType, string> = {
  select: 'default',
  pan: 'grab',
  rectangle: 'crosshair',
  ellipse: 'crosshair',
  line: 'crosshair',
  arrow: 'crosshair',
  pencil: 'crosshair',
  text: 'text',
  eraser: 'crosshair',
};

export function BoardEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { user, accessToken } = useAuthStore();
  const { setConnected, setConnectionStatus, setOnlineUsers, setCursors, cursors } = useCollaborationStore();
  const { currentBoard, setCurrentBoard, updateRecentBoards } = useBoardStore();
  const {
    elements,
    addElement,
    updateElement,
    updateElements,
    deleteElements,
    selectedIds,
    selectElements,
    clearSelection,
    zoom,
    setZoom,
    panX,
    panY,
    setPan,
    undo,
    redo,
    history,
    historyIndex,
    setElements,
    copySelected,
    pasteClipboard,
    duplicateSelected,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
  } = useCanvasStore();

  const {
    activeTool,
    setActiveTool,
    strokeColor,
    setStrokeColor,
    fillColor,
    setFillColor,
    strokeWidth,
    setStrokeWidth,
    fontSize,
    setFontSize,
  } = useToolStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoints, setCurrentPoints] = useState<number[]>([]);
  const [previewRect, setPreviewRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [previewLine, setPreviewLine] = useState<number[] | null>(null);
  const [marquee, setMarquee] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [marqueeStart, setMarqueeStart] = useState<Point | null>(null);
  const [editingText, setEditingText] = useState<{ id: string; text: string; x: number; y: number; fontSize: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef<Map<string, Konva.Node>>(new Map());
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  useEffect(() => {
    loadBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCollabElementsChange = useCallback((els: CanvasElement[]) => {
    setElements(els);
  }, [setElements]);

  // Yjs collaboration
  const collab = useCollaboration({
    boardId: id ?? '',
    token: accessToken ?? '',
    user: { id: user?.id ?? '', name: user?.name ?? 'Anonymous', email: user?.email ?? '' },
    onElementsChange: handleCollabElementsChange,
  });

  useEffect(() => {
    setConnected(collab.isConnected);
    setConnectionStatus(collab.connectionStatus);
    setOnlineUsers(collab.onlineUsers.map((u) => ({
      id: u.userId,
      email: '',
      name: u.name,
      avatarColor: u.color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })));
    setCursors(collab.cursors.map((c) => ({
      userId: c.userId,
      user: {
        id: c.userId,
        email: '',
        name: c.name,
        avatarColor: c.color,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      x: c.x,
      y: c.y,
      color: c.color,
      lastSeen: new Date().toISOString(),
    })));
  }, [collab.isConnected, collab.connectionStatus, collab.onlineUsers, collab.cursors, setConnected, setConnectionStatus, setOnlineUsers, setCursors]);

  const syncToYjs = useCallback((el: CanvasElement) => {
    collab.updateElement(el);
  }, [collab]);

  const removeFromYjs = useCallback((elementId: string) => {
    collab.deleteElement(elementId);
  }, [collab]);

  const reorderYjs = useCallback((els: CanvasElement[]) => {
    collab.reorderElements(els);
  }, [collab]);

  // Attach transformer to selected nodes
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    if (activeTool !== 'select' || selectedIds.length === 0) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const nodes = selectedIds
      .map((selId) => shapeRefs.current.get(selId))
      .filter((n): n is Konva.Node => Boolean(n));
    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
  }, [selectedIds, activeTool, elements]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;

        // Only update if we have valid dimensions
        if (width > 0 && height > 0) {
          setStageSize({ width, height });
        }
      }
    };

    // Call resize after a short delay to ensure layout is ready
    const timer = setTimeout(handleResize, 100);
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (editingText || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      if (isCtrl && (e.key === 'c' || e.key === 'C')) {
        if (selectedIds.length > 0) {
          e.preventDefault();
          copySelected();
        }
        return;
      }

      if (isCtrl && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        pasteClipboard();
        return;
      }

      if (isCtrl && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        duplicateSelected();
        return;
      }

      if (isCtrl && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        selectElements(elements.map((el) => el.id));
        return;
      }

      if (isCtrl && (e.key === ']' || e.key === ']')) {
        e.preventDefault();
        if (e.shiftKey) bringToFront(selectedIds);
        else bringForward(selectedIds);
        reorderYjs(useCanvasStore.getState().elements);
        return;
      }

      if (isCtrl && (e.key === '[' || e.key === '[')) {
        e.preventDefault();
        if (e.shiftKey) sendToBack(selectedIds);
        else sendBackward(selectedIds);
        reorderYjs(useCanvasStore.getState().elements);
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          selectedIds.forEach((selId) => removeFromYjs(selId));
          deleteElements(selectedIds);
          clearSelection();
        }
        return;
      }

      if (e.key === 'Escape') {
        clearSelection();
        setEditingText(null);
        return;
      }

      if (!isCtrl && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v': setActiveTool('select'); break;
          case 'h': setActiveTool('pan'); break;
          case 'r': setActiveTool('rectangle'); break;
          case 'o': setActiveTool('ellipse'); break;
          case 'l': setActiveTool('line'); break;
          case 'a': setActiveTool('arrow'); break;
          case 'p': setActiveTool('pencil'); break;
          case 't': setActiveTool('text'); break;
          case 'e': setActiveTool('eraser'); break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTool, selectedIds, deleteElements, clearSelection, undo, redo, editingText, elements, copySelected, pasteClipboard, duplicateSelected, selectElements, bringToFront, bringForward, sendToBack, sendBackward, removeFromYjs, reorderYjs]);

  const loadBoard = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const board = await boardService.getBoard(id);
      setCurrentBoard(board);
      updateRecentBoards(board);
    } catch {
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getCanvasPoint = (): Point => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const pos = stage.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    return transform.point(pos);
  };

  const handleMouseDown = (e: any) => {
    const clickedOnEmpty = e.target === stageRef.current;
    const point = getCanvasPoint();

    // Manual panning with pan tool or space/middle-click
    if (activeTool === 'pan' || e.evt.button === 1 || (e.evt.button === 0 && e.evt.spaceKey)) {
      setIsPanning(true);
      setPanStart({ x: e.evt.clientX, y: e.evt.clientY, panX, panY });
      return;
    }

    if (activeTool === 'select') {
      if (clickedOnEmpty) {
        setMarqueeStart(point);
        setMarquee({ x: point.x, y: point.y, width: 0, height: 0 });
        if (!e.evt.shiftKey) clearSelection();
      } else {
        const shape = e.target;
        const shapeId = shape.id();
        if (!shapeId) return;

        if (e.evt.shiftKey) {
          if (selectedIds.includes(shapeId)) {
            selectElements(selectedIds.filter((sid) => sid !== shapeId));
          } else {
            selectElements([...selectedIds, shapeId]);
          }
        } else if (!selectedIds.includes(shapeId)) {
          selectElements([shapeId]);
        }
      }
      return;
    }

    if (activeTool === 'eraser') {
      const shape = e.target;
      const shapeId = shape.id();
      if (shapeId) {
        deleteElements([shapeId]);
        removeFromYjs(shapeId);
      }
      return;
    }

    if (activeTool === 'text') {
      const element: CanvasElement = {
        id: generateId(),
        type: 'text',
        x: point.x,
        y: point.y,
        rotation: 0,
        text: '',
        fontSize,
        fontFamily: 'Inter, sans-serif',
        stroke: strokeColor,
        opacity: 1,
        locked: false,
      };
      addElement(element);
      syncToYjs(element);
      selectElements([element.id]);
      setEditingText({ id: element.id, text: '', x: point.x, y: point.y, fontSize });
      return;
    }

    // Drawing tools
    setIsDrawing(true);
    setStartPoint(point);
    if (activeTool === 'pencil') {
      setCurrentPoints([point.x, point.y]);
    } else if (activeTool === 'line' || activeTool === 'arrow') {
      setPreviewLine([point.x, point.y, point.x, point.y]);
    } else {
      setPreviewRect({ x: point.x, y: point.y, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e: any) => {
    const stage = stageRef.current;
    const pos = stage?.getPointerPosition();
    if (pos && zoom > 0) {
      collab.updateCursor((pos.x - panX) / zoom, (pos.y - panY) / zoom);
    }

    // Manual panning
    if (isPanning && panStart) {
      const dx = e.evt.clientX - panStart.x;
      const dy = e.evt.clientY - panStart.y;
      setPan(panStart.panX + dx, panStart.panY + dy);
      return;
    }

    // Marquee selection
    if (marqueeStart && activeTool === 'select') {
      const point = getCanvasPoint();
      setMarquee({
        x: Math.min(marqueeStart.x, point.x),
        y: Math.min(marqueeStart.y, point.y),
        width: Math.abs(point.x - marqueeStart.x),
        height: Math.abs(point.y - marqueeStart.y),
      });
      return;
    }

    if (!isDrawing || !startPoint) return;

    const point = getCanvasPoint();

    if (activeTool === 'pencil') {
      setCurrentPoints((prev) => [...prev, point.x, point.y]);
    } else if (activeTool === 'line' || activeTool === 'arrow') {
      setPreviewLine([startPoint.x, startPoint.y, point.x, point.y]);
    } else {
      setPreviewRect({
        x: Math.min(startPoint.x, point.x),
        y: Math.min(startPoint.y, point.y),
        width: Math.abs(point.x - startPoint.x),
        height: Math.abs(point.y - startPoint.y),
      });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      return;
    }

    if (marqueeStart && activeTool === 'select' && marquee) {
      if (marquee.width > 3 || marquee.height > 3) {
        const hitIds = elements
          .filter((el) => {
            const ex = el.x;
            const ey = el.y;
            const ew = el.width ?? (el.type === 'text' ? 100 : 0);
            const eh = el.height ?? (el.type === 'text' ? (el.fontSize ?? 16) * 1.2 : 0);
            return !(
              ex + ew < marquee.x ||
              ex > marquee.x + marquee.width ||
              ey + eh < marquee.y ||
              ey > marquee.y + marquee.height
            );
          })
          .map((el) => el.id);
        if (hitIds.length > 0) selectElements(hitIds);
      }
      setMarquee(null);
      setMarqueeStart(null);
      return;
    }

    if (!isDrawing || !startPoint) {
      setIsDrawing(false);
      setStartPoint(null);
      setPreviewRect(null);
      setPreviewLine(null);
      setCurrentPoints([]);
      return;
    }

    const endPoint = getCanvasPoint();
    let element: CanvasElement | null = null;

    const minX = Math.min(startPoint.x, endPoint.x);
    const minY = Math.min(startPoint.y, endPoint.y);
    const w = Math.abs(endPoint.x - startPoint.x);
    const h = Math.abs(endPoint.y - startPoint.y);

    if (w < 2 && h < 2 && activeTool !== 'pencil') {
      setIsDrawing(false);
      setStartPoint(null);
      setPreviewRect(null);
      setPreviewLine(null);
      setCurrentPoints([]);
      return;
    }

    switch (activeTool) {
      case 'rectangle':
        element = {
          id: generateId(),
          type: 'rectangle',
          x: minX,
          y: minY,
          width: w,
          height: h,
          rotation: 0,
          stroke: strokeColor,
          fill: fillColor,
          strokeWidth,
          opacity: 1,
          locked: false,
        };
        break;

      case 'ellipse':
        element = {
          id: generateId(),
          type: 'ellipse',
          x: minX,
          y: minY,
          width: w,
          height: h,
          rotation: 0,
          stroke: strokeColor,
          fill: fillColor,
          strokeWidth,
          opacity: 1,
          locked: false,
        };
        break;

      case 'line':
        element = {
          id: generateId(),
          type: 'line',
          x: 0,
          y: 0,
          rotation: 0,
          stroke: strokeColor,
          strokeWidth,
          points: [startPoint.x, startPoint.y, endPoint.x, endPoint.y],
          opacity: 1,
          locked: false,
        };
        break;

      case 'arrow':
        element = {
          id: generateId(),
          type: 'arrow',
          x: 0,
          y: 0,
          rotation: 0,
          stroke: strokeColor,
          strokeWidth,
          points: [startPoint.x, startPoint.y, endPoint.x, endPoint.y],
          opacity: 1,
          locked: false,
        };
        break;

      case 'pencil':
        if (currentPoints.length > 4) {
          const pts = currentPoints;
          let pMinX = Infinity;
          let pMinY = Infinity;
          for (let i = 0; i < pts.length; i += 2) {
            pMinX = Math.min(pMinX, pts[i]);
            pMinY = Math.min(pMinY, pts[i + 1]);
          }
          const normalized: number[] = [];
          for (let i = 0; i < pts.length; i += 2) {
            normalized.push(pts[i] - pMinX, pts[i + 1] - pMinY);
          }
          element = {
            id: generateId(),
            type: 'pencil',
            x: pMinX,
            y: pMinY,
            rotation: 0,
            stroke: strokeColor,
            strokeWidth,
            points: normalized,
            opacity: 1,
            locked: false,
          };
        }
        break;
    }

    if (element) {
      addElement(element);
      syncToYjs(element);
      setActiveTool('select');
      selectElements([element.id]);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setPreviewRect(null);
    setPreviewLine(null);
    setCurrentPoints([]);
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = zoom;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = {
      x: (pointer.x - panX) / oldScale,
      y: (pointer.y - panY) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(
      CANVAS_CONFIG.MIN_ZOOM,
      Math.min(CANVAS_CONFIG.MAX_ZOOM, oldScale + direction * CANVAS_CONFIG.ZOOM_STEP)
    );

    setZoom(newScale);
    setPan(pointer.x - mousePointTo.x * newScale, pointer.y - mousePointTo.y * newScale);
  };

  const handleZoomIn = () => setZoom(Math.min(CANVAS_CONFIG.MAX_ZOOM, zoom * 1.25));
  const handleZoomOut = () => setZoom(Math.max(CANVAS_CONFIG.MIN_ZOOM, zoom / 1.25));
  const handleFitToScreen = () => {
    setZoom(1);
    setPan(stageSize.width / 2 - 400, stageSize.height / 2 - 300);
  };

  // Apply color change to selected elements
  const applyStrokeColor = (color: string) => {
    setStrokeColor(color);
    if (selectedIds.length > 0) {
      updateElements(selectedIds, { stroke: color });
      selectedIds.forEach((selId) => {
        const el = elements.find((e) => e.id === selId);
        if (el) syncToYjs({ ...el, stroke: color });
      });
    }
  };

  const applyFillColor = (color: string) => {
    setFillColor(color);
    if (selectedIds.length > 0) {
      updateElements(selectedIds, { fill: color });
      selectedIds.forEach((selId) => {
        const el = elements.find((e) => e.id === selId);
        if (el) syncToYjs({ ...el, fill: color });
      });
    }
  };

  const applyStrokeWidth = (width: number) => {
    setStrokeWidth(width);
    if (selectedIds.length > 0) {
      updateElements(selectedIds, { strokeWidth: width });
      selectedIds.forEach((selId) => {
        const el = elements.find((e) => e.id === selId);
        if (el) syncToYjs({ ...el, strokeWidth: width });
      });
    }
  };

  const applyFontSize = (size: number) => {
    setFontSize(size);
    if (selectedIds.length > 0) {
      updateElements(selectedIds, { fontSize: size });
      selectedIds.forEach((selId) => {
        const el = elements.find((e) => e.id === selId);
        if (el) syncToYjs({ ...el, fontSize: size });
      });
    }
  };

  // Z-order actions
  const handleBringToFront = () => {
    bringToFront(selectedIds);
    reorderYjs(useCanvasStore.getState().elements);
  };
  const handleSendToBack = () => {
    sendToBack(selectedIds);
    reorderYjs(useCanvasStore.getState().elements);
  };
  const handleBringForward = () => {
    bringForward(selectedIds);
    reorderYjs(useCanvasStore.getState().elements);
  };
  const handleSendBackward = () => {
    sendBackward(selectedIds);
    reorderYjs(useCanvasStore.getState().elements);
  };

  const commitTextEditing = () => {
    if (!editingText) return;
    const el = elements.find((e) => e.id === editingText.id);
    if (el) {
      if (editingText.text.trim() === '') {
        deleteElements([editingText.id]);
        removeFromYjs(editingText.id);
      } else {
        updateElement(editingText.id, { text: editingText.text });
        syncToYjs({ ...el, text: editingText.text });
      }
    }
    setEditingText(null);
  };

  const handleTransformEnd = () => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    const nodes = transformer.nodes();
    for (const node of nodes) {
      const elId = node.id();
      const el = elements.find((e) => e.id === elId);
      if (!el) continue;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);

      const updates: Partial<CanvasElement> = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
      };

      if (el.type === 'rectangle' || el.type === 'ellipse') {
        updates.width = Math.max(5, (el.width ?? 100) * scaleX);
        updates.height = Math.max(5, (el.height ?? 100) * scaleY);
      } else if (el.type === 'line' || el.type === 'arrow') {
        const pts = el.points ?? [];
        if (pts.length >= 4) {
          updates.points = pts.map((p, i) => p * (i % 2 === 0 ? scaleX : scaleY));
        }
      } else if (el.type === 'pencil') {
        const pts = el.points ?? [];
        updates.points = pts.map((p, i) => p * (i % 2 === 0 ? scaleX : scaleY));
      } else if (el.type === 'text') {
        updates.fontSize = Math.max(8, Math.round((el.fontSize ?? 16) * scaleY));
      }

      updateElement(elId, updates);
      syncToYjs({ ...el, ...updates });
    }
  };

  const renderElement = (el: CanvasElement) => {
    const isDraggable = activeTool === 'select' && !el.locked && !editingText;

    const onDragEnd = (e: any) => {
      updateElement(el.id, { x: e.target.x(), y: e.target.y() });
      syncToYjs({ ...el, x: e.target.x(), y: e.target.y() });
    };

    const onElementClick = (e: any) => {
      if (activeTool === 'select') {
        const shapeId = e.target.id();
        if (e.evt.shiftKey) {
          if (selectedIds.includes(shapeId)) {
            selectElements(selectedIds.filter((sid) => sid !== shapeId));
          } else {
            selectElements([...selectedIds, shapeId]);
          }
        } else if (!selectedIds.includes(shapeId)) {
          selectElements([shapeId]);
        }
      } else if (activeTool === 'eraser') {
        deleteElements([el.id]);
        removeFromYjs(el.id);
      }
    };

    const setRef = (node: Konva.Node | null) => {
      if (node) shapeRefs.current.set(el.id, node);
      else shapeRefs.current.delete(el.id);
    };

    const commonProps = {
      key: el.id,
      id: el.id,
      x: el.x,
      y: el.y,
      rotation: el.rotation,
      opacity: el.opacity,
      draggable: isDraggable,
      onClick: onElementClick,
      onTap: onElementClick,
      onDragEnd,
      ref: setRef,
    };

    switch (el.type) {
      case 'rectangle':
        return (
          <Rect
            {...commonProps}
            width={el.width ?? 100}
            height={el.height ?? 100}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth ?? 2}
            fill={el.fill ?? 'transparent'}
            cornerRadius={4}
          />
        );
      case 'ellipse':
        return (
          <Ellipse
            {...commonProps}
            x={(el.x ?? 0) + (el.width ?? 100) / 2}
            y={(el.y ?? 0) + (el.height ?? 100) / 2}
            radiusX={(el.width ?? 100) / 2}
            radiusY={(el.height ?? 100) / 2}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth ?? 2}
            fill={el.fill ?? 'transparent'}
          />
        );
      case 'line':
        return (
          <Line
            {...commonProps}
            points={el.points ?? [0, 0, 100, 0]}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth ?? 2}
            lineCap="round"
            lineJoin="round"
            hitStrokeWidth={Math.max(el.strokeWidth ?? 2, 10)}
          />
        );
      case 'arrow':
        return (
          <Arrow
            {...commonProps}
            points={el.points ?? [0, 0, 100, 0]}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth ?? 2}
            fill={el.stroke ?? '#374151'}
            pointerLength={10}
            pointerWidth={10}
            hitStrokeWidth={Math.max(el.strokeWidth ?? 2, 10)}
          />
        );
      case 'pencil':
        return (
          <Line
            {...commonProps}
            points={el.points ?? []}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth ?? 2}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            hitStrokeWidth={Math.max(el.strokeWidth ?? 2, 10)}
          />
        );
      case 'text':
        // Show text during editing for better visibility
        return (
          <Text
            {...commonProps}
            text={el.text ?? 'Type here...'}
            fontSize={el.fontSize ?? 16}
            fontFamily={el.fontFamily ?? 'Inter'}
            fill={el.stroke ?? '#374151'}
            opacity={(el.text ?? '').length === 0 ? 0.5 : 1}
            onDblClick={() => setEditingText({ id: el.id, text: el.text ?? '', x: el.x, y: el.y, fontSize: el.fontSize ?? 16 })}
            onDblTap={() => setEditingText({ id: el.id, text: el.text ?? '', x: el.x, y: el.y, fontSize: el.fontSize ?? 16 })}
          />
        );
      default:
        return null;
    }
  };

  const leftToolbar = (
    <>
      {TOOLS.map((tool) => (
        <Tooltip key={tool.id} content={`${tool.label} (${tool.shortcut})`} position="right">
          <button
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded-xl transition-all',
              activeTool === tool.id
                ? 'bg-gradient-to-r from-blush-100 to-lavender-100 text-blush-600'
                : 'text-gray-600 hover:bg-gray-100'
            )}
            onClick={() => setActiveTool(tool.id)}
            aria-label={tool.label}
          >
            <tool.icon className="w-5 h-5" />
          </button>
        </Tooltip>
      ))}
      <div className="w-8 h-px bg-gray-200 my-2 mx-auto" />
      <Tooltip content="Undo (Ctrl+Z)" position="right">
        <button
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-xl transition-all',
            canUndo ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
          )}
          onClick={undo}
          disabled={!canUndo}
          aria-label="Undo"
        >
          <Undo className="w-5 h-5" />
        </button>
      </Tooltip>
      <Tooltip content="Redo (Ctrl+Shift+Z)" position="right">
        <button
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-xl transition-all',
            canRedo ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
          )}
          onClick={redo}
          disabled={!canRedo}
          aria-label="Redo"
        >
          <Redo className="w-5 h-5" />
        </button>
      </Tooltip>
    </>
  );

  const rightPanel = (
    <div className="p-4 space-y-6 overflow-y-auto">
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Stroke</h3>
        <ColorPicker
          colors={STROKE_COLORS}
          selectedColor={strokeColor}
          onChange={applyStrokeColor}
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Fill</h3>
        <ColorPicker
          colors={FILL_COLORS}
          selectedColor={fillColor}
          onChange={applyFillColor}
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Stroke Width</h3>
        <div className="flex flex-wrap gap-2">
          {STROKE_WIDTHS.map((w) => (
            <button
              key={w}
              className={cn(
                'px-3 py-1.5 text-xs rounded-lg border transition-all',
                strokeWidth === w
                  ? 'border-blush-400 bg-blush-50 text-blush-600'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              )}
              onClick={() => applyStrokeWidth(w)}
            >
              {w}px
            </button>
          ))}
        </div>
      </div>

      {(activeTool === 'text' || selectedIds.some((sid) => elements.find((e) => e.id === sid)?.type === 'text')) && (
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Font Size</h3>
          <div className="flex flex-wrap gap-2">
            {FONT_SIZES.slice(0, 8).map((s) => (
              <button
                key={s}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-lg border transition-all',
                  fontSize === s
                    ? 'border-blush-400 bg-blush-50 text-blush-600'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                )}
                onClick={() => applyFontSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="pt-2 border-t border-gray-100 space-y-3">
          <p className="text-xs text-gray-500">
            {selectedIds.length} element{selectedIds.length > 1 ? 's' : ''} selected
          </p>

          <div>
            <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Arrange</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={handleBringToFront}
                title="Bring to front (Ctrl+Shift+])"
              >
                <BringToFront className="w-3.5 h-3.5" /> Front
              </button>
              <button
                className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={handleSendToBack}
                title="Send to back (Ctrl+Shift+[)"
              >
                <SendToBack className="w-3.5 h-3.5" /> Back
              </button>
              <button
                className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={handleBringForward}
                title="Bring forward (Ctrl+])"
              >
                Forward
              </button>
              <button
                className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={handleSendBackward}
                title="Send backward (Ctrl+[)"
              >
                Backward
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <button
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => duplicateSelected()}
            >
              <Copy className="w-4 h-4" /> Duplicate
            </button>
            <button
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              onClick={() => {
                selectedIds.forEach((selId) => removeFromYjs(selId));
                deleteElements(selectedIds);
                clearSelection();
              }}
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const bottomBar = (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 px-3 py-2 z-10">
      <button
        onClick={handleZoomOut}
        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Zoom out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
        {Math.round(zoom * 100)}%
      </span>
      <button
        onClick={handleZoomIn}
        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Zoom in"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-200" />
      <Tooltip content="Fit to screen" position="top">
        <button
          onClick={handleFitToScreen}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Fit to screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </Tooltip>
    </div>
  );

  if (isLoading) {
    return (
      <BoardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blush-500" />
        </div>
      </BoardLayout>
    );
  }

  const textEditorScreenPos = editingText
    ? {
        left: editingText.x * zoom + panX,
        top: editingText.y * zoom + panY,
      }
    : null;

  return (
    <BoardLayout
      leftToolbar={leftToolbar}
      rightPanel={rightPanel}
      bottomBar={bottomBar}
      canUndo={canUndo}
      canRedo={canRedo}
      onUndo={undo}
      onRedo={redo}
      onExportPNG={() => exportService.exportToPNG(elements, `${currentBoard?.title ?? 'board'}.png`)}
      onExportJSON={() => exportService.exportToJSON(elements, `${currentBoard?.title ?? 'board'}.json`)}
      onImportJSON={(imported) => {
        imported.forEach((el) => { addElement(el); syncToYjs(el); });
      }}
    >
      <div ref={containerRef} className="w-full h-full bg-gray-50 relative overflow-hidden">
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            collab.clearCursor();
            handleMouseUp();
          }}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: isPanning ? 'grabbing' : TOOL_CURSORS[activeTool] }}
        >
          <Layer x={panX} y={panY} scaleX={zoom} scaleY={zoom}>
            <Rect x={-10000} y={-10000} width={20000} height={20000} fill="#f9fafb" listening={false} />
            {elements.map(renderElement)}

            {isDrawing && previewRect && activeTool === 'rectangle' && (
              <Rect
                x={previewRect.x}
                y={previewRect.y}
                width={previewRect.width}
                height={previewRect.height}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill={fillColor}
                cornerRadius={4}
                listening={false}
                opacity={0.8}
              />
            )}
            {isDrawing && previewRect && activeTool === 'ellipse' && (
              <Ellipse
                x={previewRect.x + previewRect.width / 2}
                y={previewRect.y + previewRect.height / 2}
                radiusX={previewRect.width / 2}
                radiusY={previewRect.height / 2}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill={fillColor}
                listening={false}
                opacity={0.8}
              />
            )}
            {isDrawing && previewLine && activeTool === 'line' && (
              <Line
                points={previewLine}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                lineCap="round"
                lineJoin="round"
                listening={false}
                opacity={0.8}
              />
            )}
            {isDrawing && previewLine && activeTool === 'arrow' && (
              <Arrow
                points={previewLine}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill={strokeColor}
                pointerLength={10}
                pointerWidth={10}
                listening={false}
                opacity={0.8}
              />
            )}
            {isDrawing && activeTool === 'pencil' && currentPoints.length > 0 && (
              <Line
                points={currentPoints}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                listening={false}
              />
            )}

            {marquee && (marquee.width > 0 || marquee.height > 0) && (
              <Rect
                x={marquee.x}
                y={marquee.y}
                width={marquee.width}
                height={marquee.height}
                fill="rgba(244, 114, 182, 0.08)"
                stroke="#f472b6"
                strokeWidth={1 / zoom}
                dash={[4 / zoom, 4 / zoom]}
                listening={false}
              />
            )}

            <Transformer
              ref={transformerRef}
              rotateEnabled
              rotateAnchorOffset={24}
              borderStroke="#f472b6"
              borderStrokeWidth={1.5}
              anchorFill="#ffffff"
              anchorStroke="#f472b6"
              anchorStrokeWidth={2}
              anchorSize={8}
              anchorCornerRadius={4}
              onTransformEnd={handleTransformEnd}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) return oldBox;
                return newBox;
              }}
            />
          </Layer>
        </Stage>
        <div className="absolute inset-0 pointer-events-none z-20">
          <CollabCursors
            cursors={cursors.filter((cursor) => cursor.userId !== user?.id)}
            zoom={zoom}
            panX={panX}
            panY={panY}
            containerWidth={stageSize.width}
            containerHeight={stageSize.height}
          />
        </div>

        {editingText && textEditorScreenPos && (
          <textarea
            autoFocus
            value={editingText.text}
            onChange={(e) => {
              const newText = e.target.value;
              setEditingText({ ...editingText, text: newText });
              // Update in real-time
              updateElement(editingText.id, { text: newText });
            }}
            onBlur={commitTextEditing}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                commitTextEditing();
              }
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                commitTextEditing();
              }
              e.stopPropagation();
            }}
            placeholder="Type text..."
            style={{
              position: 'absolute',
              left: textEditorScreenPos.left,
              top: textEditorScreenPos.top,
              fontSize: editingText.fontSize * zoom,
              fontFamily: 'Inter, sans-serif',
              color: strokeColor,
              border: '2px solid #f472b6',
              borderRadius: 4,
              padding: 4,
              margin: 0,
              background: 'rgba(255, 255, 255, 0.98)',
              outline: 'none',
              resize: 'none',
              overflow: 'hidden',
              whiteSpace: 'pre',
              minWidth: 100,
              minHeight: editingText.fontSize * zoom * 1.4,
              lineHeight: 1.2,
              boxShadow: '0 4px 12px rgba(244, 114, 182, 0.3)',
              zIndex: 100,
            }}
            rows={1}
            spellCheck={false}
          />
        )}
      </div>
    </BoardLayout>
  );
}
