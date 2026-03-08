import { useEffect, useCallback } from 'react';
import { useEditorInstance } from '../context/EditorContext';

function parseShortcut(shortcut: string): { key: string; ctrl: boolean; shift: boolean; alt: boolean; meta: boolean } {
  const parts = shortcut.toLowerCase().split('+');
  return {
    key: parts[parts.length - 1],
    ctrl: parts.includes('ctrl'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    meta: parts.includes('meta') || parts.includes('cmd'),
  };
}

function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parsed = parseShortcut(shortcut);
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

  return (
    event.key.toLowerCase() === parsed.key &&
    ctrlOrCmd === (parsed.ctrl || parsed.meta) &&
    event.shiftKey === parsed.shift &&
    event.altKey === parsed.alt
  );
}

export function useShortcuts() {
  const { pluginManager } = useEditorInstance();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when editing text inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const shortcuts = pluginManager.getShortcuts();
      for (const shortcut of shortcuts) {
        if (matchesShortcut(event, shortcut.keys)) {
          if (!shortcut.when || shortcut.when()) {
            event.preventDefault();
            shortcut.action();
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pluginManager]);

  const registerShortcut = useCallback(
    (id: string, keys: string, label: string, action: () => void) => {
      // Dynamic shortcut registration through plugin manager
      // This is handled by plugins, this is a convenience wrapper
    },
    []
  );

  return { registerShortcut };
}
