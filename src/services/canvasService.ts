import type { CanvasElement, Point } from '@/types';
import { generateId } from '@/utils';
import { STROKE_COLORS, STROKE_WIDTHS, FONT_SIZES } from '@/constants';
import { CANVAS_CONFIG } from '@/constants/canvas';

class CanvasService {
  createRectangle(
    x: number,
    y: number,
    width: number = 100,
    height: number = 100
  ): CanvasElement {
    const minX = Math.min(x, x + width);
    const minY = Math.min(y, y + height);
    return {
      id: generateId(),
      type: 'rectangle',
      x: minX,
      y: minY,
      width: Math.abs(width),
      height: Math.abs(height),
      rotation: 0,
      stroke: STROKE_COLORS[0],
      strokeWidth: STROKE_WIDTHS[2],
      fill: 'transparent',
      opacity: 1,
      locked: false,
    };
  }

  createEllipse(
    x: number,
    y: number,
    width: number = 100,
    height: number = 100
  ): CanvasElement {
    const minX = Math.min(x, x + width);
    const minY = Math.min(y, y + height);
    return {
      id: generateId(),
      type: 'ellipse',
      x: minX,
      y: minY,
      width: Math.abs(width),
      height: Math.abs(height),
      rotation: 0,
      stroke: STROKE_COLORS[0],
      strokeWidth: STROKE_WIDTHS[2],
      fill: 'transparent',
      opacity: 1,
      locked: false,
    };
  }

  createLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): CanvasElement {
    return {
      id: generateId(),
      type: 'line',
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      rotation: 0,
      stroke: STROKE_COLORS[0],
      strokeWidth: STROKE_WIDTHS[2],
      points: [x1, y1, x2, y2],
      opacity: 1,
      locked: false,
    };
  }

  createArrow(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): CanvasElement {
    return {
      id: generateId(),
      type: 'arrow',
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      rotation: 0,
      stroke: STROKE_COLORS[0],
      strokeWidth: STROKE_WIDTHS[2],
      points: [x1, y1, x2, y2],
      opacity: 1,
      locked: false,
    };
  }

  createPencil(
    points: number[],
    strokeColor: string = STROKE_COLORS[0],
    strokeWidth: number = STROKE_WIDTHS[2]
  ): CanvasElement {
    if (points.length < 4) {
      throw new Error('Not enough points for pencil stroke');
    }

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
      id: generateId(),
      type: 'pencil',
      x: minX,
      y: minY,
      rotation: 0,
      stroke: strokeColor,
      strokeWidth,
      points: normalizedPoints,
      opacity: 1,
      locked: false,
    };
  }

  createText(
    x: number,
    y: number,
    text: string = 'Text'
  ): CanvasElement {
    return {
      id: generateId(),
      type: 'text',
      x,
      y,
      rotation: 0,
      text,
      fontSize: FONT_SIZES[4],
      fontFamily: 'Inter, sans-serif',
      stroke: STROKE_COLORS[0],
      opacity: 1,
      locked: false,
    };
  }

  private getElementsBounds(elements: CanvasElement[]): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const el of elements) {
      const w = el.width || (el.type === 'text' ? 200 : 0);
      const h = el.height || (el.type === 'text' ? 50 : 0);

      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + w);
      maxY = Math.max(maxY, el.y + h);
    }

    return { minX, minY, maxX, maxY };
  }

  exportToJSON(elements: CanvasElement[]): string {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      elements,
    };
    return JSON.stringify(data, null, 2);
  }

  importFromJSON(jsonString: string): CanvasElement[] {
    try {
      const data = JSON.parse(jsonString);
      if (!data.elements || !Array.isArray(data.elements)) {
        throw new Error('Invalid format');
      }
      return data.elements;
    } catch {
      throw new Error('Failed to parse canvas data');
    }
  }

  fitToScreen(
    elements: CanvasElement[],
    containerWidth: number,
    containerHeight: number,
    padding: number = 50
  ): { zoom: number; panX: number; panY: number } {
    if (elements.length === 0) {
      return { zoom: 1, panX: containerWidth / 2, panY: containerHeight / 2 };
    }

    const bounds = this.getElementsBounds(elements);
    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;

    const availableWidth = containerWidth - padding * 2;
    const availableHeight = containerHeight - padding * 2;

    const scaleX = availableWidth / (contentWidth || 1);
    const scaleY = availableHeight / (contentHeight || 1);
    const zoom = Math.min(scaleX, scaleY, CANVAS_CONFIG.MAX_ZOOM);

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    const panX = containerWidth / 2 - centerX * zoom;
    const panY = containerHeight / 2 - centerY * zoom;

    return { zoom, panX, panY };
  }

  isPointOnElement(
    point: Point,
    element: CanvasElement,
    zoom: number
  ): boolean {
    const hitArea = CANVAS_CONFIG.SNAP_THRESHOLD / zoom;
    const w = element.width || 100;
    const h = element.height || 100;

    return (
      point.x >= element.x - hitArea &&
      point.x <= element.x + w + hitArea &&
      point.y >= element.y - hitArea &&
      point.y <= element.y + h + hitArea
    );
  }
}

export const canvasService = new CanvasService();
