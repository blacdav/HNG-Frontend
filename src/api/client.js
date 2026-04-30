import { API_BASE_URL } from '../config/api'

let refreshRequest = null

export function buildUrl(path, params = {}) {
  const url = new URL(path, API_BASE_URL)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      url.searchParams.set(key, value)
    }
  })

  return url.toString()
}

function buildHeaders(headers = {}, includeJson = true) {
  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    'x-client-type': 'web',
    ...headers,
  }
}

async function runRefreshRequest() {
  if (!refreshRequest) {
    refreshRequest = fetch(buildUrl('/api/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
      headers: buildHeaders(),
    }).finally(() => {
      refreshRequest = null
    })
  }

  return refreshRequest
}

export async function refreshSession() {
  const response = await runRefreshRequest()

  if (response.status === 204) {
    return null
  }

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.error || payload.message || 'Unable to refresh session.')
  }

  return payload
}

async function fetchWithRefresh(path, options = {}, includeJson = true) {
  const { params, headers, skipRefresh = false, ...fetchOptions } = options
  const requestUrl = buildUrl(path, params)

  const sendRequest = () => fetch(requestUrl, {
    credentials: 'include',
    headers: buildHeaders(headers, includeJson),
    ...fetchOptions,
  })

  let response = await sendRequest()

  if (
    !skipRefresh &&
    response.status === 401 &&
    path !== '/api/auth/refresh' &&
    path !== '/api/auth/logout'
  ) {
    const refreshResponse = await runRefreshRequest()

    if (refreshResponse.ok) {
      response = await sendRequest()
    }
  }

  return response
}

export async function request(path, options = {}) {
  const response = await fetchWithRefresh(path, options)

  if (response.status === 204) {
    return null
  }

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.error || payload.message || 'Something went wrong.')
  }

  return payload
}

export async function downloadFile(path, options = {}) {
  const { filename, ...requestOptions } = options
  const response = await fetchWithRefresh(path, requestOptions, false)

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || payload.message || 'Unable to export profiles.')
  }

  const blob = await response.blob()
  const contentDisposition = response.headers.get('content-disposition') || ''
  const matchedFilename = contentDisposition.match(/filename\*?=(?:UTF-8''|")?([^";\n]+)/i)
  const downloadName = filename || matchedFilename?.[1] || 'profiles-export'
  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = decodeURIComponent(downloadName.replace(/"/g, ''))
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(objectUrl)
}
