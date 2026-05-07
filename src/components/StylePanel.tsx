import React from 'react';
import { useAppStore } from '../store';
import { NodeStyle, NodeShape } from '../types';
import { COLOR_PALETTE } from '../utils';
import { ICON_LIBRARY } from '../utils/icons';

interface StylePanelProps {
  onClose: () => void;
}

const StylePanel: React.FC<StylePanelProps> = ({ onClose }) => {
  const { selectedNodeIds, updateNodeStyle, getNode } = useAppStore();

  const firstNode = selectedNodeIds.length > 0 ? getNode(selectedNodeIds[0]) : undefined;
  const currentStyle = firstNode?.style;

  const handleStyleChange = (style: Partial<NodeStyle>) => {
    for (const nodeId of selectedNodeIds) {
      updateNodeStyle(nodeId, style);
    }
  };

  const shapes: { value: NodeShape; label: string }[] = [
    { value: 'rounded-rect', label: '圆角矩形' },
    { value: 'ellipse', label: '椭圆' },
    { value: 'diamond', label: '菱形' },
    { value: 'capsule', label: '胶囊形' },
  ];

  if (!currentStyle) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'var(--panel-bg)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-lg)',
        width: 400,
        maxHeight: '80vh',
        overflow: 'auto',
        zIndex: 1000,
        border: '1px solid var(--border-color)',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--text-color)',
          }}
        >
          节点样式
        </h3>
        <button
          onClick={onClose}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            color: 'var(--text-secondary)',
          }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              marginBottom: 8,
            }}
          >
            形状
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {shapes.map((shape) => (
              <button
                key={shape.value}
                onClick={() => handleStyleChange({ shape: shape.value })}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: currentStyle.shape === shape.value ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                  background: currentStyle.shape === shape.value ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: 'var(--text-color)',
                  fontWeight: 500,
                }}
              >
                {shape.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              marginBottom: 8,
            }}
          >
            背景色
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLOR_PALETTE.background.map((color, i) => (
              <button
                key={i}
                onClick={() => handleStyleChange({ backgroundColor: color })}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: currentStyle.backgroundColor === color ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                  background: color,
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              marginBottom: 8,
            }}
          >
            边框色
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLOR_PALETTE.border.map((color, i) => (
              <button
                key={i}
                onClick={() => handleStyleChange({ borderColor: color })}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: currentStyle.borderColor === color ? '3px solid var(--primary-color)' : `2px solid ${color}`,
                  background: '#fff',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              marginBottom: 8,
            }}
          >
            文字颜色
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLOR_PALETTE.text.map((color, i) => (
              <button
                key={i}
                onClick={() => handleStyleChange({ textColor: color })}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: currentStyle.textColor === color ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                  background: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 600,
                  color,
                }}
              >
                A
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              marginBottom: 8,
            }}
          >
            文字大小: {currentStyle.fontSize}px
          </label>
          <input
            type="range"
            min={10}
            max={24}
            value={currentStyle.fontSize}
            onChange={(e) => handleStyleChange({ fontSize: parseInt(e.target.value) })}
            style={{
              width: '100%',
              height: 4,
              borderRadius: 2,
              background: 'var(--border-color)',
              outline: 'none',
              cursor: 'pointer',
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              marginBottom: 8,
            }}
          >
            图标
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => handleStyleChange({ iconId: undefined })}
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                border: !currentStyle.iconId ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                color: 'var(--text-secondary)',
              }}
            >
              ✕
            </button>
            {ICON_LIBRARY.map((icon) => (
              <button
                key={icon.id}
                onClick={() => handleStyleChange({ iconId: icon.id })}
                title={icon.name}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  border: currentStyle.iconId === icon.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 6,
                  color: 'var(--text-color)',
                }}
                dangerouslySetInnerHTML={{ __html: icon.svg }}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            paddingTop: 16,
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 6,
              border: 'none',
              background: 'var(--primary-color)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};

export default StylePanel;
