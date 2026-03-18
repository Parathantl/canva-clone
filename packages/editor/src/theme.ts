/**
 * Centralized theme — clean light mode, professional dashboard look.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Color palette — Light Mode
// ---------------------------------------------------------------------------

export const colors = {
  /** Primary background — panels, toolbar, sidebars */
  bg: '#ffffff',

  /** Secondary background — cards, input groups, nested panels */
  bgSecondary: '#f8f9fa',

  /** Tertiary background — inputs in dialogs, kbd backgrounds */
  bgTertiary: '#f1f3f5',

  /** Primary text — headings, main content */
  text: '#212529',

  /** Muted text — section labels, empty states */
  textMuted: '#868e96',

  /** Dim text — icon buttons, secondary labels */
  textDim: '#495057',

  /** Subdued text — descriptions, hints */
  textSubdued: '#6c757d',

  /** Faintest text — close buttons, tiny labels */
  textFaint: '#adb5bd',

  /** Accent blue — active states, links, selections */
  accent: '#4A90D9',

  /** Accent blue hover */
  accentHover: '#3a7bc8',

  /** Accent purple — gradient end */
  accentPurple: '#7c5cbf',

  /** Accent tint background */
  accentBg: '#e7f0ff',

  /** Primary border — panel dividers */
  border: '#e9ecef',

  /** Secondary border — input borders, card borders */
  borderLight: '#dee2e6',

  /** Tertiary border — active inputs, stronger dividers */
  borderMedium: '#ced4da',

  /** Modal border */
  borderModal: '#dee2e6',

  /** Error text */
  error: '#e03131',

  /** Error background */
  errorBg: '#fff5f5',

  /** Success green */
  success: '#2b8a3e',

  /** Success background */
  successBg: '#ebfbee',

  /** Active element bg (blue tint) */
  bgActive: '#e7f0ff',

  /** Canvas/editor background */
  bgCanvas: '#e9ecef',
} as const;

// ---------------------------------------------------------------------------
// Common gradients
// ---------------------------------------------------------------------------

export const gradients = {
  /** Primary accent gradient */
  accent: `linear-gradient(135deg, ${colors.accent}, ${colors.accentPurple})`,
} as const;

// ---------------------------------------------------------------------------
// Common component style fragments
// ---------------------------------------------------------------------------

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

export const buttonActive: React.CSSProperties = {
  backgroundColor: colors.bgActive,
  color: colors.accent,
};

export const buttonDisabled: React.CSSProperties = {
  opacity: 0.3,
  cursor: 'not-allowed',
};

export const inputBase: React.CSSProperties = {
  width: '100%',
  height: 30,
  border: `1px solid ${colors.borderLight}`,
  borderRadius: 8,
  backgroundColor: colors.bg,
  color: colors.text,
  fontSize: 12,
  padding: '0 10px',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

export const selectBase: React.CSSProperties = {
  width: '100%',
  height: 30,
  border: `1px solid ${colors.borderLight}`,
  borderRadius: 8,
  backgroundColor: colors.bg,
  color: colors.text,
  fontSize: 12,
  padding: '0 8px',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

export const dialogInputBase: React.CSSProperties = {
  width: '100%',
  height: 36,
  border: `1px solid ${colors.borderMedium}`,
  borderRadius: 6,
  backgroundColor: colors.bg,
  color: colors.text,
  fontSize: 13,
  padding: '0 8px',
};

export const sectionLabel: React.CSSProperties = {
  color: colors.textMuted,
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
};

export const panelBg: React.CSSProperties = {
  backgroundColor: colors.bg,
};

export const cardBase: React.CSSProperties = {
  backgroundColor: colors.bg,
  border: `1px solid ${colors.borderLight}`,
  borderRadius: 10,
  cursor: 'pointer',
  transition: 'all 0.12s',
};

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

export const modalBase: React.CSSProperties = {
  backgroundColor: colors.bg,
  borderRadius: 12,
  border: `1px solid ${colors.borderModal}`,
  overflow: 'hidden',
};

export const primaryButton: React.CSSProperties = {
  border: 'none',
  borderRadius: 8,
  background: gradients.accent,
  color: '#ffffff',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

export const divider: React.CSSProperties = {
  width: 1,
  backgroundColor: colors.borderLight,
  flexShrink: 0,
};

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
