import React from 'react';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);
const mod = isMac ? '\u2318' : 'Ctrl';
const shift = isMac ? '\u21E7' : 'Shift';

const SECTIONS: { title: string; shortcuts: { keys: string; desc: string }[] }[] = [
  {
    title: 'General',
    shortcuts: [
      { keys: `${mod}+Z`, desc: 'Undo' },
      { keys: `${mod}+${shift}+Z`, desc: 'Redo' },
      { keys: `${mod}+A`, desc: 'Select all' },
      { keys: 'Escape', desc: 'Deselect all' },
      { keys: 'Delete', desc: 'Delete selected' },
    ],
  },
  {
    title: 'Clipboard',
    shortcuts: [
      { keys: `${mod}+C`, desc: 'Copy' },
      { keys: `${mod}+V`, desc: 'Paste' },
      { keys: `${mod}+D`, desc: 'Duplicate' },
    ],
  },
  {
    title: 'Layers',
    shortcuts: [
      { keys: `${mod}+]`, desc: 'Bring to front' },
      { keys: `${mod}+[`, desc: 'Send to back' },
      { keys: `${mod}+${shift}+]`, desc: 'Bring forward' },
      { keys: `${mod}+${shift}+[`, desc: 'Send backward' },
    ],
  },
  {
    title: 'Transform',
    shortcuts: [
      { keys: `${shift}+Drag corner`, desc: 'Lock aspect ratio' },
      { keys: `${shift}+Rotate`, desc: 'Snap to 15\u00B0' },
      { keys: `Alt+Drag`, desc: 'Disable snap' },
      { keys: `${mod}+${shift}+H`, desc: 'Flip horizontal' },
      { keys: `${mod}+${shift}+V`, desc: 'Flip vertical' },
    ],
  },
  {
    title: 'Move',
    shortcuts: [
      { keys: 'Arrow keys', desc: 'Nudge 1px' },
      { keys: `${shift}+Arrow`, desc: 'Nudge 10px' },
    ],
  },
  {
    title: 'Group',
    shortcuts: [
      { keys: `${mod}+G`, desc: 'Group elements' },
      { keys: `${mod}+${shift}+G`, desc: 'Ungroup' },
    ],
  },
  {
    title: 'Zoom',
    shortcuts: [
      { keys: `${mod}+Scroll`, desc: 'Zoom in/out' },
      { keys: 'Scroll', desc: 'Pan' },
    ],
  },
];

export function ShortcutHelp({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.title}>Keyboard Shortcuts</span>
          <button onClick={onClose} style={styles.closeBtn}>{'\u2715'}</button>
        </div>
        <div style={styles.body}>
          {SECTIONS.map((section) => (
            <div key={section.title} style={styles.section}>
              <div style={styles.sectionTitle}>{section.title}</div>
              {section.shortcuts.map((s) => (
                <div key={s.keys} style={styles.row}>
                  <span style={styles.desc}>{s.desc}</span>
                  <kbd style={styles.kbd}>{s.keys}</kbd>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10001,
  },
  modal: {
    width: 520,
    maxHeight: '80vh',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    border: '1px solid #f1f3f5',
    boxShadow: '0 16px 64px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #f1f3f5',
  },
  title: {
    color: '#212529',
    fontSize: 16,
    fontWeight: 700,
  },
  closeBtn: {
    width: 28,
    height: 28,
    border: 'none',
    borderRadius: 8,
    backgroundColor: 'transparent',
    color: '#868e96',
    fontSize: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: '12px 20px 20px',
    overflowY: 'auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  sectionTitle: {
    color: '#4A90D9',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: 4,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '3px 0',
  },
  desc: {
    color: '#6c757d',
    fontSize: 12,
  },
  kbd: {
    color: '#212529',
    fontSize: 10,
    fontFamily: 'JetBrains Mono, monospace',
    backgroundColor: '#f1f3f5',
    padding: '2px 6px',
    borderRadius: 4,
    border: '1px solid #e9ecef',
    whiteSpace: 'nowrap',
  },
};
