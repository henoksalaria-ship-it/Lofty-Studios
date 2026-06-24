import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function getAppContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, workspace: null, membership: null }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(id, name, slug)')
    .eq('user_id', user.id)
    .order('created_at')
    .limit(1)
    .maybeSingle()

  return {
    supabase,
    user,
    membership,
    workspace: membership?.workspaces ?? null,
  }
}

export async function requireAppContext() {
  const context = await getAppContext()
  if (!context.user) redirect('/login')
  if (!context.workspace) redirect('/onboarding')
  return context
}
