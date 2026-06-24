import LoginForm from './login-form'

export default function LoginPage() {
  return <main className="auth-page"><section className="auth-card"><div className="brand"><span>LOFTY</span><small>STUDIOS</small></div><h1>Enter the command center</h1><p>We’ll email you a secure sign-in link. No password to forget, no drama to negotiate with.</p><LoginForm /></section></main>
}
