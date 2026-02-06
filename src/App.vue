<script setup lang="ts">
import { ref } from 'vue'
import MonitorView from '@/components/MonitorView.vue'
import BuilderView from '@/components/builder/BuilderView.vue'

// 当前视图: monitor 或 builder
const currentView = ref<'monitor' | 'builder'>('builder')
</script>

<template>
  <div class="app">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-icon">⬡</span>
          <span class="logo-text">Hexagon Dev UI</span>
        </div>
      </div>
      <div class="header-center">
        <div class="view-tabs">
          <button
            :class="['tab-btn', { active: currentView === 'monitor' }]"
            @click="currentView = 'monitor'"
          >
            📊 Monitor
          </button>
          <button
            :class="['tab-btn', { active: currentView === 'builder' }]"
            @click="currentView = 'builder'"
          >
            🔨 Builder
          </button>
        </div>
      </div>
      <div class="header-right">
        <span class="version-badge">Hexagon AI Agent Framework</span>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="main-view">
      <MonitorView v-if="currentView === 'monitor'" />
      <BuilderView v-else />
    </main>
  </div>
</template>

<style scoped>
.main-view {
  flex: 1;
  overflow: hidden;
}
.view-tabs {
  display: flex;
  gap: 2px;
  background: var(--color-bg-primary);
  border-radius: 6px;
  padding: 2px;
}
.tab-btn {
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.tab-btn:hover {
  color: var(--color-text-primary);
}
.tab-btn.active {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  font-weight: 600;
}
.version-badge {
  font-size: 10px;
  color: var(--color-text-muted);
}
</style>
