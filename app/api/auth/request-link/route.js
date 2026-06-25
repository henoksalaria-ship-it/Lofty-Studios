import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function safeNext(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  return value
}

function matchesSecret(input, secret) {
  const inputBuffer = Buffer.from(String(input || ''))
  const secretBuffer = Buffer.from(String(secret || ''))
  return inputBuffer.length === secretBuffer.length && timingSafeEqual(inputBuffer, secretBuffer)
}

export async function POST(request) {
  const masterPassword = process.env.LOFTY_MASTER_LOGIN_PASSWORD
  if (!masterPassword) {
    return NextResponse.json({ error: 'Sign-in is not configured yet.' }, { status: 500 })
  }

  const body = await request.json().catch(() => ({}))
  const email = String(body.email || '').trim().toLowerCase()
  const accessPassword = String(body.accessPassword || '')
  const next = safeNext(body.next)

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }

  if (!matchesSecret(accessPassword, masterPassword)) {
    return NextResponse.json({ error: 'Access password is incorrect.' }, { status: 401 })
  }

  const { origin } = new URL(request.url)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
