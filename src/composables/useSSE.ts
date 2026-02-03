import { ref, onMounted, onUnmounted } from 'vue'
import type { Event, EventType } from '@/types/event'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'paused'

// 流式内容最大保留条目数
const MAX_STREAM_ENTRIES = 100

// 事件类型验证
function isValidEvent(obj: unknown): obj is Omit<Event, 'type'> {
  if (typeof obj !== 'object' || obj === null) return false
  const e = obj as Record<string, unknown>
  return (
    typeof e.id === 'string' &&
    typeof e.timestamp === 'string' &&
    (e.data === undefined || typeof e.data === 'object')
  )
}

export function useSSE() {
  const events = ref<Event[]>([])
  const status = ref<ConnectionStatus>('connecting')
  const paused = ref(false)
  const streamContent = ref<Record<string, string>>({})

  let eventSource: EventSource | null = null
  let reconnectTimer: number | null = null
  const handlers = new Map<string, EventListener>()

  // 事件类型列表
  const eventTypes: EventType[] = [
    'agent.start', 'agent.end',
    'llm.request', 'llm.stream', 'llm.response',
    'tool.call', 'tool.result',
    'retriever.start', 'retriever.end',
    'graph.start', 'graph.node', 'graph.end',
    'state.change', 'error'
  ]

  // 连接 SSE
  function connect() {
    if (eventSource) {
      cleanup()
    }

    const protocol = window.location.protocol
    const host = window.location.host
    const url = `${protocol}//${host}/events`

    console.log('Connecting to SSE:', url)
    status.value = 'connecting'

    eventSource = new EventSource(url)

    eventSource.onopen = () => {
      console.log('SSE connected')
      status.value = 'connected'
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }

    eventSource.onerror = (err) => {
      console.error('SSE error:', err)
      status.value = 'disconnected'
      scheduleReconnect()
    }

    // 监听所有事件类型，保存引用以便清理
    eventTypes.forEach(type => {
      const handler = (e: MessageEvent) => {
        handleEvent(type, e.data)
      }
      handlers.set(type, handler as EventListener)
      eventSource!.addEventListener(type, handler)
    })

    // 连接成功事件
    const connectedHandler = (e: MessageEvent) => {
      console.log('Connected:', e.data)
    }
    handlers.set('connected', connectedHandler as EventListener)
    eventSource.addEventListener('connected', connectedHandler)
  }

  // 处理事件
  function handleEvent(type: EventType, data: string) {
    if (paused.value) return

    try {
      const parsed = JSON.parse(data)

      // 验证事件结构
      if (!isValidEvent(parsed)) {
        console.error('Invalid event structure:', parsed)
        return
      }

      const event: Event = {
        ...parsed,
        type,
        data: parsed.data || {}
      }

      // 处理 LLM 流式事件
      if (type === 'llm.stream') {
        const runId = getRunId(event)

        // 限制 streamContent 条目数，防止内存泄漏
        const keys = Object.keys(streamContent.value)
        if (keys.length >= MAX_STREAM_ENTRIES && !streamContent.value[runId]) {
          // 删除最旧的条目
          delete streamContent.value[keys[0]]
        }

        if (!streamContent.value[runId]) {
          streamContent.value[runId] = ''
        }

        const content = event.data?.content
        if (typeof content === 'string') {
          streamContent.value[runId] += content
        }
      }

      // 添加事件
      events.value.unshift(event)

      // 限制事件数量
      if (events.value.length > 1000) {
        events.value.pop()
      }
    } catch (err) {
      console.error('Failed to parse event:', err, data)
    }
  }

  // 获取运行 ID，确保始终有值
  function getRunId(event: Event): string {
    const runId = event.data?.run_id
    if (typeof runId === 'string' && runId) {
      return runId
    }
    if (event.id) {
      return event.id
    }
    return `fallback-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }

  // 重连
  function scheduleReconnect() {
    if (reconnectTimer) return

    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null
      if (status.value === 'disconnected') {
        console.log('Attempting to reconnect...')
        connect()
      }
    }, 3000)
  }

  // 暂停/继续
  function togglePause() {
    paused.value = !paused.value
    if (paused.value) {
      status.value = 'paused'
    } else if (eventSource?.readyState === EventSource.OPEN) {
      status.value = 'connected'
    }
  }

  // 清空
  function clear() {
    events.value = []
    streamContent.value = {}
  }

  // 清理监听器
  function cleanup() {
    if (eventSource) {
      // 移除所有监听器
      handlers.forEach((handler, type) => {
        eventSource?.removeEventListener(type, handler)
      })
      handlers.clear()
      eventSource.close()
      eventSource = null
    }
  }

  // 断开连接
  function disconnect() {
    cleanup()
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    status.value = 'disconnected'
  }

  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    events,
    status,
    paused,
    streamContent,
    togglePause,
    clear,
    getRunId
  }
}
