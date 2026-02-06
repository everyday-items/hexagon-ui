<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'

const props = defineProps<{
  data: {
    name: string
    nodeType: 'start' | 'end'
    executing?: boolean
  }
}>()

const isStart = computed(() => props.data.nodeType === 'start')
const icon = computed(() => isStart.value ? '▶️' : '⏹️')
</script>

<template>
  <div :class="['start-end-node', { executing: data.executing }]">
    <Handle v-if="!isStart" type="target" :position="Position.Left" />
    <div class="node-body">
      <span class="node-icon">{{ icon }}</span>
      <span class="node-label">{{ data.name }}</span>
    </div>
    <Handle v-if="isStart" type="source" :position="Position.Right" />
  </div>
</template>

<style scoped>
.start-end-node {
  min-width: 80px;
  border-radius: 20px;
  border: 2px solid #58a6ff;
  background: rgba(88, 166, 255, 0.15);
  padding: 8px 16px;
  text-align: center;
  transition: all 0.2s;
}
.start-end-node.executing {
  border-color: #3fb950;
  box-shadow: 0 0 12px rgba(63, 185, 80, 0.4);
}
.node-body {
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
</style>
