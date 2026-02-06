<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ExecutionResult, ValidationResult } from '@/types/builder'

const props = defineProps<{
  executionResult?: ExecutionResult | null
  validationResult?: ValidationResult | null
}>()

const collapsed = ref(false)

const hasContent = computed(() => props.executionResult || props.validationResult)

const statusClass = computed(() => {
  if (props.executionResult) {
    return props.executionResult.status === 'completed' ? 'status-success' : 'status-error'
  }
  if (props.validationResult) {
    return props.validationResult.valid ? 'status-success' : 'status-error'
  }
  return ''
})
</script>

<template>
  <div v-if="hasContent" :class="['execution-panel', { collapsed }]">
    <div class="panel-toggle" @click="collapsed = !collapsed">
      <span class="toggle-icon">{{ collapsed ? '▲' : '▼' }}</span>
      <span class="toggle-title">
        <template v-if="executionResult">
          执行结果
          <span :class="['status-badge', statusClass]">{{ executionResult.status }}</span>
          <span class="duration">{{ executionResult.duration_ms }}ms</span>
        </template>
        <template v-else-if="validationResult">
          验证结果
          <span :class="['status-badge', statusClass]">{{ validationResult.valid ? '通过' : '失败' }}</span>
        </template>
      </span>
    </div>

    <div v-if="!collapsed" class="panel-body">
      <!-- 验证结果 -->
      <div v-if="validationResult && !validationResult.valid" class="result-section">
        <div class="section-title">验证错误</div>
        <div v-for="(err, idx) in validationResult.errors" :key="idx" class="error-item">
          <span class="error-icon">✘</span> {{ err }}
        </div>
      </div>
      <div v-if="validationResult && validationResult.valid" class="result-section">
        <div class="success-msg">✓ 图验证通过</div>
      </div>

      <!-- 执行结果 -->
      <template v-if="executionResult">
        <div v-if="executionResult.error" class="result-section">
          <div class="section-title">错误信息</div>
          <div class="error-item"><span class="error-icon">✘</span> {{ executionResult.error }}</div>
        </div>

        <div v-if="executionResult.node_results?.length" class="result-section">
          <div class="section-title">节点执行</div>
          <div class="node-results">
            <div v-for="nr in executionResult.node_results" :key="nr.node_id" class="node-result-item">
              <div class="nr-header">
                <span class="nr-status" :class="nr.status">{{ nr.status === 'completed' ? '✓' : '✘' }}</span>
                <span class="nr-name">{{ nr.node_name }}</span>
                <span class="nr-type">{{ nr.node_type }}</span>
                <span class="nr-duration">{{ nr.duration_ms }}ms</span>
              </div>
              <div v-if="nr.output?.message" class="nr-output">{{ nr.output.message }}</div>
            </div>
          </div>
        </div>

        <div v-if="executionResult.final_state && Object.keys(executionResult.final_state).length" class="result-section">
          <div class="section-title">最终状态</div>
          <pre class="state-json">{{ JSON.stringify(executionResult.final_state, null, 2) }}</pre>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.execution-panel {
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  max-height: 300px;
  display: flex;
  flex-direction: column;
}
.execution-panel.collapsed {
  max-height: 32px;
}
.panel-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border);
  user-select: none;
}
.panel-toggle:hover { background: var(--color-bg-tertiary); }
.toggle-icon { font-size: 10px; color: var(--color-text-muted); }
.toggle-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}
.status-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 400;
}
.status-success { background: rgba(63, 185, 80, 0.2); color: var(--color-accent-green); }
.status-error { background: rgba(248, 81, 73, 0.2); color: var(--color-accent-red); }
.duration { font-size: 10px; color: var(--color-text-muted); font-weight: 400; }
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
}
.result-section {
  margin-bottom: 12px;
}
.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}
.error-item {
  font-size: 12px;
  color: var(--color-accent-red);
  padding: 4px 0;
}
.error-icon { margin-right: 4px; }
.success-msg {
  font-size: 12px;
  color: var(--color-accent-green);
}
.node-results {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.node-result-item {
  padding: 6px 8px;
  border-radius: 4px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
}
.nr-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.nr-status.completed { color: var(--color-accent-green); }
.nr-status.failed { color: var(--color-accent-red); }
.nr-name { font-weight: 600; color: var(--color-text-primary); }
.nr-type {
  font-size: 10px;
  color: var(--color-text-muted);
  padding: 1px 4px;
  background: var(--color-bg-tertiary);
  border-radius: 2px;
}
.nr-duration { font-size: 10px; color: var(--color-text-muted); margin-left: auto; }
.nr-output {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 4px;
  padding-left: 20px;
}
.state-json {
  font-size: 11px;
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  padding: 8px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  overflow-x: auto;
  margin: 0;
}
</style>
