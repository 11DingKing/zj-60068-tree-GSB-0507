import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppStore } from "../store";
import { LayoutMode } from "../types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStylePanel: () => void;
  onExportJSON: () => void;
  onExportMarkdown: () => void;
  onExportPNG: () => void;
}

interface Command {
  id: string;
  label: string;
  description: string;
  shortcut?: string;
  icon?: string;
  action: () => void;
}

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPod|iPhone|iPad/.test(navigator.platform);

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenStylePanel,
  onExportJSON,
  onExportMarkdown,
  onExportPNG,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const {
    getCurrentMindMap,
    createMindMap,
    selectedNodeIds,
    addChildNode,
    addSiblingNode,
    deleteNode,
    changeLayoutMode,
    changeLineStyle,
    fitToScreen,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useAppStore();

  const mindMap = getCurrentMindMap();
  const layoutMode: LayoutMode = mindMap?.layoutMode || "right";

  const formatShortcut = (shortcut: string) => {
    if (isMac) {
      return shortcut.replace("Ctrl+", "⌘");
    }
    return shortcut;
  };

  const commands: Command[] = [
    {
      id: "new-map",
      label: "新建导图",
      description: "创建一个新的思维导图",
      icon: "+",
      action: () => {
        createMindMap();
        onClose();
      },
    },
    {
      id: "add-child",
      label: "添加子节点",
      description: "在选中节点后添加子节点",
      shortcut: "Tab",
      icon: "→",
      action: () => {
        if (selectedNodeIds.length > 0) {
          addChildNode(selectedNodeIds[0]);
        }
        onClose();
      },
    },
    {
      id: "add-sibling",
      label: "添加兄弟节点",
      description: "在选中节点后添加兄弟节点",
      shortcut: "Enter",
      icon: "↓",
      action: () => {
        if (selectedNodeIds.length > 0) {
          addSiblingNode(selectedNodeIds[0]);
        }
        onClose();
      },
    },
    {
      id: "delete-node",
      label: "删除节点",
      description: "删除选中的节点及其子树",
      shortcut: "Delete",
      icon: "✕",
      action: () => {
        for (const nodeId of selectedNodeIds) {
          deleteNode(nodeId);
        }
        onClose();
      },
    },
    {
      id: "edit-style",
      label: "编辑节点样式",
      description: "打开节点样式编辑面板",
      icon: "🎨",
      action: () => {
        if (selectedNodeIds.length > 0) {
          onOpenStylePanel();
        }
        onClose();
      },
    },
    {
      id: "layout-right",
      label: "向右展开布局",
      description: "标准思维导图布局",
      icon: layoutMode === "right" ? "✓" : "",
      action: () => {
        changeLayoutMode("right");
        onClose();
      },
    },
    {
      id: "layout-down",
      label: "向下展开布局",
      description: "组织架构图布局",
      icon: layoutMode === "down" ? "✓" : "",
      action: () => {
        changeLayoutMode("down");
        onClose();
      },
    },
    {
      id: "layout-both",
      label: "双向展开布局",
      description: "左右分布布局",
      icon: layoutMode === "both" ? "✓" : "",
      action: () => {
        changeLayoutMode("both");
        onClose();
      },
    },
    {
      id: "layout-free",
      label: "自由布局",
      description: "手动拖拽定位",
      icon: layoutMode === "free" ? "✓" : "",
      action: () => {
        changeLayoutMode("free");
        onClose();
      },
    },
    {
      id: "line-straight",
      label: "直线连接",
      description: "使用直线连接节点",
      icon: "—",
      action: () => {
        changeLineStyle("straight");
        onClose();
      },
    },
    {
      id: "line-orthogonal",
      label: "折线连接",
      description: "使用正交折线连接节点",
      icon: "└",
      action: () => {
        changeLineStyle("orthogonal");
        onClose();
      },
    },
    {
      id: "line-bezier",
      label: "曲线连接",
      description: "使用贝塞尔曲线连接节点",
      icon: "⌒",
      action: () => {
        changeLineStyle("bezier");
        onClose();
      },
    },
    {
      id: "fit-screen",
      label: "适应屏幕",
      description: "将所有节点缩放到视野内",
      icon: "⬜",
      action: () => {
        fitToScreen();
        onClose();
      },
    },
    {
      id: "export-json",
      label: "导出为 JSON",
      description: "导出完整数据结构",
      icon: "📄",
      action: () => {
        onExportJSON();
        onClose();
      },
    },
    {
      id: "export-markdown",
      label: "导出为 Markdown",
      description: "导出为缩进列表格式",
      icon: "📝",
      action: () => {
        onExportMarkdown();
        onClose();
      },
    },
    {
      id: "export-png",
      label: "导出为 PNG",
      description: "导出为图片格式",
      icon: "🖼",
      action: () => {
        onExportPNG();
        onClose();
      },
    },
  ];

  if (canUndo()) {
    commands.push({
      id: "undo",
      label: "撤销",
      description: "撤销上一步操作",
      shortcut: "Ctrl+Z",
      icon: "↩",
      action: () => {
        undo();
        onClose();
      },
    });
  }

  if (canRedo()) {
    commands.push({
      id: "redo",
      label: "重做",
      description: "重做已撤销的操作",
      shortcut: "Ctrl+Shift+Z",
      icon: "↪",
      action: () => {
        redo();
        onClose();
      },
    });
  }

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    setSearchQuery("");
    setSelectedIndex(0);
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, filteredCommands.length - 1),
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filteredCommands[selectedIndex];
        if (cmd) {
          cmd.action();
        }
      }
    },
    [filteredCommands, selectedIndex, onClose],
  );

  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "10vh",
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        style={{
          width: 600,
          maxHeight: "70vh",
          background: "var(--panel-bg)",
          borderRadius: 12,
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 18, color: "var(--text-secondary)" }}>
            ⌘K
          </span>
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="输入命令搜索..."
            autoFocus
            style={{
              flex: 1,
              fontSize: 15,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--text-color)",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                color: "var(--text-secondary)",
                padding: 4,
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div
          ref={resultsRef}
          style={{
            flex: 1,
            overflowY: "auto",
            maxHeight: "60vh",
          }}
        >
          {filteredCommands.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "var(--text-secondary)",
                fontSize: 14,
              }}
            >
              没有找到匹配的命令
            </div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <button
                key={cmd.id}
                onClick={() => cmd.action()}
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  textAlign: "left",
                  background:
                    selectedIndex === index
                      ? "rgba(24, 144, 255, 0.1)"
                      : "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span
                  style={{
                    width: 24,
                    fontSize: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-color)",
                  }}
                >
                  {cmd.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "var(--text-color)",
                    }}
                  >
                    {cmd.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      marginTop: 2,
                    }}
                  >
                    {cmd.description}
                  </div>
                </div>
                {cmd.shortcut && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-secondary)",
                      background: "var(--bg-color)",
                      padding: "4px 8px",
                      borderRadius: 4,
                    }}
                  >
                    {formatShortcut(cmd.shortcut)}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
