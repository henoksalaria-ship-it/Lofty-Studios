import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const allowedOtpTypes = new Set(['email', 'magiclink', 'signup', 'invite', 'recovery', 'email_change'])

function safeNext(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  return value
}

function withLoginError(origin, error, next) {
  const url = new URL('/login', origin)
  url.searchParams.set('error', error)
  if (next && next !== '/dashboard') url.searchParams.set('next', next)
  return NextResponse.redirect(url)
}

function applyHeaders(response, headers) {
  if (!headers) return
  if (typeof headers.forEach === 'function') {
    headers.forEach((value, key) => response.headers.set(key, value))
    return
  }
  Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const authError = searchParams.get('error')
  const authErrorDescription = searchParams.get('error_description')
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') || 'email'
  const next = safeNext(searchParams.get('next') ?? '/dashboard')

  if (authError) {
    console.error('Supabase auth redirect failed:', authError, authErrorDescription || '')
    return withLoginError(origin, 'auth_redirect_failed', next)
  }

  if (!code && !tokenHash) return withLoginError(origin, 'missing_auth_token', next)
  if (tokenHash && !allowedOtpTypes.has(type)) return withLoginError(origin, 'unsupported_auth_type', next)

  const response = NextResponse.redirect(`${origin}${next}`)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          applyHeaders(response, headers)
        },
      },
    },
  )

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ token_hash: tokenHash, type })

  if (error) {
    console.error('Supabase auth callback failed:', error.message)
    return withLoginError(origin, code ? 'auth_code_failed' : 'auth_token_failed', next)
  }

  return response
}
