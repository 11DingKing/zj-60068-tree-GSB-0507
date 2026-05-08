import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { useAppStore } from "../store";
import { calculateLayout } from "../layout";
import { LayoutMode, MindMapNode } from "../types";
import Node from "./Node";
import Connections from "./Connections";

const Canvas: React.FC = () => {
  const {
    getCurrentMindMap,
    selectedNodeIds,
    editingNodeId,
    zoom,
    panX,
    panY,
    isDragging,
    dragStartX,
    dragStartY,
    dragPanStartX,
    dragPanStartY,
    spacePressed,
    setPan,
    zoomBy,
    setIsDragging,
    setDragStart,
    setSpacePressed,
    selectNode,
    deselectAll,
    setEditingNode,
    updateNodeText,
    collapseNode,
    getNode,
    addChildNode,
    addSiblingNode,
    deleteNode,
    moveNode,
    setNodePosition,
    changeLayoutMode,
    mindMaps,
    currentMindMapId,
  } = useAppStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dropTargetNodeId, setDropTargetNodeId] = useState<string | null>(null);
  const [invalidDropTarget, setInvalidDropTarget] = useState(false);
  const [dragOffset, setDragOffset] = useState<{
    dx: number;
    dy: number;
  } | null>(null);

  const dragStartNodePosRef = useRef<{
    nodeId: string;
    x: number;
    y: number;
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const isDescendantOf = useCallback(
    (ancestorId: string, descendantId: string) => {
      const map = useAppStore.getState().getCurrentMindMap();
      if (!map) return false;
      const nodes = map.nodes;
      function check(parentId: string): boolean {
        const parent = nodes[parentId];
        if (!parent) return false;
        if (parent.children.includes(descendantId)) return true;
        for (const cid of parent.children) {
          if (check(cid)) return true;
        }
        return false;
      }
      return check(ancestorId);
    },
    [],
  );

  const mindMap = getCurrentMindMap();
  const layoutMode: LayoutMode = mindMap?.layoutMode || "right";

  const connections = useMemo(() => {
    const store = useAppStore.getState();
    return store.getVisibleConnections();
  }, [mindMaps, currentMindMapId, layoutMode]);

  const layoutResult = useMemo(() => {
    if (!mindMap) {
      return {
        positions: {} as Record<
          string,
          { x: number; y: number; width: number; height: number }
        >,
        bounds: { x: 0, y: 0, width: 0, height: 0 },
      };
    }
    return calculateLayout(mindMap.nodes, mindMap.rootNodeId, layoutMode);
  }, [mindMap?.nodes, mindMap?.rootNodeId, layoutMode]);

  const positions = useMemo(() => {
    if (!mindMap) {
      return {} as Record<
        string,
        { x: number; y: number; width: number; height: number }
      >;
    }

    if (layoutMode === "free") {
      const result: Record<
        string,
        { x: number; y: number; width: number; height: number }
      > = {};
      for (const nodeId of Object.keys(mindMap.nodes)) {
        const node = mindMap.nodes[nodeId];
        result[nodeId] = {
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
        };
      }
      return result;
    }

    return layoutResult.positions;
  }, [mindMap?.nodes, layoutMode, layoutResult.positions]);

  const visibleNodeIds = useMemo(() => {
    if (!mindMap) return [];

    const currentNodes = mindMap.nodes;
    const rootId = mindMap.rootNodeId;
    const visibleNodes: string[] = [];

    function collectNodes(nodeId: string) {
      visibleNodes.push(nodeId);
      const node = currentNodes[nodeId];
      if (node && !node.collapsed) {
        for (const childId of node.children) {
          collectNodes(childId);
        }
      }
    }

    collectNodes(rootId);
    return visibleNodes;
  }, [mindMap?.nodes, mindMap?.rootNodeId]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -1 : 1;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        zoomBy(delta, mouseX, mouseY);
      }
    },
    [zoomBy],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (
        e.target === canvasRef.current ||
        (e.target as HTMLElement).closest(".canvas-bg")
      ) {
        deselectAll();

        if (e.button === 1 || spacePressed) {
          setIsDragging(true);
          setDragStart(e.clientX, e.clientY);
        }
      }
    },
    [deselectAll, spacePressed, setIsDragging, setDragStart],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        setPan(dragPanStartX + dx, dragPanStartY + dy);
        return;
      }

      if (draggedNodeId && dragStartNodePosRef.current && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - panX) / zoom;
        const mouseY = (e.clientY - rect.top - panY) / zoom;

        const startPos = dragStartNodePosRef.current;
        const dx = mouseX - startPos.mouseX;
        const dy = mouseY - startPos.mouseY;

        if (layoutMode === "free") {
          const newX = startPos.x + dx;
          const newY = startPos.y + dy;
          setNodePosition(draggedNodeId, newX, newY);
        } else {
          setDragOffset({ dx, dy });
        }

        let foundDropTarget = false;
        for (const nodeId of visibleNodeIds) {
          if (nodeId === draggedNodeId) continue;

          const pos = positions[nodeId];
          if (!pos) continue;

          let currentDraggedX = startPos.x + dx;
          let currentDraggedY = startPos.y + dy;

          const currentPos = positions[draggedNodeId];
          if (currentPos && layoutMode === "free") {
            currentDraggedX = currentPos.x + currentPos.width / 2;
            currentDraggedY = currentPos.y + currentPos.height / 2;
          } else if (currentPos) {
            currentDraggedX = currentPos.x + currentPos.width / 2 + dx;
            currentDraggedY = currentPos.y + currentPos.height / 2 + dy;
          }

          const targetCenterX = pos.x + pos.width / 2;
          const targetCenterY = pos.y + pos.height / 2;

          const distance = Math.sqrt(
            Math.pow(currentDraggedX - targetCenterX, 2) +
              Math.pow(currentDraggedY - targetCenterY, 2),
          );

          if (distance < 100) {
            const isInvalid = isDescendantOf(draggedNodeId, nodeId);
            setDropTargetNodeId(nodeId);
            setInvalidDropTarget(isInvalid);
            foundDropTarget = true;
            break;
          }
        }

        if (!foundDropTarget) {
          setDropTargetNodeId(null);
          setInvalidDropTarget(false);
        }
      }
    },
    [
      isDragging,
      dragStartX,
      dragStartY,
      dragPanStartX,
      dragPanStartY,
      setPan,
      draggedNodeId,
      zoom,
      panX,
      panY,
      layoutMode,
      setNodePosition,
      visibleNodeIds,
      positions,
      isDescendantOf,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);

    if (draggedNodeId && dropTargetNodeId && !invalidDropTarget) {
      moveNode(draggedNodeId, dropTargetNodeId);

      if (layoutMode !== "free") {
        setTimeout(() => {
          changeLayoutMode(layoutMode);
        }, 0);
      }
    }

    setDraggedNodeId(null);
    setDropTargetNodeId(null);
    setInvalidDropTarget(false);
    setDragOffset(null);
    dragStartNodePosRef.current = null;
  }, [
    setIsDragging,
    draggedNodeId,
    dropTargetNodeId,
    invalidDropTarget,
    moveNode,
    layoutMode,
    changeLayoutMode,
  ]);

  const handleNodeSelect = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const isMultiSelect = e.ctrlKey || e.metaKey;
      selectNode(nodeId, isMultiSelect);
    },
    [selectNode],
  );

  const handleNodeStartEdit = useCallback(
    (nodeId: string) => {
      setEditingNode(nodeId);
    },
    [setEditingNode],
  );

  const handleNodeFinishEdit = useCallback(
    (nodeId: string, text: string) => {
      updateNodeText(nodeId, text);
      setEditingNode(null);

      if (layoutMode !== "free") {
        changeLayoutMode(layoutMode);
      }
    },
    [updateNodeText, setEditingNode, layoutMode, changeLayoutMode],
  );

  const handleNodeToggleCollapse = useCallback(
    (nodeId: string) => {
      const node = getNode(nodeId);
      if (node) {
        collapseNode(nodeId, !node.collapsed);

        if (layoutMode !== "free") {
          changeLayoutMode(layoutMode);
        }
      }
    },
    [getNode, collapseNode, layoutMode, changeLayoutMode],
  );

  const handleNodeDragStart = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();

      if (e.button !== 0) return;

      const pos = positions[nodeId];
      if (!pos) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = (e.clientX - rect.left - panX) / zoom;
      const mouseY = (e.clientY - rect.top - panY) / zoom;

      dragStartNodePosRef.current = {
        nodeId,
        x: pos.x,
        y: pos.y,
        mouseX,
        mouseY,
      };

      setDraggedNodeId(nodeId);
      setDragOffset({ dx: 0, dy: 0 });
    },
    [positions, panX, panY, zoom],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !spacePressed) {
        e.preventDefault();
        setSpacePressed(true);
      }

      if (e.code === "Tab" && selectedNodeIds.length > 0) {
        e.preventDefault();
        addChildNode(selectedNodeIds[0]);

        if (layoutMode !== "free") {
          changeLayoutMode(layoutMode);
        }
      }

      if (e.code === "Enter" && selectedNodeIds.length > 0 && !editingNodeId) {
        e.preventDefault();
        addSiblingNode(selectedNodeIds[0]);

        if (layoutMode !== "free") {
          changeLayoutMode(layoutMode);
        }
      }

      if (
        (e.code === "Delete" || e.code === "Backspace") &&
        selectedNodeIds.length > 0 &&
        !editingNodeId
      ) {
        e.preventDefault();
        for (const nodeId of selectedNodeIds) {
          deleteNode(nodeId);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setSpacePressed(false);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [
    spacePressed,
    setSpacePressed,
    selectedNodeIds,
    editingNodeId,
    addChildNode,
    addSiblingNode,
    deleteNode,
    layoutMode,
    changeLayoutMode,
  ]);

  const transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;

  if (!mindMap) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-secondary)",
          fontSize: 16,
        }}
      >
        请创建或选择一个导图
      </div>
    );
  }

  const renderNode = (
    node: MindMapNode,
    pos: { x: number; y: number; width: number; height: number },
    nodeId: string,
  ) => {
    const isSelected = selectedNodeIds.includes(nodeId);
    const isEditing = editingNodeId === nodeId;
    const canDrop = dropTargetNodeId === nodeId && draggedNodeId !== nodeId;
    const isInvalidDrop = canDrop && invalidDropTarget;
    const isDragging = draggedNodeId === nodeId;
    const showDragOffset = isDragging && dragOffset && layoutMode !== "free";

    let finalX = pos.x;
    let finalY = pos.y;

    if (showDragOffset) {
      finalX = pos.x + dragOffset.dx;
      finalY = pos.y + dragOffset.dy;
    }

    return (
      <div
        key={nodeId}
        style={{
          pointerEvents: "auto",
          transition: showDragOffset
            ? "none"
            : "transform 0.2s ease, opacity 0.2s ease",
          opacity: isDragging ? 0.9 : 1,
        }}
      >
        <Node
          node={node}
          x={finalX}
          y={finalY}
          width={pos.width}
          height={pos.height}
          isSelected={isSelected}
          isEditing={isEditing}
          onSelect={(e) => handleNodeSelect(nodeId, e)}
          onStartEdit={() => handleNodeStartEdit(nodeId)}
          onFinishEdit={(text) => handleNodeFinishEdit(nodeId, text)}
          onToggleCollapse={() => handleNodeToggleCollapse(nodeId)}
          onDragStart={(e) => handleNodeDragStart(nodeId, e)}
          canDrop={canDrop}
          invalidDrop={isInvalidDrop}
        />
        {showDragOffset && (
          <div
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              width: pos.width,
              height: pos.height,
              border: "2px dashed #1890ff",
              borderRadius: 8,
              opacity: 0.4,
              pointerEvents: "none",
              background: "rgba(24, 144, 255, 0.05)",
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div
      ref={canvasRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#fafafa",
        backgroundImage: `
          radial-gradient(circle, #e8e8e8 1px, transparent 1px)
        `,
        backgroundSize: "20px 20px",
        cursor: spacePressed
          ? "grabbing"
          : draggedNodeId
            ? "grabbing"
            : "default",
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="canvas-bg"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

      {mindMap && (
        <Connections
          connections={connections}
          nodes={mindMap.nodes}
          rootNodeId={mindMap.rootNodeId}
          layoutMode={layoutMode}
          zoom={zoom}
          panX={panX}
          panY={panY}
          positions={positions}
        />
      )}

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          transformOrigin: "0 0",
          transform,
          pointerEvents: "none",
        }}
      >
        {visibleNodeIds.map((nodeId) => {
          const node = mindMap.nodes[nodeId];
          const pos = positions[nodeId];

          if (!node || !pos) return null;

          return renderNode(node, pos, nodeId);
        })}
      </div>
    </div>
  );
};

export default Canvas;
