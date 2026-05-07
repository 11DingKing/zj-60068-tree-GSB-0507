import React, { useState } from 'react';
import { useAppStore } from '../store';
import { MindMap } from '../types';

interface SidebarProps {
  onOpenStylePanel: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenStylePanel }) => {
  const {
    mindMaps,
    currentMindMapId,
    selectMindMap,
    createMindMap,
    deleteMindMap,
    renameMindMap,
    duplicateMindMap,
    selectedNodeIds,
  } = useAppStore();

  const [editingMapId, setEditingMapId] = useState<string | null>(null);
  const [editingMapName, setEditingMapName] = useState('');

  const sortedMaps = Object.values(mindMaps).sort((a, b) => b.updatedAt - a.updatedAt);

  const handleStartEdit = (map: MindMap, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMapId(map.id);
    setEditingMapName(map.name);
  };

  const handleFinishEdit = () => {
    if (editingMapId && editingMapName.trim()) {
      renameMindMap(editingMapId, editingMapName.trim());
    }
    setEditingMapId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个导图吗？')) {
      deleteMindMap(id);
    }
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateMindMap(id);
  };

  return (
    <div
      style={{
        width: 250,
        height: '100%',
        background: 'var(--panel-bg)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: 16,
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--text-color)',
          }}
        >
          导图列表
        </h2>
        <button
          onClick={createMindMap}
          title="新建导图"
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: '1px solid var(--border-color)',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            color: 'var(--text-color)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-color)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          +
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 8,
        }}
      >
        {sortedMaps.map((map) => (
          <div
            key={map.id}
            onClick={() => selectMindMap(map.id)}
            style={{
              padding: 12,
              borderRadius: 8,
              cursor: 'pointer',
              marginBottom: 4,
              background: currentMindMapId === map.id ? 'var(--bg-color)' : 'transparent',
              border: currentMindMapId === map.id ? '1px solid var(--primary-color)' : '1px solid transparent',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (currentMindMapId !== map.id) {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (currentMindMapId !== map.id) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {editingMapId === map.id ? (
              <input
                value={editingMapName}
                onChange={(e) => setEditingMapName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleFinishEdit();
                  } else if (e.key === 'Escape') {
                    setEditingMapId(null);
                  }
                }}
                onBlur={handleFinishEdit}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--text-color)',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  padding: 0,
                }}
              />
            ) : (
              <>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--text-color)',
                    marginBottom: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {map.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {new Date(map.updatedAt).toLocaleString('zh-CN')}
                </div>
              </>
            )}

            {currentMindMapId === map.id && editingMapId !== map.id && (
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  marginTop: 8,
                }}
              >
                <button
                  onClick={(e) => handleStartEdit(map, e)}
                  title="重命名"
                  style={{
                    padding: '4px 8px',
                    fontSize: 12,
                    borderRadius: 4,
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--text-color)',
                  }}
                >
                  重命名
                </button>
                <button
                  onClick={(e) => handleDuplicate(map.id, e)}
                  title="复制"
                  style={{
                    padding: '4px 8px',
                    fontSize: 12,
                    borderRadius: 4,
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--text-color)',
                  }}
                >
                  复制
                </button>
                <button
                  onClick={(e) => handleDelete(map.id, e)}
                  title="删除"
                  style={{
                    padding: '4px 8px',
                    fontSize: 12,
                    borderRadius: 4,
                    border: '1px solid var(--danger-color)',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--danger-color)',
                  }}
                >
                  删除
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          padding: 16,
          borderTop: '1px solid var(--border-color)',
        }}
      >
        {selectedNodeIds.length > 0 && (
          <button
            onClick={onOpenStylePanel}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
              color: 'var(--text-color)',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            编辑节点样式
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
