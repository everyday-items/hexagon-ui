// 事件类型
export type EventType =
  | 'agent.start'
  | 'agent.end'
  | 'llm.request'
  | 'llm.stream'
  | 'llm.response'
  | 'tool.call'
  | 'tool.result'
  | 'retriever.start'
  | 'retriever.end'
  | 'graph.start'
  | 'graph.node'
  | 'graph.end'
  | 'state.change'
  | 'error'

// 事件接口
export interface Event {
  id: string
  type: EventType
  timestamp: string
  trace_id?: string
  span_id?: string
  parent_id?: string
  agent_id?: string
  agent_name?: string
  data: Record<string, unknown>
}

// 事件配置
export interface EventConfig {
  icon: string
  label: string
  category: 'agent' | 'llm' | 'tool' | 'retriever' | 'graph' | 'state' | 'error' | 'unknown'
}

// 事件类型配置映射
export const EVENT_CONFIG: Record<EventType, EventConfig> = {
  'agent.start': { icon: '🚀', label: 'Agent 开始', category: 'agent' },
  'agent.end': { icon: '✅', label: 'Agent 结束', category: 'agent' },
  'llm.request': { icon: '🤖', label: 'LLM 请求', category: 'llm' },
  'llm.stream': { icon: '💬', label: 'LLM 流式', category: 'llm' },
  'llm.response': { icon: '📝', label: 'LLM 响应', category: 'llm' },
  'tool.call': { icon: '🔧', label: '工具调用', category: 'tool' },
  'tool.result': { icon: '📦', label: '工具结果', category: 'tool' },
  'retriever.start': { icon: '🔍', label: '检索开始', category: 'retriever' },
  'retriever.end': { icon: '📚', label: '检索结束', category: 'retriever' },
  'graph.start': { icon: '📊', label: '图开始', category: 'graph' },
  'graph.node': { icon: '⬡', label: '图节点', category: 'graph' },
  'graph.end': { icon: '🏁', label: '图结束', category: 'graph' },
  'state.change': { icon: '🔄', label: '状态变更', category: 'state' },
  'error': { icon: '❌', label: '错误', category: 'error' }
}

// 指标接口
export interface Metrics {
  total_events: number
  agent_runs: number
  llm_calls: number
  tool_calls: number
  retriever_runs: number
  errors: number
  subscribers: number
  buffer_size: number
  uptime_seconds: number
}

// API 响应
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
