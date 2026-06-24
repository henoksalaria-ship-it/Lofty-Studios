import { redirect } from 'next/navigation'
import { getAppContext } from '@/lib/auth'
import { createWorkspace } from '@/app/actions'

export default async function OnboardingPage() {
  const { user, workspace } = await getAppContext()
  if (!user) redirect('/login')
  if (workspace) redirect('/dashboard')
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || ''
  return <main className="auth-page"><section className="auth-card"><div className="brand"><span>LOFTY</span><small>STUDIOS</small></div><h1>Set up your workspace</h1><p>This creates the private operating system your team will use for deals, content, and money.</p><form action={createWorkspace}><label>Your name<input required name="display_name" defaultValue={name} placeholder="Haron Solomon" /></label><label>Workspace name<input required name="name" defaultValue="Lofty Studios" placeholder="Lofty Studios" /></label><button className="primary-button" type="submit">Create workspace</button></form></section></main>
}
