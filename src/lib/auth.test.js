import { getToken, setToken, clearToken, getUser } from './auth.js'

beforeEach(() => {
  // Clear localStorage for each test
  if (typeof localStorage !== 'undefined' && localStorage.clear) {
    localStorage.clear()
  }
})

test('setToken/getToken roundtrip', () => {
  setToken('abc')
  expect(getToken()).toBe('abc')
})

test('clearToken removes token', () => {
  setToken('abc')
  clearToken()
  expect(getToken()).toBeNull()
})

test('getUser decodes JWT payload without verifying', () => {
  // payload = base64url({ sub: "42", login: "alice", exp: 9999999999 })
  const payload = btoa(JSON.stringify({ sub: '42', login: 'alice', exp: 9999999999 }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const fakeToken = `header.${payload}.sig`
  setToken(fakeToken)
  const user = getUser()
  expect(user.sub).toBe('42')
  expect(user.login).toBe('alice')
})

test('getUser returns null when no token', () => {
  expect(getUser()).toBeNull()
})

test('getUser returns null for malformed token', () => {
  setToken('notavalidtoken')
  expect(getUser()).toBeNull()
})
