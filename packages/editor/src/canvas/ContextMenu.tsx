export interface ContextMenuProps {
  x: number;
  y: number;
  hasSelection: boolean;
  canGroup: boolean;
  canUngroup: boolean;
  onBringToFront: () => void;
  onBringForward: () => void;
  onSendToBack: () => void;
  onSendBackward: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onSelectAll: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
  hasClipboard: boolean;
}

export function ContextMenu({
  x, y,
  hasSelection, canGroup, canUngroup,
  onBringToFront, onBringForward, onSendToBack, onSendBackward,
  onDuplicate, onDelete,
  onCopy, onPaste, onGroup, onUngroup, onSelectAll,
  onFlipH, onFlipV,
  hasClipboard,
}: ContextMenuProps) {
  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 10000,
        minWidth: 200,
        backgroundColor: '#f8f9fa',
        border: '1px solid #f1f3f5',
        borderRadius: 10,
        padding: '6px 0',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {hasSelection && (
        <>
          <CtxItem label="Copy" shortcut={'\u2318C'} onClick={onCopy} />
          <CtxItem label="Paste" shortcut={'\u2318V'} onClick={onPaste} disabled={!hasClipboard} />
          <CtxItem label="Duplicate" shortcut={'\u2318D'} onClick={onDuplicate} />
          <CtxDivider />
          <CtxItem label="Bring to Front" shortcut={'\u21E7\u2318]'} onClick={onBringToFront} />
          <CtxItem label="Bring Forward" shortcut={'\u2318]'} onClick={onBringForward} />
          <CtxItem label="Send Backward" shortcut={'\u2318['} onClick={onSendBackward} />
          <CtxItem label="Send to Back" shortcut={'\u21E7\u2318['} onClick={onSendToBack} />
          <CtxDivider />
          <CtxItem label="Flip Horizontal" shortcut={'\u21E7\u2318H'} onClick={onFlipH} />
          <CtxItem label="Flip Vertical" onClick={onFlipV} />
          <CtxDivider />
          {canGroup && <CtxItem label="Group" shortcut={'\u2318G'} onClick={onGroup} />}
          {canUngroup && <CtxItem label="Ungroup" shortcut={'\u21E7\u2318G'} onClick={onUngroup} />}
          {(canGroup || canUngroup) && <CtxDivider />}
          <CtxItem label="Delete" shortcut={'\u232B'} onClick={onDelete} danger />
        </>
      )}
      {!hasSelection && (
        <>
          <CtxItem label="Paste" shortcut={'\u2318V'} onClick={onPaste} disabled={!hasClipboard} />
          <CtxDivider />
          <CtxItem label="Select All" shortcut={'\u2318A'} onClick={onSelectAll} />
        </>
      )}
    </div>
  );
}

function CtxItem({ label, shortcut, onClick, disabled, danger }: {
  label: string; shortcut?: string; onClick: () => void; disabled?: boolean; danger?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '7px 14px',
        border: 'none',
        backgroundColor: 'transparent',
        color: disabled ? '#e9ecef' : danger ? '#e03131' : '#212529',
        fontSize: 12,
        fontWeight: 500,
        cursor: disabled ? 'default' : 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
      }}
    >
      <span>{label}</span>
      {shortcut && <span style={{ color: '#868e96', fontSize: 11, marginLeft: 24 }}>{shortcut}</span>}
    </button>
  );
}

function CtxDivider() {
  return <div style={{ height: 1, backgroundColor: '#f1f3f5', margin: '4px 0' }} />;
}
