import React, { useCallback, useState } from 'react';
import { DesignEditor } from '@reactcanvas/editor';
import type { Document } from '@reactcanvas/core';

function App() {
  const [savedData, setSavedData] = useState<string>('');

  const handleChange = useCallback((document: Document) => {
    // Auto-save callback - fires on every change
  }, []);

  const handleSave = useCallback((document: Document) => {
    const json = JSON.stringify(document, null, 2);
    setSavedData(json);
    console.log('Document saved:', document);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <DesignEditor
        onChange={handleChange}
        showToolbar={true}
        showSidebar={true}
        showInspector={true}
      />
    </div>
  );
}

export default App;
