import React from 'react';
import { useAppStore } from '../store';

const ZoomControls: React.FC = () => {
  const { zoom, setZoom, fitToScreen } = useAppStore();

  const zoomPercent = Math.round(zoom * 100);

  const handleZoomIn = () => {
    setZoom(Math.min(3, zoom + 0.1));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(0.3, zoom - 0.1));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--panel-bg)',
        padding: '8px 12px',
        borderRadius: 8,
        boxShadow: 'var(--shadow-lg)',
        zIndex: 100,
        border: '1px solid var(--border-color)',
      }}
    >
      <button
        onClick={fitToScreen}
        title="适应屏幕"
        style={{
          width: 28,
          height: 28,
          borderRadius: 4,
          border: '1px solid var(--border-color)',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          color: 'var(--text-color)',
        }}
      >
        ⬜
      </button>

      <button
        onClick={handleZoomOut}
        title="缩小 (30%-300%)"
        style={{
          width: 28,
          height: 28,
          borderRadius: 4,
          border: '1px solid var(--border-color)',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          color: 'var(--text-color)',
        }}
      >
        −
      </button>

      <button
        onClick={handleResetZoom}
        title="重置缩放"
        style={{
          padding: '4px 12px',
          borderRadius: 4,
          border: '1px solid var(--border-color)',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: 13,
          color: 'var(--text-color)',
          fontWeight: 500,
          minWidth: 60,
        }}
      >
        {zoomPercent}%
      </button>

      <button
        onClick={handleZoomIn}
        title="放大 (30%-300%)"
        style={{
          width: 28,
          height: 28,
          borderRadius: 4,
          border: '1px solid var(--border-color)',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          color: 'var(--text-color)',
        }}
      >
        +
      </button>
    </div>
  );
};

export default ZoomControls;
