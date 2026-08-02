import assert from 'node:assert/strict'
import test from 'node:test'

import { createDevUIRequester } from '../src/api/devui-auth.ts'

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

test('builder reads do not create a privileged session', async () => {
  const calls = []
  const request = createDevUIRequester(async (url, init) => {
    calls.push({ url, init })
    return jsonResponse(200, { success: true, data: { graphs: [] } })
  })

  await request('/api/builder/graphs')

  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, '/api/builder/graphs')
  assert.equal(new Headers(calls[0].init.headers).has('X-DevUI-CSRF'), false)
})

test('builder mutations bootstrap once and send same-origin CSRF credentials', async () => {
  const calls = []
  const csrf = 'csrf-token-000000000000000000000001'
  const request = createDevUIRequester(async (url, init) => {
    calls.push({ url, init })
    if (url === '/api/auth/bootstrap') {
      return jsonResponse(200, { success: true, data: { csrf_token: csrf } })
    }
    return jsonResponse(200, { success: true, data: { id: 'g1' } })
  })

  await request('/api/builder/graphs', { method: 'POST', body: '{}' })
  await request('/api/builder/graphs/g1', { method: 'PUT', body: '{}' })

  assert.equal(calls.filter((call) => call.url === '/api/auth/bootstrap').length, 1)
  for (const call of calls.filter((item) => item.url !== '/api/auth/bootstrap')) {
    assert.equal(call.init.credentials, 'same-origin')
    assert.equal(new Headers(call.init.headers).get('X-DevUI-CSRF'), csrf)
  }
})

test('expired session is re-bootstrapped and retried at most once', async () => {
  let bootstrap = 0
  let mutations = 0
  const request = createDevUIRequester(async (url) => {
    if (url === '/api/auth/bootstrap') {
      bootstrap++
      return jsonResponse(200, { success: true, data: { csrf_token: `csrf-token-00000000000000000000000${bootstrap}` } })
    }
    mutations++
    if (mutations === 1) return jsonResponse(403, { success: false, error: 'expired' })
    return jsonResponse(200, { success: true, data: { ok: true } })
  })

  const result = await request('/api/builder/graphs/g1/execute', { method: 'POST', body: '{}' })

  assert.deepEqual(result, { ok: true })
  assert.equal(bootstrap, 2)
  assert.equal(mutations, 2)
})
