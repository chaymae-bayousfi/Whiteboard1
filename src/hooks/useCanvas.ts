import { useState, useRef, useCallback, useEffect } from 'react';
import type { Point } from '@/types';

interface UseCanvasEventsProps {
  onPointerDown?: (e: PointerEvent) => void;
  onPointerMove?: (e: PointerEvent) => void;
  onPointerUp?: (e: PointerEvent) => void;
  onWheel?: (e: WheelEvent) => void;
}

export function useCanvasEvents({
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
}: UseCanvasEventsProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const down = onPointerDown ?? (() => {});
    const move = onPointerMove ?? (() => {});
    const up = onPointerUp ?? (() => {});
    const wheel = onWheel ?? (() => {});

    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointerleave', up);
    canvas.addEventListener('wheel', wheel);

    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointerleave', up);
      canvas.removeEventListener('wheel', wheel);
    };
  }, [onPointerDown, onPointerMove, onPointerUp, onWheel]);

  return canvasRef;
}

export function usePanZoom(initialZoom = 1) {
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPanPoint = useRef<Point>({ x: 0, y: 0 });

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((z) => Math.max(0.1, Math.min(4, z * delta)));
    } else {
      setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  }, []);

  const startPan = useCallback((point: Point) => {
    isPanning.current = true;
    lastPanPoint.current = point;
  }, []);

  const updatePan = useCallback((point: Point) => {
    if (!isPanning.current) return;
    const dx = point.x - lastPanPoint.current.x;
    const dy = point.y - lastPanPoint.current.y;
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    lastPanPoint.current = point;
  }, []);

  const endPan = useCallback(() => {
    isPanning.current = false;
  }, []);

  return { zoom, setZoom, pan, setPan, handleWheel, startPan, updatePan, endPan };
}

export function useMousePosition() {
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return position;
}
