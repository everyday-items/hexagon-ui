import { ref, computed } from 'vue'
import type { GraphDefinition, GraphNodeDef, GraphEdgeDef, NodeType } from '@/types/builder'

// 全局图状态管理
const currentGraph = ref<GraphDefinition | null>(null)
const nodes = ref<GraphNodeDef[]>([])
const edges = ref<GraphEdgeDef[]>([])
const selectedNodeId = ref<string | null>(null)
const isDirty = ref(false)

let nextNodeId = 1
let nextEdgeId = 1

// 生成唯一节点 ID
function generateNodeId(): string {
  return `node-${Date.now()}-${nextNodeId++}`
}

// 生成唯一边 ID
function generateEdgeId(): string {
  return `edge-${Date.now()}-${nextEdgeId++}`
}

export function useGraphStore() {
  // 选中的节点
  const selectedNode = computed(() => {
    if (!selectedNodeId.value) return null
    return nodes.value.find(n => n.id === selectedNodeId.value) ?? null
  })

  // 从 GraphDefinition 同步到本地状态
  function syncFromDefinition(def: GraphDefinition) {
    currentGraph.value = def
    nodes.value = [...def.nodes]
    edges.value = [...def.edges]
    isDirty.value = false
    selectedNodeId.value = null
  }

  // 从本地状态同步到 GraphDefinition
  function syncToDefinition(): Partial<GraphDefinition> {
    // 自动查找 entry_point（start 节点）
    const startNode = nodes.value.find(n => n.type === 'start')
    return {
      ...(currentGraph.value || {}),
      nodes: [...nodes.value],
      edges: [...edges.value],
      entry_point: startNode?.id || '',
    }
  }

  // 添加节点
  function addNode(type: NodeType, name: string, position: { x: number; y: number }, config?: Record<string, unknown>) {
    const node: GraphNodeDef = {
      id: generateNodeId(),
      name,
      type,
      position,
      config,
    }
    nodes.value = [...nodes.value, node]
    isDirty.value = true
    return node
  }

  // 移除节点（同时移除关联的边）
  function removeNode(nodeId: string) {
    nodes.value = nodes.value.filter(n => n.id !== nodeId)
    edges.value = edges.value.filter(e => e.source !== nodeId && e.target !== nodeId)
    if (selectedNodeId.value === nodeId) {
      selectedNodeId.value = null
    }
    isDirty.value = true
  }

  // 更新节点位置
  function updateNodePosition(nodeId: string, position: { x: number; y: number }) {
    const idx = nodes.value.findIndex(n => n.id === nodeId)
    if (idx === -1) return
    const updated = [...nodes.value]
    updated[idx] = { ...updated[idx], position }
    nodes.value = updated
    isDirty.value = true
  }

  // 更新节点属性
  function updateNodeProps(nodeId: string, props: Partial<GraphNodeDef>) {
    const idx = nodes.value.findIndex(n => n.id === nodeId)
    if (idx === -1) return
    const updated = [...nodes.value]
    updated[idx] = { ...updated[idx], ...props }
    nodes.value = updated
    isDirty.value = true
  }

  // 添加边
  function addEdge(source: string, target: string, label?: string, condition?: string) {
    // 避免重复边
    const exists = edges.value.some(e => e.source === source && e.target === target)
    if (exists) return null

    const edge: GraphEdgeDef = {
      id: generateEdgeId(),
      source,
      target,
      label,
      condition,
    }
    edges.value = [...edges.value, edge]
    isDirty.value = true
    return edge
  }

  // 移除边
  function removeEdge(edgeId: string) {
    edges.value = edges.value.filter(e => e.id !== edgeId)
    isDirty.value = true
  }

  // 选择节点
  function selectNode(nodeId: string | null) {
    selectedNodeId.value = nodeId
  }

  // 新建空图
  function newGraph(name: string) {
    currentGraph.value = null
    nodes.value = []
    edges.value = []
    isDirty.value = false
    selectedNodeId.value = null

    // 添加默认的 start 和 end 节点
    addNode('start', '开始', { x: 100, y: 250 })
    addNode('end', '结束', { x: 700, y: 250 })

    // 创建临时图定义
    currentGraph.value = {
      id: '',
      name,
      version: 0,
      nodes: nodes.value,
      edges: edges.value,
      entry_point: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  // 清空
  function clear() {
    currentGraph.value = null
    nodes.value = []
    edges.value = []
    isDirty.value = false
    selectedNodeId.value = null
  }

  return {
    currentGraph,
    nodes,
    edges,
    selectedNodeId,
    selectedNode,
    isDirty,
    syncFromDefinition,
    syncToDefinition,
    addNode,
    removeNode,
    updateNodePosition,
    updateNodeProps,
    addEdge,
    removeEdge,
    selectNode,
    newGraph,
    clear,
  }
}
