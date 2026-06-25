import { redirect } from 'next/navigation'
import { getAppContext } from '@/lib/auth'

export default async function OnboardingPage() {
  const { user, workspace } = await getAppContext()
  if (!user) redirect('/login')
  if (workspace) redirect('/dashboard')
  return <main className="auth-page"><section className="auth-card"><div className="brand"><span>LOFTY</span><small>STUDIOS</small></div><h1>Access pending</h1><p>Your account is signed in, but it has not been added to a Lofty workspace yet. Ask the workspace owner to add your email from Settings.</p><form action="/login"><button className="primary-button" type="submit">Back to login</button></form></section></main>
}
