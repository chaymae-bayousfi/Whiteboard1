import { create } from 'zustand';
import type { CanvasElement, Point } from '@/types';
import { generateId } from '@/utils';
import { CANVAS_CONFIG } from '@/constants/canvas';

interface HistoryEntry {
  elements: CanvasElement[];
  selectedIds: string[];
}

interface CanvasStore {
  elements: CanvasElement[];
  selectedIds: string[];
  zoom: number;
  panX: number;
  panY: number;
  history: HistoryEntry[];
  historyIndex: number;
  clipboard: CanvasElement[];
  isDirty: boolean;

  setElements: (elements: CanvasElement[]) => void;
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElements: (ids: string[]) => void;
  selectElements: (ids: string[]) => void;
  clearSelection: () => void;
  setZoom: (zoom: number) => void;
  setPan: (panX: number, panY: number) => void;
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  copySelected: () => void;
  pasteClipboard: (offset?: Point) => void;
  duplicateSelected: () => void;
  resetCanvas: () => void;
  setIsDirty: (dirty: boolean) => void;
  moveSelectedElements: (delta: Point) => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  elements: [],
  selectedIds: [],
  zoom: 1,
  panX: 0,
  panY: 0,
  history: [],
  historyIndex: -1,
  clipboard: [],
  isDirty: false,

  setElements: (elements) => set({ elements, isDirty: true }),

  addElement: (element) => {
    const { elements, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ elements: [...elements], selectedIds: [] });

    set({
      elements: [...elements, element],
      history: newHistory.slice(-50),
      historyIndex: newHistory.length - 1,
      isDirty: true,
    });
  },

  updateElement: (id, updates) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
      isDirty: true,
    })),

  deleteElements: (ids) => {
    const { elements, selectedIds, history, historyIndex } = get();

    if (ids.length === 0) return;

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ elements: [...elements], selectedIds });

    set({
      elements: elements.filter((el) => !ids.includes(el.id)),
      selectedIds: [],
      history: newHistory.slice(-50),
      historyIndex: newHistory.length - 1,
      isDirty: true,
    });
  },

  selectElements: (ids) => set({ selectedIds: ids }),

  clearSelection: () => set({ selectedIds: [] }),

  setZoom: (zoom) =>
    set({
      zoom: Math.max(CANVAS_CONFIG.MIN_ZOOM, Math.min(CANVAS_CONFIG.MAX_ZOOM, zoom)),
    }),

  setPan: (panX, panY) => set({ panX, panY }),

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      const entry = history[historyIndex - 1];
      set({
        elements: entry.elements,
        selectedIds: entry.selectedIds,
        historyIndex: historyIndex - 1,
        isDirty: true,
      });
    } else if (historyIndex === 0) {
      set({ elements: [], selectedIds: [], historyIndex: -1, isDirty: false });
    }
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      const entry = history[historyIndex + 1];
      set({
        elements: entry.elements,
        selectedIds: entry.selectedIds,
        historyIndex: historyIndex + 1,
        isDirty: true,
      });
    }
  },

  saveToHistory: () => {
    const { elements, selectedIds, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ elements: [...elements], selectedIds: [...selectedIds] });

    set({
      history: newHistory.slice(-50),
      historyIndex: newHistory.length - 1,
    });
  },

  copySelected: () => {
    const { elements, selectedIds } = get();
    const selected = elements.filter((el) => selectedIds.includes(el.id));
    set({ clipboard: selected });
  },

  pasteClipboard: (offset = { x: 20, y: 20 }) => {
    const { clipboard, elements } = get();
    if (clipboard.length === 0) return;

    const newElements = clipboard.map((el) => ({
      ...el,
      id: generateId(),
      x: el.x + offset.x,
      y: el.y + offset.y,
    }));

    set({
      elements: [...elements, ...newElements],
      selectedIds: newElements.map((el) => el.id),
      isDirty: true,
    });
    get().saveToHistory();
  },

  duplicateSelected: () => {
    const { elements, selectedIds } = get();
    const selected = elements.filter((el) => selectedIds.includes(el.id));

    if (selected.length === 0) return;

    const newElements = selected.map((el) => ({
      ...el,
      id: generateId(),
      x: el.x + 20,
      y: el.y + 20,
    }));

    set((state) => ({
      elements: [...state.elements, ...newElements],
      selectedIds: newElements.map((el) => el.id),
      isDirty: true,
    }));
    get().saveToHistory();
  },

  resetCanvas: () =>
    set({
      elements: [],
      selectedIds: [],
      zoom: 1,
      panX: 0,
      panY: 0,
      history: [],
      historyIndex: -1,
      isDirty: false,
    }),

  setIsDirty: (dirty) => set({ isDirty: dirty }),

  moveSelectedElements: (delta) => {
    const { elements, selectedIds } = get();
    if (selectedIds.length === 0) return;

    set({
      elements: elements.map((el) =>
        selectedIds.includes(el.id) ? { ...el, x: el.x + delta.x, y: el.y + delta.y } : el
      ),
      isDirty: true,
    });
  },
}));
