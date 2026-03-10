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
export { AIChat } from './ui/AIChat';
export type { AIChatProps, AIChatMessage } from './ui/AIChat';

// LLM Slide Schema
export { convertSlidesToDocument, validateSlidePresentation, LLM_SYSTEM_PROMPT } from './utils/slideSchema';
export type { SlidePresentation, Slide, SlideElement } from './utils/slideSchema';

// Re-export everything from core, react, and plugins for convenience
export * from '@reactcanvas/core';
export * from '@reactcanvas/react';
export { createDefaultPlugins } from '@reactcanvas/plugins';
