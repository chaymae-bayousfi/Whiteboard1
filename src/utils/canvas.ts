import type { Point } from '@/types';

export function getDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function getAngle(p1: Point, p2: Point): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

export function rotatePoint(point: Point, center: Point, angle: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export function normalizePoints(points: number[]): { points: number[]; offset: Point } {
  if (points.length < 2) return { points: [], offset: { x: 0, y: 0 } };

  let minX = Infinity;
  let minY = Infinity;

  for (let i = 0; i < points.length; i += 2) {
    minX = Math.min(minX, points[i]);
    minY = Math.min(minY, points[i + 1]);
  }

  const normalizedPoints: number[] = [];
  for (let i = 0; i < points.length; i += 2) {
    normalizedPoints.push(points[i] - minX, points[i + 1] - minY);
  }

  return {
    points: normalizedPoints,
    offset: { x: minX, y: minY },
  };
}

export function isPointInRect(
  point: Point,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

export function getBoundingRect(
  points: Point[]
): { x: number; y: number; width: number; height: number } | null {
  if (points.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function smoothPoints(points: number[], tension: number = 0.5): number[] {
  if (points.length < 4) return points;

  const result: number[] = [points[0], points[1]];

  for (let i = 2; i < points.length - 4; i += 2) {
    const p0x = points[i - 2];
    const p0y = points[i - 1];
    const p1x = points[i];
    const p1y = points[i + 1];
    const p2x = points[i + 2];
    const p2y = points[i + 3];
    const p3x = points[i + 4];
    const p3y = points[i + 5];

    const cp1x = p1x + (p2x - p0x) * tension;
    const cp1y = p1y + (p2y - p0y) * tension;
    const cp2x = p2x - (p3x - p1x) * tension;
    const cp2y = p2y - (p3y - p1y) * tension;

    result.push(cp1x, cp1y, cp2x, cp2y, p2x, p2y);
  }

  result.push(points[points.length - 2], points[points.length - 1]);

  return result;
}

export function screenToCanvas(
  screenPoint: Point,
  canvas: { panX: number; panY: number; zoom: number }
): Point {
  return {
    x: (screenPoint.x - canvas.panX) / canvas.zoom,
    y: (screenPoint.y - canvas.panY) / canvas.zoom,
  };
}

export function canvasToScreen(
  canvasPoint: Point,
  canvas: { panX: number; panY: number; zoom: number }
): Point {
  return {
    x: canvasPoint.x * canvas.zoom + canvas.panX,
    y: canvasPoint.y * canvas.zoom + canvas.panY,
  };
}
