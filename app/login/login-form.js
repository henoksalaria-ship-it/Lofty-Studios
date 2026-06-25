'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/src/components/Icon'

export default function LoginForm({ next = '/dashboard', initialMessage = '', initialTone = 'success' }) {
  const router = useRouter()
  const [mode, setMode] = useState('link')
  const [email, setEmail] = useState('')
  const [accessPassword, setAccessPassword] = useState('')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState(initialMessage)
  const [tone, setTone] = useState(initialTone)
  const [loading, setLoading] = useState(false)
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  async function signIn() {
    const formEmail = email.trim().toLowerCase()
    if (!formEmail || !accessPassword) return
    setLoading(true)
    setMessage('')
    setTone('success')
    const response = await fetch('/api/auth/request-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: formEmail, accessPassword, next: safeNext }),
    })
    const result = await response.json().catch(() => ({}))
    setLoading(false)
    if (!response.ok) {
      setTone('error')
      setMessage(result.error || 'Could not send sign-in link.')
      return
    }
    setEmail(formEmail)
    setTone('success')
    setMessage('Check your inbox. Use the newest sign-in link, or enter the one-time code if your email shows one.')
  }

  async function verifyCode() {
    const formEmail = email.trim().toLowerCase()
    const cleanCode = code.replace(/\s+/g, '')
    if (!formEmail || cleanCode.length < 6) {
      setTone('error')
      setMessage('Enter the email you used and the full one-time code from the newest message.')
      return
    }
    setLoading(true)
    setMessage('')
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({ email: formEmail, token: cleanCode, type: 'email' })
    setLoading(false)
    if (error) {
      setTone('error')
      setMessage(error.message)
      return
    }
    router.replace(safeNext)
    router.refresh()
  }

  async function submit(event) {
    event.preventDefault()
    if (mode === 'link') await signIn()
    else await verifyCode()
  }

  function switchMode(nextMode) {
    setMode(nextMode)
    setMessage('')
    setTone('success')
  }

  return <div className="login-stack"><div className="login-mode-switch" role="tablist" aria-label="Sign-in method"><button type="button" role="tab" aria-selected={mode === 'link'} className={mode === 'link' ? 'is-active' : ''} onClick={() => switchMode('link')}><Icon name="send" size={15}/>Email link</button><button type="button" role="tab" aria-selected={mode === 'code'} className={mode === 'code' ? 'is-active' : ''} onClick={() => switchMode('code')}><Icon name="check" size={15}/>Code</button></div><form className="login-form-panel" onSubmit={submit}><label>Email address<input required name="email" type="email" placeholder="you@loftystudios.com" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>{mode === 'link' && <label>Access password<input required name="access_password" type="password" placeholder="Master password" autoComplete="current-password" value={accessPassword} onChange={(event) => setAccessPassword(event.target.value)} /></label>}{mode === 'code' && <label>One-time code<input required inputMode="numeric" name="code" pattern="[0-9 ]{6,}" placeholder="123456" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} /></label>}<button className="primary-button" disabled={loading || (mode === 'link' && !accessPassword) || (mode === 'code' && !code)} type="submit">{loading ? (mode === 'link' ? 'Sending link...' : 'Verifying code...') : (mode === 'link' ? 'Send secure link' : 'Verify code')}</button></form>{message && <div className={`form-message ${tone === 'error' ? 'is-error' : ''}`} aria-live="polite"><span>{tone === 'error' ? '!' : 'i'}</span><p>{message}</p></div>}</div>
}
