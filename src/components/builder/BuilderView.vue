<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGraphStore } from '@/composables/useGraphStore'
import type { ExecutionResult, ValidationResult } from '@/types/builder'
import NodePalette from './NodePalette.vue'
import GraphCanvas from './GraphCanvas.vue'
import PropertiesPanel from './PropertiesPanel.vue'
import BuilderToolbar from './BuilderToolbar.vue'
import ExecutionPanel from './ExecutionPanel.vue'
import GraphListDialog from './GraphListDialog.vue'

const { currentGraph, newGraph } = useGraphStore()

const showGraphList = ref(false)
const executionResult = ref<ExecutionResult | null>(null)
const validationResult = ref<ValidationResult | null>(null)

// 当前执行中的节点集合（用于画布高亮）
const executingNodes = computed(() => {
  if (!executionResult.value) return new Set<string>()
  const nodes = new Set<string>()
  for (const nr of executionResult.value.node_results || []) {
    if (nr.status === 'completed') {
      nodes.add(nr.node_id)
    }
  }
  return nodes
})

// 初始化时创建一个空图
onMounted(() => {
  if (!currentGraph.value) {
    newGraph('新建图')
  }
})

function handleExecute(result: ExecutionResult) {
  executionResult.value = result
  validationResult.value = null
}

function handleValidation(result: ValidationResult) {
  validationResult.value = result
  executionResult.value = null
}

function handleGraphLoaded() {
  executionResult.value = null
  validationResult.value = null
}
</script>

<template>
  <div class="builder-view">
    <!-- 工具栏 -->
    <BuilderToolbar
      @execute="handleExecute"
      @show-graph-list="showGraphList = true"
      @validation-result="handleValidation"
    />

    <!-- 主体三栏布局 -->
    <div class="builder-body">
      <!-- 左侧节点面板 -->
      <aside class="builder-left">
        <NodePalette />
      </aside>

      <!-- 中间画布 -->
      <div class="builder-center">
        <GraphCanvas :executing-nodes="executingNodes" />
      </div>

      <!-- 右侧属性面板 -->
      <aside class="builder-right">
        <PropertiesPanel />
      </aside>
    </div>

    <!-- 底部执行面板 -->
    <ExecutionPanel
      :execution-result="executionResult"
      :validation-result="validationResult"
    />

    <!-- 图列表弹窗 -->
    <GraphListDialog
      v-if="showGraphList"
      @close="showGraphList = false"
      @loaded="handleGraphLoaded"
    />
  </div>
</template>

<style scoped>
.builder-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.builder-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.builder-left {
  width: 240px;
  border-right: 1px solid var(--color-border);
  flex-shrink: 0;
}
.builder-center {
  flex: 1;
  overflow: hidden;
}
.builder-right {
  width: 280px;
  border-left: 1px solid var(--color-border);
  flex-shrink: 0;
}
</style>
