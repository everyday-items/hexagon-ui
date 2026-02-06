<script setup lang="ts">
import { ref } from 'vue'
import { useGraphStore } from '@/composables/useGraphStore'
import { useBuilderApi } from '@/composables/useBuilderApi'
import type { ValidationResult, ExecutionResult } from '@/types/builder'

const emit = defineEmits<{
  (e: 'execute', result: ExecutionResult): void
  (e: 'showGraphList'): void
  (e: 'validationResult', result: ValidationResult): void
}>()

const { currentGraph, isDirty, syncToDefinition, syncFromDefinition, newGraph } = useGraphStore()
const { createGraph, updateGraph, validateGraph, executeGraph, loading } = useBuilderApi()

const graphName = ref('')

// 新建图
function handleNew() {
  const name = graphName.value.trim() || '新建图'
  newGraph(name)
  graphName.value = name
}

// 保存图
async function handleSave() {
  const def = syncToDefinition()
  if (!def.name) def.name = graphName.value || '未命名图'

  if (currentGraph.value?.id) {
    // 更新
    const updated = await updateGraph(currentGraph.value.id, def)
    if (updated) {
      syncFromDefinition(updated)
      graphName.value = updated.name
    }
  } else {
    // 创建
    const created = await createGraph(def)
    if (created) {
      syncFromDefinition(created)
      graphName.value = created.name
    }
  }
}

// 验证图
async function handleValidate() {
  if (!currentGraph.value?.id) {
    // 先保存
    await handleSave()
  }
  if (!currentGraph.value?.id) return

  const result = await validateGraph(currentGraph.value.id)
  if (result) {
    emit('validationResult', result)
  }
}

// 执行图
async function handleExecute() {
  if (!currentGraph.value?.id) {
    await handleSave()
  }
  if (!currentGraph.value?.id) return

  const result = await executeGraph(currentGraph.value.id)
  if (result) {
    emit('execute', result)
  }
}

// 导出 JSON
function handleExport() {
  const def = syncToDefinition()
  const json = JSON.stringify(def, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${def.name || 'graph'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 导入 JSON
function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const def = JSON.parse(text)
      if (def.nodes && def.edges) {
        syncFromDefinition({
          id: '',
          name: def.name || '导入的图',
          version: 0,
          nodes: def.nodes,
          edges: def.edges,
          entry_point: def.entry_point || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        graphName.value = def.name || '导入的图'
      }
    } catch {
      // 静默处理
    }
  }
  input.click()
}
</script>

<template>
  <div class="builder-toolbar">
    <div class="toolbar-left">
      <button class="btn btn-sm" @click="handleNew" title="新建">📄 新建</button>
      <button class="btn btn-sm" @click="emit('showGraphList')" title="加载">📂 加载</button>
      <button class="btn btn-sm btn-primary" @click="handleSave" :disabled="loading" title="保存">
        💾 {{ loading ? '保存中...' : '保存' }}{{ isDirty ? ' *' : '' }}
      </button>
    </div>

    <div class="toolbar-center">
      <input
        v-model="graphName"
        class="graph-name-input"
        placeholder="图名称"
        @change="handleSave"
      />
      <span v-if="currentGraph?.id" class="graph-version">v{{ currentGraph.version }}</span>
    </div>

    <div class="toolbar-right">
      <button class="btn btn-sm" @click="handleImport" title="导入 JSON">📥</button>
      <button class="btn btn-sm" @click="handleExport" title="导出 JSON">📤</button>
      <button class="btn btn-sm btn-warning" @click="handleValidate" :disabled="loading" title="验证">
        ✅ 验证
      </button>
      <button class="btn btn-sm btn-success" @click="handleExecute" :disabled="loading" title="执行">
        ▶️ 执行
      </button>
    </div>
  </div>
</template>

<style scoped>
.builder-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  height: 40px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}
.toolbar-left, .toolbar-right {
  display: flex;
  gap: 4px;
}
.toolbar-center {
  display: flex;
  align-items: center;
  gap: 8px;
}
.graph-name-input {
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  background: transparent;
  text-align: center;
  min-width: 120px;
  max-width: 240px;
}
.graph-name-input:focus {
  outline: none;
  border-color: var(--color-accent-blue);
  background: var(--color-bg-primary);
}
.graph-version {
  font-size: 10px;
  color: var(--color-text-muted);
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--color-bg-tertiary);
}
.btn-sm {
  padding: 4px 8px;
  font-size: 11px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.btn-sm:hover { background: var(--color-bg-secondary); }
.btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { border-color: var(--color-accent-blue); color: var(--color-accent-blue); }
.btn-primary:hover { background: rgba(88, 166, 255, 0.15); }
.btn-warning { border-color: var(--color-accent-yellow); color: var(--color-accent-yellow); }
.btn-warning:hover { background: rgba(210, 153, 34, 0.15); }
.btn-success { border-color: var(--color-accent-green); color: var(--color-accent-green); }
.btn-success:hover { background: rgba(63, 185, 80, 0.15); }
</style>
