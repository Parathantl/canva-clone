/**
 * Shared theme constants extracted from UI components.
 * Only values that appear 3+ times across different files are included.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------

export const colors = {
  /** Primary background — #16161e (Inspector, Toolbar, Sidebar panels, AIChat, TextToolbar, DesignEditor rail/panel, ErrorBoundary) */
  bg: '#16161e',

  /** Secondary background — #1e1e2e (inputs, dropdowns, cards, toolGroups, modals, active items, ColorPicker dropdown) */
  bgSecondary: '#1e1e2e',

  /** Tertiary background — #313244 (TextToolbar inputs, ExportDialog inputs, ShortcutHelp kbd bg) */
  bgTertiary: '#313244',

  /** Primary text — #cdd6f4 (headings, input text, labels, nav labels) */
  text: '#cdd6f4',

  /** Muted text — #585878 (section labels, dims, empty states, status icons, tab text) */
  textMuted: '#585878',

  /** Dim text — #8888a8 (icon buttons, secondary labels, suggestions) */
  textDim: '#8888a8',

  /** Subdued text — #a6adc8 (descriptions, ExportDialog labels, ShortcutHelp desc) */
  textSubdued: '#a6adc8',

  /** Muted icon/label text — #6c7086 (ExportDialog close, quality value, TextToolbar miniLabel) */
  textFaint: '#6c7086',

  /** Accent blue — #89b4fa (active states, accent borders, slider accent, widget icons, gradient start) */
  accent: '#89b4fa',

  /** Accent purple — #cba6f7 (gradient end, used with accent for linear-gradient) */
  accentPurple: '#cba6f7',

  /** Primary border — #1e1e2e (panel/section borders — borderBottom, borderRight, borderLeft) */
  border: '#1e1e2e',

  /** Secondary border — #2a2a3a (input borders, card borders, dividers in Inspector/Sidebar/WidgetLibrary/Templates) */
  borderLight: '#2a2a3a',

  /** Tertiary border — #45475a (TextToolbar dividers/inputs, ExportDialog borders, ShortcutHelp kbd border) */
  borderMedium: '#45475a',

  /** Modal border — #313244 (ExportDialog, ShortcutHelp, ColorPicker dropdown borders) */
  borderModal: '#313244',

  /** Error text — #f38ba8 (AIChat error box) */
  error: '#f38ba8',

  /** Success green — #50C878 (used in KPI trend colors, progress fills) */
  success: '#50C878',

  /** Active element bg — #2a2a44 (Toolbar btnActive, AIChat user message bg) */
  bgActive: '#2a2a44',

  /** Canvas/editor background — #0f0f14 (DesignEditor outer container) */
  bgCanvas: '#0f0f14',
} as const;

// ---------------------------------------------------------------------------
// Common gradients
// ---------------------------------------------------------------------------

export const gradients = {
  /** Primary accent gradient — used on export button, apply button, logo */
  accent: `linear-gradient(135deg, ${colors.accent}, ${colors.accentPurple})`,
} as const;

// ---------------------------------------------------------------------------
// Common component style fragments
// ---------------------------------------------------------------------------

/** Base styles for small icon/tool buttons (transparent bg, centered flex) */
export const buttonBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: 8,
  backgroundColor: 'transparent',
  color: colors.textDim,
  cursor: 'pointer',
  padding: 0,
  lineHeight: 1,
};

/** Active state for toggle buttons */
export const buttonActive: React.CSSProperties = {
  backgroundColor: colors.bgActive,
  color: colors.accent,
};

/** Disabled state for buttons */
export const buttonDisabled: React.CSSProperties = {
  opacity: 0.3,
  cursor: 'not-allowed',
};

/** Base styles for text/number inputs (dark bg, rounded, light text) — Inspector variant */
export const inputBase: React.CSSProperties = {
  width: '100%',
  height: 30,
  border: `1px solid ${colors.borderLight}`,
  borderRadius: 8,
  backgroundColor: colors.bgSecondary,
  color: colors.text,
  fontSize: 12,
  padding: '0 10px',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

/** Base styles for select dropdowns — Inspector variant */
export const selectBase: React.CSSProperties = {
  width: '100%',
  height: 30,
  border: `1px solid ${colors.borderLight}`,
  borderRadius: 8,
  backgroundColor: colors.bgSecondary,
  color: colors.text,
  fontSize: 12,
  padding: '0 8px',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

/** Base styles for dialog inputs — ExportDialog variant (uses borderMedium + bgTertiary) */
export const dialogInputBase: React.CSSProperties = {
  width: '100%',
  height: 36,
  border: `1px solid ${colors.borderMedium}`,
  borderRadius: 6,
  backgroundColor: colors.bgTertiary,
  color: colors.text,
  fontSize: 13,
  padding: '0 8px',
};

/** Section label style (uppercase, small, muted — used in Inspector, Sidebar, WidgetLibrary, Templates, ColorPicker) */
export const sectionLabel: React.CSSProperties = {
  color: colors.textMuted,
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
};

/** Panel/section container background (dark panels like Inspector, Sidebar rail, AIChat, TextToolbar) */
export const panelBg: React.CSSProperties = {
  backgroundColor: colors.bg,
};

/** Card style (bgSecondary with borderLight — used in WidgetLibrary, Templates) */
export const cardBase: React.CSSProperties = {
  backgroundColor: colors.bgSecondary,
  border: `1px solid ${colors.borderLight}`,
  borderRadius: 10,
  cursor: 'pointer',
  transition: 'all 0.12s',
};

/** Overlay backdrop for modals/dialogs */
export const overlayBase: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

/** Modal/dialog container */
export const modalBase: React.CSSProperties = {
  backgroundColor: colors.bgSecondary,
  borderRadius: 12,
  border: `1px solid ${colors.borderModal}`,
  overflow: 'hidden',
};

/** Primary CTA button (gradient bg, dark text) */
export const primaryButton: React.CSSProperties = {
  border: 'none',
  borderRadius: 8,
  background: gradients.accent,
  color: colors.bg,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

/** Vertical divider used in toolbars */
export const divider: React.CSSProperties = {
  width: 1,
  backgroundColor: colors.borderLight,
  flexShrink: 0,
};

// Re-export for convenience so consumers can do: import { theme } from './theme'
export const theme = {
  colors,
  gradients,
  buttonBase,
  buttonActive,
  buttonDisabled,
  inputBase,
  selectBase,
  dialogInputBase,
  sectionLabel,
  panelBg,
  cardBase,
  overlayBase,
  modalBase,
  primaryButton,
  divider,
} as const;

export default theme;
