<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{
  data: {
    name: string
    config?: Record<string, unknown>
    executing?: boolean
  }
}>()
</script>

<template>
  <div :class="['tool-node', { executing: data.executing }]">
    <Handle type="target" :position="Position.Left" />
    <div class="node-header">
      <span class="node-icon">🔧</span>
      <span class="node-label">{{ data.name }}</span>
    </div>
    <div v-if="data.config?.tool_name" class="node-detail">
      {{ data.config.tool_name }}
    </div>
    <Handle type="source" :position="Position.Right" />
  </div>
</template>

<style scoped>
.tool-node {
  min-width: 120px;
  border-radius: 8px;
  border: 2px solid #3fb950;
  background: rgba(63, 185, 80, 0.15);
  padding: 8px 12px;
  transition: all 0.2s;
}
.tool-node.executing {
  border-color: #58a6ff;
  box-shadow: 0 0 12px rgba(88, 166, 255, 0.4);
}
.node-header {
  display: flex;
  align-items: center;
  gap: 6px;
}
.node-icon { font-size: 14px; }
.node-label {
  font-size: 12px;
  font-weight: 600;
  color: #c9d1d9;
}
.node-detail {
  margin-top: 4px;
  font-size: 10px;
  color: #8b949e;
}
</style>
