import React, { useState, useMemo, useCallback } from 'react';
import { useEditor, useEditorInstance } from '@reactcanvas/react';
import type { DashboardVariable } from '@reactcanvas/core';
import { extractVariables } from '@reactcanvas/core';

export function VariablesPanel() {
  const { document } = useEditor();
  const { store } = useEditorInstance();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showUndeclared, setShowUndeclared] = useState(false);

  const variables: DashboardVariable[] = useMemo(
    () => document.variables ?? [],
    [document.variables],
  );

  const updateVariables = useCallback(
    (newVars: DashboardVariable[]) => {
      const state = store.getState();
      const doc = state.document;
      state.setDocument({ ...doc, variables: newVars });
    },
    [store],
  );

  // Scan document for undeclared variables
  const undeclaredVars = useMemo(() => {
    const usedNames = extractVariables(document);
    const declaredNames = new Set(variables.map((v) => v.name));
    return usedNames.filter((name) => !declaredNames.has(name));
  }, [document, variables]);

  const handleAdd = useCallback(() => {
    const baseName = 'newVariable';
    let name = baseName;
    let counter = 1;
    const existing = new Set(variables.map((v) => v.name));
    while (existing.has(name)) {
      name = `${baseName}${counter++}`;
    }
    const newVar: DashboardVariable = {
      name,
      defaultValue: '',
      type: 'string',
      label: '',
    };
    const newVars = [...variables, newVar];
    updateVariables(newVars);
    setEditingIndex(newVars.length - 1);
  }, [variables, updateVariables]);

  const handleAddUndeclared = useCallback(
    (varName: string) => {
      const newVar: DashboardVariable = {
        name: varName,
        defaultValue: '',
        type: 'string',
        label: '',
      };
      updateVariables([...variables, newVar]);
    },
    [variables, updateVariables],
  );

  const handleAddAllUndeclared = useCallback(() => {
    const newVars = undeclaredVars.map(
      (name): DashboardVariable => ({
        name,
        defaultValue: '',
        type: 'string',
        label: '',
      }),
    );
    updateVariables([...variables, ...newVars]);
    setShowUndeclared(false);
  }, [variables, undeclaredVars, updateVariables]);

  const handleUpdate = useCallback(
    (index: number, partial: Partial<DashboardVariable>) => {
      const updated = variables.map((v, i) =>
        i === index ? { ...v, ...partial } : v,
      );
      updateVariables(updated);
    },
    [variables, updateVariables],
  );

  const handleDelete = useCallback(
    (index: number) => {
      updateVariables(variables.filter((_, i) => i !== index));
      if (editingIndex === index) setEditingIndex(null);
      else if (editingIndex !== null && editingIndex > index)
        setEditingIndex(editingIndex - 1);
    },
    [variables, updateVariables, editingIndex],
  );

  const handleCopy = useCallback(
    (index: number, varName: string) => {
      navigator.clipboard.writeText(`{{${varName}}}`).then(() => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 1500);
      });
    },
    [],
  );

  // Find which elements use a given variable
  const findUsages = useCallback(
    (varName: string): Array<{ pageId: string; elementId: string; elementName: string }> => {
      const pattern = `{{${varName}}}`;
      const usages: Array<{ pageId: string; elementId: string; elementName: string }> = [];
      for (const page of document.pages) {
        for (const el of page.elements) {
          const json = JSON.stringify(el);
          if (json.includes(pattern)) {
            usages.push({ pageId: page.id, elementId: el.id, elementName: el.name });
          }
        }
      }
      return usages;
    },
    [document],
  );

  return (
    <div style={styles.container}>
      {/* Header area with Add button */}
      <div style={styles.headerActions}>
        <button onClick={handleAdd} style={styles.addButton}>
          + Add Variable
        </button>
      </div>

      {/* Helper text */}
      <div style={styles.helperText}>
        Use in text elements, KPI values, chart titles, or data source URLs.
      </div>

      {/* Undeclared variables alert */}
      {undeclaredVars.length > 0 && (
        <div style={styles.undeclaredBanner}>
          <div style={styles.undeclaredHeader}>
            <span style={styles.undeclaredTitle}>
              {undeclaredVars.length} undeclared variable{undeclaredVars.length > 1 ? 's' : ''} found
            </span>
            <button
              onClick={() => setShowUndeclared(!showUndeclared)}
              style={styles.undeclaredToggle}
            >
              {showUndeclared ? 'Hide' : 'Show'}
            </button>
          </div>
          {showUndeclared && (
            <div style={styles.undeclaredList}>
              {undeclaredVars.map((name) => (
                <div key={name} style={styles.undeclaredItem}>
                  <code style={styles.undeclaredCode}>{`{{${name}}}`}</code>
                  <button
                    onClick={() => handleAddUndeclared(name)}
                    style={styles.undeclaredAddBtn}
                    title={`Define ${name}`}
                  >
                    + Define
                  </button>
                </div>
              ))}
              {undeclaredVars.length > 1 && (
                <button onClick={handleAddAllUndeclared} style={styles.defineAllBtn}>
                  Define All
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Variable list */}
      <div style={styles.variableList}>
        {variables.length === 0 && (
          <div style={styles.emptyState}>
            No variables defined yet. Click "+ Add Variable" to create one, or use{' '}
            <code style={styles.inlineCode}>{'{{varName}}'}</code> syntax in your elements.
          </div>
        )}

        {variables.map((variable, index) => {
          const isEditing = editingIndex === index;
          const usages = findUsages(variable.name);

          return (
            <VariableCard
              key={`${variable.name}-${index}`}
              variable={variable}
              isEditing={isEditing}
              isCopied={copiedIndex === index}
              usages={usages}
              onEdit={() => setEditingIndex(isEditing ? null : index)}
              onUpdate={(partial) => handleUpdate(index, partial)}
              onDelete={() => handleDelete(index)}
              onCopy={() => handleCopy(index, variable.name)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Variable Card ──────────────────────────────────────────────────

interface VariableCardProps {
  variable: DashboardVariable;
  isEditing: boolean;
  isCopied: boolean;
  usages: Array<{ pageId: string; elementId: string; elementName: string }>;
  onEdit: () => void;
  onUpdate: (partial: Partial<DashboardVariable>) => void;
  onDelete: () => void;
  onCopy: () => void;
}

function VariableCard({
  variable,
  isEditing,
  isCopied,
  usages,
  onEdit,
  onUpdate,
  onDelete,
  onCopy,
}: VariableCardProps) {
  return (
    <div style={styles.card}>
      {/* Collapsed view */}
      <div style={styles.cardHeader} onClick={onEdit}>
        <div style={styles.cardHeaderLeft}>
          <code style={styles.varSyntax}>{`{{${variable.name}}}`}</code>
          <span style={styles.varType}>{variable.type}</span>
        </div>
        <div style={styles.cardHeaderRight}>
          <button
            onClick={(e) => { e.stopPropagation(); onCopy(); }}
            style={styles.copyBtn}
            title="Copy syntax to clipboard"
          >
            {isCopied ? '\u2713' : '\u2398'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={styles.deleteBtn}
            title="Delete variable"
          >
            {'\u2715'}
          </button>
        </div>
      </div>

      {/* Expanded editing view */}
      {isEditing && (
        <div style={styles.cardBody}>
          <label style={styles.fieldLabel}>Name</label>
          <input
            type="text"
            value={variable.name}
            onChange={(e) => onUpdate({ name: e.target.value.replace(/\s+/g, '') })}
            style={styles.input}
            placeholder="variableName"
          />

          <label style={styles.fieldLabel}>Label (optional)</label>
          <input
            type="text"
            value={variable.label ?? ''}
            onChange={(e) => onUpdate({ label: e.target.value })}
            style={styles.input}
            placeholder="Human-readable label"
          />

          <label style={styles.fieldLabel}>Type</label>
          <select
            value={variable.type}
            onChange={(e) => onUpdate({ type: e.target.value as DashboardVariable['type'] })}
            style={styles.select}
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
          </select>

          <label style={styles.fieldLabel}>Default Value</label>
          <input
            type={variable.type === 'number' ? 'number' : variable.type === 'date' ? 'date' : 'text'}
            value={variable.defaultValue}
            onChange={(e) => onUpdate({ defaultValue: e.target.value })}
            style={styles.input}
            placeholder="Default value"
          />

          {/* Usages */}
          {usages.length > 0 && (
            <div style={styles.usagesSection}>
              <span style={styles.usagesLabel}>
                Used in {usages.length} element{usages.length > 1 ? 's' : ''}:
              </span>
              <div style={styles.usagesList}>
                {usages.map((u) => (
                  <div key={u.elementId} style={styles.usageItem}>
                    {u.elementName || u.elementId}
                  </div>
                ))}
              </div>
            </div>
          )}
          {usages.length === 0 && (
            <div style={styles.noUsages}>Not used in any element yet.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  headerActions: {
    padding: '12px 16px 0',
    flexShrink: 0,
  },
  addButton: {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: '#4A90D9',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  helperText: {
    padding: '8px 16px',
    fontSize: 10,
    color: '#868e96',
    lineHeight: 1.4,
    flexShrink: 0,
  },
  variableList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 12px 12px',
  },
  emptyState: {
    padding: '24px 8px',
    textAlign: 'center',
    fontSize: 11,
    color: '#868e96',
    lineHeight: 1.6,
  },
  inlineCode: {
    backgroundColor: '#f1f3f5',
    padding: '1px 4px',
    borderRadius: 3,
    fontSize: 11,
    fontFamily: 'monospace',
  },

  // Card
  card: {
    marginTop: 8,
    border: '1px solid #dee2e6',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    cursor: 'pointer',
    gap: 6,
  },
  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
    minWidth: 0,
  },
  varSyntax: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 600,
    color: '#212529',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  varType: {
    fontSize: 9,
    color: '#4A90D9',
    backgroundColor: '#e7f0fa',
    padding: '1px 5px',
    borderRadius: 4,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  cardHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  copyBtn: {
    width: 24,
    height: 24,
    border: 'none',
    borderRadius: 4,
    backgroundColor: 'transparent',
    color: '#868e96',
    cursor: 'pointer',
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  deleteBtn: {
    width: 24,
    height: 24,
    border: 'none',
    borderRadius: 4,
    backgroundColor: 'transparent',
    color: '#868e96',
    cursor: 'pointer',
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },

  // Card body (editing)
  cardBody: {
    padding: '8px 10px 12px',
    borderTop: '1px solid #dee2e6',
    backgroundColor: '#ffffff',
  },
  fieldLabel: {
    display: 'block',
    fontSize: 10,
    fontWeight: 600,
    color: '#495057',
    marginTop: 8,
    marginBottom: 3,
  },
  input: {
    width: '100%',
    padding: '5px 8px',
    border: '1px solid #dee2e6',
    borderRadius: 4,
    fontSize: 11,
    color: '#212529',
    backgroundColor: '#f8f9fa',
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '5px 8px',
    border: '1px solid #dee2e6',
    borderRadius: 4,
    fontSize: 11,
    color: '#212529',
    backgroundColor: '#f8f9fa',
    outline: 'none',
    boxSizing: 'border-box',
  },

  // Usages
  usagesSection: {
    marginTop: 10,
    padding: '8px',
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  usagesLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: '#495057',
  },
  usagesList: {
    marginTop: 4,
  },
  usageItem: {
    fontSize: 10,
    color: '#212529',
    padding: '2px 0',
    borderBottom: '1px solid #f1f3f5',
  },
  noUsages: {
    marginTop: 8,
    fontSize: 10,
    color: '#adb5bd',
    fontStyle: 'italic',
  },

  // Undeclared variables
  undeclaredBanner: {
    margin: '0 12px 4px',
    padding: '8px 10px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: 6,
    flexShrink: 0,
  },
  undeclaredHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  undeclaredTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#664d03',
  },
  undeclaredToggle: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#664d03',
    fontSize: 10,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0,
  },
  undeclaredList: {
    marginTop: 6,
  },
  undeclaredItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '3px 0',
  },
  undeclaredCode: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#664d03',
  },
  undeclaredAddBtn: {
    border: 'none',
    backgroundColor: '#4A90D9',
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 4,
    cursor: 'pointer',
  },
  defineAllBtn: {
    width: '100%',
    marginTop: 6,
    padding: '5px 8px',
    backgroundColor: '#4A90D9',
    color: '#ffffff',
    border: 'none',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
