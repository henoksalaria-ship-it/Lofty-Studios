import { requireAppContext } from '@/lib/auth'
import AppShell from '@/components/app-shell'

export default async function WorkspaceLayout({ children }) {
  const { user, workspace } = await requireAppContext()
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Lofty member'
  return <AppShell workspaceName={workspace.name} displayName={displayName}>{children}</AppShell>
}
