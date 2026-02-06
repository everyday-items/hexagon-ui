<script setup lang="ts">
import { computed } from 'vue'
import { VueFlow, useVueFlow, type Connection, type NodeDragEvent } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { useGraphStore } from '@/composables/useGraphStore'
import { NODE_STYLES, type NodeType, type GraphNodeDef } from '@/types/builder'
import StartEndNode from './nodes/StartEndNode.vue'
import AgentNode from './nodes/AgentNode.vue'
import ToolNode from './nodes/ToolNode.vue'
import LLMNode from './nodes/LLMNode.vue'
import ConditionNode from './nodes/ConditionNode.vue'

const props = defineProps<{
  executingNodes?: Set<string>
}>()

const {
  nodes: graphNodes,
  edges: graphEdges,
  addNode,
  addEdge,
  removeNode,
  removeEdge,
  updateNodePosition,
  selectNode,
} = useGraphStore()

const { onConnect, onNodeDragStop, onPaneClick, onNodesChange, onEdgesChange } = useVueFlow()

// 将 GraphNodeDef 转换为 Vue Flow 节点格式
const vfNodes = computed(() => {
  return graphNodes.value.map((node: GraphNodeDef) => {
    const style = NODE_STYLES[node.type as NodeType]
    const isExecuting = props.executingNodes?.has(node.id) ?? false

    // 根据类型确定自定义节点类型名
    let vfType = 'default'
    switch (node.type) {
      case 'start':
      case 'end':
        vfType = 'startEnd'
        break
      case 'agent':
        vfType = 'agent'
        break
      case 'tool':
        vfType = 'tool'
        break
      case 'llm':
        vfType = 'llm'
        break
      case 'condition':
        vfType = 'condition'
        break
      default:
        vfType = 'agent'
    }

    return {
      id: node.id,
      type: vfType,
      position: { x: node.position.x, y: node.position.y },
      data: {
        name: node.name,
        nodeType: node.type,
        config: node.config,
        executing: isExecuting,
      },
      style: {
        '--node-color': style?.color || '#8b949e',
      },
    }
  })
})

// 将 GraphEdgeDef 转换为 Vue Flow 边格式
const vfEdges = computed(() => {
  return graphEdges.value.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label || '',
    animated: props.executingNodes?.has(edge.source) ?? false,
    style: { stroke: '#8b949e' },
    labelStyle: { fill: '#c9d1d9', fontSize: '10px' },
  }))
})

// 处理连接（创建新边）
onConnect((connection: Connection) => {
  if (connection.source && connection.target) {
    addEdge(connection.source, connection.target)
  }
})

// 处理节点拖拽停止（更新位置）
onNodeDragStop(({ node }: NodeDragEvent) => {
  updateNodePosition(node.id, { x: node.position.x, y: node.position.y })
})

// 处理画布点击（取消选中）
onPaneClick(() => {
  selectNode(null)
})

// 处理节点变更（删除等）
onNodesChange((changes) => {
  for (const change of changes) {
    if (change.type === 'remove') {
      removeNode(change.id)
    }
    if (change.type === 'select' && change.selected) {
      selectNode(change.id)
    }
  }
})

// 处理边变更（删除等）
onEdgesChange((changes) => {
  for (const change of changes) {
    if (change.type === 'remove') {
      removeEdge(change.id)
    }
  }
})

// 处理拖放（从面板拖入节点）
function onDrop(event: DragEvent) {
  const data = event.dataTransfer?.getData('application/hexagon-node')
  if (!data) return

  const { type, name } = JSON.parse(data)

  // 获取画布相对位置
  const canvas = (event.target as HTMLElement).closest('.vue-flow')
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const position = {
    x: event.clientX - rect.left - 60,
    y: event.clientY - rect.top - 20,
  }

  addNode(type, name, position)
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}
</script>

<template>
  <div class="graph-canvas" @drop="onDrop" @dragover="onDragOver">
    <VueFlow
      :nodes="vfNodes"
      :edges="vfEdges"
      :default-viewport="{ zoom: 1, x: 0, y: 0 }"
      :min-zoom="0.2"
      :max-zoom="4"
      :snap-to-grid="true"
      :snap-grid="[20, 20]"
      fit-view-on-init
      class="vue-flow-dark"
    >
      <!-- 自定义节点 -->
      <template #node-startEnd="nodeProps">
        <StartEndNode v-bind="nodeProps" />
      </template>
      <template #node-agent="nodeProps">
        <AgentNode v-bind="nodeProps" />
      </template>
      <template #node-tool="nodeProps">
        <ToolNode v-bind="nodeProps" />
      </template>
      <template #node-llm="nodeProps">
        <LLMNode v-bind="nodeProps" />
      </template>
      <template #node-condition="nodeProps">
        <ConditionNode v-bind="nodeProps" />
      </template>

      <Background />
      <Controls />
    </VueFlow>
  </div>
</template>

<style scoped>
.graph-canvas {
  width: 100%;
  height: 100%;
}

.vue-flow-dark {
  --vf-node-bg: transparent;
  --vf-node-text: #c9d1d9;
  --vf-handle: #58a6ff;
  --vf-box-shadow: none;
}
</style>
