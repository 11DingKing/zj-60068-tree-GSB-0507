export type LayoutMode = 'right' | 'down' | 'both' | 'free';
export type LineStyle = 'straight' | 'orthogonal' | 'bezier';
export type NodeShape = 'rounded-rect' | 'ellipse' | 'diamond' | 'capsule';

export interface NodeStyle {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  fontSize: number;
  shape: NodeShape;
  iconId?: string;
}

export interface ConnectionStyle {
  lineStyle: LineStyle;
  color: string;
  width: number;
}

export interface MindMapNode {
  id: string;
  text: string;
  children: string[];
  parentId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: NodeStyle;
  collapsed: boolean;
  side?: 'left' | 'right';
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  style: ConnectionStyle;
}

export interface MindMap {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  rootNodeId: string;
  nodes: Record<string, MindMapNode>;
  connections: Record<string, Connection>;
  layoutMode: LayoutMode;
  globalLineStyle: LineStyle;
}

export interface AppState {
  mindMaps: Record<string, MindMap>;
  currentMindMapId: string | null;
  selectedNodeIds: string[];
  editingNodeId: string | null;
  zoom: number;
  panX: number;
  panY: number;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
  dragPanStartX: number;
  dragPanStartY: number;
  spacePressed: boolean;
  commandPanelOpen: boolean;
}

export interface HistoryState {
  past: MindMap[];
  future: MindMap[];
  maxHistory: number;
}

export type ActionType = 
  | 'addNode'
  | 'deleteNode'
  | 'updateNodeText'
  | 'updateNodeStyle'
  | 'moveNode'
  | 'collapseNode'
  | 'changeLayout'
  | 'changeLineStyle'
  | 'renameMindMap'
  | 'deleteMindMap';

export interface CommandItem {
  id: string;
  label: string;
  description: string;
  shortcut?: string;
  action: () => void;
}
