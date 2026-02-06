<script setup lang="ts">
import { ref, watch } from 'vue'
import { useGraphStore } from '@/composables/useGraphStore'

const { selectedNode, updateNodeProps, removeNode } = useGraphStore()

// 本地编辑状态
const editName = ref('')
const editDescription = ref('')
const editConfig = ref<Record<string, unknown>>({})

// 当选中节点变化时，同步到本地编辑状态
watch(selectedNode, (node) => {
  if (node) {
    editName.value = node.name
    editDescription.value = node.description || ''
    editConfig.value = { ...(node.config || {}) }
  }
}, { immediate: true })

// 保存属性到 store
function saveProps() {
  if (!selectedNode.value) return
  updateNodeProps(selectedNode.value.id, {
    name: editName.value,
    description: editDescription.value,
    config: { ...editConfig.value },
  })
}

// 更新配置字段
function updateConfig(key: string, value: unknown) {
  editConfig.value = { ...editConfig.value, [key]: value }
  saveProps()
}

// 删除节点
function handleDelete() {
  if (!selectedNode.value) return
  if (selectedNode.value.type === 'start' || selectedNode.value.type === 'end') {
    return // 不允许删除 start/end 节点
  }
  removeNode(selectedNode.value.id)
}

// 节点类型的中文名
const typeNames: Record<string, string> = {
  start: '开始', end: '结束', agent: 'Agent',
  tool: '工具', llm: 'LLM', condition: '条件', parallel: '并行'
}
</script>

<template>
  <div class="properties-panel">
    <div class="panel-header">
      <h4>属性</h4>
    </div>

    <div v-if="!selectedNode" class="empty-state">
      <p>选择节点查看属性</p>
    </div>

    <div v-else class="props-content">
      <!-- 基本信息 -->
      <div class="prop-section">
        <div class="prop-section-title">基本信息</div>
        <div class="prop-field">
          <label>类型</label>
          <div class="prop-value-static">{{ typeNames[selectedNode.type] || selectedNode.type }}</div>
        </div>
        <div class="prop-field">
          <label>ID</label>
          <div class="prop-value-static mono">{{ selectedNode.id }}</div>
        </div>
        <div class="prop-field">
          <label>名称</label>
          <input v-model="editName" @change="saveProps" class="prop-input" />
        </div>
        <div class="prop-field">
          <label>描述</label>
          <input v-model="editDescription" @change="saveProps" class="prop-input" placeholder="可选" />
        </div>
      </div>

      <!-- Agent 配置 -->
      <div v-if="selectedNode.type === 'agent'" class="prop-section">
        <div class="prop-section-title">Agent 配置</div>
        <div class="prop-field">
          <label>Agent 引用</label>
          <input :value="(editConfig.agent_ref as string) || ''" @input="updateConfig('agent_ref', ($event.target as HTMLInputElement).value)" class="prop-input" placeholder="agent ID 或名称" />
        </div>
        <div class="prop-field">
          <label>System Prompt</label>
          <textarea :value="(editConfig.system_prompt as string) || ''" @input="updateConfig('system_prompt', ($event.target as HTMLTextAreaElement).value)" class="prop-textarea" rows="3" placeholder="可选" />
        </div>
      </div>

      <!-- Tool 配置 -->
      <div v-if="selectedNode.type === 'tool'" class="prop-section">
        <div class="prop-section-title">工具配置</div>
        <div class="prop-field">
          <label>工具名称</label>
          <input :value="(editConfig.tool_name as string) || ''" @input="updateConfig('tool_name', ($event.target as HTMLInputElement).value)" class="prop-input" placeholder="例: search, calculator" />
        </div>
      </div>

      <!-- LLM 配置 -->
      <div v-if="selectedNode.type === 'llm'" class="prop-section">
        <div class="prop-section-title">LLM 配置</div>
        <div class="prop-field">
          <label>Provider</label>
          <select :value="(editConfig.provider as string) || ''" @change="updateConfig('provider', ($event.target as HTMLSelectElement).value)" class="prop-input">
            <option value="">选择 Provider</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="deepseek">DeepSeek</option>
            <option value="gemini">Google Gemini</option>
            <option value="qwen">通义千问</option>
            <option value="ollama">Ollama</option>
          </select>
        </div>
        <div class="prop-field">
          <label>模型</label>
          <input :value="(editConfig.model as string) || ''" @input="updateConfig('model', ($event.target as HTMLInputElement).value)" class="prop-input" placeholder="例: gpt-4o" />
        </div>
        <div class="prop-field">
          <label>Temperature</label>
          <input type="number" min="0" max="2" step="0.1" :value="(editConfig.temperature as number) ?? 0.7" @input="updateConfig('temperature', parseFloat(($event.target as HTMLInputElement).value))" class="prop-input" />
        </div>
        <div class="prop-field">
          <label>Max Tokens</label>
          <input type="number" min="1" :value="(editConfig.max_tokens as number) ?? 4096" @input="updateConfig('max_tokens', parseInt(($event.target as HTMLInputElement).value))" class="prop-input" />
        </div>
      </div>

      <!-- Condition 配置 -->
      <div v-if="selectedNode.type === 'condition'" class="prop-section">
        <div class="prop-section-title">条件配置</div>
        <div class="prop-field">
          <label>条件表达式</label>
          <input :value="(editConfig.condition as string) || ''" @input="updateConfig('condition', ($event.target as HTMLInputElement).value)" class="prop-input" placeholder="状态键名" />
        </div>
      </div>

      <!-- 操作 -->
      <div class="prop-section" v-if="selectedNode.type !== 'start' && selectedNode.type !== 'end'">
        <button class="btn btn-danger" @click="handleDelete">删除节点</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.properties-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.panel-header {
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
}
.panel-header h4 {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.empty-state {
  padding: 24px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 12px;
}
.props-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.prop-section {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}
.prop-section:last-child {
  border-bottom: none;
}
.prop-section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding: 0 4px;
}
.prop-field {
  margin-bottom: 8px;
  padding: 0 4px;
}
.prop-field label {
  display: block;
  font-size: 11px;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}
.prop-value-static {
  font-size: 12px;
  color: var(--color-text-primary);
  padding: 4px 0;
}
.prop-value-static.mono {
  font-family: monospace;
  font-size: 10px;
  color: var(--color-text-muted);
}
.prop-input, .prop-textarea {
  width: 100%;
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 12px;
  font-family: inherit;
  box-sizing: border-box;
}
.prop-input:focus, .prop-textarea:focus {
  outline: none;
  border-color: var(--color-accent-blue);
}
.prop-textarea {
  resize: vertical;
  min-height: 60px;
}
.btn-danger {
  width: 100%;
  padding: 6px;
  border: 1px solid var(--color-accent-red);
  border-radius: 4px;
  background: transparent;
  color: var(--color-accent-red);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-danger:hover {
  background: rgba(248, 81, 73, 0.15);
}
</style>
