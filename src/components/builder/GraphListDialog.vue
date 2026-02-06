<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBuilderApi } from '@/composables/useBuilderApi'
import { useGraphStore } from '@/composables/useGraphStore'
import type { GraphDefinition } from '@/types/builder'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'loaded'): void
}>()

const { fetchGraphs, deleteGraph, loading } = useBuilderApi()
const { syncFromDefinition } = useGraphStore()

const graphs = ref<GraphDefinition[]>([])

onMounted(async () => {
  await loadGraphs()
})

async function loadGraphs() {
  const result = await fetchGraphs()
  if (result) {
    graphs.value = result.graphs || []
  }
}

async function handleLoad(graph: GraphDefinition) {
  syncFromDefinition(graph)
  emit('loaded')
  emit('close')
}

async function handleDelete(id: string) {
  await deleteGraph(id)
  await loadGraphs()
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('close')">
    <div class="dialog">
      <div class="dialog-header">
        <h3>加载图定义</h3>
        <button class="btn-close" @click="emit('close')">✕</button>
      </div>
      <div class="dialog-body">
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="graphs.length === 0" class="empty">
          <p>暂无已保存的图定义</p>
        </div>
        <div v-else class="graph-list">
          <div v-for="g in graphs" :key="g.id" class="graph-item">
            <div class="graph-info" @click="handleLoad(g)">
              <div class="graph-name">{{ g.name }}</div>
              <div class="graph-meta">
                <span>v{{ g.version }}</span>
                <span>{{ g.nodes?.length || 0 }} 节点</span>
                <span>{{ g.edges?.length || 0 }} 边</span>
                <span>{{ formatDate(g.updated_at) }}</span>
              </div>
            </div>
            <button class="btn-delete" @click.stop="handleDelete(g.id)" title="删除">🗑️</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.dialog {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  width: 480px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}
.dialog-header h3 {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-primary);
}
.btn-close {
  border: none;
  background: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
}
.btn-close:hover { color: var(--color-text-primary); }
.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}
.loading, .empty {
  text-align: center;
  padding: 24px;
  color: var(--color-text-muted);
  font-size: 13px;
}
.graph-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.graph-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  transition: all 0.15s;
}
.graph-item:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-accent-blue);
}
.graph-info {
  flex: 1;
  cursor: pointer;
  min-width: 0;
}
.graph-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.graph-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 4px;
}
.btn-delete {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
  opacity: 0.5;
  transition: opacity 0.15s;
}
.btn-delete:hover { opacity: 1; }
</style>
