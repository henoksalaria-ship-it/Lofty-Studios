'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function signIn(event) {
    event.preventDefault()
    const email = new FormData(event.currentTarget).get('email')
    setLoading(true)
    setMessage('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    setMessage(error ? error.message : 'Check your inbox — your secure sign-in link is on its way.')
  }

  return <form onSubmit={signIn}><label>Email address<input required name="email" type="email" placeholder="you@loftystudios.com" autoComplete="email" /></label><button className="primary-button" disabled={loading} type="submit">{loading ? 'Sending link…' : 'Send secure sign-in link'}</button><p className={`form-message ${message.includes('Check') ? '' : 'is-error'}`}>{message}</p></form>
}
