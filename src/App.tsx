import React, { useState, useCallback, useEffect } from 'react';
import { useAppStore } from './store';
import { exportToJSON, exportToMarkdown, exportToPNG } from './utils/export';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import ZoomControls from './components/ZoomControls';
import StylePanel from './components/StylePanel';
import CommandPalette from './components/CommandPalette';

const App: React.FC = () => {
  const {
    setCommandPanelOpen,
    commandPanelOpen,
    getCurrentMindMap,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useAppStore();

  const [showStylePanel, setShowStylePanel] = useState(false);

  const handleOpenCommandPalette = useCallback(() => {
    setCommandPanelOpen(true);
  }, [setCommandPanelOpen]);

  const handleCloseCommandPalette = useCallback(() => {
    setCommandPanelOpen(false);
  }, [setCommandPanelOpen]);

  const handleOpenStylePanel = useCallback(() => {
    setShowStylePanel(true);
  }, []);

  const handleCloseStylePanel = useCallback(() => {
    setShowStylePanel(false);
  }, []);

  const handleExportJSON = useCallback(() => {
    const mindMap = getCurrentMindMap();
    if (mindMap) {
      exportToJSON(mindMap);
    }
  }, [getCurrentMindMap]);

  const handleExportMarkdown = useCallback(() => {
    const mindMap = getCurrentMindMap();
    if (mindMap) {
      exportToMarkdown(mindMap);
    }
  }, [getCurrentMindMap]);

  const handleExportPNG = useCallback(async () => {
    const mindMap = getCurrentMindMap();
    if (mindMap) {
      try {
        await exportToPNG('canvas-container', mindMap.name);
      } catch (error) {
        alert('导出 PNG 失败，请重试');
      }
    }
  }, [getCurrentMindMap]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handleOpenCommandPalette();
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) {
          undo();
        }
      }
      
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (canRedo()) {
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOpenCommandPalette, undo, redo, canUndo, canRedo]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-color)',
      }}
    >
      <Toolbar
        onOpenCommandPalette={handleOpenCommandPalette}
        onExportJSON={handleExportJSON}
        onExportMarkdown={handleExportMarkdown}
        onExportPNG={handleExportPNG}
      />

      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        <Sidebar onOpenStylePanel={handleOpenStylePanel} />

        <div
          id="canvas-container"
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Canvas />
          <ZoomControls />
        </div>
      </div>

      {showStylePanel && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.3)',
              zIndex: 999,
            }}
            onClick={handleCloseStylePanel}
          />
          <StylePanel onClose={handleCloseStylePanel} />
        </>
      )}

      <CommandPalette
        isOpen={commandPanelOpen}
        onClose={handleCloseCommandPalette}
        onOpenStylePanel={handleOpenStylePanel}
        onExportJSON={handleExportJSON}
        onExportMarkdown={handleExportMarkdown}
        onExportPNG={handleExportPNG}
      />
    </div>
  );
};

export default App;
