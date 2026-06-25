import LoginForm from './login-form'

const loginCopy = {
  auth_redirect_failed: 'Supabase rejected that old sign-in link. Sign in with your email and password instead.',
  missing_auth_token: 'That old sign-in link was incomplete. Sign in with your email and password instead.',
  unsupported_auth_type: 'That old sign-in link used an unsupported verification type. Sign in with your email and password instead.',
  auth_code_failed: 'That link could not be verified. It may have expired, already been used, or opened in a different browser.',
  auth_token_failed: 'That secure token could not be verified. Sign in with your email and password instead.',
}

function safeNext(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  return value
}

export default async function LoginPage({ searchParams }) {
  const params = await searchParams
  const next = safeNext(params?.next)
  const error = typeof params?.error === 'string' ? params.error : ''
  return <main className="auth-minimal-page"><section className="auth-minimal-shell" aria-labelledby="login-heading"><div className="auth-logo-lockup"><span className="auth-logo-mark" aria-hidden="true">L</span><h1 id="login-heading"><span>LOFTY</span><small>STUDIOS</small></h1></div><LoginForm next={next} initialMessage={loginCopy[error] || ''} initialTone={error ? 'error' : 'success'} /></section></main>
}
