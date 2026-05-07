import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MindMap, MindMapNode, NodeStyle, Connection, LayoutMode, LineStyle } from '../types';
import { generateId, deepClone } from '../utils';
import { calculateLayout } from '../layout';

const STORAGE_KEY = 'mind-map-editor-storage';

const DEFAULT_STYLE: NodeStyle = {
  backgroundColor: '#ffffff',
  borderColor: '#d9d9d9',
  textColor: '#000000',
  fontSize: 14,
  shape: 'rounded-rect',
};

interface HistoryItem {
  mindMaps: Record<string, MindMap>;
  currentMindMapId: string | null;
}

interface AppStoreState {
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
  history: HistoryItem[];
  historyIndex: number;
  maxHistory: number;
}

interface AppStoreActions {
  createMindMap: () => string;
  deleteMindMap: (id: string) => void;
  renameMindMap: (id: string, name: string) => void;
  duplicateMindMap: (id: string) => string;
  selectMindMap: (id: string) => void;
  
  addChildNode: (parentId: string) => string | null;
  addSiblingNode: (nodeId: string) => string | null;
  deleteNode: (nodeId: string) => void;
  updateNodeText: (nodeId: string, text: string) => void;
  updateNodeStyle: (nodeId: string, style: Partial<NodeStyle>) => void;
  collapseNode: (nodeId: string, collapsed: boolean) => void;
  moveNode: (nodeId: string, newParentId: string, insertIndex?: number) => void;
  setNodePosition: (nodeId: string, x: number, y: number) => void;
  
  selectNode: (nodeId: string, multiSelect?: boolean) => void;
  deselectAll: () => void;
  setEditingNode: (nodeId: string | null) => void;
  
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  panBy: (dx: number, dy: number) => void;
  zoomBy: (delta: number, centerX?: number, centerY?: number) => void;
  
  setIsDragging: (dragging: boolean) => void;
  setDragStart: (x: number, y: number) => void;
  setSpacePressed: (pressed: boolean) => void;
  setCommandPanelOpen: (open: boolean) => void;
  
  changeLayoutMode: (mode: LayoutMode) => void;
  changeLineStyle: (style: LineStyle) => void;
  
  fitToScreen: () => void;
  
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  
  getCurrentMindMap: () => MindMap | null;
  getNode: (nodeId: string) => MindMapNode | undefined;
  getParentNode: (nodeId: string) => MindMapNode | undefined;
  getVisibleConnections: () => Connection[];
  canUndo: () => boolean;
  canRedo: () => boolean;
}

function createDefaultMindMap(): MindMap {
  const rootId = generateId();
  const now = Date.now();
  
  const rootNode: MindMapNode = {
    id: rootId,
    text: '中心主题',
    children: [],
    x: 400,
    y: 300,
    width: 120,
    height: 40,
    style: {
      ...DEFAULT_STYLE,
      backgroundColor: '#e6f7ff',
      borderColor: '#1890ff',
      fontSize: 16,
    },
    collapsed: false,
  };

  const child1Id = generateId();
  const child2Id = generateId();
  
  const child1: MindMapNode = {
    id: child1Id,
    text: '分支 1',
    children: [],
    parentId: rootId,
    x: 600,
    y: 250,
    width: 100,
    height: 40,
    style: DEFAULT_STYLE,
    collapsed: false,
  };

  const child2: MindMapNode = {
    id: child2Id,
    text: '分支 2',
    children: [],
    parentId: rootId,
    x: 600,
    y: 350,
    width: 100,
    height: 40,
    style: DEFAULT_STYLE,
    collapsed: false,
  };

  rootNode.children = [child1Id, child2Id];

  const conn1: Connection = {
    id: generateId(),
    from: rootId,
    to: child1Id,
    style: {
      lineStyle: 'straight',
      color: '#1890ff',
      width: 2,
    },
  };

  const conn2: Connection = {
    id: generateId(),
    from: rootId,
    to: child2Id,
    style: {
      lineStyle: 'straight',
      color: '#1890ff',
      width: 2,
    },
  };

  const nodes: Record<string, MindMapNode> = {};
  nodes[rootId] = rootNode;
  nodes[child1Id] = child1;
  nodes[child2Id] = child2;

  const connections: Record<string, Connection> = {};
  connections[conn1.id] = conn1;
  connections[conn2.id] = conn2;

  const mindMap: MindMap = {
    id: generateId(),
    name: '未命名导图',
    createdAt: now,
    updatedAt: now,
    rootNodeId: rootId,
    nodes,
    connections,
    layoutMode: 'right',
    globalLineStyle: 'straight',
  };

  const { positions } = calculateLayout(nodes, rootId, 'right');
  for (const nodeId of Object.keys(positions)) {
    if (nodes[nodeId]) {
      nodes[nodeId].x = positions[nodeId].x;
      nodes[nodeId].y = positions[nodeId].y;
      nodes[nodeId].width = positions[nodeId].width;
      nodes[nodeId].height = positions[nodeId].height;
    }
  }

  return mindMap;
}

type AppStore = AppStoreState & AppStoreActions;

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => {
      const initialMindMap = createDefaultMindMap();
      
      return {
        mindMaps: {
          [initialMindMap.id]: initialMindMap,
        },
        currentMindMapId: initialMindMap.id,
        selectedNodeIds: [],
        editingNodeId: null,
        zoom: 1,
        panX: 0,
        panY: 0,
        isDragging: false,
        dragStartX: 0,
        dragStartY: 0,
        dragPanStartX: 0,
        dragPanStartY: 0,
        spacePressed: false,
        commandPanelOpen: false,
        history: [],
        historyIndex: -1,
        maxHistory: 50,

        createMindMap: () => {
          const newMap = createDefaultMindMap();
          set((state) => ({
            mindMaps: {
              ...state.mindMaps,
              [newMap.id]: newMap,
            },
            currentMindMapId: newMap.id,
          }));
          get().saveToHistory();
          return newMap.id;
        },

        deleteMindMap: (id) => {
          set((state) => {
            const newMindMaps = { ...state.mindMaps };
            delete newMindMaps[id];
            
            let newCurrentId = state.currentMindMapId;
            if (newCurrentId === id) {
              const remainingIds = Object.keys(newMindMaps);
              newCurrentId = remainingIds.length > 0 ? remainingIds[0] : null;
            }
            
            return {
              mindMaps: newMindMaps,
              currentMindMapId: newCurrentId,
            };
          });
          get().saveToHistory();
        },

        renameMindMap: (id, name) => {
          set((state) => {
            const mindMap = state.mindMaps[id];
            if (!mindMap) return state;
            
            return {
              mindMaps: {
                ...state.mindMaps,
                [id]: {
                  ...mindMap,
                  name,
                  updatedAt: Date.now(),
                },
              },
            };
          });
          get().saveToHistory();
        },

        duplicateMindMap: (id) => {
          const original = get().mindMaps[id];
          if (!original) return '';
          
          const newMap = deepClone(original);
          const newId = generateId();
          newMap.id = newId;
          newMap.name = `${original.name} (副本)`;
          newMap.createdAt = Date.now();
          newMap.updatedAt = Date.now();
          
          const idMap: Record<string, string> = {};
          
          function remapNode(node: MindMapNode): MindMapNode {
            const newNodeId = generateId();
            idMap[node.id] = newNodeId;
            return {
              ...node,
              id: newNodeId,
              children: [],
            };
          }
          
          const newNodes: Record<string, MindMapNode> = {};
          
          function cloneNodeTree(nodeId: string, newParentId?: string): string {
            const originalNode = original.nodes[nodeId];
            if (!originalNode) return '';
            
            const newNode = remapNode(originalNode);
            newNode.parentId = newParentId;
            newNodes[newNode.id] = newNode;
            
            for (const childId of originalNode.children) {
              const newChildId = cloneNodeTree(childId, newNode.id);
              newNode.children.push(newChildId);
            }
            
            return newNode.id;
          }
          
          const newRootId = cloneNodeTree(original.rootNodeId);
          newMap.rootNodeId = newRootId;
          newMap.nodes = newNodes;
          
          const newConnections: Record<string, Connection> = {};
          for (const connId of Object.keys(original.connections)) {
            const conn = original.connections[connId];
            const newFromId = idMap[conn.from];
            const newToId = idMap[conn.to];
            if (newFromId && newToId) {
              const newConnId = generateId();
              newConnections[newConnId] = {
                ...conn,
                id: newConnId,
                from: newFromId,
                to: newToId,
              };
            }
          }
          newMap.connections = newConnections;
          
          set((state) => ({
            mindMaps: {
              ...state.mindMaps,
              [newId]: newMap,
            },
            currentMindMapId: newId,
          }));
          
          return newId;
        },

        selectMindMap: (id) => {
          set({
            currentMindMapId: id,
            selectedNodeIds: [],
            editingNodeId: null,
            zoom: 1,
            panX: 0,
            panY: 0,
          });
        },

        addChildNode: (parentId) => {
          const mindMap = get().getCurrentMindMap();
          if (!mindMap) return null;
          
          const parentNode = mindMap.nodes[parentId];
          if (!parentNode) return null;
          
          const newNodeId = generateId();
          const newNode: MindMapNode = {
            id: newNodeId,
            text: '新节点',
            children: [],
            parentId,
            x: parentNode.x + 150,
            y: parentNode.y,
            width: 80,
            height: 40,
            style: DEFAULT_STYLE,
            collapsed: false,
          };

          const newConn: Connection = {
            id: generateId(),
            from: parentId,
            to: newNodeId,
            style: {
              lineStyle: mindMap.globalLineStyle,
              color: '#1890ff',
              width: 2,
            },
          };

          set((state) => {
            const currentMap = state.mindMaps[state.currentMindMapId || ''];
            if (!currentMap) return state;
            
            const updatedParent = {
              ...currentMap.nodes[parentId],
              children: [...currentMap.nodes[parentId].children, newNodeId],
              collapsed: false,
            };

            const updatedMap = {
              ...currentMap,
              updatedAt: Date.now(),
              nodes: {
                ...currentMap.nodes,
                [parentId]: updatedParent,
                [newNodeId]: newNode,
              },
              connections: {
                ...currentMap.connections,
                [newConn.id]: newConn,
              },
            };

            return {
              mindMaps: {
                ...state.mindMaps,
                [updatedMap.id]: updatedMap,
              },
              selectedNodeIds: [newNodeId],
              editingNodeId: newNodeId,
            };
          });

          get().saveToHistory();
          return newNodeId;
        },

        addSiblingNode: (nodeId) => {
          const mindMap = get().getCurrentMindMap();
          if (!mindMap) return null;
          
          const node = mindMap.nodes[nodeId];
          if (!node || !node.parentId) {
            return get().addChildNode(mindMap.rootNodeId);
          }
          
          const parentNode = mindMap.nodes[node.parentId];
          if (!parentNode) return null;
          
          const siblingIndex = parentNode.children.indexOf(nodeId);
          const newNodeId = generateId();
          const newNode: MindMapNode = {
            id: newNodeId,
            text: '新节点',
            children: [],
            parentId: node.parentId,
            x: node.x,
            y: node.y + 60,
            width: 80,
            height: 40,
            style: DEFAULT_STYLE,
            collapsed: false,
          };

          const newConn: Connection = {
            id: generateId(),
            from: node.parentId,
            to: newNodeId,
            style: {
              lineStyle: mindMap.globalLineStyle,
              color: '#1890ff',
              width: 2,
            },
          };

          set((state) => {
            const currentMap = state.mindMaps[state.currentMindMapId || ''];
            if (!currentMap) return state;
            
            const updatedParent = {
              ...currentMap.nodes[node.parentId!],
            };
            
            const newChildren = [...updatedParent.children];
            newChildren.splice(siblingIndex + 1, 0, newNodeId);
            updatedParent.children = newChildren;

            const updatedMap = {
              ...currentMap,
              updatedAt: Date.now(),
              nodes: {
                ...currentMap.nodes,
                [node.parentId!]: updatedParent,
                [newNodeId]: newNode,
              },
              connections: {
                ...currentMap.connections,
                [newConn.id]: newConn,
              },
            };

            return {
              mindMaps: {
                ...state.mindMaps,
                [updatedMap.id]: updatedMap,
              },
              selectedNodeIds: [newNodeId],
              editingNodeId: newNodeId,
            };
          });

          get().saveToHistory();
          return newNodeId;
        },

        deleteNode: (nodeId) => {
          const mindMap = get().getCurrentMindMap();
          if (!mindMap) return;
          
          const node = mindMap.nodes[nodeId];
          if (!node) return;
          
          const currentMap = mindMap;
          
          function collectDescendantIds(id: string): string[] {
            const result: string[] = [id];
            const n = currentMap.nodes[id];
            if (n) {
              for (const childId of n.children) {
                result.push(...collectDescendantIds(childId));
              }
            }
            return result;
          }

          const idsToDelete = collectDescendantIds(nodeId);
          
          set((state) => {
            const currentMap = state.mindMaps[state.currentMindMapId || ''];
            if (!currentMap) return state;
            
            const updatedNodes = { ...currentMap.nodes };
            const updatedConnections = { ...currentMap.connections };
            let updatedParent: MindMapNode | undefined;
            
            if (node.parentId) {
              const parent = updatedNodes[node.parentId];
              if (parent) {
                updatedParent = {
                  ...parent,
                  children: parent.children.filter((id) => id !== nodeId),
                };
                updatedNodes[node.parentId] = updatedParent;
              }
            }
            
            for (const id of idsToDelete) {
              delete updatedNodes[id];
              
              for (const connId of Object.keys(updatedConnections)) {
                const conn = updatedConnections[connId];
                if (conn.from === id || conn.to === id) {
                  delete updatedConnections[connId];
                }
              }
            }

            return {
              mindMaps: {
                ...state.mindMaps,
                [currentMap.id]: {
                  ...currentMap,
                  updatedAt: Date.now(),
                  nodes: updatedNodes,
                  connections: updatedConnections,
                },
              },
              selectedNodeIds: state.selectedNodeIds.filter((id) => !idsToDelete.includes(id)),
              editingNodeId: null,
            };
          });

          get().saveToHistory();
        },

        updateNodeText: (nodeId, text) => {
          set((state) => {
            const currentMap = state.mindMaps[state.currentMindMapId || ''];
            if (!currentMap || !currentMap.nodes[nodeId]) return state;
            
            return {
              mindMaps: {
                ...state.mindMaps,
                [currentMap.id]: {
                  ...currentMap,
                  updatedAt: Date.now(),
                  nodes: {
                    ...currentMap.nodes,
                    [nodeId]: {
                      ...currentMap.nodes[nodeId],
                      text,
                    },
                  },
                },
              },
            };
          });
        },

        updateNodeStyle: (nodeId, style) => {
          set((state) => {
            const currentMap = state.mindMaps[state.currentMindMapId || ''];
            if (!currentMap || !currentMap.nodes[nodeId]) return state;
            
            return {
              mindMaps: {
                ...state.mindMaps,
                [currentMap.id]: {
                  ...currentMap,
                  updatedAt: Date.now(),
                  nodes: {
                    ...currentMap.nodes,
                    [nodeId]: {
                      ...currentMap.nodes[nodeId],
                      style: {
                        ...currentMap.nodes[nodeId].style,
                        ...style,
                      },
                    },
                  },
                },
              },
            };
          });
          get().saveToHistory();
        },

        collapseNode: (nodeId, collapsed) => {
          set((state) => {
            const currentMap = state.mindMaps[state.currentMindMapId || ''];
            if (!currentMap || !currentMap.nodes[nodeId]) return state;
            
            return {
              mindMaps: {
                ...state.mindMaps,
                [currentMap.id]: {
                  ...currentMap,
                  updatedAt: Date.now(),
                  nodes: {
                    ...currentMap.nodes,
                    [nodeId]: {
                      ...currentMap.nodes[nodeId],
                      collapsed,
                    },
                  },
                },
              },
            };
          });
          get().saveToHistory();
        },

        moveNode: (nodeId, newParentId, insertIndex) => {
          const mindMap = get().getCurrentMindMap();
          if (!mindMap) return;
          
          const node = mindMap.nodes[nodeId];
          const newParent = mindMap.nodes[newParentId];
          
          if (!node || !newParent) return;
          
          const currentMap = mindMap;
          
          function isDescendant(parentId: string, childId: string): boolean {
            const parent = currentMap.nodes[parentId];
            if (!parent) return false;
            if (parent.children.includes(childId)) return true;
            for (const cid of parent.children) {
              if (isDescendant(cid, childId)) return true;
            }
            return false;
          }
          
          if (isDescendant(nodeId, newParentId)) return;
          
          set((state) => {
            const currentMap = state.mindMaps[state.currentMindMapId || ''];
            if (!currentMap) return state;
            
            const updatedNodes = { ...currentMap.nodes };
            const updatedConnections = { ...currentMap.connections };
            
            if (node.parentId) {
              const oldParent = updatedNodes[node.parentId];
              if (oldParent) {
                updatedNodes[node.parentId] = {
                  ...oldParent,
                  children: oldParent.children.filter((id) => id !== nodeId),
                };
              }
              
              for (const connId of Object.keys(updatedConnections)) {
                const conn = updatedConnections[connId];
                if (conn.from === node.parentId && conn.to === nodeId) {
                  updatedConnections[connId] = {
                    ...conn,
                    from: newParentId,
                  };
                }
              }
            }
            
            const updatedNewParent = { ...updatedNodes[newParentId] };
            const newChildren = [...updatedNewParent.children];
            const existingIndex = newChildren.indexOf(nodeId);
            if (existingIndex !== -1) {
              newChildren.splice(existingIndex, 1);
            }
            if (insertIndex !== undefined && insertIndex >= 0) {
              newChildren.splice(insertIndex, 0, nodeId);
            } else {
              newChildren.push(nodeId);
            }
            updatedNewParent.children = newChildren;
            updatedNewParent.collapsed = false;
            updatedNodes[newParentId] = updatedNewParent;
            
            updatedNodes[nodeId] = {
              ...updatedNodes[nodeId],
              parentId: newParentId,
            };

            return {
              mindMaps: {
                ...state.mindMaps,
                [currentMap.id]: {
                  ...currentMap,
                  updatedAt: Date.now(),
                  nodes: updatedNodes,
                  connections: updatedConnections,
                },
              },
            };
          });

          get().saveToHistory();
        },

        setNodePosition: (nodeId, x, y) => {
          set((state) => {
            const currentMap = state.mindMaps[state.currentMindMapId || ''];
            if (!currentMap || !currentMap.nodes[nodeId]) return state;
            
            return {
              mindMaps: {
                ...state.mindMaps,
                [currentMap.id]: {
                  ...currentMap,
                  updatedAt: Date.now(),
                  nodes: {
                    ...currentMap.nodes,
                    [nodeId]: {
                      ...currentMap.nodes[nodeId],
                      x,
                      y,
                    },
                  },
                },
              },
            };
          });
        },

        selectNode: (nodeId, multiSelect) => {
          set((state) => {
            let newSelectedIds: string[];
            if (multiSelect) {
              if (state.selectedNodeIds.includes(nodeId)) {
                newSelectedIds = state.selectedNodeIds.filter((id) => id !== nodeId);
              } else {
                newSelectedIds = [...state.selectedNodeIds, nodeId];
              }
            } else {
              newSelectedIds = [nodeId];
            }
            return {
              selectedNodeIds: newSelectedIds,
              editingNodeId: null,
            };
          });
        },

        deselectAll: () => {
          set({
            selectedNodeIds: [],
            editingNodeId: null,
          });
        },

        setEditingNode: (nodeId) => {
          set({
            editingNodeId: nodeId,
          });
        },

        setZoom: (zoom) => {
          const clampedZoom = Math.max(0.3, Math.min(3, zoom));
          set({ zoom: clampedZoom });
        },

        setPan: (x, y) => {
          set({ panX: x, panY: y });
        },

        panBy: (dx, dy) => {
          set((state) => ({
            panX: state.panX + dx,
            panY: state.panY + dy,
          }));
        },

        zoomBy: (delta, centerX, centerY) => {
          set((state) => {
            const newZoom = Math.max(0.3, Math.min(3, state.zoom + delta * state.zoom * 0.2));
            const zoomRatio = newZoom / state.zoom;
            
            let newPanX = state.panX;
            let newPanY = state.panY;
            
            if (centerX !== undefined && centerY !== undefined) {
              newPanX = centerX - (centerX - state.panX) * zoomRatio;
              newPanY = centerY - (centerY - state.panY) * zoomRatio;
            }
            
            return {
              zoom: newZoom,
              panX: newPanX,
              panY: newPanY,
            };
          });
        },

        setIsDragging: (dragging) => {
          set({ isDragging: dragging });
        },

        setDragStart: (x, y) => {
          set((state) => ({
            dragStartX: x,
            dragStartY: y,
            dragPanStartX: state.panX,
            dragPanStartY: state.panY,
          }));
        },

        setSpacePressed: (pressed) => {
          set({ spacePressed: pressed });
        },

        setCommandPanelOpen: (open) => {
          set({ commandPanelOpen: open });
        },

        changeLayoutMode: (mode) => {
          set((state) => {
            const currentMap = state.mindMaps[state.currentMindMapId || ''];
            if (!currentMap) return state;
            
            const { positions } = calculateLayout(currentMap.nodes, currentMap.rootNodeId, mode);
            
            const updatedNodes = { ...currentMap.nodes };
            for (const nodeId of Object.keys(positions)) {
              if (updatedNodes[nodeId]) {
                updatedNodes[nodeId] = {
                  ...updatedNodes[nodeId],
                  x: positions[nodeId].x,
                  y: positions[nodeId].y,
                  width: positions[nodeId].width,
                  height: positions[nodeId].height,
                };
              }
            }

            return {
              mindMaps: {
                ...state.mindMaps,
                [currentMap.id]: {
                  ...currentMap,
                  updatedAt: Date.now(),
                  layoutMode: mode,
                  nodes: updatedNodes,
                },
              },
            };
          });
          get().saveToHistory();
        },

        changeLineStyle: (style) => {
          set((state) => {
            const currentMap = state.mindMaps[state.currentMindMapId || ''];
            if (!currentMap) return state;
            
            const updatedConnections = { ...currentMap.connections };
            for (const connId of Object.keys(updatedConnections)) {
              updatedConnections[connId] = {
                ...updatedConnections[connId],
                style: {
                  ...updatedConnections[connId].style,
                  lineStyle: style,
                },
              };
            }

            return {
              mindMaps: {
                ...state.mindMaps,
                [currentMap.id]: {
                  ...currentMap,
                  updatedAt: Date.now(),
                  globalLineStyle: style,
                  connections: updatedConnections,
                },
              },
            };
          });
          get().saveToHistory();
        },

        fitToScreen: () => {
          const mindMap = get().getCurrentMindMap();
          if (!mindMap) return;
          
          const viewportWidth = window.innerWidth - 250;
          const viewportHeight = window.innerHeight - 60;
          
          const { bounds } = calculateLayout(
            mindMap.nodes,
            mindMap.rootNodeId,
            mindMap.layoutMode
          );
          
          if (bounds.width === 0 || bounds.height === 0) return;
          
          const padding = 50;
          const scaleX = (viewportWidth - padding * 2) / bounds.width;
          const scaleY = (viewportHeight - padding * 2) / bounds.height;
          const newZoom = Math.min(scaleX, scaleY, 1);
          
          const clampedZoom = Math.max(0.3, Math.min(3, newZoom));
          const centerX = viewportWidth / 2 + 250 / 2;
          const centerY = viewportHeight / 2 + 30;
          const contentCenterX = bounds.x + bounds.width / 2;
          const contentCenterY = bounds.y + bounds.height / 2;
          
          const newPanX = centerX - contentCenterX * clampedZoom;
          const newPanY = centerY - contentCenterY * clampedZoom;
          
          set({
            zoom: clampedZoom,
            panX: newPanX,
            panY: newPanY,
          });
        },

        saveToHistory: () => {
          set((state) => {
            const newHistoryItem: HistoryItem = {
              mindMaps: deepClone(state.mindMaps),
              currentMindMapId: state.currentMindMapId,
            };
            
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push(newHistoryItem);
            
            if (newHistory.length > state.maxHistory) {
              newHistory.shift();
              return {
                history: newHistory,
                historyIndex: newHistory.length - 1,
              };
            }
            
            return {
              history: newHistory,
              historyIndex: newHistory.length - 1,
            };
          });
        },

        undo: () => {
          const state = get();
          if (state.historyIndex <= 0) return;
          
          const prevIndex = state.historyIndex - 1;
          const prevState = state.history[prevIndex];
          
          if (prevState) {
            set({
              mindMaps: deepClone(prevState.mindMaps),
              currentMindMapId: prevState.currentMindMapId,
              historyIndex: prevIndex,
              selectedNodeIds: [],
              editingNodeId: null,
            });
          }
        },

        redo: () => {
          const state = get();
          if (state.historyIndex >= state.history.length - 1) return;
          
          const nextIndex = state.historyIndex + 1;
          const nextState = state.history[nextIndex];
          
          if (nextState) {
            set({
              mindMaps: deepClone(nextState.mindMaps),
              currentMindMapId: nextState.currentMindMapId,
              historyIndex: nextIndex,
              selectedNodeIds: [],
              editingNodeId: null,
            });
          }
        },

        getCurrentMindMap: () => {
          const state = get();
          if (!state.currentMindMapId) return null;
          return state.mindMaps[state.currentMindMapId] || null;
        },

        getNode: (nodeId) => {
          const mindMap = get().getCurrentMindMap();
          return mindMap?.nodes[nodeId];
        },

        getParentNode: (nodeId) => {
          const node = get().getNode(nodeId);
          if (!node?.parentId) return undefined;
          return get().getNode(node.parentId);
        },

        getVisibleConnections: () => {
          const mindMap = get().getCurrentMindMap();
          if (!mindMap) return [];
          
          const currentMap = mindMap;
          const visibleConnections: Connection[] = [];
          const visibleNodeIds = new Set<string>();
          
          function collectVisibleNodes(nodeId: string) {
            visibleNodeIds.add(nodeId);
            const node = currentMap.nodes[nodeId];
            if (node && !node.collapsed) {
              for (const childId of node.children) {
                collectVisibleNodes(childId);
              }
            }
          }
          
          collectVisibleNodes(currentMap.rootNodeId);
          
          for (const connId of Object.keys(currentMap.connections)) {
            const conn = currentMap.connections[connId];
            if (visibleNodeIds.has(conn.from) && visibleNodeIds.has(conn.to)) {
              visibleConnections.push(conn);
            }
          }
          
          return visibleConnections;
        },

        canUndo: () => {
          return get().historyIndex > 0;
        },

        canRedo: () => {
          return get().historyIndex < get().history.length - 1;
        },
      };
    },
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        mindMaps: state.mindMaps,
        currentMindMapId: state.currentMindMapId,
      }),
    }
  )
);
