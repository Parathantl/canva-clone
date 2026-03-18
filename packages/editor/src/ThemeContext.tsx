import React, { createContext, useContext, useMemo } from 'react';

export interface EditorTheme {
  // Brand colors
  primaryColor: string;
  primaryHoverColor: string;
  accentColor: string;

  // Backgrounds
  canvasBg: string;
  panelBg: string;
  panelSecondaryBg: string;
  inputBg: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Borders
  borderColor: string;
  borderLight: string;

  // Semantic
  successColor: string;
  errorColor: string;
  warningColor: string;

  // Typography
  fontFamily: string;

  // Border radius
  borderRadius: number;
}

export const defaultTheme: EditorTheme = {
  primaryColor: '#4A90D9',
  primaryHoverColor: '#3a7bc8',
  accentColor: '#7c5cbf',

  canvasBg: '#e9ecef',
  panelBg: '#ffffff',
  panelSecondaryBg: '#f8f9fa',
  inputBg: '#ffffff',

  textPrimary: '#212529',
  textSecondary: '#495057',
  textMuted: '#868e96',

  borderColor: '#dee2e6',
  borderLight: '#e9ecef',

  successColor: '#2b8a3e',
  errorColor: '#e03131',
  warningColor: '#e67700',

  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

  borderRadius: 8,
};

const ThemeContext = createContext<EditorTheme>(defaultTheme);

export function ThemeProvider({
  theme,
  children,
}: {
  theme?: Partial<EditorTheme>;
  children: React.ReactNode;
}) {
  const mergedTheme = useMemo(() => ({ ...defaultTheme, ...theme }), [theme]);
  return <ThemeContext.Provider value={mergedTheme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): EditorTheme {
  return useContext(ThemeContext);
}

/** Helper to generate gradient from primary + accent */
export function themeGradient(theme: EditorTheme): string {
  return `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`;
}
