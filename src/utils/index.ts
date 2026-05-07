export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function countDescendants(nodeId: string, nodes: Record<string, any>): number {
  let count = 0;
  const node = nodes[nodeId];
  if (node && node.children) {
    for (const childId of node.children) {
      count += 1 + countDescendants(childId, nodes);
    }
  }
  return count;
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function calculateTextWidth(text: string, fontSize: number): number {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.font = `${fontSize}px system-ui, -apple-system, sans-serif`;
    return ctx.measureText(text).width;
  }
  return text.length * fontSize * 0.6;
}

export const COLOR_PALETTE = {
  background: [
    '#ffffff',
    '#fff7e6',
    '#f6ffed',
    '#e6f7ff',
    '#fff1f0',
    '#f9f0ff',
    '#fffbe6',
    '#e6f4ff',
  ],
  border: [
    '#d9d9d9',
    '#faad14',
    '#52c41a',
    '#1890ff',
    '#ff4d4f',
    '#722ed1',
    '#faad14',
    '#1677ff',
  ],
  text: [
    '#000000',
    '#ffffff',
    '#1890ff',
    '#ff4d4f',
    '#52c41a',
    '#722ed1',
    '#faad14',
  ],
};
