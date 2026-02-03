import { ref, onMounted, onUnmounted } from 'vue'
import type { Metrics, ApiResponse } from '@/types/event'

export function useMetrics() {
  const metrics = ref<Metrics>({
    total_events: 0,
    agent_runs: 0,
    llm_calls: 0,
    tool_calls: 0,
    retriever_runs: 0,
    errors: 0,
    subscribers: 0,
    buffer_size: 0,
    uptime_seconds: 0
  })

  let timer: number | null = null
  let fetching = false
  let requestId = 0

  async function fetchMetrics() {
    // 节流：如果上一个请求还在进行中，跳过本次
    if (fetching) return

    fetching = true
    const currentRequestId = ++requestId

    try {
      const response = await fetch('/api/metrics')

      // 竞态保护：忽略过期的响应
      if (currentRequestId !== requestId) {
        return
      }

      if (!response.ok) {
        console.error('Metrics API error:', response.status)
        return
      }

      const data: ApiResponse<Metrics> = await response.json()

      // 再次检查竞态
      if (currentRequestId !== requestId) {
        return
      }

      if (data.success && data.data) {
        metrics.value = data.data
      }
    } catch (err) {
      // 只有当前请求才打印错误
      if (currentRequestId === requestId) {
        console.error('Failed to fetch metrics:', err)
      }
    } finally {
      fetching = false
    }
  }

  function formatUptime(seconds: number): string {
    // 确保秒数为整数
    const totalSeconds = Math.floor(seconds)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  onMounted(() => {
    fetchMetrics()
    timer = window.setInterval(fetchMetrics, 1000)
  })

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    // 使过期的响应被忽略
    requestId++
  })

  return {
    metrics,
    formatUptime
  }
}
