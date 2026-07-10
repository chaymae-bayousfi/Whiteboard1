import { useEffect, useCallback } from 'react';
import { isMac } from '@/utils';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  preventDefault?: boolean;
}

export function useKeyboardShortcut(
  shortcut: string,
  callback: () => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const keys = shortcut.split('+').map((k) => k.trim());
    const mainKey = keys.pop()?.toLowerCase();
    const hasCtrl = keys.includes('Ctrl');
    const hasCmd = keys.includes('Cmd');
    const hasShift = keys.includes('Shift');
    const hasAlt = keys.includes('Alt');

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlPressed = isMac() ? e.metaKey : e.ctrlKey;
      const needsCtrl = hasCtrl || (hasCmd && isMac());

      if (
        e.key.toLowerCase() === mainKey &&
        isCtrlPressed === needsCtrl &&
        e.shiftKey === hasShift &&
        e.altKey === hasAlt
      ) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortcut, ...deps]);
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const config of shortcuts) {
        const isCtrlPressed = isMac() ? e.metaKey : e.ctrlKey;

        if (
          e.key.toLowerCase() === config.key.toLowerCase() &&
          isCtrlPressed === (config.ctrl ?? false) &&
          e.shiftKey === (config.shift ?? false) &&
          e.altKey === (config.alt ?? false)
        ) {
          if (config.preventDefault !== false) e.preventDefault();
          config.handler();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export function useEscapeKey(callback: () => void, enabled = true) {
  const stableCallback = useCallback(callback, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stableCallback();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stableCallback, enabled]);
}
