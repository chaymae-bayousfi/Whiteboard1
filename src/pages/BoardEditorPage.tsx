import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stage, Layer, Rect, Ellipse, Line, Arrow, Text } from 'react-konva';
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
} from 'lucide-react';
import { BoardLayout } from '@/layouts';
import { Tooltip, ColorPicker } from '@/components/ui';
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

export function BoardEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { user, accessToken } = useAuthStore();
  const { setConnected, setConnectionStatus, setOnlineUsers, setCursors } = useCollaborationStore();
  const { currentBoard, setCurrentBoard, updateRecentBoards } = useBoardStore();
  const {
    elements,
    addElement,
    updateElement,
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
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  useEffect(() => {
    loadBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Yjs collaboration
  const collab = useCollaboration({
    boardId: id ?? '',
    token: accessToken ?? '',
    user: { id: user?.id ?? '', name: user?.name ?? 'Anonymous', email: user?.email ?? '' },
    onElementsChange: (els) => {
      setElements(els);
    },
  });

  useEffect(() => {
    setConnected(collab.isConnected);
    setConnectionStatus(collab.isConnected ? 'connected' : 'connecting');
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
  }, [collab.isConnected, collab.onlineUsers, collab.cursors, setConnected, setConnectionStatus, setOnlineUsers, setCursors]);

  const syncToYjs = useCallback((el: CanvasElement) => {
    collab.updateElement(el);
  }, [collab]);

  const removeFromYjs = useCallback((elementId: string) => {
    collab.deleteElement(elementId);
  }, [collab]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextId) return;

      if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      else if (e.key === 'h' || e.key === 'H') setActiveTool('pan');
      else if (e.key === 'r' || e.key === 'R') setActiveTool('rectangle');
      else if (e.key === 'o' || e.key === 'O') setActiveTool('ellipse');
      else if (e.key === 'l' || e.key === 'L') setActiveTool('line');
      else if (e.key === 'a' || e.key === 'A') setActiveTool('arrow');
      else if (e.key === 'p' || e.key === 'P') setActiveTool('pencil');
      else if (e.key === 't' || e.key === 'T') setActiveTool('text');
      else if (e.key === 'e' || e.key === 'E') setActiveTool('eraser');
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          deleteElements(selectedIds);
      selectedIds.forEach((id) => removeFromYjs(id));
          clearSelection();
        }
      } else if (e.key === 'Escape') {
        clearSelection();
        setEditingTextId(null);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTool, selectedIds, deleteElements, clearSelection, undo, redo, editingTextId]);

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

  const getCanvasPoint = (_e: unknown): Point => {
    const stage = stageRef.current;
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const pos = stage.getPointerPosition();
    return transform.point(pos);
  };

  const handleMouseDown = (e: any) => {
    const clickedOnEmpty = e.target === stageRef.current;

    if (activeTool === 'select') {
      if (clickedOnEmpty) {
        clearSelection();
      } else {
        const shape = e.target;
        if (shape && shape.id()) selectElements([shape.id()]);
      }
      return;
    }

    if (activeTool === 'eraser') {
      const shape = e.target;
      if (shape && shape.id()) { deleteElements([shape.id()]); removeFromYjs(shape.id()); }
      return;
    }

    if (activeTool === 'text') {
      const point = getCanvasPoint(e);
      const element: CanvasElement = {
        id: generateId(),
        type: 'text',
        x: point.x,
        y: point.y,
        rotation: 0,
        text: 'Text',
        fontSize,
        fontFamily: 'Inter, sans-serif',
        stroke: strokeColor,
        opacity: 1,
        locked: false,
      };
      addElement(element);
      syncToYjs(element);
      selectElements([element.id]);
      return;
    }

    if (activeTool !== 'pan') {
      const point = getCanvasPoint(e);
      setIsDrawing(true);
      setStartPoint(point);
      if (activeTool === 'pencil') {
        setCurrentPoints([point.x, point.y]);
      }
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || !startPoint) return;
    if (activeTool === 'pencil') {
      const point = getCanvasPoint(e);
      setCurrentPoints((prev) => [...prev, point.x, point.y]);
    }
  };

  const handleMouseUp = (e: any) => {
    if (!isDrawing || !startPoint) {
      setIsDrawing(false);
      setStartPoint(null);
      return;
    }

    const endPoint = getCanvasPoint(e);
    let element: CanvasElement | null = null;

    const minX = Math.min(startPoint.x, endPoint.x);
    const minY = Math.min(startPoint.y, endPoint.y);
    const w = Math.abs(endPoint.x - startPoint.x);
    const h = Math.abs(endPoint.y - startPoint.y);

    if (w < 2 && h < 2 && activeTool !== 'pencil') {
      setIsDrawing(false);
      setStartPoint(null);
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
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoints([]);
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = zoom;
    const pointer = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(
      CANVAS_CONFIG.MIN_ZOOM,
      Math.min(CANVAS_CONFIG.MAX_ZOOM, oldScale + direction * CANVAS_CONFIG.ZOOM_STEP)
    );

    setZoom(newScale);
    setPan(pointer.x - mousePointTo.x * newScale, pointer.y - mousePointTo.y * newScale);
  };

  const handleDragEnd = () => {
    const stage = stageRef.current;
    if (stage) setPan(stage.x(), stage.y());
  };

  const handleZoomIn = () => setZoom(Math.min(CANVAS_CONFIG.MAX_ZOOM, zoom * 1.25));
  const handleZoomOut = () => setZoom(Math.max(CANVAS_CONFIG.MIN_ZOOM, zoom / 1.25));
  const handleFitToScreen = () => {
    setZoom(1);
    setPan(stageSize.width / 2 - 400, stageSize.height / 2 - 300);
  };

  const renderElement = (el: CanvasElement) => {
    const isSelected = selectedIds.includes(el.id);
    const isDraggable = activeTool === 'select' && !el.locked;

    const onDragEnd = (e: any) => {
      updateElement(el.id, { x: e.target.x(), y: e.target.y() });
      syncToYjs({ ...el, x: e.target.x(), y: e.target.y() });
    };

    const onElementClick = () => {
      if (activeTool === 'select') selectElements([el.id]);
      else if (activeTool === 'eraser') { deleteElements([el.id]); removeFromYjs(el.id); }
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
      onDragEnd,
    };

    switch (el.type) {
      case 'rectangle':
        return (
          <Rect
            {...commonProps}
            width={el.width ?? 100}
            height={el.height ?? 100}
            stroke={isSelected ? '#f472b6' : el.stroke}
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
            stroke={isSelected ? '#f472b6' : el.stroke}
            strokeWidth={el.strokeWidth ?? 2}
            fill={el.fill ?? 'transparent'}
          />
        );
      case 'line':
        return (
          <Line
            {...commonProps}
            points={el.points ?? [0, 0, 100, 0]}
            stroke={isSelected ? '#f472b6' : el.stroke}
            strokeWidth={el.strokeWidth ?? 2}
            lineCap="round"
            lineJoin="round"
          />
        );
      case 'arrow':
        return (
          <Arrow
            {...commonProps}
            points={el.points ?? [0, 0, 100, 0]}
            stroke={isSelected ? '#f472b6' : el.stroke}
            strokeWidth={el.strokeWidth ?? 2}
            fill={isSelected ? '#f472b6' : (el.stroke ?? '#374151')}
            pointerLength={10}
            pointerWidth={10}
          />
        );
      case 'pencil':
        return (
          <Line
            {...commonProps}
            points={el.points ?? []}
            stroke={isSelected ? '#f472b6' : el.stroke}
            strokeWidth={el.strokeWidth ?? 2}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />
        );
      case 'text':
        return (
          <Text
            {...commonProps}
            text={el.text ?? 'Text'}
            fontSize={el.fontSize ?? 16}
            fontFamily={el.fontFamily ?? 'Inter'}
            fill={isSelected ? '#f472b6' : (el.stroke ?? '#374151')}
            onDblClick={() => setEditingTextId(el.id)}
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
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Stroke</h3>
        <ColorPicker
          colors={STROKE_COLORS}
          selectedColor={strokeColor}
          onChange={setStrokeColor}
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Fill</h3>
        <ColorPicker
          colors={FILL_COLORS}
          selectedColor={fillColor}
          onChange={setFillColor}
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
              onClick={() => setStrokeWidth(w)}
            >
              {w}px
            </button>
          ))}
        </div>
      </div>

      {activeTool === 'text' && (
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
                onClick={() => setFontSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-3">
            {selectedIds.length} element{selectedIds.length > 1 ? 's' : ''} selected
          </p>
          <button
            className="w-full px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            onClick={() => { deleteElements(selectedIds); clearSelection(); }}
          >
            Delete selected
          </button>
        </div>
      )}
    </div>
  );

  const bottomBar = (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 px-3 py-2">
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
      <div ref={containerRef} className="w-full h-full bg-gray-50">
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          x={panX}
          y={panY}
          scaleX={zoom}
          scaleY={zoom}
          onMouseDown={handleMouseDown}
          onMouseMove={(e) => {
            handleMouseMove(e);
            const pos = e.target.getStage()?.getPointerPosition();
            if (pos) {
              collab.updateCursor((pos.x - panX) / zoom, (pos.y - panY) / zoom);
            }
          }}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => collab.clearCursor()}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          onWheel={handleWheel}
          draggable={activeTool === 'pan'}
          onDragEnd={handleDragEnd}
          style={{ cursor: activeTool === 'pan' ? 'grab' : activeTool === 'eraser' ? 'crosshair' : 'default' }}
        >
          <Layer>
            <Rect x={-10000} y={-10000} width={20000} height={20000} fill="#f9fafb" listening={false} />
            {elements.map(renderElement)}
            {isDrawing && startPoint && activeTool === 'pencil' && currentPoints.length > 0 && (
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
          </Layer>
        </Stage>
      </div>
    </BoardLayout>
  );
}
