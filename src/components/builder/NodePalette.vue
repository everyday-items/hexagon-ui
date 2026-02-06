<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBuilderApi } from '@/composables/useBuilderApi'
import { NODE_STYLES, type NodeTypeInfo, type NodeType } from '@/types/builder'

const { fetchNodeTypes } = useBuilderApi()
const nodeTypes = ref<NodeTypeInfo[]>([])

onMounted(async () => {
  const result = await fetchNodeTypes()
  if (result) {
    nodeTypes.value = result
  }
})

// 拖拽开始
function onDragStart(event: DragEvent, nodeType: NodeTypeInfo) {
  if (!event.dataTransfer) return
  event.dataTransfer.setData('application/hexagon-node', JSON.stringify({
    type: nodeType.type,
    name: nodeType.name,
  }))
  event.dataTransfer.effectAllowed = 'move'
}

// 获取节点样式
function getStyle(type: string) {
  return NODE_STYLES[type as NodeType] || { color: '#8b949e', bgColor: 'rgba(139, 148, 158, 0.15)', icon: '📌' }
}
</script>

<template>
  <div class="node-palette">
    <div class="palette-header">
      <h4>节点类型</h4>
    </div>
    <div class="palette-list">
      <div
        v-for="nt in nodeTypes"
        :key="nt.type"
        class="palette-item"
        draggable="true"
        @dragstart="onDragStart($event, nt)"
      >
        <div class="palette-icon" :style="{ background: getStyle(nt.type).bgColor, borderColor: getStyle(nt.type).color }">
          {{ getStyle(nt.type).icon }}
        </div>
        <div class="palette-info">
          <div class="palette-name">{{ nt.name }}</div>
          <div class="palette-desc">{{ nt.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.node-palette {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.palette-header {
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
}
.palette-header h4 {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.palette-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.palette-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 6px;
  cursor: grab;
  transition: background 0.15s;
  margin-bottom: 4px;
}
.palette-item:hover {
  background: var(--color-bg-secondary);
}
.palette-item:active {
  cursor: grabbing;
}
.palette-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}
.palette-info {
  min-width: 0;
}
.palette-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.palette-desc {
  font-size: 10px;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
