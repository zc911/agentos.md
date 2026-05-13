const KEY = 'agentos_token'

export function getToken() {
  return localStorage.getItem(KEY)
}

export function setToken(token) {
  localStorage.setItem(KEY, token)
}

export function clearToken() {
  localStorage.removeItem(KEY)
}

export function getUser(token) {
  const tok = token !== undefined ? token : getToken()
  if (!tok) return null
  try {
    const part = tok.split('.')[1]
    if (!part) return null
    const padded = part.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((part.length + 3) % 4)
    return JSON.parse(atob(padded))
  } catch { return null }
}
