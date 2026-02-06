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
  <div :class="['condition-node', { executing: data.executing }]">
    <Handle type="target" :position="Position.Left" />
    <div class="diamond">
      <div class="node-header">
        <span class="node-icon">🔀</span>
        <span class="node-label">{{ data.name }}</span>
      </div>
      <div v-if="data.config?.condition" class="node-detail">
        {{ data.config.condition }}
      </div>
    </div>
    <Handle type="source" id="a" :position="Position.Right" :style="{ top: '30%' }" />
    <Handle type="source" id="b" :position="Position.Right" :style="{ top: '70%' }" />
  </div>
</template>

<style scoped>
.condition-node {
  min-width: 100px;
  position: relative;
  transition: all 0.2s;
}
.diamond {
  border-radius: 8px;
  border: 2px solid #d29922;
  background: rgba(210, 153, 34, 0.15);
  padding: 8px 12px;
  transform: none;
  text-align: center;
}
.condition-node.executing .diamond {
  border-color: #3fb950;
  box-shadow: 0 0 12px rgba(63, 185, 80, 0.4);
}
.node-header {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
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
  font-family: monospace;
}
</style>
