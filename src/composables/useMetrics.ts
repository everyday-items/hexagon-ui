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

  async function fetchMetrics() {
    try {
      const response = await fetch('/api/metrics')
      const data: ApiResponse<Metrics> = await response.json()
      if (data.success && data.data) {
        metrics.value = data.data
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err)
    }
  }

  function formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  onMounted(() => {
    fetchMetrics()
    timer = window.setInterval(fetchMetrics, 1000)
  })

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer)
    }
  })

  return {
    metrics,
    formatUptime
  }
}
