import { MindMapNode, LayoutMode } from '../types';
import { calculateTextWidth } from '../utils';

interface LayoutNode {
  id: string;
  node: MindMapNode;
  children: LayoutNode[];
  x: number;
  y: number;
  width: number;
  height: number;
  subtreeHeight: number;
  subtreeWidth: number;
}

const HORIZONTAL_SPACING = 80;
const VERTICAL_SPACING = 25;
const NODE_PADDING = 24;
const MIN_NODE_WIDTH = 60;
const NODE_HEIGHT = 40;

function buildLayoutTree(
  nodeId: string,
  nodes: Record<string, MindMapNode>
): LayoutNode | null {
  const node = nodes[nodeId];
  if (!node) return null;

  const textWidth = calculateTextWidth(node.text, node.style.fontSize);
  const width = Math.max(MIN_NODE_WIDTH, textWidth + NODE_PADDING * 2);
  const height = NODE_HEIGHT;

  const children: LayoutNode[] = [];
  let subtreeHeight = height;
  let subtreeWidth = width;

  if (!node.collapsed && node.children.length > 0) {
    for (const childId of node.children) {
      const child = buildLayoutTree(childId, nodes);
      if (child) {
        children.push(child);
      }
    }

    const childrenHeight = children.reduce((sum, child) => sum + child.subtreeHeight, 0);
    const spacingHeight = (children.length - 1) * VERTICAL_SPACING;
    subtreeHeight = Math.max(height, childrenHeight + spacingHeight);

    const maxChildWidth = children.length > 0 ? Math.max(...children.map((c) => c.subtreeWidth)) : 0;
    subtreeWidth = width + HORIZONTAL_SPACING + maxChildWidth;
  }

  return {
    id: nodeId,
    node,
    children,
    x: 0,
    y: 0,
    width,
    height,
    subtreeHeight,
    subtreeWidth,
  };
}

function layoutRight(
  tree: LayoutNode,
  startX: number,
  startY: number
): { x: number; y: number; width: number; height: number } {
  tree.x = startX;
  tree.y = startY;

  let totalWidth = tree.width;
  let totalHeight = tree.height;

  if (tree.children.length > 0) {
    const totalSubtreeHeight =
      tree.children.reduce((sum, child) => sum + child.subtreeHeight, 0) +
      (tree.children.length - 1) * VERTICAL_SPACING;

    let offsetY = startY + (tree.height - totalSubtreeHeight) / 2;

    for (const child of tree.children) {
      const childStartX = startX + tree.width + HORIZONTAL_SPACING;
      const childLayout = layoutRight(child, childStartX, offsetY);
      
      totalWidth = Math.max(totalWidth, childLayout.width + HORIZONTAL_SPACING + tree.width);
      totalHeight = Math.max(totalHeight, childLayout.height);
      
      offsetY += child.subtreeHeight + VERTICAL_SPACING;
    }
  }

  return {
    x: startX,
    y: Math.min(startY, tree.children[0]?.y ?? startY),
    width: totalWidth,
    height: Math.max(tree.height, tree.children.reduce((sum, c) => sum + c.subtreeHeight, 0) + (tree.children.length - 1) * VERTICAL_SPACING),
  };
}

function layoutDown(
  tree: LayoutNode,
  startX: number,
  startY: number
): { x: number; y: number; width: number; height: number } {
  tree.x = startX;
  tree.y = startY;

  let totalWidth = tree.width;
  let totalHeight = tree.height;

  if (tree.children.length > 0) {
    const totalSubtreeWidth =
      tree.children.reduce((sum, child) => sum + child.subtreeWidth, 0) +
      (tree.children.length - 1) * HORIZONTAL_SPACING;

    let offsetX = startX + (tree.width - totalSubtreeWidth) / 2;

    for (const child of tree.children) {
      const childStartY = startY + tree.height + VERTICAL_SPACING;
      const childLayout = layoutDown(child, offsetX, childStartY);
      
      totalHeight = Math.max(totalHeight, childLayout.height + VERTICAL_SPACING + tree.height);
      totalWidth = Math.max(totalWidth, childLayout.width);
      
      offsetX += child.subtreeWidth + HORIZONTAL_SPACING;
    }
  }

  return {
    x: Math.min(startX, tree.children[0]?.x ?? startX),
    y: startY,
    width: Math.max(tree.width, tree.children.reduce((sum, c) => sum + c.subtreeWidth, 0) + (tree.children.length - 1) * HORIZONTAL_SPACING),
    height: totalHeight,
  };
}

function layoutBoth(
  tree: LayoutNode,
  startX: number,
  startY: number
): { x: number; y: number; width: number; height: number } {
  tree.x = startX;
  tree.y = startY;

  const halfCount = Math.ceil(tree.children.length / 2);
  const leftChildren = tree.children.slice(0, halfCount);
  const rightChildren = tree.children.slice(halfCount);

  let minX = startX;
  let maxX = startX + tree.width;
  let minY = startY;
  let maxY = startY + tree.height;

  if (leftChildren.length > 0) {
    const totalSubtreeHeight =
      leftChildren.reduce((sum, child) => sum + child.subtreeHeight, 0) +
      (leftChildren.length - 1) * VERTICAL_SPACING;

    let offsetY = startY + (tree.height - totalSubtreeHeight) / 2;

    for (const child of leftChildren) {
      const childStartX = startX - HORIZONTAL_SPACING - child.width;
      
      let currentY = offsetY;
      if (child.children.length > 0) {
        currentY = offsetY + (child.subtreeHeight - child.height) / 2;
      }

      child.x = childStartX;
      child.y = currentY;

      for (const grandchild of child.children) {
        const grandChildStartX = childStartX - HORIZONTAL_SPACING - grandchild.width;
        layoutRightBranchLeft(grandchild, grandChildStartX, grandchild.y);
      }

      minX = Math.min(minX, child.x - (child.children.length > 0 ? child.subtreeWidth - child.width + HORIZONTAL_SPACING : 0));
      maxY = Math.max(maxY, child.y + child.subtreeHeight);
      minY = Math.min(minY, child.y);

      offsetY += child.subtreeHeight + VERTICAL_SPACING;
    }
  }

  if (rightChildren.length > 0) {
    const totalSubtreeHeight =
      rightChildren.reduce((sum, child) => sum + child.subtreeHeight, 0) +
      (rightChildren.length - 1) * VERTICAL_SPACING;

    let offsetY = startY + (tree.height - totalSubtreeHeight) / 2;

    for (const child of rightChildren) {
      const childStartX = startX + tree.width + HORIZONTAL_SPACING;
      
      let currentY = offsetY;
      if (child.children.length > 0) {
        currentY = offsetY + (child.subtreeHeight - child.height) / 2;
      }

      child.x = childStartX;
      child.y = currentY;

      for (const grandchild of child.children) {
        const grandChildStartX = childStartX + child.width + HORIZONTAL_SPACING;
        layoutRight(grandchild, grandChildStartX, grandchild.y);
      }

      maxX = Math.max(maxX, child.x + child.subtreeWidth);
      maxY = Math.max(maxY, child.y + child.subtreeHeight);
      minY = Math.min(minY, child.y);

      offsetY += child.subtreeHeight + VERTICAL_SPACING;
    }
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function layoutRightBranchLeft(
  tree: LayoutNode,
  startX: number,
  startY: number
) {
  tree.x = startX;
  tree.y = startY;

  if (tree.children.length > 0) {
    const totalSubtreeHeight =
      tree.children.reduce((sum, child) => sum + child.subtreeHeight, 0) +
      (tree.children.length - 1) * VERTICAL_SPACING;

    let offsetY = startY + (tree.height - totalSubtreeHeight) / 2;

    for (const child of tree.children) {
      const childStartX = startX - HORIZONTAL_SPACING - child.width;
      layoutRightBranchLeft(child, childStartX, offsetY);
      offsetY += child.subtreeHeight + VERTICAL_SPACING;
    }
  }
}

export function calculateLayout(
  nodes: Record<string, MindMapNode>,
  rootNodeId: string,
  layoutMode: LayoutMode
): { positions: Record<string, { x: number; y: number; width: number; height: number }>; bounds: { x: number; y: number; width: number; height: number } } {
  const tree = buildLayoutTree(rootNodeId, nodes);
  if (!tree) {
    return { positions: {}, bounds: { x: 0, y: 0, width: 0, height: 0 } };
  }

  let bounds: { x: number; y: number; width: number; height: number };
  
  const startX = 400;
  const startY = 300;

  switch (layoutMode) {
    case 'down':
      bounds = layoutDown(tree, startX, startY);
      break;
    case 'both':
      bounds = layoutBoth(tree, startX, startY);
      break;
    case 'free':
      const positions: Record<string, { x: number; y: number; width: number; height: number }> = {};
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      for (const nodeId of Object.keys(nodes)) {
        const node = nodes[nodeId];
        const textWidth = calculateTextWidth(node.text, node.style.fontSize);
        const width = Math.max(MIN_NODE_WIDTH, textWidth + NODE_PADDING * 2);
        const height = NODE_HEIGHT;
        
        positions[nodeId] = {
          x: node.x,
          y: node.y,
          width,
          height,
        };
        
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x + width);
        maxY = Math.max(maxY, node.y + height);
      }
      
      return {
        positions,
        bounds: {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        },
      };
    case 'right':
    default:
      bounds = layoutRight(tree, startX, startY);
      break;
  }

  const positions: Record<string, { x: number; y: number; width: number; height: number }> = {};
  
  function collectPositions(t: LayoutNode) {
    positions[t.id] = {
      x: t.x,
      y: t.y,
      width: t.width,
      height: t.height,
    };
    for (const child of t.children) {
      collectPositions(child);
    }
  }
  
  collectPositions(tree);

  return { positions, bounds };
}
