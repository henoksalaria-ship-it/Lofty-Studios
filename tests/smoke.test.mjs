import test from 'node:test'
import assert from 'node:assert/strict'

const baseUrl = process.env.SMOKE_BASE_URL

test('read-only app smoke checks', { skip: !baseUrl }, async () => {
  const login = await fetch(`${baseUrl}/login`)
  const loginText = await login.text()
  assert.equal(login.status, 200)
  assert.equal(loginText.includes('Sign in'), true)
  assert.equal(loginText.includes('First setup'), true)
  assert.equal(loginText.includes('Email link'), false)

  const removedMagicLink = await fetch(`${baseUrl}/api/auth/request-link`)
  assert.equal(removedMagicLink.status, 404)

  const activationValidation = await fetch(`${baseUrl}/api/auth/activate-owner`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  })
  assert.equal(activationValidation.status, 400)

  for (const path of ['/pipeline', '/pipeline/new', '/finance', '/companies', '/outreach']) {
    const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual' })
    assert.equal(response.status, 307)
    assert.equal(response.headers.get('location'), '/login')
  }
})
