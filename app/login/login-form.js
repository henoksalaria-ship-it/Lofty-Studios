'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm({ next = '/dashboard', initialMessage = '', initialTone = 'success' }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState(initialMessage)
  const [tone, setTone] = useState(initialTone)
  const [loading, setLoading] = useState(false)
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  async function signIn(event) {
    event.preventDefault()
    const formEmail = String(new FormData(event.currentTarget).get('email') || '').trim().toLowerCase()
    if (!formEmail) return
    setLoading(true)
    setMessage('')
    setTone('success')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: formEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}` },
    })
    setLoading(false)
    if (error) {
      setTone('error')
      setMessage(error.message)
      return
    }
    setEmail(formEmail)
    setTone('success')
    setMessage('Check your inbox. Use the newest sign-in link, or enter the one-time code if your email shows one.')
  }

  async function verifyCode(event) {
    event.preventDefault()
    const cleanCode = code.replace(/\s+/g, '')
    if (!email || cleanCode.length < 6) {
      setTone('error')
      setMessage('Enter the email you used and the full one-time code from the newest message.')
      return
    }
    setLoading(true)
    setMessage('')
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({ email, token: cleanCode, type: 'email' })
    setLoading(false)
    if (error) {
      setTone('error')
      setMessage(error.message)
      return
    }
    router.replace(safeNext)
    router.refresh()
  }

  return <div className="login-stack"><form onSubmit={signIn}><label>Email address<input required name="email" type="email" placeholder="you@loftystudios.com" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><button className="primary-button" disabled={loading} type="submit">{loading ? 'Sending link...' : 'Send secure sign-in link'}</button></form><form className="otp-form" onSubmit={verifyCode}><label>One-time code<input inputMode="numeric" name="code" pattern="[0-9 ]{6,}" placeholder="123456" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} /></label><button type="submit" disabled={loading || !email || !code}>Verify code</button></form><p className={`form-message ${tone === 'error' ? 'is-error' : ''}`} aria-live="polite">{message}</p></div>
}
