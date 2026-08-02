type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  error?: string
}

interface BootstrapData {
  csrf_token: string
}

function isBuilderMutation(url: RequestInfo | URL, init?: RequestInit): boolean {
  const method = (init?.method ?? 'GET').toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return false
  const value = typeof url === 'string' ? url : url.toString()
  const pathname = new URL(value, 'http://devui.local').pathname
  return pathname === '/api/builder' || pathname.startsWith('/api/builder/')
}

async function decodeEnvelope<T>(response: Response): Promise<T> {
  let envelope: ApiEnvelope<T>
  try {
    envelope = await response.json() as ApiEnvelope<T>
  } catch {
    throw new Error(`请求失败: HTTP ${response.status}`)
  }
  if (!response.ok || !envelope.success) {
    throw new Error(envelope.error || `请求失败: HTTP ${response.status}`)
  }
  return envelope.data as T
}

export function createDevUIRequester(fetchImpl: FetchLike = globalThis.fetch.bind(globalThis)) {
  let csrfToken: string | null = null
  let bootstrapInFlight: Promise<string> | null = null

  async function bootstrap(): Promise<string> {
    if (csrfToken) return csrfToken
    if (!bootstrapInFlight) {
      bootstrapInFlight = (async () => {
        const response = await fetchImpl('/api/auth/bootstrap', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
        })
        const data = await decodeEnvelope<BootstrapData>(response)
        if (typeof data?.csrf_token !== 'string' || data.csrf_token.length < 16) {
          throw new Error('DevUI bootstrap 未返回有效 CSRF token')
        }
        csrfToken = data.csrf_token
        return csrfToken
      })().finally(() => {
        bootstrapInFlight = null
      })
    }
    return bootstrapInFlight
  }

  async function request<T>(url: RequestInfo | URL, init: RequestInit = {}, retry = true): Promise<T> {
    const protectedMutation = isBuilderMutation(url, init)
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json')
    if (init.body != null && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    if (protectedMutation) {
      headers.set('X-DevUI-CSRF', await bootstrap())
    }

    const response = await fetchImpl(url, {
      ...init,
      credentials: 'same-origin',
      headers,
    })
    if (protectedMutation && retry && (response.status === 401 || response.status === 403)) {
      csrfToken = null
      return request<T>(url, init, false)
    }
    return decodeEnvelope<T>(response)
  }

  return request
}
