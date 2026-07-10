import type { CanvasElement } from './index';

export interface DrawingTool {
  type: string;
  icon: string;
  label: string;
  shortcut: string;
}

export interface ShapeStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
}

export interface TextElement extends CanvasElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
}

export interface PencilElement extends CanvasElement {
  type: 'pencil';
  points: number[];
  tension: number;
  lineCap: 'round' | 'square' | 'butt';
  lineJoin: 'round' | 'bevel' | 'miter';
}

export interface RectangleElement extends CanvasElement {
  type: 'rectangle';
  width: number;
  height: number;
  cornerRadius: number | number[];
}

export interface EllipseElement extends CanvasElement {
  type: 'ellipse';
  radiusX: number;
  radiusY: number;
}

export interface LineElement extends CanvasElement {
  type: 'line' | 'arrow';
  points: [number, number, number, number];
}

export interface ArrowElement extends CanvasElement {
  type: 'arrow';
  points: [number, number, number, number];
  pointerLength: number;
  pointerWidth: number;
}

export type CanvasAction =
  | { type: 'CREATE'; elements: CanvasElement[] }
  | { type: 'UPDATE'; elements: CanvasElement[] }
  | { type: 'DELETE'; ids: string[] }
  | { type: 'MOVE'; delta: { x: number; y: number }; ids: string[] };

export interface HistoryEntry {
  action: CanvasAction;
  inverseAction: CanvasAction;
  timestamp: number;
}
