// Main editor component
export { DesignEditor } from './DesignEditor';
export type { DesignEditorProps } from './DesignEditor';

// Theming
export { ThemeProvider, useTheme, defaultTheme, themeGradient } from './ThemeContext';
export type { EditorTheme } from './ThemeContext';

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
export type { AIChatProps, AIChatMessage, StreamCallback } from './ui/AIChat';

// LLM Slide Schema
export { convertSlidesToDocument, validateSlidePresentation, createSlideTransformer, LLM_SYSTEM_PROMPT } from './utils/slideSchema';
export type { SlidePresentation, Slide, SlideElement, LLMCaller } from './utils/slideSchema';

// Dashboard Viewer (embeddable read-only component)
export { DashboardViewer } from './DashboardViewer';
export type { DashboardViewerProps, DashboardViewerRef } from './DashboardViewer';

// Re-export everything from core, react, and plugins for convenience
export * from '@reactcanvas/core';
export * from '@reactcanvas/react';
export { createDefaultPlugins } from '@reactcanvas/plugins';
