<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSSE, type ConnectionStatus } from '@/composables/useSSE'
import { useMetrics } from '@/composables/useMetrics'
import { EVENT_CONFIG, type Event, type EventType } from '@/types/event'

// SSE 连接
const { events, status, paused, streamContent, togglePause, clear } = useSSE()

// 指标
const { metrics, formatUptime } = useMetrics()

// 选中的事件
const selectedEvent = ref<Event | null>(null)

// 事件类型过滤
const eventFilter = ref<EventType | ''>('')

// 过滤后的事件
const filteredEvents = computed(() => {
  if (!eventFilter.value) return events.value
  return events.value.filter(e => e.type === eventFilter.value)
})

// 连接状态文本
const statusText = computed(() => {
  const map: Record<ConnectionStatus, string> = {
    connecting: '连接中...',
    connected: '已连接',
    disconnected: '已断开',
    paused: '已暂停'
  }
  return map[status.value]
})

// 获取事件配置
function getEventConfig(type: EventType) {
  return EVENT_CONFIG[type] || { icon: '📌', label: type, category: 'unknown' }
}

// 获取事件标题
function getEventTitle(event: Event): string {
  const data = event.data || {}

  switch (event.type) {
    case 'agent.start':
      return `Agent: ${data.input || data.run_id || 'unknown'}`
    case 'agent.end':
      return `完成 (${data.duration_ms}ms)`
    case 'llm.request':
      return `${data.model || 'LLM'}: 请求中...`
    case 'llm.stream':
      return (data.content as string)?.substring(0, 50) || '...'
    case 'llm.response':
      return `${data.model}: ${data.total_tokens} tokens`
    case 'tool.call':
      return `调用: ${data.tool_name}`
    case 'tool.result':
      return `${data.tool_name}: ${data.error ? '失败' : '成功'}`
    case 'retriever.start':
      return `检索: ${(data.query as string)?.substring(0, 30)}...`
    case 'retriever.end':
      return `找到 ${data.doc_count} 个文档`
    case 'error':
      return (data.message as string)?.substring(0, 50) || '错误'
    default:
      return event.type
  }
}

// 格式化时间
function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 格式化日期时间
function formatDateTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 格式化 JSON
function formatJSON(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

// 选择事件
function selectEvent(event: Event) {
  selectedEvent.value = event
}

// 获取流式内容
function getStreamContent(event: Event): string {
  if (!['llm.request', 'llm.stream', 'llm.response'].includes(event.type)) {
    return ''
  }
  const runId = (event.data?.run_id as string) || event.id
  return streamContent.value[runId] || ''
}
</script>

<template>
  <div class="app">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-icon">⬡</span>
          <span class="logo-text">Hexagon Dev UI</span>
        </div>
      </div>
      <div class="header-center">
        <div :class="['connection-status', status]">
          <span class="status-dot"></span>
          <span class="status-text">{{ statusText }}</span>
        </div>
      </div>
      <div class="header-right">
        <button class="btn btn-icon" title="清空事件" @click="clear">
          🗑️
        </button>
        <button class="btn btn-icon" title="暂停/继续" @click="togglePause">
          {{ paused ? '▶️' : '⏸️' }}
        </button>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="main">
      <!-- 左侧事件列表 -->
      <aside class="sidebar">
        <div class="panel-header">
          <h3>事件流</h3>
          <select v-model="eventFilter" class="event-filter">
            <option value="">全部类型</option>
            <option value="agent.start">Agent 开始</option>
            <option value="agent.end">Agent 结束</option>
            <option value="llm.request">LLM 请求</option>
            <option value="llm.stream">LLM 流式</option>
            <option value="llm.response">LLM 响应</option>
            <option value="tool.call">工具调用</option>
            <option value="tool.result">工具结果</option>
            <option value="retriever.start">检索开始</option>
            <option value="retriever.end">检索结束</option>
            <option value="error">错误</option>
          </select>
        </div>
        <div class="event-list">
          <div v-if="filteredEvents.length === 0" class="empty-state">
            <span class="empty-icon">📭</span>
            <p>等待事件...</p>
          </div>
          <div
            v-for="event in filteredEvents.slice(0, 100)"
            :key="event.id"
            :class="['event-item', { selected: selectedEvent?.id === event.id }]"
            @click="selectEvent(event)"
          >
            <div :class="['event-icon', getEventConfig(event.type).category]">
              {{ getEventConfig(event.type).icon }}
            </div>
            <div class="event-content">
              <div class="event-title">{{ getEventTitle(event) }}</div>
              <div class="event-meta">
                <span class="event-type">{{ getEventConfig(event.type).label }}</span>
                <span class="event-time">{{ formatTime(event.timestamp) }}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- 中间详情 -->
      <section class="content">
        <div class="panel-header">
          <h3>
            {{ selectedEvent ? `${getEventConfig(selectedEvent.type).icon} ${getEventConfig(selectedEvent.type).label}` : '事件详情' }}
          </h3>
        </div>
        <div class="detail-view">
          <div v-if="!selectedEvent" class="empty-state">
            <span class="empty-icon">👈</span>
            <p>选择一个事件查看详情</p>
          </div>
          <template v-else>
            <!-- 基本信息 -->
            <div class="detail-section">
              <div class="detail-section-title">基本信息</div>
              <div class="detail-content">
                <div class="detail-row">
                  <span class="detail-label">事件 ID</span>
                  <span class="detail-value">{{ selectedEvent.id }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">类型</span>
                  <span class="detail-value">{{ selectedEvent.type }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">时间</span>
                  <span class="detail-value">{{ formatDateTime(selectedEvent.timestamp) }}</span>
                </div>
                <div v-if="selectedEvent.trace_id" class="detail-row">
                  <span class="detail-label">Trace ID</span>
                  <span class="detail-value">{{ selectedEvent.trace_id }}</span>
                </div>
                <div v-if="selectedEvent.agent_id" class="detail-row">
                  <span class="detail-label">Agent ID</span>
                  <span class="detail-value">{{ selectedEvent.agent_id }}</span>
                </div>
              </div>
            </div>

            <!-- 事件数据 -->
            <div v-if="Object.keys(selectedEvent.data).length > 0" class="detail-section">
              <div class="detail-section-title">事件数据</div>
              <pre class="detail-content">{{ formatJSON(selectedEvent.data) }}</pre>
            </div>

            <!-- 流式内容 -->
            <div v-if="getStreamContent(selectedEvent)" class="detail-section">
              <div class="detail-section-title">流式输出</div>
              <pre class="detail-content">{{ getStreamContent(selectedEvent) }}</pre>
            </div>
          </template>
        </div>
      </section>

      <!-- 右侧指标 -->
      <aside class="metrics-panel">
        <div class="panel-header">
          <h3>实时指标</h3>
        </div>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">{{ metrics.total_events }}</div>
            <div class="metric-label">总事件</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">{{ metrics.agent_runs }}</div>
            <div class="metric-label">Agent 运行</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">{{ metrics.llm_calls }}</div>
            <div class="metric-label">LLM 调用</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">{{ metrics.tool_calls }}</div>
            <div class="metric-label">工具调用</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">{{ metrics.retriever_runs }}</div>
            <div class="metric-label">检索次数</div>
          </div>
          <div class="metric-card error">
            <div class="metric-value">{{ metrics.errors }}</div>
            <div class="metric-label">错误</div>
          </div>
        </div>
        <div class="uptime-info">
          <span>运行时间: </span>
          <span>{{ formatUptime(metrics.uptime_seconds) }}</span>
        </div>
      </aside>
    </main>

    <!-- 底部 -->
    <footer class="footer">
      <div class="footer-left">
        <span>{{ events.length }} 个事件</span>
      </div>
      <div class="footer-center">
        <span v-if="events.length > 0">最后更新: {{ formatTime(events[0].timestamp) }}</span>
      </div>
      <div class="footer-right">
        <span>Hexagon AI Agent Framework</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* 样式在 main.css 中定义 */
</style>
