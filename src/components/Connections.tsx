import React from "react";
import { Connection, LineStyle, MindMapNode } from "../types";

interface Positions {
  [nodeId: string]: { x: number; y: number; width: number; height: number };
}

interface ConnectionsProps {
  connections: Connection[];
  nodes: Record<string, MindMapNode>;
  rootNodeId: string;
  layoutMode: string;
  zoom: number;
  panX: number;
  panY: number;
  positions: Positions;
}

const Connections: React.FC<ConnectionsProps> = ({
  connections,
  nodes,
  layoutMode,
  zoom,
  panX,
  panY,
  positions,
}) => {
  function getConnectionPoints(
    from: { x: number; y: number; width: number; height: number },
    to: { x: number; y: number; width: number; height: number },
  ): {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    direction: "right" | "left" | "down" | "up";
  } {
    const fromCenterX = from.x + from.width / 2;
    const fromCenterY = from.y + from.height / 2;
    const toCenterX = to.x + to.width / 2;
    const toCenterY = to.y + to.height / 2;

    let fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      direction: "right" | "left" | "down" | "up";

    if (layoutMode === "down") {
      direction = "down";
      fromX = fromCenterX;
      fromY = from.y + from.height;
      toX = toCenterX;
      toY = to.y;
    } else if (layoutMode === "both") {
      if (toCenterX > from.x + from.width) {
        direction = "right";
        fromX = from.x + from.width;
        fromY = fromCenterY;
        toX = to.x;
        toY = toCenterY;
      } else if (toCenterX < from.x) {
        direction = "left";
        fromX = from.x;
        fromY = fromCenterY;
        toX = to.x + to.width;
        toY = toCenterY;
      } else {
        direction = "right";
        fromX = from.x + from.width;
        fromY = fromCenterY;
        toX = to.x;
        toY = toCenterY;
      }
    } else if (layoutMode === "free") {
      const dx = toCenterX - fromCenterX;
      const dy = toCenterY - fromCenterY;

      if (Math.abs(dx) >= Math.abs(dy)) {
        if (dx > 0) {
          direction = "right";
          fromX = from.x + from.width;
          fromY = fromCenterY;
          toX = to.x;
          toY = toCenterY;
        } else {
          direction = "left";
          fromX = from.x;
          fromY = fromCenterY;
          toX = to.x + to.width;
          toY = toCenterY;
        }
      } else {
        if (dy > 0) {
          direction = "down";
          fromX = fromCenterX;
          fromY = from.y + from.height;
          toX = toCenterX;
          toY = to.y;
        } else {
          direction = "up";
          fromX = fromCenterX;
          fromY = from.y;
          toX = toCenterX;
          toY = to.y + to.height;
        }
      }
    } else {
      if (toCenterX > from.x + from.width) {
        direction = "right";
        fromX = from.x + from.width;
        fromY = fromCenterY;
        toX = to.x;
        toY = toCenterY;
      } else if (toCenterX < from.x) {
        direction = "left";
        fromX = from.x;
        fromY = fromCenterY;
        toX = to.x + to.width;
        toY = toCenterY;
      } else if (toCenterY > from.y + from.height) {
        direction = "down";
        fromX = fromCenterX;
        fromY = from.y + from.height;
        toX = toCenterX;
        toY = to.y;
      } else if (toCenterY < from.y) {
        direction = "up";
        fromX = fromCenterX;
        fromY = from.y;
        toX = toCenterX;
        toY = to.y + to.height;
      } else {
        direction = "right";
        fromX = fromCenterX;
        fromY = fromCenterY;
        toX = toCenterX;
        toY = toCenterY;
      }
    }

    return { fromX, fromY, toX, toY, direction };
  }

  function getConnectionPath(
    from: { x: number; y: number; width: number; height: number },
    to: { x: number; y: number; width: number; height: number },
    lineStyle: LineStyle,
  ): string {
    const { fromX, fromY, toX, toY, direction } = getConnectionPoints(from, to);

    switch (lineStyle) {
      case "straight":
        return `M ${fromX} ${fromY} L ${toX} ${toY}`;

      case "orthogonal": {
        if (layoutMode === "down") {
          if (Math.abs(toY - fromY) < 10) {
            return `M ${fromX} ${fromY} L ${toX} ${toY}`;
          }

          const gap = toY - fromY;
          const bendOffset = Math.min(gap * 0.3, 20);
          const midY = fromY + bendOffset;

          if (Math.abs(toX - fromX) < 5) {
            return `M ${fromX} ${fromY} V ${toY}`;
          }

          return `M ${fromX} ${fromY} V ${midY} H ${toX} V ${toY}`;
        }

        if (direction === "right" || direction === "left") {
          if (Math.abs(toY - fromY) < 5) {
            return `M ${fromX} ${fromY} L ${toX} ${toY}`;
          }

          const gap = Math.abs(toX - fromX);
          const bendOffset = Math.min(gap * 0.3, 25);
          const midX =
            direction === "right" ? fromX + bendOffset : fromX - bendOffset;

          return `M ${fromX} ${fromY} H ${midX} V ${toY} H ${toX}`;
        } else {
          if (Math.abs(toX - fromX) < 5) {
            return `M ${fromX} ${fromY} L ${toX} ${toY}`;
          }

          const gap = Math.abs(toY - fromY);
          const bendOffset = Math.min(gap * 0.3, 25);
          const midY =
            direction === "down" ? fromY + bendOffset : fromY - bendOffset;

          return `M ${fromX} ${fromY} V ${midY} H ${toX} V ${toY}`;
        }
      }

      case "bezier":
      default: {
        const dx = Math.abs(toX - fromX);
        const dy = Math.abs(toY - fromY);
        const controlDistance = Math.max(dx, dy, 40) * 0.4;

        let cp1x: number, cp1y: number, cp2x: number, cp2y: number;

        if (direction === "right" || direction === "left") {
          cp1x =
            fromX +
            (direction === "right" ? controlDistance : -controlDistance);
          cp1y = fromY;
          cp2x =
            toX + (direction === "right" ? -controlDistance : controlDistance);
          cp2y = toY;
        } else {
          cp1x = fromX;
          cp1y =
            fromY + (direction === "down" ? controlDistance : -controlDistance);
          cp2x = toX;
          cp2y =
            toY + (direction === "down" ? -controlDistance : controlDistance);
        }

        return `M ${fromX} ${fromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toX} ${toY}`;
      }
    }
  }

  const transform = `translate(${panX}, ${panY}) scale(${zoom})`;

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      <g transform={transform}>
        {connections.map((conn) => {
          const fromPos = positions[conn.from];
          const toPos = positions[conn.to];

          if (!fromPos || !toPos) return null;

          const fromNode = nodes[conn.from];
          const toNode = nodes[conn.to];

          if (!fromNode || !toNode) return null;
          if (fromNode.collapsed) return null;

          const path = getConnectionPath(fromPos, toPos, conn.style.lineStyle);

          return (
            <path
              key={conn.id}
              d={path}
              stroke={conn.style.color}
              strokeWidth={conn.style.width}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </g>
    </svg>
  );
};

export default Connections;
