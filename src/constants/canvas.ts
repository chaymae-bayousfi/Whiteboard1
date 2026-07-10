import type { ToolType } from '@/types';

export const CANVAS_CONFIG = {
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 4,
  ZOOM_STEP: 0.1,
  GRID_SIZE: 20,
  SNAP_THRESHOLD: 10,
  SELECTION_PADDING: 10,
  DEFAULT_STROKE_WIDTH: 2,
  DEFAULT_FONT_SIZE: 16,
  DEFAULT_FONT_FAMILY: 'Inter, sans-serif',
  MIN_ELEMENT_SIZE: 5,
  PENCIL_SMOOTHING: 0.5,
} as const;

export const getToolLabel = (tool: ToolType): string => {
  const labels: Record<ToolType, string> = {
    select: 'Select',
    pan: 'Pan',
    rectangle: 'Rectangle',
    ellipse: 'Ellipse',
    line: 'Line',
    arrow: 'Arrow',
    pencil: 'Pencil',
    text: 'Text',
    eraser: 'Eraser',
  };
  return labels[tool];
};

export const getToolIcon = (tool: ToolType): string => {
  const icons: Record<ToolType, string> = {
    select: 'MousePointer',
    pan: 'Hand',
    rectangle: 'Square',
    ellipse: 'Circle',
    line: 'Minus',
    arrow: 'ArrowRight',
    pencil: 'Pencil',
    text: 'Type',
    eraser: 'Eraser',
  };
  return icons[tool];
};

export const getToolShortcut = (tool: ToolType): string => {
  const shortcuts: Record<ToolType, string> = {
    select: 'V',
    pan: 'H',
    rectangle: 'R',
    ellipse: 'O',
    line: 'L',
    arrow: 'A',
    pencil: 'P',
    text: 'T',
    eraser: 'E',
  };
  return shortcuts[tool];
};
