import assert from 'node:assert/strict'
import test from 'node:test'

import { useGraphStore } from '../src/composables/useGraphStore.ts'

test('graph name has one source of truth across edit, save, and load', () => {
  const store = useGraphStore()
  store.clear()

  store.newGraph('Draft')
  store.setGraphName('Renamed graph')

  assert.equal(store.currentGraph.value?.name, 'Renamed graph')
  assert.equal(store.syncToDefinition().name, 'Renamed graph')
  assert.equal(store.isDirty.value, true)

  store.syncFromDefinition({
    id: 'loaded-graph',
    name: 'Loaded graph',
    version: 3,
    nodes: [],
    edges: [],
    entry_point: '',
    created_at: '2026-08-02T00:00:00.000Z',
    updated_at: '2026-08-02T00:00:00.000Z',
  })

  assert.equal(store.currentGraph.value?.name, 'Loaded graph')
  assert.equal(store.syncToDefinition().name, 'Loaded graph')
  assert.equal(store.isDirty.value, false)
})
