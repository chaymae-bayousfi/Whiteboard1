export const COLORS = {
  blush: {
    50: '#fff5f7',
    100: '#ffe4ec',
    200: '#ffc9d9',
    300: '#ffa0bf',
    400: '#ff6b9d',
    500: '#f472b6',
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
  },
  lavender: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
} as const;

export const TOOL_CONFIGS = {
  select: { icon: 'MousePointer', label: 'Select', shortcut: 'V' },
  pan: { icon: 'Hand', label: 'Pan', shortcut: 'H' },
  rectangle: { icon: 'Square', label: 'Rectangle', shortcut: 'R' },
  ellipse: { icon: 'Circle', label: 'Ellipse', shortcut: 'O' },
  line: { icon: 'Minus', label: 'Line', shortcut: 'L' },
  arrow: { icon: 'ArrowRight', label: 'Arrow', shortcut: 'A' },
  pencil: { icon: 'Pencil', label: 'Pencil', shortcut: 'P' },
  text: { icon: 'Type', label: 'Text', shortcut: 'T' },
  eraser: { icon: 'Eraser', label: 'Eraser', shortcut: 'E' },
} as const;

export const CURSOR_COLORS = [
  '#FF6B9D',
  '#9333EA',
  '#00D4AA',
  '#FFB800',
  '#FF4757',
  '#2ED573',
  '#1E90FF',
  '#FF6348',
  '#9B59B6',
  '#3498DB',
] as const;

export const DEFAULT_COLORS = [
  '#FFFFFF',
  '#F5F5F5',
  '#F5E6D3',
  '#FFE4EC',
  '#E9D5FF',
  '#DBEAFE',
  '#D1FAE5',
  '#FEF3C7',
  '#FECACA',
  '#F3E8FF',
] as const;

export const STROKE_COLORS = [
  '#374151',
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#06B6D4',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#78716C',
] as const;

export const FILL_COLORS = [
  'transparent',
  '#FFFFFF',
  '#FFF5F7',
  '#FAF5FF',
  '#EFF6FF',
  '#F0FDF4',
  '#FEF3C7',
  '#FEE2E2',
  '#F3E8FF',
  '#F5F5F5',
] as const;

export const ZOOM_LEVELS = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4] as const;

export const STROKE_WIDTHS = [1, 2, 3, 4, 6, 8, 12, 16] as const;

export const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64, 96] as const;

export const KEYBOARD_SHORTCUTS = {
  UNDO: 'Ctrl+Z',
  REDO: 'Ctrl+Shift+Z',
  DELETE: 'Delete, Backspace',
  DUPLICATE: 'Ctrl+D',
  COPY: 'Ctrl+C',
  PASTE: 'Ctrl+V',
  SELECT_ALL: 'Ctrl+A',
  ZOOM_IN: 'Ctrl+=',
  ZOOM_OUT: 'Ctrl+-',
  RESET_ZOOM: 'Ctrl+0',
  FIT_TO_SCREEN: 'Ctrl+1',
} as const;

export const CONNECTION_STATUS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
} as const;
