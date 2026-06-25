import { redirect } from 'next/navigation'
import { getAppContext } from '@/lib/auth'
import { createWorkspace } from '@/app/actions'

export default async function OnboardingPage() {
  const { user, workspace } = await getAppContext()
  if (!user) redirect('/login')
  if (workspace) redirect('/dashboard')
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || ''
  return <main className="auth-page"><section className="auth-card"><div className="brand"><span>LOFTY</span><small>STUDIOS</small></div><h1>Activate Lofty</h1><p>The first activated account becomes the workspace owner.</p><form action={createWorkspace}><label>Your name<input required name="display_name" defaultValue={name} placeholder="Haron Solomon" /></label><label>Workspace name<input required name="name" defaultValue="Lofty Studios" placeholder="Lofty Studios" /></label><label>Setup password<input required name="setup_password" type="password" placeholder="Master password" autoComplete="current-password" /></label><button className="primary-button" type="submit">Activate workspace</button></form></section></main>
}
