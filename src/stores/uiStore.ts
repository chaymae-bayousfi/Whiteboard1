import { create } from 'zustand';
import type { Toast, ModalState } from '@/types';
import { generateId } from '@/utils';

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

interface ModalStore {
  modals: ModalState[];
  openModal: (type: ModalState['type'], data?: Record<string, unknown>) => void;
  closeModal: () => void;
}

interface UIStore extends ToastStore, ModalStore {}

export const useUIStore = create<UIStore>((set) => ({
  toasts: [],
  modals: [],

  addToast: (toast) => {
    const id = generateId();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, toast.duration || 5000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  openModal: (type, data) =>
    set({
      modals: [{ isOpen: true, type, data }],
    }),

  closeModal: () =>
    set({
      modals: [],
    }),
}));
