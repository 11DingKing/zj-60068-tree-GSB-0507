import React, { useState, useRef, useEffect } from "react";
import { MindMapNode, NodeShape } from "../types";
import { getIconById } from "../utils/icons";
import { countDescendants } from "../utils";
import { useAppStore } from "../store";

interface NodeProps {
  node: MindMapNode;
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onStartEdit: () => void;
  onFinishEdit: (text: string) => void;
  onToggleCollapse: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  canDrop: boolean;
  invalidDrop?: boolean;
}

const Node: React.FC<NodeProps> = ({
  node,
  x,
  y,
  width,
  height,
  isSelected,
  isEditing,
  onSelect,
  onStartEdit,
  onFinishEdit,
  onToggleCollapse,
  onDragStart,
  canDrop,
  invalidDrop,
}) => {
  const [editText, setEditText] = useState(node.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onFinishEdit(editText);
    } else if (e.key === "Escape") {
      setEditText(node.text);
      onFinishEdit(node.text);
    }
  };

  const handleBlur = () => {
    onFinishEdit(editText);
  };

  const getNodeShape = (shape: NodeShape) => {
    const styles: React.CSSProperties = {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      border: `2px solid ${node.style.borderColor}`,
      backgroundColor: node.style.backgroundColor,
      transition: "box-shadow 0.2s ease",
    };

    switch (shape) {
      case "rounded-rect":
        return { ...styles, borderRadius: "8px" };
      case "ellipse":
        return { ...styles, borderRadius: "50%" };
      case "diamond":
        return { ...styles, borderRadius: "4px", transform: "rotate(45deg)" };
      case "capsule":
        return { ...styles, borderRadius: "20px" };
      default:
        return { ...styles, borderRadius: "8px" };
    }
  };

  const descendantCount = node.collapsed
    ? countDescendants(
        node.id,
        useAppStore.getState().getCurrentMindMap()?.nodes || {},
      )
    : 0;

  const icon = node.style.iconId ? getIconById(node.style.iconId) : undefined;

  const nodeStyle: React.CSSProperties = {
    position: "absolute",
    left: x,
    top: y,
    width: width,
    height: height,
    cursor: isSelected ? "move" : "pointer",
    zIndex: isSelected ? 10 : 2,
    userSelect: "none",
  };

  const contentStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 16px",
    gap: "8px",
    fontSize: node.style.fontSize,
    color: node.style.textColor,
    fontWeight: "500",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    zIndex: 2,
  };

  const selectedBorderStyle: React.CSSProperties = isSelected
    ? {
        outline: `3px solid var(--primary-color)`,
        outlineOffset: "2px",
        borderRadius: "8px",
      }
    : {};

  const dropHighlightStyle: React.CSSProperties =
    canDrop && invalidDrop
      ? {
          outline: "3px dashed #ff4d4f",
          outlineOffset: "4px",
          borderRadius: "8px",
        }
      : canDrop
      ? {
          outline: "3px dashed var(--success-color)",
          outlineOffset: "4px",
          borderRadius: "8px",
        }
      : {};

  const handleMouseMove = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      style={nodeStyle}
      onMouseDown={onDragStart}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        style={{
          ...getNodeShape(node.style.shape),
          ...selectedBorderStyle,
          ...dropHighlightStyle,
        }}
      />

      <div
        style={{
          ...contentStyle,
          transform: node.style.shape === "diamond" ? "rotate(-45deg)" : "none",
        }}
        onClick={onSelect}
        onDoubleClick={onStartEdit}
      >
        {icon && (
          <span
            style={{
              width: 16,
              height: 16,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: node.style.textColor,
              flexShrink: 0,
            }}
            dangerouslySetInnerHTML={{ __html: icon.svg }}
          />
        )}

        {isEditing ? (
          <input
            ref={inputRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: node.style.fontSize,
              color: node.style.textColor,
              border: "none",
              outline: "none",
              background: "transparent",
              textAlign: "center",
              fontWeight: "500",
              padding: 0,
              margin: 0,
            }}
          />
        ) : (
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {node.text}
          </span>
        )}
      </div>

      {node.children.length > 0 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
            style={{
              position: "absolute",
              right: -10,
              top: "50%",
              transform: "translateY(-50%)",
              width: 20,
              height: 20,
              borderRadius: "50%",
              border: "1px solid var(--border-color)",
              background: "var(--panel-bg)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "var(--text-color)",
              zIndex: 3,
              padding: 0,
              transition: "all 0.2s ease",
            }}
            title={node.collapsed ? "展开" : "折叠"}
          >
            {node.collapsed ? "+" : "−"}
          </button>

          {node.collapsed && descendantCount > 0 && (
            <div
              style={{
                position: "absolute",
                right: -24,
                top: -8,
                background: "var(--primary-color)",
                color: "white",
                borderRadius: 10,
                padding: "2px 6px",
                fontSize: 10,
                fontWeight: 600,
                minWidth: 20,
                textAlign: "center",
                zIndex: 4,
              }}
            >
              {descendantCount}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Node;
