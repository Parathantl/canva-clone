import { useCallback, useSyncExternalStore } from 'react';
import { useEditorInstance } from '../context/EditorContext';

// This hook interfaces with the history plugin through the event bus
export function useHistory() {
  const { store, eventBus } = useEditorInstance();

  // History state managed externally by history plugin
  // This hook provides the interface
  const undo = useCallback(() => {
    eventBus.emit('history:undo', {});
  }, [eventBus]);

  const redo = useCallback(() => {
    eventBus.emit('history:redo', {});
  }, [eventBus]);

  return {
    undo,
    redo,
  };
}
