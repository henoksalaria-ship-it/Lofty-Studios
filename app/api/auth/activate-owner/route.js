import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function clean(value, maximum = 5000) {
  return String(value ?? '').trim().slice(0, maximum)
}

function toSlug(value) {
  return clean(value, 90).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function findAuthUserByEmail(admin, email) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(error.message)
    const user = data?.users?.find((candidate) => candidate.email?.toLowerCase() === email)
    if (user) return user
    if (!data?.users || data.users.length < 1000) return null
  }
  return null
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const email = clean(body.email, 220).toLowerCase()
  const password = String(body.password || '')
  const displayName = clean(body.displayName, 120)
  const workspaceName = clean(body.workspaceName, 120) || 'Lofty Studios'

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }
  if (!displayName) {
    return NextResponse.json({ error: 'Enter your name.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { count: ownerCount, error: ownerCountError } = await admin
    .from('workspace_members')
    .select('workspace_id', { count: 'exact', head: true })
    .eq('role', 'owner')
  if (ownerCountError) return NextResponse.json({ error: ownerCountError.message }, { status: 500 })
  if (ownerCount) {
    return NextResponse.json({ error: 'The Lofty workspace is already activated. Sign in with your password.' }, { status: 409 })
  }

  let user = await findAuthUserByEmail(admin, email)
  if (user) {
    const { data, error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: displayName },
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    user = data.user
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: displayName },
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    user = data.user
  }

  const baseSlug = toSlug(workspaceName) || 'lofty-studios'
  const slug = `${baseSlug}-${user.id.slice(0, 6)}`
  const { error: profileError } = await admin.from('profiles').upsert({ id: user.id, display_name: displayName })
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  const { data: workspace, error: workspaceError } = await admin
    .from('workspaces')
    .insert({ name: workspaceName, slug, created_by: user.id })
    .select('id')
    .single()
  if (workspaceError) return NextResponse.json({ error: workspaceError.message }, { status: 500 })

  const { error: membershipError } = await admin
    .from('workspace_members')
    .insert({ workspace_id: workspace.id, user_id: user.id, role: 'owner' })
  if (membershipError) return NextResponse.json({ error: membershipError.message }, { status: 500 })

  return NextResponse.json({ ok: true, email })
}
