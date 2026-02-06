import { ref } from 'vue'
import type { GraphDefinition, NodeTypeInfo, ValidationResult, ExecutionResult } from '@/types/builder'
import type { ApiResponse } from '@/types/event'

// API 基础路径
const API_BASE = '/api/builder'

// 通用请求函数
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data: ApiResponse<T> = await resp.json()
  if (!data.success) {
    throw new Error(data.error || '请求失败')
  }
  return data.data as T
}

// Builder API 封装
export function useBuilderApi() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 包装异步调用，统一处理 loading 和 error
  async function withLoading<T>(fn: () => Promise<T>): Promise<T | null> {
    loading.value = true
    error.value = null
    try {
      return await fn()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '未知错误'
      return null
    } finally {
      loading.value = false
    }
  }

  // 获取所有图定义
  async function fetchGraphs(): Promise<{ graphs: GraphDefinition[]; total: number } | null> {
    return withLoading(() =>
      request<{ graphs: GraphDefinition[]; total: number }>(`${API_BASE}/graphs`)
    )
  }

  // 创建图定义
  async function createGraph(def: Partial<GraphDefinition>): Promise<GraphDefinition | null> {
    return withLoading(() =>
      request<GraphDefinition>(`${API_BASE}/graphs`, {
        method: 'POST',
        body: JSON.stringify(def),
      })
    )
  }

  // 获取单个图定义
  async function getGraph(id: string): Promise<GraphDefinition | null> {
    return withLoading(() =>
      request<GraphDefinition>(`${API_BASE}/graphs/${id}`)
    )
  }

  // 更新图定义
  async function updateGraph(id: string, def: Partial<GraphDefinition>): Promise<GraphDefinition | null> {
    return withLoading(() =>
      request<GraphDefinition>(`${API_BASE}/graphs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(def),
      })
    )
  }

  // 删除图定义
  async function deleteGraph(id: string): Promise<boolean> {
    const result = await withLoading(() =>
      request<{ deleted: boolean }>(`${API_BASE}/graphs/${id}`, {
        method: 'DELETE',
      })
    )
    return result?.deleted ?? false
  }

  // 验证图定义
  async function validateGraph(id: string): Promise<ValidationResult | null> {
    return withLoading(() =>
      request<ValidationResult>(`${API_BASE}/graphs/${id}/validate`, {
        method: 'POST',
      })
    )
  }

  // 执行图定义
  async function executeGraph(id: string, initialState?: Record<string, unknown>): Promise<ExecutionResult | null> {
    return withLoading(() =>
      request<ExecutionResult>(`${API_BASE}/graphs/${id}/execute`, {
        method: 'POST',
        body: JSON.stringify({ initial_state: initialState }),
      })
    )
  }

  // 获取可用节点类型
  async function fetchNodeTypes(): Promise<NodeTypeInfo[] | null> {
    return withLoading(() =>
      request<NodeTypeInfo[]>(`${API_BASE}/node-types`)
    )
  }

  return {
    loading,
    error,
    fetchGraphs,
    createGraph,
    getGraph,
    updateGraph,
    deleteGraph,
    validateGraph,
    executeGraph,
    fetchNodeTypes,
  }
}
