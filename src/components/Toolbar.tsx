import React, { useState } from 'react';
import { useAppStore } from '../store';
import { LayoutMode, LineStyle } from '../types';

interface ToolbarProps {
  onOpenCommandPalette: () => void;
  onExportJSON: () => void;
  onExportMarkdown: () => void;
  onExportPNG: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onOpenCommandPalette,
  onExportJSON,
  onExportMarkdown,
  onExportPNG,
}) => {
  const {
    getCurrentMindMap,
    changeLayoutMode,
    changeLineStyle,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useAppStore();

  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showLineMenu, setShowLineMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const mindMap = getCurrentMindMap();
  const layoutMode: LayoutMode = mindMap?.layoutMode || 'right';
  const globalLineStyle: LineStyle = mindMap?.globalLineStyle || 'straight';

  const layouts: { value: LayoutMode; label: string; icon: string }[] = [
    { value: 'right', label: '向右展开', icon: '→' },
    { value: 'down', label: '向下展开', icon: '↓' },
    { value: 'both', label: '双向展开', icon: '↔' },
    { value: 'free', label: '自由布局', icon: '✋' },
  ];

  const lineStyles: { value: LineStyle; label: string; icon: string }[] = [
    { value: 'straight', label: '直线', icon: '—' },
    { value: 'orthogonal', label: '折线', icon: '└' },
    { value: 'bezier', label: '曲线', icon: '⌒' },
  ];

  const currentLayout = layouts.find((l) => l.value === layoutMode);
  const currentLineStyle = lineStyles.find((l) => l.value === globalLineStyle);

  return (
    <div
      style={{
        height: 48,
        background: 'var(--panel-bg)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', gap: 4, marginRight: 8 }}>
        <button
          onClick={undo}
          disabled={!canUndo()}
          title="撤销 (Ctrl+Z)"
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            border: '1px solid var(--border-color)',
            background: 'transparent',
            cursor: canUndo() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            color: canUndo() ? 'var(--text-color)' : 'var(--text-secondary)',
            opacity: canUndo() ? 1 : 0.5,
          }}
        >
          ↩
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          title="重做 (Ctrl+Shift+Z)"
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            border: '1px solid var(--border-color)',
            background: 'transparent',
            cursor: canRedo() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            color: canRedo() ? 'var(--text-color)' : 'var(--text-secondary)',
            opacity: canRedo() ? 1 : 0.5,
          }}
        >
          ↪
        </button>
      </div>

      <div style={{ width: 1, height: 24, background: 'var(--border-color)', marginRight: 8 }} />

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => {
            setShowLayoutMenu(!showLayoutMenu);
            setShowLineMenu(false);
            setShowExportMenu(false);
          }}
          title="布局模式"
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid var(--border-color)',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--text-color)',
          }}
        >
          <span style={{ fontSize: 14 }}>{currentLayout?.icon}</span>
          <span>{currentLayout?.label}</span>
          <span style={{ fontSize: 10 }}>▼</span>
        </button>

        {showLayoutMenu && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              background: 'var(--panel-bg)',
              borderRadius: 8,
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-color)',
              padding: 4,
              zIndex: 100,
              minWidth: 140,
            }}
          >
            {layouts.map((layout) => (
              <button
                key={layout.value}
                onClick={() => {
                  changeLayoutMode(layout.value);
                  setShowLayoutMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  textAlign: 'left',
                  background: layoutMode === layout.value ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  color: 'var(--text-color)',
                }}
              >
                <span style={{ fontSize: 14 }}>{layout.icon}</span>
                <span>{layout.label}</span>
                {layoutMode === layout.value && <span style={{ marginLeft: 'auto' }}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => {
            setShowLineMenu(!showLineMenu);
            setShowLayoutMenu(false);
            setShowExportMenu(false);
          }}
          title="连线样式"
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid var(--border-color)',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--text-color)',
          }}
        >
          <span style={{ fontSize: 16 }}>{currentLineStyle?.icon}</span>
          <span>{currentLineStyle?.label}</span>
          <span style={{ fontSize: 10 }}>▼</span>
        </button>

        {showLineMenu && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              background: 'var(--panel-bg)',
              borderRadius: 8,
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-color)',
              padding: 4,
              zIndex: 100,
              minWidth: 100,
            }}
          >
            {lineStyles.map((style) => (
              <button
                key={style.value}
                onClick={() => {
                  changeLineStyle(style.value);
                  setShowLineMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  textAlign: 'left',
                  background: globalLineStyle === style.value ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  color: 'var(--text-color)',
                }}
              >
                <span style={{ fontSize: 16 }}>{style.icon}</span>
                <span>{style.label}</span>
                {globalLineStyle === style.value && <span style={{ marginLeft: 'auto' }}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ width: 1, height: 24, background: 'var(--border-color)', marginLeft: 4, marginRight: 8 }} />

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => {
            setShowExportMenu(!showExportMenu);
            setShowLayoutMenu(false);
            setShowLineMenu(false);
          }}
          title="导出"
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid var(--border-color)',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--text-color)',
          }}
        >
          <span>📤</span>
          <span>导出</span>
          <span style={{ fontSize: 10 }}>▼</span>
        </button>

        {showExportMenu && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              background: 'var(--panel-bg)',
              borderRadius: 8,
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-color)',
              padding: 4,
              zIndex: 100,
              minWidth: 140,
            }}
          >
            <button
              onClick={() => {
                onExportJSON();
                setShowExportMenu(false);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: 'var(--text-color)',
              }}
            >
              <span>📄</span>
              <span>导出 JSON</span>
            </button>
            <button
              onClick={() => {
                onExportMarkdown();
                setShowExportMenu(false);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: 'var(--text-color)',
              }}
            >
              <span>📝</span>
              <span>导出 Markdown</span>
            </button>
            <button
              onClick={() => {
                onExportPNG();
                setShowExportMenu(false);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: 'var(--text-color)',
              }}
            >
              <span>🖼</span>
              <span>导出 PNG</span>
            </button>
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      <button
        onClick={onOpenCommandPalette}
        title="命令面板 (Ctrl+K)"
        style={{
          padding: '6px 12px',
          borderRadius: 6,
          border: '1px solid var(--border-color)',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          color: 'var(--text-secondary)',
        }}
      >
        <span>⌘K</span>
        <span>命令面板</span>
      </button>

      {(showLayoutMenu || showLineMenu || showExportMenu) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 99,
          }}
          onClick={() => {
            setShowLayoutMenu(false);
            setShowLineMenu(false);
            setShowExportMenu(false);
          }}
        />
      )}
    </div>
  );
};

export default Toolbar;
