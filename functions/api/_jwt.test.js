// functions/api/_jwt.test.js
import { mintJWT, verifyJWT } from './_jwt.js'

const SECRET = 'test-secret-32-bytes-long-xxxxxxx'

test('mintJWT produces a 3-part token', async () => {
  const token = await mintJWT({ sub: '42', login: 'alice', exp: Math.floor(Date.now()/1000) + 3600 }, SECRET)
  expect(token.split('.').length).toBe(3)
})

test('verifyJWT returns payload for valid token', async () => {
  const payload = { sub: '42', login: 'alice', exp: Math.floor(Date.now()/1000) + 3600 }
  const token = await mintJWT(payload, SECRET)
  const result = await verifyJWT(token, SECRET)
  expect(result.sub).toBe('42')
  expect(result.login).toBe('alice')
})

test('verifyJWT returns null for wrong secret', async () => {
  const token = await mintJWT({ sub: '1', exp: Math.floor(Date.now()/1000) + 3600 }, SECRET)
  const result = await verifyJWT(token, 'wrong-secret')
  expect(result).toBeNull()
})

test('verifyJWT returns null for expired token', async () => {
  const token = await mintJWT({ sub: '1', exp: Math.floor(Date.now()/1000) - 1 }, SECRET)
  const result = await verifyJWT(token, SECRET)
  expect(result).toBeNull()
})

test('verifyJWT returns null for malformed token', async () => {
  expect(await verifyJWT('not.a.token', SECRET)).toBeNull()
  expect(await verifyJWT(null, SECRET)).toBeNull()
  expect(await verifyJWT('', SECRET)).toBeNull()
})
