// Main editor component
export { DesignEditor } from './DesignEditor';
export type { DesignEditorProps } from './DesignEditor';

// Canvas
export { EditorCanvas } from './canvas/EditorCanvas';
export type { EditorCanvasProps } from './canvas/EditorCanvas';

// Renderers
export { DOMElementRenderer } from './renderers/DOMElementRenderer';

// UI Components
export { Toolbar } from './ui/Toolbar';
export { Sidebar } from './ui/Sidebar';
export { Inspector } from './ui/Inspector';
export { ExportDialog } from './ui/ExportDialog';
export { TextToolbar } from './ui/TextToolbar';

// Re-export everything from core, react, and plugins for convenience
export * from '@reactcanvas/core';
export * from '@reactcanvas/react';
export { createDefaultPlugins } from '@reactcanvas/plugins';
