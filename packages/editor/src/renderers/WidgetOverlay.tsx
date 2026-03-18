import React, { memo } from 'react';

export interface WidgetOverlayProps {
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

/** Overlay rendered on top of a widget to show loading or error states. */
export const WidgetOverlay = memo(function WidgetOverlay({
  loading,
  error,
  onRetry,
}: WidgetOverlayProps) {
  if (!loading && !error) return null;

  if (error) {
    const truncatedError = error.length > 100 ? error.slice(0, 100) + '...' : error;
    return (
      <div style={styles.errorOverlay}>
        <div style={styles.errorIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="#dc3545" strokeWidth="2" />
            <line x1="12" y1="8" x2="12" y2="13" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16.5" r="1" fill="#dc3545" />
          </svg>
        </div>
        <div style={styles.errorMessage}>{truncatedError}</div>
        {onRetry && (
          <button
            style={styles.retryButton}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onRetry();
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // Loading state
  return (
    <div style={styles.loadingOverlay}>
      <style>{spinnerKeyframes}</style>
      <div style={styles.spinner} />
      <div style={styles.loadingText}>Loading...</div>
    </div>
  );
});

const spinnerKeyframes = `
@keyframes widget-overlay-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

const styles: Record<string, React.CSSProperties> = {
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    zIndex: 5,
    pointerEvents: 'none',
    borderRadius: 4,
  },
  spinner: {
    width: 28,
    height: 28,
    border: '3px solid #dee2e6',
    borderTopColor: '#4A90D9',
    borderRadius: '50%',
    animation: 'widget-overlay-spin 0.8s linear infinite',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 500,
    color: '#495057',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  errorOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 235, 238, 0.85)',
    zIndex: 5,
    borderRadius: 4,
    padding: 12,
    gap: 6,
  },
  errorIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorMessage: {
    fontSize: 12,
    fontWeight: 500,
    color: '#842029',
    textAlign: 'center',
    lineHeight: 1.4,
    maxWidth: '90%',
    wordBreak: 'break-word',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  retryButton: {
    marginTop: 4,
    padding: '4px 14px',
    fontSize: 12,
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: '#dc3545',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
};
