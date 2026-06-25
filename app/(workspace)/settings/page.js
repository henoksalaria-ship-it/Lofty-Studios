import { requireAppContext } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { addWorkspaceMember, removeWorkspaceMember, updateWorkspaceMemberRole } from '@/app/actions'

export const dynamic = 'force-dynamic'

const roleOptions = [
  ['admin', 'Admin'],
  ['sales', 'Sales'],
  ['editor', 'Editor'],
  ['finance', 'Finance'],
  ['viewer', 'Viewer'],
]

const roleLabels = {
  owner: 'Owner',
  admin: 'Admin',
  sales: 'Sales',
  editor: 'Editor',
  finance: 'Finance',
  viewer: 'Viewer',
}

const roleDescriptions = {
  owner: 'Full workspace control, activation, and team access.',
  admin: 'Operational control across pipeline, calendar, finance, and content.',
  sales: 'Companies, contacts, deals, outreach, and follow-up work.',
  editor: 'Calendar, content planning, tasks, and performance entries.',
  finance: 'Finance records, payment tracking, and finance goals.',
  viewer: 'Read-only visibility across shared workspace data.',
}

function shortMemberDate(value) {
  if (!value) return 'Active member'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

async function loadOwnerMembers(workspaceId) {
  const admin = createAdminClient()
  const { data: memberRows = [], error: membersError } = await admin
    .from('workspace_members')
    .select('workspace_id,user_id,role,created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at')
  if (membersError) throw new Error(membersError.message)

  const memberIds = memberRows.map((member) => member.user_id)
  const [{ data: profiles = [] }, { data: authUsers }] = await Promise.all([
    memberIds.length ? admin.from('profiles').select('id,display_name').in('id', memberIds) : { data: [] },
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]))
  const authUsersById = new Map((authUsers?.users || []).map((member) => [member.id, member]))

  return memberRows.map((member) => {
    const profile = profilesById.get(member.user_id)
    const authUser = authUsersById.get(member.user_id)
    return {
      ...member,
      displayName: profile?.display_name || authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || 'Lofty member',
      email: authUser?.email || 'Email unavailable',
    }
  })
}

export default async function SettingsPage() {
  const { workspace, membership, user } = await requireAppContext()
  const isOwner = membership.role === 'owner'
  let members = []
  let adminError = null

  if (isOwner) {
    try {
      members = await loadOwnerMembers(workspace.id)
    } catch (error) {
      adminError = error.message
      members = [{
        workspace_id: workspace.id,
        user_id: user.id,
        role: membership.role,
        created_at: null,
        displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Lofty owner',
        email: user.email || 'Owner email unavailable',
      }]
    }
  } else {
    members = [{
      workspace_id: workspace.id,
      user_id: user.id,
      role: membership.role,
      created_at: null,
      displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Lofty member',
      email: user.email || 'Member email unavailable',
    }]
  }

  return <><header className="page-heading"><div><h1>Settings</h1><p>Workspace access, role management, and the controls that keep Lofty organized.</p></div></header><div className="settings-grid"><section className="panel role-panel"><div className="section-label"><h2>Role management hub</h2><span className="text-action">{isOwner ? `${members.length} members` : roleLabels[membership.role]}</span></div>{adminError ? <div className="settings-notice"><strong>Owner tools need the service key.</strong><span>{adminError}</span></div> : null}<div className="member-list">{members.map((member) => <article className="member-row" key={member.user_id}><div className="member-main"><span className="member-avatar">{member.displayName.slice(0, 2).toUpperCase()}</span><span><strong>{member.displayName}</strong><small>{member.email}</small><em>{shortMemberDate(member.created_at)}</em></span></div><span className={`role-badge role-${member.role}`}>{roleLabels[member.role] || member.role}</span>{isOwner && member.role !== 'owner' ? <form className="member-role-form" action={updateWorkspaceMemberRole}><input type="hidden" name="workspace_id" value={workspace.id}/><input type="hidden" name="member_user_id" value={member.user_id}/><select name="role" defaultValue={member.role}>{roleOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button className="filter-button" type="submit">Save</button></form> : <p className="role-description">{roleDescriptions[member.role]}</p>}{isOwner && member.role !== 'owner' ? <form action={removeWorkspaceMember}><input type="hidden" name="workspace_id" value={workspace.id}/><input type="hidden" name="member_user_id" value={member.user_id}/><button className="danger-button" type="submit">Remove</button></form> : null}</article>)}</div></section><section className="panel new-panel"><h2>Add teammate</h2><p>Add a user after they have signed in once. The first activated account stays the owner; every new teammate gets a specific operating role.</p>{isOwner ? <form action={addWorkspaceMember}><input type="hidden" name="workspace_id" value={workspace.id}/><label>Email<input required name="email" type="email" placeholder="teammate@loftystudios.com"/></label><label>Role<select name="role" defaultValue="viewer">{roleOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="primary-button" type="submit">Add or update member</button></form> : <div className="settings-notice"><strong>Owner access required.</strong><span>Ask the workspace owner to add teammates or change roles.</span></div>}<div className="role-guide">{Object.entries(roleDescriptions).map(([role, description]) => <div key={role}><strong>{roleLabels[role]}</strong><span>{description}</span></div>)}</div></section></div></>
}
