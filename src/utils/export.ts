import html2canvas from 'html2canvas';
import { MindMap } from '../types';

export function exportToJSON(mindMap: MindMap): void {
  const dataStr = JSON.stringify(mindMap, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `${mindMap.name}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToMarkdown(mindMap: MindMap): void {
  const lines: string[] = [];
  const visited = new Set<string>();

  function traverse(nodeId: string, level: number) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = mindMap.nodes[nodeId];
    if (!node) return;

    const indent = '  '.repeat(level);
    const bullet = level === 0 ? '# ' : '- ';
    lines.push(`${indent}${bullet}${node.text}`);

    if (!node.collapsed) {
      for (const childId of node.children) {
        traverse(childId, level + 1);
      }
    }
  }

  traverse(mindMap.rootNodeId, 0);

  const markdown = lines.join('\n');
  const dataBlob = new Blob([markdown], { type: 'text/markdown' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `${mindMap.name}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportToPNG(containerId: string, filename: string): Promise<void> {
  const container = document.getElementById(containerId);
  
  if (!container) {
    console.error(`容器元素未找到: #${containerId}，可用元素:`, 
      document.querySelectorAll('[id]').length, '个带 ID 的元素');
    throw new Error(`容器元素未找到: #${containerId}。请确保画布已正确渲染。`);
  }

  try {
    const canvas = await html2canvas(container, {
      backgroundColor: '#fafafa',
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      foreignObjectRendering: true,
    });

    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('导出 PNG 失败:', error);
    
    try {
      const simpleCanvas = await html2canvas(container, {
        backgroundColor: '#fafafa',
        scale: 1,
        useCORS: false,
        logging: false,
        allowTaint: true,
      });

      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = simpleCanvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (fallbackError) {
      console.error('备用导出方式也失败:', fallbackError);
      throw new Error('导出 PNG 失败。可能是因为画布中包含特殊元素。');
    }
  }
}
