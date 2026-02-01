import { ref, onMounted, onUnmounted } from 'vue'
import type { Event, EventType } from '@/types/event'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'paused'

export function useSSE() {
  const events = ref<Event[]>([])
  const status = ref<ConnectionStatus>('connecting')
  const paused = ref(false)
  const streamContent = ref<Record<string, string>>({})

  let eventSource: EventSource | null = null
  let reconnectTimer: number | null = null

  // 连接 SSE
  function connect() {
    if (eventSource) {
      eventSource.close()
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

    // 监听所有事件类型
    const eventTypes: EventType[] = [
      'agent.start', 'agent.end',
      'llm.request', 'llm.stream', 'llm.response',
      'tool.call', 'tool.result',
      'retriever.start', 'retriever.end',
      'graph.start', 'graph.node', 'graph.end',
      'state.change', 'error'
    ]

    eventTypes.forEach(type => {
      eventSource!.addEventListener(type, (e: MessageEvent) => {
        handleEvent(type, e.data)
      })
    })

    // 连接成功事件
    eventSource.addEventListener('connected', (e: MessageEvent) => {
      console.log('Connected:', e.data)
    })
  }

  // 处理事件
  function handleEvent(type: EventType, data: string) {
    if (paused.value) return

    try {
      const event: Event = JSON.parse(data)
      event.type = type

      // 处理 LLM 流式事件
      if (type === 'llm.stream') {
        const runId = (event.data?.run_id as string) || event.id
        if (!streamContent.value[runId]) {
          streamContent.value[runId] = ''
        }
        streamContent.value[runId] += (event.data?.content as string) || ''
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

  // 断开连接
  function disconnect() {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
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
    connect,
    disconnect
  }
}
