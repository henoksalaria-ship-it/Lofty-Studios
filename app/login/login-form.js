'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/src/components/Icon'

export default function LoginForm({ next = '/dashboard', initialMessage = '', initialTone = 'success' }) {
  const router = useRouter()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [workspaceName, setWorkspaceName] = useState('Lofty Studios')
  const [message, setMessage] = useState(initialMessage)
  const [tone, setTone] = useState(initialTone)
  const [loading, setLoading] = useState(false)
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  function showError(text) {
    setTone('error')
    setMessage(text)
  }

  async function signIn(formEmail, formPassword) {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: formEmail, password: formPassword })
    if (error) {
      showError(error.message)
      return false
    }
    router.replace(safeNext)
    router.refresh()
    return true
  }

  async function activateOwner(formEmail, formPassword) {
    const response = await fetch('/api/auth/activate-owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: formEmail, password: formPassword, displayName, workspaceName }),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      showError(result.error || 'Could not activate the first owner.')
      return false
    }
    return true
  }

  async function submit(event) {
    event.preventDefault()
    const formEmail = email.trim().toLowerCase()
    if (!formEmail || !password) return
    if (password.length < 8) {
      showError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    setMessage('')
    setTone('success')
    if (mode === 'setup') {
      const activated = await activateOwner(formEmail, password)
      if (!activated) {
        setLoading(false)
        return
      }
      setTone('success')
      setMessage('Owner account created. Signing you in now.')
    }
    await signIn(formEmail, password)
    setLoading(false)
  }

  function switchMode(nextMode) {
    setMode(nextMode)
    setMessage('')
    setTone('success')
  }

  return <div className="login-stack">
    <div className="login-mode-switch" role="tablist" aria-label="Login mode">
      <button type="button" role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'is-active' : ''} onClick={() => switchMode('signin')}><Icon name="check" size={15}/>Sign in</button>
      <button type="button" role="tab" aria-selected={mode === 'setup'} className={mode === 'setup' ? 'is-active' : ''} onClick={() => switchMode('setup')}><Icon name="settings" size={15}/>First setup</button>
    </div>
    <form className="login-form-panel" onSubmit={submit}>
      {mode === 'setup' && <label>Your name<input required name="display_name" placeholder="Your name" autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>}
      {mode === 'setup' && <label>Workspace<input required name="workspace_name" placeholder="Lofty Studios" autoComplete="organization" value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} /></label>}
      <label>Email address<input required name="email" type="email" placeholder="you@loftystudios.com" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>Password<input required name="password" type="password" placeholder={mode === 'setup' ? 'Create a password' : 'Enter your password'} autoComplete={mode === 'setup' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <button className="primary-button" disabled={loading || !email || !password || (mode === 'setup' && (!displayName || !workspaceName))} type="submit">{loading ? (mode === 'setup' ? 'Creating owner...' : 'Signing in...') : (mode === 'setup' ? 'Create owner account' : 'Sign in')}</button>
    </form>
    {message && <div className={`form-message ${tone === 'error' ? 'is-error' : ''}`} aria-live="polite"><span>{tone === 'error' ? '!' : 'i'}</span><p>{message}</p></div>}
  </div>
}
