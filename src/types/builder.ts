// 图定义
export interface GraphDefinition {
  id: string
  name: string
  description?: string
  version: number
  nodes: GraphNodeDef[]
  edges: GraphEdgeDef[]
  entry_point: string
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

// 节点定义
export interface GraphNodeDef {
  id: string
  name: string
  type: NodeType
  position: { x: number; y: number }
  description?: string
  config?: Record<string, unknown>
}

// 节点类型
export type NodeType = 'start' | 'end' | 'agent' | 'tool' | 'condition' | 'parallel' | 'llm'

// 边定义
export interface GraphEdgeDef {
  id: string
  source: string
  target: string
  label?: string
  condition?: string
}

// 节点类型信息（来自后端 /api/builder/node-types）
export interface NodeTypeInfo {
  type: NodeType
  name: string
  description: string
  icon: string
  color: string
  category: string
}

// 图验证结果
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// 节点执行结果
export interface NodeResult {
  node_id: string
  node_name: string
  node_type: string
  status: string
  duration_ms: number
  output?: Record<string, unknown>
}

// 图执行结果
export interface ExecutionResult {
  run_id: string
  graph_id: string
  status: string
  final_state: Record<string, unknown>
  node_results: NodeResult[]
  duration_ms: number
  error?: string
}

// 节点样式配置
export const NODE_STYLES: Record<NodeType, { color: string; bgColor: string; icon: string }> = {
  start:     { color: '#58a6ff', bgColor: 'rgba(88, 166, 255, 0.15)', icon: '▶️' },
  end:       { color: '#58a6ff', bgColor: 'rgba(88, 166, 255, 0.15)', icon: '⏹️' },
  agent:     { color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.15)', icon: '🤖' },
  tool:      { color: '#3fb950', bgColor: 'rgba(63, 185, 80, 0.15)',  icon: '🔧' },
  llm:       { color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)', icon: '🧠' },
  condition: { color: '#d29922', bgColor: 'rgba(210, 153, 34, 0.15)', icon: '🔀' },
  parallel:  { color: '#f85149', bgColor: 'rgba(248, 81, 73, 0.15)',  icon: '⚡' },
}
