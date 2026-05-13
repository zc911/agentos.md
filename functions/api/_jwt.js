// functions/api/_jwt.js
const ENC = new TextEncoder()
const DEC = new TextDecoder()

function b64url(buf) {
  let str = ''
  const bytes = new Uint8Array(buf instanceof ArrayBuffer ? buf : buf)
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i])
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  const bin = atob(str)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf
}

async function getKey(secret, usage) {
  return crypto.subtle.importKey(
    'raw',
    ENC.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  )
}

export async function mintJWT(payload, secret) {
  const header = b64url(ENC.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const body = b64url(ENC.encode(JSON.stringify(payload)))
  const key = await getKey(secret, 'sign')
  const sig = await crypto.subtle.sign('HMAC', key, ENC.encode(`${header}.${body}`))
  return `${header}.${body}.${b64url(new Uint8Array(sig))}`
}

export async function verifyJWT(token, secret) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, sig] = parts
  try {
    const key = await getKey(secret, 'verify')
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlDecode(sig),
      ENC.encode(`${header}.${body}`)
    )
    if (!valid) return null
    const payload = JSON.parse(DEC.decode(b64urlDecode(body)))
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}
