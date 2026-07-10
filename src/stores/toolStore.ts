import { create } from 'zustand';
import type { ToolType } from '@/types';
import { DEFAULT_COLORS, STROKE_COLORS, STROKE_WIDTHS, FONT_SIZES } from '@/constants';

interface ToolStore {
  activeTool: ToolType;
  previousTool: ToolType | null;
  isDrawing: boolean;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;

  setActiveTool: (tool: ToolType) => void;
  setPreviousTool: (tool: ToolType | null) => void;
  setIsDrawing: (drawing: boolean) => void;
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  resetToPreviousTool: () => void;
}

export const useToolStore = create<ToolStore>((set, get) => ({
  activeTool: 'select',
  previousTool: null,
  isDrawing: false,
  strokeColor: STROKE_COLORS[0],
  fillColor: DEFAULT_COLORS[2],
  strokeWidth: STROKE_WIDTHS[2],
  fontSize: FONT_SIZES[4],
  fontFamily: 'Inter, sans-serif',

  setActiveTool: (tool) =>
    set((state) => ({
      previousTool: state.activeTool,
      activeTool: tool,
    })),

  setPreviousTool: (tool) => set({ previousTool: tool }),

  setIsDrawing: (drawing) => set({ isDrawing: drawing }),

  setStrokeColor: (color) => set({ strokeColor: color }),

  setFillColor: (color) => set({ fillColor: color }),

  setStrokeWidth: (width) => set({ strokeWidth: width }),

  setFontSize: (size) => set({ fontSize: size }),

  setFontFamily: (family) => set({ fontFamily: family }),

  resetToPreviousTool: () => {
    const { previousTool } = get();
    if (previousTool) {
      set({ activeTool: previousTool, previousTool: null });
    }
  },
}));
